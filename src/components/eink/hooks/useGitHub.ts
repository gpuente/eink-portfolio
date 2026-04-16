import { useEffect, useState } from "react";

export type GitHubData = {
  repos: number | null;
  followers: number | null;
  lastPush: Date | null;
  lastRepo: string | null;
};

type GitHubUser = { public_repos: number; followers: number };
type GitHubEvent = { type: string; created_at: string; repo: { name: string } };

export function useGitHub(): GitHubData {
  const [data, setData] = useState<GitHubData>({
    repos: null,
    followers: null,
    lastPush: null,
    lastRepo: null,
  });

  useEffect(() => {
    fetch("https://api.github.com/users/gpuente")
      .then((r) => (r.ok ? (r.json() as Promise<GitHubUser>) : null))
      .then((u) => {
        if (u) {
          setData((d) => ({ ...d, repos: u.public_repos, followers: u.followers }));
        }
      })
      .catch(() => {});

    fetch("https://api.github.com/users/gpuente/events/public?per_page=10")
      .then((r) => (r.ok ? (r.json() as Promise<GitHubEvent[]>) : null))
      .then((events) => {
        if (!events) return;
        const push = events.find((e) => e.type === "PushEvent");
        if (push) {
          setData((d) => ({
            ...d,
            lastPush: new Date(push.created_at),
            lastRepo: push.repo.name.split("/")[1] ?? null,
          }));
        }
      })
      .catch(() => {});
  }, []);

  return data;
}
