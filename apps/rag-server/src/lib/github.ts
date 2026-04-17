import { env } from "../env.ts";

/**
 * Thin GitHub REST client for the `getGithubActivity` agent tool.
 *
 * - Hits api.github.com directly. Auth is optional: if GITHUB_TOKEN is set
 *   the rate limit is 5000 req/h (authenticated), otherwise 60 req/h per IP.
 * - In-memory response cache with a TTL to absorb bursts from multiple
 *   visitors asking similar questions. Cache resets on server restart.
 */

const API = "https://api.github.com";
const USER_AGENT = "portfolio-rag-server";
const CACHE_TTL_MS = 5 * 60 * 1000;

type CacheEntry<T> = { data: T; expiresAt: number };
const cache = new Map<string, CacheEntry<unknown>>();

async function gh<T>(path: string): Promise<T> {
  const cached = cache.get(path);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data as T;
  }

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": USER_AGENT,
  };
  if (env.GITHUB_TOKEN) headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`;

  const res = await fetch(`${API}${path}`, { headers });
  if (!res.ok) {
    // Surface rate-limit hints so the model can explain to the user.
    const rateRemaining = res.headers.get("x-ratelimit-remaining");
    const rateReset = res.headers.get("x-ratelimit-reset");
    throw new Error(
      `GitHub API ${res.status} on ${path}` +
        (rateRemaining === "0" && rateReset
          ? ` — rate limit hit, resets at ${new Date(Number(rateReset) * 1000).toISOString()}`
          : ""),
    );
  }
  const data = (await res.json()) as T;
  cache.set(path, { data, expiresAt: Date.now() + CACHE_TTL_MS });
  return data;
}

// ── Raw API shapes (only the fields we actually read) ────────────────────

type RawUser = {
  login: string;
  name: string | null;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  html_url: string;
  avatar_url: string;
};

type RawRepo = {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  fork: boolean;
  archived: boolean;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  pushed_at: string;
  updated_at: string;
  topics?: string[];
};

type RawEvent = {
  type: string;
  created_at: string;
  repo: { name: string };
  // Event payloads are polymorphic — type as `unknown` fields and narrow per-event.
  payload: {
    action?: string;
    ref?: string;
    ref_type?: string;
    commits?: Array<{ message: string }>;
    pull_request?: { title: string; html_url: string; merged: boolean };
    issue?: { title: string; html_url: string; number: number };
    release?: { tag_name: string; name: string | null; html_url: string };
  };
};

// ── Public shapes returned to the model ──────────────────────────────────

export type GithubProfile = {
  login: string;
  name: string | null;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
  publicRepos: number;
  followers: number;
  following: number;
  createdAt: string;
  profileUrl: string;
};

export type GithubRepoSummary = {
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  stars: number;
  forks: number;
  language: string | null;
  topics: string[];
  archived: boolean;
  pushedAt: string;
};

export type GithubLanguageUsage = {
  language: string;
  repoCount: number;
};

export type GithubActivityEvent =
  | {
      kind: "push";
      repo: string;
      when: string;
      commits: number;
      latestMessage: string | null;
    }
  | {
      kind: "pull_request";
      repo: string;
      when: string;
      action: string;
      title: string;
      url: string;
      merged: boolean;
    }
  | {
      kind: "issue";
      repo: string;
      when: string;
      action: string;
      title: string;
      url: string;
    }
  | {
      kind: "create";
      repo: string;
      when: string;
      refType: string;
      ref: string | null;
    }
  | { kind: "release"; repo: string; when: string; tag: string; url: string }
  | { kind: "star"; repo: string; when: string }
  | { kind: "fork"; repo: string; when: string };

// ── Fetchers ─────────────────────────────────────────────────────────────

function user(): string {
  return env.GITHUB_USERNAME;
}

export async function getProfile(): Promise<GithubProfile> {
  const u = await gh<RawUser>(`/users/${user()}`);
  return {
    login: u.login,
    name: u.name,
    bio: u.bio,
    company: u.company,
    location: u.location,
    blog: u.blog,
    publicRepos: u.public_repos,
    followers: u.followers,
    following: u.following,
    createdAt: u.created_at,
    profileUrl: u.html_url,
  };
}

/** Fetched once and reused for top-repos + languages (two tool calls → one API request). */
async function getAllOwnedRepos(): Promise<RawRepo[]> {
  const repos = await gh<RawRepo[]>(
    `/users/${user()}/repos?per_page=100&type=owner&sort=updated`,
  );
  return repos.filter((r) => !r.fork);
}

export async function getTopRepos(limit = 10): Promise<GithubRepoSummary[]> {
  const repos = await getAllOwnedRepos();
  return repos
    .slice()
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, limit)
    .map((r) => ({
      name: r.name,
      fullName: r.full_name,
      description: r.description,
      url: r.html_url,
      stars: r.stargazers_count,
      forks: r.forks_count,
      language: r.language,
      topics: r.topics ?? [],
      archived: r.archived,
      pushedAt: r.pushed_at,
    }));
}

export async function getLanguages(limit = 10): Promise<GithubLanguageUsage[]> {
  const repos = await getAllOwnedRepos();
  const counts = new Map<string, number>();
  for (const r of repos) {
    if (!r.language) continue;
    counts.set(r.language, (counts.get(r.language) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([language, repoCount]) => ({ language, repoCount }));
}

/**
 * Map a raw `/events/public` item to a friendly summary. Unknown event types
 * are dropped (returns null) to keep the agent's context clean.
 */
function summarizeEvent(e: RawEvent): GithubActivityEvent | null {
  const repo = e.repo.name;
  const when = e.created_at;
  switch (e.type) {
    case "PushEvent": {
      const commits = e.payload.commits ?? [];
      const last = commits[commits.length - 1];
      return {
        kind: "push",
        repo,
        when,
        commits: commits.length,
        latestMessage: last ? last.message.split("\n")[0] ?? null : null,
      };
    }
    case "PullRequestEvent": {
      const pr = e.payload.pull_request;
      if (!pr) return null;
      return {
        kind: "pull_request",
        repo,
        when,
        action: e.payload.action ?? "unknown",
        title: pr.title,
        url: pr.html_url,
        merged: pr.merged,
      };
    }
    case "IssuesEvent": {
      const issue = e.payload.issue;
      if (!issue) return null;
      return {
        kind: "issue",
        repo,
        when,
        action: e.payload.action ?? "unknown",
        title: issue.title,
        url: issue.html_url,
      };
    }
    case "CreateEvent": {
      return {
        kind: "create",
        repo,
        when,
        refType: e.payload.ref_type ?? "unknown",
        ref: e.payload.ref ?? null,
      };
    }
    case "ReleaseEvent": {
      const rel = e.payload.release;
      if (!rel) return null;
      return { kind: "release", repo, when, tag: rel.tag_name, url: rel.html_url };
    }
    case "WatchEvent":
      return { kind: "star", repo, when };
    case "ForkEvent":
      return { kind: "fork", repo, when };
    default:
      return null;
  }
}

export async function getRecentActivity(limit = 20): Promise<GithubActivityEvent[]> {
  const events = await gh<RawEvent[]>(
    `/users/${user()}/events/public?per_page=30`,
  );
  const out: GithubActivityEvent[] = [];
  for (const e of events) {
    const s = summarizeEvent(e);
    if (s) out.push(s);
    if (out.length >= limit) break;
  }
  return out;
}

// ── Dispatcher used by the agent tool ────────────────────────────────────

export type GithubKind =
  | "profile"
  | "recent_activity"
  | "top_repos"
  | "languages"
  | "all";

export async function getGithubInfo(kind: GithubKind) {
  switch (kind) {
    case "profile":
      return { profile: await getProfile() };
    case "recent_activity":
      return { recentActivity: await getRecentActivity() };
    case "top_repos":
      return { topRepos: await getTopRepos() };
    case "languages":
      return { languages: await getLanguages() };
    case "all": {
      // Run the three independent API hits in parallel. `top_repos` and
      // `languages` both consume the same /repos response via the cache,
      // so only profile + repos + events actually go to the network.
      const [profile, topRepos, languages, recentActivity] = await Promise.all([
        getProfile(),
        getTopRepos(),
        getLanguages(),
        getRecentActivity(),
      ]);
      return { profile, topRepos, languages, recentActivity };
    }
  }
}
