"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  RefreshCw,
  ExternalLink,
  Search,
  GitPullRequest,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default function GitHubPage() {
  const params = useParams();
  const projectId = (params?.projectId as string) || "proj-apollo-9";

  const [activeTab, setActiveTab] = useState<"COMMITS" | "PRS" | "ISSUES">("COMMITS");
  const [syncing, setSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState("12 mins ago");
  const [searchTerm, setSearchTerm] = useState("");

  const repo = {
    owner: "acme-corp",
    name: "apollo-core",
    fullName: "acme-corp/apollo-core",
    defaultBranch: "main",
    url: "https://github.com/acme-corp/apollo-core",
    commitsCount: 412,
    openPrs: 2,
    openIssues: 2,
  };

  const commits = [
    {
      sha: "c8f49b1",
      fullSha: "c8f49b189a74130f40d1109a",
      message: "refactor(auth): direct db fallback on token revoke",
      author: "Alex Chen",
      date: "2 hours ago",
      additions: "+45",
      deletions: "-12",
      isLinkedToHandover: true,
    },
    {
      sha: "9a11ef0",
      fullSha: "9a11ef0241bba67e819b109b",
      message: "chore(cron): sync webhook secret rotating schedule",
      author: "Alex Chen",
      date: "Yesterday",
      additions: "+8",
      deletions: "-3",
      isLinkedToHandover: true,
    },
    {
      sha: "4a3e21c",
      fullSha: "4a3e21ce20bb33f9104a298c",
      message: "feat(sanitizer): initial GDPR masking pipeline for export requests",
      author: "Alex Chen",
      date: "3 days ago",
      additions: "+380",
      deletions: "-0",
      isLinkedToHandover: true,
    },
    {
      sha: "8f7e6d5",
      fullSha: "8f7e6d543210aa9988776655",
      message: "fix(kafka): increase session timeout threshold to 30000ms",
      author: "David Kim",
      date: "4 days ago",
      additions: "+4",
      deletions: "-4",
      isLinkedToHandover: false,
    },
    {
      sha: "2b3c4d5",
      fullSha: "2b3c4d5e6f7a8b9c0d1e2f3a",
      message: "feat(billing): idempotent invoice sequence generation",
      author: "Priya Sharma",
      date: "5 days ago",
      additions: "+120",
      deletions: "-18",
      isLinkedToHandover: false,
    },
  ];

  const prs = [
    {
      number: 42,
      title: "Webhook pipeline updates with HMAC verification",
      author: "Priya Sharma",
      state: "MERGED",
      mergedAt: "5 hours ago",
      comments: 7,
      isLinkedToHandover: true,
      url: "https://github.com/acme-corp/apollo-core/pull/42",
    },
    {
      number: 48,
      title: "Draft: Refactor session store to use memory-cached JWTs",
      author: "Alex Chen",
      state: "OPEN",
      mergedAt: "In Review",
      comments: 14,
      isLinkedToHandover: true,
      url: "https://github.com/acme-corp/apollo-core/pull/48",
    },
  ];

  const issues = [
    {
      number: 104,
      title: "Kafka consumer group rebalance timeout under sustained traffic",
      author: "David Kim",
      state: "OPEN",
      labels: ["bug", "critical", "kafka"],
      assignee: "Alex Chen (Departing)",
      isCritical: true,
      url: "https://github.com/acme-corp/apollo-core/issues/104",
    },
    {
      number: 98,
      title: "Audit log retention policy job failure after Postgres 16 update",
      author: "Sarah Connor",
      state: "OPEN",
      labels: ["database", "security"],
      assignee: "Alex Chen",
      isCritical: false,
      url: "https://github.com/acme-corp/apollo-core/issues/98",
    },
  ];

  const handleSync = async () => {
    setSyncing(true);
    setSyncFeedback("");
    try {
      const res = await fetch(`/api/projects/${projectId}/github/sync`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setLastSyncedAt(data.lastSyncedAt || "Just now");
        setSyncFeedback(data.message);
        setTimeout(() => setSyncFeedback(""), 4000);
      }
    } catch (err) {
      console.error("Sync failed:", err);
    } finally {
      setSyncing(false);
    }
  };

  const q = searchTerm.trim().toLowerCase();
  const filteredCommits = commits.filter(
    (c) => !q || c.message.toLowerCase().includes(q) || c.author.toLowerCase().includes(q) || c.sha.includes(q)
  );
  const filteredPrs = prs.filter(
    (p) => !q || p.title.toLowerCase().includes(q) || p.author.toLowerCase().includes(q) || String(p.number).includes(q)
  );
  const filteredIssues = issues.filter(
    (i) => !q || i.title.toLowerCase().includes(q) || i.assignee.toLowerCase().includes(q) || String(i.number).includes(q)
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans text-sand-950">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-sand-300 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-sand-950 font-sans">
            GitHub Source Stream
          </h1>
          <p className="text-xs text-sand-700 mt-1 font-medium">
            Raw commits, pull requests, and open issues feeding the AI Knowledge Reconstruction Engine.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-sand-200 hover:bg-sand-300 border border-sand-300 text-sand-900 text-xs font-mono font-semibold transition disabled:opacity-70"
          >
            <RefreshCw size={13} className={syncing ? "animate-spin" : ""} />
            <span>{syncing ? "SYNCING..." : "SYNC NOW"}</span>
          </button>

          <Link
            href={`/dashboard/projects/${projectId}/analysis`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-moss-900 text-sand-50 text-xs font-mono font-semibold uppercase tracking-wider hover:bg-moss-800 transition"
          >
            <span>[λ] RECONSTRUCT INSIGHTS</span>
          </Link>
        </div>
      </div>

      {syncFeedback && (
        <div className="p-3 rounded-xl bg-moss-100 border border-moss-300 text-moss-950 text-xs font-mono font-bold flex items-center gap-2">
          <CheckCircle2 size={14} className="text-moss-800" />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* Connected Repo Status Card */}
      <div className="p-5 rounded-2xl bg-sand-50 border border-sand-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-moss-200 text-moss-950 border border-moss-300 uppercase">
              WEBHOOK ACTIVE
            </span>
            <span className="text-xs font-mono text-sand-600">Synced {lastSyncedAt}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <h2 className="text-lg font-bold text-sand-950">{repo.fullName}</h2>
            <a
              href={repo.url}
              target="_blank"
              rel="noreferrer"
              className="text-sand-600 hover:text-sand-950"
            >
              <ExternalLink size={14} />
            </a>
          </div>
          <p className="text-xs text-sand-700 font-mono">
            Tracking branch:{" "}
            <code className="bg-sand-200 px-1 py-0.5 rounded">{repo.defaultBranch}</code>
          </p>
        </div>

        <div className="flex items-center gap-6 font-mono text-center">
          <div>
            <div className="text-xl font-bold text-sand-950">{repo.commitsCount}</div>
            <div className="text-[10px] text-sand-500 uppercase">Commits</div>
          </div>
          <div className="border-l border-sand-300 pl-6">
            <div className="text-xl font-bold text-sand-950">{prs.length}</div>
            <div className="text-[10px] text-sand-500 uppercase">Pull Requests</div>
          </div>
          <div className="border-l border-sand-300 pl-6">
            <div className="text-xl font-bold text-moss-900">{issues.length}</div>
            <div className="text-[10px] text-sand-500 uppercase">Open Issues</div>
          </div>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sand-300 pb-3">
        <div className="flex flex-wrap gap-1.5 font-mono text-xs">
          <button
            onClick={() => setActiveTab("COMMITS")}
            className={`px-3 py-1.5 rounded transition ${
              activeTab === "COMMITS"
                ? "bg-moss-900 text-sand-50 font-bold"
                : "bg-sand-200/70 text-sand-800 hover:bg-sand-300"
            }`}
          >
            COMMITS ({filteredCommits.length})
          </button>
          <button
            onClick={() => setActiveTab("PRS")}
            className={`px-3 py-1.5 rounded transition ${
              activeTab === "PRS"
                ? "bg-moss-900 text-sand-50 font-bold"
                : "bg-sand-200/70 text-sand-800 hover:bg-sand-300"
            }`}
          >
            PULL REQUESTS ({filteredPrs.length})
          </button>
          <button
            onClick={() => setActiveTab("ISSUES")}
            className={`px-3 py-1.5 rounded transition ${
              activeTab === "ISSUES"
                ? "bg-moss-900 text-sand-50 font-bold"
                : "bg-sand-200/70 text-sand-800 hover:bg-sand-300"
            }`}
          >
            ISSUES ({filteredIssues.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-sand-500 absolute left-2.5 top-2.5" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="FILTER COMMITS, PRS, ISSUES..."
            className="w-full bg-sand-50 border border-sand-300 rounded-xl pl-8 pr-3 py-1.5 text-xs font-mono placeholder:text-sand-500 text-sand-950 focus:outline-none focus:border-moss-700"
          />
        </div>
      </div>

      {/* Tab Content Lists */}
      <div className="space-y-2.5">
        {activeTab === "COMMITS" &&
          filteredCommits.map((c) => (
            <div
              key={c.sha}
              className="p-3.5 rounded-2xl border border-sand-300 bg-sand-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-moss-900 bg-moss-100 px-1.5 py-0.5 rounded border border-moss-200">
                    {c.sha}
                  </span>
                  <span className="font-bold text-sand-950 font-sans">{c.message}</span>
                </div>
                <div className="text-sand-600 font-mono text-[11px]">
                  {c.author} • {c.date} • <span className="text-moss-800">{c.additions}</span>{" "}
                  <span className="text-red-700">{c.deletions}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 font-mono text-[10px]">
                {c.isLinkedToHandover && (
                  <span className="px-2 py-0.5 rounded bg-moss-200 text-moss-950 font-bold">
                    ✓ HANDOVER EVIDENCE
                  </span>
                )}
                <a
                  href={`https://github.com/acme-corp/apollo-core/commit/${c.fullSha}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sand-600 hover:text-sand-950 p-1"
                  title="Inspect commit on GitHub"
                >
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          ))}

        {activeTab === "PRS" &&
          filteredPrs.map((pr) => (
            <div
              key={pr.number}
              className="p-4 rounded-2xl border border-sand-300 bg-sand-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 font-mono font-bold text-moss-900 bg-moss-100 px-2 py-0.5 rounded border border-moss-200">
                    <GitPullRequest size={11} /> #{pr.number}
                  </span>
                  <span
                    className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                      pr.state === "MERGED"
                        ? "bg-moss-900 text-sand-50"
                        : "bg-amber-100 text-amber-900 border border-amber-300"
                    }`}
                  >
                    {pr.state}
                  </span>
                  <span className="font-bold text-sand-950 font-sans">{pr.title}</span>
                </div>
                <div className="text-sand-600 font-mono text-[11px]">
                  Author: {pr.author} • {pr.mergedAt} • {pr.comments} review comments
                </div>
              </div>

              <div className="flex items-center gap-2 font-mono text-[10px]">
                {pr.isLinkedToHandover && (
                  <span className="px-2 py-0.5 rounded bg-moss-200 text-moss-950 font-bold">
                    ✓ EVIDENCE LINKED
                  </span>
                )}
                <a
                  href={pr.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sand-600 hover:text-sand-950 p-1"
                >
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          ))}

        {activeTab === "ISSUES" &&
          filteredIssues.map((iss) => (
            <div
              key={iss.number}
              className="p-4 rounded-2xl border border-sand-300 bg-sand-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 font-mono font-bold text-red-900 bg-red-100 px-2 py-0.5 rounded border border-red-200">
                    <AlertCircle size={11} /> Issue #{iss.number}
                  </span>
                  <span className="font-bold text-sand-950 font-sans">{iss.title}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sand-600 font-mono text-[11px]">
                  <span>Reporter: {iss.author}</span>
                  <span>•</span>
                  <span>
                    Assignee: <strong className="text-sand-950">{iss.assignee}</strong>
                  </span>
                  {iss.labels.map((lbl) => (
                    <span key={lbl} className="px-1.5 py-0.5 rounded bg-sand-200 text-[9px] uppercase">
                      {lbl}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 font-mono text-[10px]">
                {iss.isCritical && (
                  <span className="px-2 py-0.5 rounded bg-red-200 text-red-950 font-bold">
                    CRITICAL HANDOVER BLOCKER
                  </span>
                )}
                <a
                  href={iss.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sand-600 hover:text-sand-950 p-1"
                >
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
