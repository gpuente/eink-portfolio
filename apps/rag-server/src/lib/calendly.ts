import { env } from "../env.ts";

const BASE = "https://api.calendly.com";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const HEADERS = {
  Authorization: `Bearer ${env.CALENDLY_PAT}`,
  "Content-Type": "application/json",
  Accept: "application/json",
};

// ── Types ────────────────────────────────────────────────────────────────

export type AvailableSlot = {
  /** ISO 8601 UTC, e.g. "2026-04-20T14:00:00Z". */
  utc: string;
  /** Pre-formatted in a given timezone for easy LLM quoting. */
  local: string;
  /** Calendly's own status string (almost always "available" in results). */
  status: string;
};

export type BookingLink = {
  /**
   * Single-use Calendly URL with the specific slot pre-selected (via the
   * `/-/{local-iso}?month=…&date=…` tail) and the invitee's name + email
   * pre-filled (via `&name=…&email=…`). The invitee clicks, lands on
   * Calendly with everything filled, and only has to confirm. 90-day
   * expiry, single use.
   */
  bookingUrl: string;
  /** ISO 8601 UTC of the slot (echoed back). */
  startTime: string;
};

// ── Helpers ──────────────────────────────────────────────────────────────

/** Human-readable local time in a given IANA timezone. */
export function formatLocal(iso: string, tz: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", {
    timeZone: tz,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  });
}

// ── Tool 1: availability ─────────────────────────────────────────────────

/**
 * Fetch available 30-min slots between `start` and `end`. Calendly's
 * `/event_type_available_times` endpoint caps each request at a 7-day
 * window, so we chunk and concatenate.
 *
 * All slots are returned with both raw UTC and a pre-formatted local time
 * (in `displayTz`) so the LLM can quote either without having to do TZ math.
 */
export async function checkAvailability(params: {
  start: Date;
  end: Date;
  displayTz?: string;
}): Promise<AvailableSlot[]> {
  const { start, end, displayTz = env.CALENDLY_DEFAULT_TZ } = params;

  if (end.getTime() <= start.getTime()) {
    throw new Error("`end` must be after `start`");
  }

  const slots: AvailableSlot[] = [];
  let cursor = new Date(start);

  while (cursor.getTime() < end.getTime()) {
    const windowEnd = new Date(
      Math.min(cursor.getTime() + SEVEN_DAYS_MS - 60_000, end.getTime()),
    );

    const url = new URL(`${BASE}/event_type_available_times`);
    url.searchParams.set("event_type", env.CALENDLY_EVENT_TYPE_URI);
    url.searchParams.set("start_time", cursor.toISOString());
    url.searchParams.set("end_time", windowEnd.toISOString());

    const res = await fetch(url.toString(), { headers: HEADERS });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Calendly availability ${res.status}: ${body.slice(0, 200)}`);
    }

    const data = (await res.json()) as {
      collection: Array<{ start_time: string; status: string }>;
    };

    for (const s of data.collection) {
      slots.push({
        utc: s.start_time,
        local: formatLocal(s.start_time, displayTz),
        status: s.status,
      });
    }

    // Advance cursor to the next minute after the window we just fetched.
    cursor = new Date(windowEnd.getTime() + 60_000);
  }

  return slots;
}

// ── Tool 2: generate a slot-preselected booking link ────────────────────

type CalendlyError = {
  message?: string;
  title?: string;
  details?: Array<{ message?: string; parameter?: string }>;
};

/**
 * Build a Calendly deep-link that lands the user on the booking page with
 * a specific day + time already selected AND optional invitee details
 * pre-filled. Pattern (confirmed from live Calendly URLs):
 *
 *   {baseUrl}/-/{YYYY-MM-DDTHH:mm:ss±HH:MM}?month=YYYY-MM&date=YYYY-MM-DD&name=…&email=…
 *
 * Where the ISO timestamp is in the INVITEE's local timezone (with proper
 * offset) so Calendly's UI shows the correct clock time. The `month` and
 * `date` query params pre-navigate the calendar widget. `name` and `email`
 * pre-fill the invitee form so the user only clicks "Confirm".
 */
function buildSlotDeepLink(
  baseUrl: string,
  utcISO: string,
  tz: string,
  invitee?: { name?: string; email?: string },
): string {
  const d = new Date(utcISO);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid startTime: ${utcISO}`);

  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    timeZoneName: "longOffset", // yields "GMT-04:00" / "GMT+05:30" / "GMT"
  });

  const parts = fmt.formatToParts(d);
  const get = (t: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === t)?.value ?? "";

  const yyyy = get("year");
  const mm = get("month");
  const dd = get("day");
  const hh = get("hour");
  const mi = get("minute");
  const ss = get("second") || "00";
  // Offset: strip "GMT", fall back to "+00:00" for UTC (where "longOffset" returns just "GMT").
  const rawOffset = get("timeZoneName").replace("GMT", "");
  const offset = rawOffset || "+00:00";

  const localISO = `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}${offset}`;

  const query = new URLSearchParams({
    month: `${yyyy}-${mm}`,
    date: `${yyyy}-${mm}-${dd}`,
  });
  if (invitee?.name) query.set("name", invitee.name);
  if (invitee?.email) query.set("email", invitee.email);

  return `${baseUrl}/-/${localISO}?${query.toString()}`;
}

/**
 * Create a single-use scheduling link (via POST /scheduling_links) and
 * bolt on the slot-preselect tail. Works on Calendly Standard+. The
 * resulting URL is valid for 90 days and can be used once.
 */
export async function bookSlot(params: {
  startTime: string; // ISO 8601 UTC — from checkAvailability, must be in the future
  timezone?: string; // IANA timezone to render the Calendly UI in (defaults to Guillermo's tz)
  name?: string; // Invitee's full name — pre-filled in Calendly's form
  email?: string; // Invitee's email — pre-filled in Calendly's form
}): Promise<BookingLink> {
  const timezone = params.timezone ?? env.CALENDLY_DEFAULT_TZ;

  const res = await fetch(`${BASE}/scheduling_links`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      max_event_count: 1,
      owner: env.CALENDLY_EVENT_TYPE_URI,
      owner_type: "EventType",
    }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as CalendlyError;
    const firstDetail = err.details?.[0];
    const msg = firstDetail?.message
      ? `${firstDetail.parameter ?? "field"}: ${firstDetail.message}`
      : (err.message ?? err.title ?? `scheduling_links HTTP ${res.status}`);
    throw new Error(msg);
  }

  const data = (await res.json()) as { resource: { booking_url: string } };
  const baseUrl = data.resource.booking_url;
  const bookingUrl = buildSlotDeepLink(baseUrl, params.startTime, timezone, {
    name: params.name,
    email: params.email,
  });

  return { bookingUrl, startTime: params.startTime };
}

// ── Convenience ──────────────────────────────────────────────────────────

/** Public Calendly page the agent can always fall back to. */
export const PUBLIC_SCHEDULING_URL = env.CALENDLY_SCHEDULING_URL;
