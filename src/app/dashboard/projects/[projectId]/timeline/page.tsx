"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Clock,
  GitCommit,
  GitPullRequest,
  AlertCircle,
  FileText,
  Calendar,
  Search,
  ExternalLink,
  BrainCircuit,
  ArrowUpRight,
} from "lucide-react";

export default function TimelinePage() {
  const params = useParams();
  const projectId = (params?.projectId as string) || "proj-apollo-9";

  const [activeFilter, setActiveFilter] = useState("ALL");
  const [memberFilter, setMemberFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/projects/${projectId}/timeline`)
      .then((res) => res.json())
      .then((data) => {
        if (active && data.success && data.timeline) {
          setTimelineEvents(data.timeline);
        }
      })
      .catch((err) => console.error("Failed to fetch timeline:", err))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [projectId]);

  const defaultEvents = [
    {
      id: "evt-1",
      type: "COMMIT",
      title: "refactor(auth): direct db fallback on token revoke",
      desc: "Bypassing cluster redis key lookup due to replica lag in multi-region deployments.",
      author: "Alex Chen",
      authorRole: "Principal Backend Architect",
      occurredAt: "Today, 6:15 PM (2h ago)",
      sourceUrl: "https://github.com/acme-corp/apollo-core/commit/c8f49b1",
      sourceType: "Commit c8f49b1",
      aiLinked: true,
      aiInsightTitle: "Bypassed Redis Cache for Session Invalidation due to Edge Concurrency",
    },
    {
      id: "evt-2",
      type: "PULL_REQUEST",
      title: "PR #42: Webhook pipeline updates merged into main",
      desc: "Added webhook notification queues with HMAC-SHA256 signature verification and exponential retry backoff.",
      author: "Priya Sharma",
      authorRole: "Senior Full Stack Engineer",
      occurredAt: "Today, 3:30 PM (5h ago)",
      sourceUrl: "https://github.com/acme-corp/apollo-core/pull/42",
      sourceType: "PR #42",
      aiLinked: true,
      aiInsightTitle: "Undocumented dependency on external Webhook Secret rotating script",
    },
    {
      id: "evt-3",
      type: "MEETING",
      title: "Departing Architect Handover Sync #1",
      desc: "Technical walkthrough of Kafka partition balancing, secret rotation, and deployment runbooks with incoming lead.",
      author: "Sarah Connor",
      authorRole: "Project Lead",
      occurredAt: "Yesterday, 2:00 PM",
      sourceUrl: `/dashboard/projects/${projectId}/meetings`,
      sourceType: "Meeting Transcript",
      aiLinked: true,
      aiInsightTitle: "Assigned successor to Kafka consumer soak testing",
    },
    {
      id: "evt-4",
      type: "DOCUMENT",
      title: "Uploaded Q4 Architecture RFC & Topology Spec",
      desc: "Detailed network diagram showing multi-AZ PostgreSQL read-replicas and Kafka partition strategies.",
      author: "Alex Chen",
      authorRole: "Principal Backend Architect",
      occurredAt: "Nov 7, 2026",
      sourceUrl: `/dashboard/projects/${projectId}/knowledge`,
      sourceType: "RFC-402.pdf",
      aiLinked: false,
    },
    {
      id: "evt-5",
      type: "ISSUE",
      title: "Issue #104: Kafka consumer group rebalance timeout under sustained traffic",
      desc: "During partition reassignment, consumers fail heartbeat checks causing cascade rebalances.",
      author: "David Kim",
      authorRole: "DevOps / SRE Lead",
      occurredAt: "Nov 6, 2026",
      sourceUrl: "https://github.com/acme-corp/apollo-core/issues/104",
      sourceType: "Issue #104",
      aiLinked: true,
      aiInsightTitle: "Kafka Consumer Partition Rebalancing Edge Case Unhandled",
    },
    {
      id: "evt-6",
      type: "DECISION",
      title: "Technical Decision: Adopt Prisma for Type-Safe Multi-Tenant Schemas",
      desc: "Migrated from TypeORM to Prisma 6 to enforce compile-time client safety across services.",
      author: "Alex Chen",
      authorRole: "Principal Backend Architect",
      occurredAt: "Nov 2, 2026",
      sourceUrl: `/dashboard/projects/${projectId}/knowledge`,
      sourceType: "ADR-014",
      aiLinked: true,
      aiInsightTitle: "Schema migration dependency on custom Prisma binary extensions",
    },
  ];

  const events = timelineEvents.length > 0 ? timelineEvents : defaultEvents;

  const filteredEvents = events.filter((e) => {
    const matchesFilter = activeFilter === "ALL" || e.type === activeFilter;
    const matchesMember = memberFilter === "ALL" || e.author === memberFilter;
    const matchesSearch =
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.author.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesMember && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans text-sand-950">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-sand-300 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-sand-950 font-sans">
            Unified Project Timeline
          </h1>
          <p className="text-xs text-sand-700 mt-1 font-medium">
            Every git commit, PR, issue, architecture decision, and meeting note linked into a chronological evidence stream.
          </p>
        </div>

        <Link
          href={`/dashboard/projects/${projectId}/analysis`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-moss-900 text-sand-50 text-xs font-mono font-semibold uppercase tracking-wider hover:bg-moss-800 transition"
        >
          <span>[λ] RECONSTRUCT WITH GEMINI</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-sand-50 border border-sand-300 space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 text-sand-500 absolute left-3 top-2.5" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="SEARCH COMMITS, PR MESSAGES, DECISIONS..."
              className="w-full bg-sand-100 border border-sand-300 rounded-xl pl-9 pr-3 py-1.5 text-xs font-mono placeholder:text-sand-500 text-sand-950 focus:outline-none focus:border-moss-700"
            />
          </div>

          <select
            value={memberFilter}
            onChange={(e) => setMemberFilter(e.target.value)}
            className="bg-sand-100 border border-sand-300 rounded-xl px-3 py-1.5 text-xs font-mono text-sand-900 focus:outline-none"
          >
            <option value="ALL">ALL CONTRIBUTORS</option>
            <option value="Alex Chen">ALEX CHEN (DEPARTING)</option>
            <option value="Priya Sharma">PRIYA SHARMA</option>
            <option value="Sarah Connor">SARAH CONNOR</option>
            <option value="David Kim">DAVID KIM</option>
          </select>
        </div>

        {/* Activity Filter Chips */}
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-sand-200">
          {["ALL", "COMMIT", "PULL_REQUEST", "ISSUE", "DOCUMENT", "MEETING", "DECISION"].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded transition ${
                activeFilter === cat
                  ? "bg-moss-900 text-sand-50 font-bold"
                  : "bg-sand-200/70 text-sand-800 hover:bg-sand-300"
              }`}
            >
              {cat === "ALL" ? "ALL ACTIVITIES" : cat.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Stream */}
      {loading ? (
        <div className="space-y-4 animate-pulse pl-6 border-l border-sand-300 my-6 ml-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-sand-200 rounded-2xl border border-sand-300" />
          ))}
        </div>
      ) : (
        <div className="relative pl-6 border-l border-sand-300 space-y-6 my-6 ml-3">
          {filteredEvents.map((evt) => (
            <div key={evt.id} className="relative group">
              <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-sand-50 border-2 border-moss-800 group-hover:bg-moss-900 transition" />

              <div className="p-4 rounded-2xl border border-sand-300 bg-sand-50 hover:border-moss-700 transition space-y-2 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] font-mono">
                  <div className="flex items-center gap-2">
                    <span className="font-bold px-1.5 py-0.5 rounded bg-sand-200 text-sand-900">
                      {evt.type}
                    </span>
                    <span className="text-sand-600">{evt.occurredAt}</span>
                  </div>

                  {evt.aiLinked && (
                    <span className="text-moss-800 font-bold flex items-center gap-1">
                      ✓ LINKED AS GEMINI EVIDENCE
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-sand-950 font-sans">{evt.title}</h3>
                <p className="text-xs text-sand-700 leading-relaxed font-sans">{evt.desc}</p>

                {evt.aiLinked && evt.aiInsightTitle && (
                  <div className="p-2.5 rounded-xl bg-moss-100/70 border border-moss-200 text-xs text-moss-950 font-mono">
                    ⚡ <strong>SUPPORTING EVIDENCE:</strong> {evt.aiInsightTitle}
                  </div>
                )}

                <div className="pt-2 border-t border-sand-200 flex items-center justify-between text-[11px] font-mono text-sand-600">
                  <span>
                    {evt.author} ({evt.authorRole})
                  </span>
                  <div className="flex items-center gap-2">
                    <span>{evt.sourceType}</span>
                    {(evt.sourceUrl || "#").startsWith("http") ? (
                      <a
                        href={evt.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-moss-900 font-bold hover:underline inline-flex items-center"
                      >
                        [DIFF ↗]
                      </a>
                    ) : (
                      <Link
                        href={evt.sourceUrl || `/dashboard/projects/${projectId}/knowledge`}
                        className="text-moss-900 font-bold hover:underline inline-flex items-center"
                      >
                        [VIEW ↗]
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
