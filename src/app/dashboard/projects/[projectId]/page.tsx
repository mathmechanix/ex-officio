"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  GitBranch,
  BrainCircuit,
  Clock,
  BookOpen,
  Users,
  Network,
  AlertTriangle,
  FileText,
  ArrowUpRight,
} from "lucide-react";

export default function ProjectDetailsPage() {
  const params = useParams();
  const projectId = (params?.projectId as string) || "proj-apollo-9";

  const [summaryData, setSummaryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/projects/${projectId}/summary`)
      .then((res) => res.json())
      .then((data) => {
        if (active && data.success) {
          setSummaryData(data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [projectId]);

  const storedProject = summaryData?.project;
  const metrics = summaryData?.metrics || {
    documentsCount: 3,
    insightsCount: 4,
    timelineCount: 6,
    highRiskCount: 3,
    readinessScore: 78,
  };
  const handoverStatus = summaryData?.handover?.status || "IN_REVIEW";

  const project = {
    id: projectId,
    name: storedProject?.name || "Apollo Core Platform",
    slug: storedProject?.slug || "apollo-core",
    description:
      storedProject?.description ||
      "High-throughput distributed event broker and transaction processor for enterprise financial workloads with zero-downtime consensus.",
    status: storedProject?.status || "HANDOVER_IN_PROGRESS",
    techStack: storedProject?.techStack || ["TypeScript", "Next.js", "PostgreSQL", "Prisma", "Apache Kafka", "Redis"],
    departingMember: {
      name: storedProject?.departingMember?.name || "Alex Chen",
      role: storedProject?.departingMember?.role || "Principal Backend Architect",
      leavingIn: storedProject?.departingMember?.leavingDate || "in 4 days",
      avatar:
        storedProject?.departingMember?.avatar ||
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
      criticalOwnership: storedProject?.departingMember?.criticalOwnership || "82% of Auth & Kafka Modules",
    },
    stats: {
      commits: 412,
      pullRequests: 68,
      unresolvedIssues: 12,
      documents: metrics.documentsCount,
      aiInsights: metrics.insightsCount,
      continuityReadiness: metrics.readinessScore,
    },
  };

  const modules = [
    {
      title: "Unified Timeline",
      desc: "Chronological activity stream of commits, PRs, issues, decisions, and uploaded documents.",
      icon: Clock,
      href: `/dashboard/projects/${projectId}/timeline`,
      count: `${metrics.timelineCount} Events`,
    },
    {
      title: "GitHub Source Stream",
      desc: "Active connection to GitHub repository, syncing commits, diffs, PRs, and issues.",
      icon: GitBranch,
      href: `/dashboard/projects/${projectId}/github`,
      count: storedProject?.lastSyncedAt || "Synced",
    },
    {
      title: "AI Reconstruction",
      desc: "Gemini AI analyzes commits & docs to reconstruct decisions, unfinished tasks, and risks.",
      icon: BrainCircuit,
      href: `/dashboard/projects/${projectId}/analysis`,
      count: `${metrics.insightsCount} Insights`,
    },
    {
      title: "Handover Report",
      desc: "The official 6-question handover report for incoming team members with human review.",
      icon: FileText,
      href: `/dashboard/projects/${projectId}/handover`,
      count: handoverStatus === "PUBLISHED" ? "Published" : "In Review",
    },
    {
      title: "Team & Knowledge Map",
      desc: "Knowledge ownership map identifying single points of failure & direct teammate contact.",
      icon: Users,
      href: `/dashboard/projects/${projectId}/team`,
      count: "4 Members",
    },
    {
      title: "Knowledge Base",
      desc: "Centralized repository for architecture docs, RFCs, meeting notes, and uploaded PDFs.",
      icon: BookOpen,
      href: `/dashboard/projects/${projectId}/knowledge`,
      count: `${metrics.documentsCount} Docs`,
    },
    {
      title: "Structure Explorer",
      desc: "Folder and module hierarchy showing code ownership, contributors, and doc coverage.",
      icon: Network,
      href: `/dashboard/projects/${projectId}/structure`,
      count: "4 Modules",
    },
    {
      title: "Risks & Dependencies",
      desc: "Continuous continuity risk assessment, unhandled edge-cases, and mitigation plans.",
      icon: AlertTriangle,
      href: `/dashboard/projects/${projectId}/risks`,
      count: `${metrics.highRiskCount} High Risks`,
    },
  ];

  if (loading && !summaryData) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-pulse">
        <div className="h-20 bg-sand-200 rounded-xl w-full" />
        <div className="h-28 bg-sand-200 rounded-2xl w-full" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-sand-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-sand-950">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-sand-300 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-sand-950 font-sans">
              {project.name}
            </h1>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-moss-200 text-moss-950 border border-moss-300 uppercase">
              {project.status.replace(/_/g, " ")}
            </span>
          </div>
          <p className="text-xs text-sand-700 mt-1 max-w-3xl leading-relaxed font-medium">
            {project.description}
          </p>

          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            {project.techStack.map((tech: string) => (
              <span
                key={tech}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-sand-200 text-sand-800"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            href={`/dashboard/projects/${projectId}/analysis`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-moss-900 text-sand-50 text-xs font-mono font-semibold uppercase tracking-wider hover:bg-moss-800 transition"
          >
            <span>[λ] RUN RECONSTRUCTION</span>
          </Link>
          <Link
            href={`/dashboard/projects/${projectId}/handover`}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-sand-200 hover:bg-sand-300 border border-sand-300 text-sand-900 text-xs font-mono font-semibold transition"
          >
            <span>HANDOVER REPORT</span>
          </Link>
        </div>
      </div>

      {/* Departing Architect Profile Banner */}
      <div className="p-5 rounded-2xl bg-sand-50 border border-sand-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl overflow-hidden border border-sand-400 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={project.departingMember.avatar} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-moss-900 text-sand-50 uppercase tracking-wider">
                DEPARTING ARCHITECT
              </span>
              <span className="text-xs font-mono text-sand-600">
                Leaving {project.departingMember.leavingIn}
              </span>
            </div>
            <h3 className="text-base font-bold text-sand-950 mt-1">{project.departingMember.name}</h3>
            <p className="text-xs text-sand-700">
              {project.departingMember.role} •{" "}
              <strong className="text-moss-900 font-bold">
                {project.departingMember.criticalOwnership}
              </strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          <div className="text-right">
            <span className="text-[10px] font-mono text-sand-500 uppercase">Handover Readiness</span>
            <div className="text-xl font-mono font-bold text-moss-900">
              {project.stats.continuityReadiness}% Verified
            </div>
          </div>
          <Link
            href={`/dashboard/projects/${projectId}/handover`}
            className="px-3 py-2 rounded bg-moss-900 text-sand-50 text-xs font-mono font-semibold uppercase tracking-wider hover:bg-moss-800 transition"
          >
            [REVIEW REPORT ↗]
          </Link>
        </div>
      </div>

      {/* Big Counter Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "INGESTED COMMITS", val: project.stats.commits },
          { label: "PULL REQUESTS", val: project.stats.pullRequests },
          { label: "UNRESOLVED ISSUES", val: project.stats.unresolvedIssues },
          { label: "KNOWLEDGE DOCS", val: project.stats.documents },
          { label: "RECONSTRUCTED INSIGHTS", val: project.stats.aiInsights },
        ].map((stat, i) => (
          <div key={i} className="p-4 rounded-xl bg-sand-50 border border-sand-300">
            <div className="text-[10px] font-mono text-sand-600 font-semibold">{stat.label}</div>
            <div className="text-2xl font-mono font-bold text-sand-950 mt-1">{stat.val}</div>
          </div>
        ))}
      </div>

      {/* Module Navigation Grid */}
      <div>
        <div className="text-[11px] font-mono font-bold uppercase tracking-widest text-sand-600 mb-3">
          PROJECT KNOWLEDGE MODULES
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <Link key={m.title} href={m.href} className="group">
                <div className="h-full bg-sand-50 border border-sand-300 rounded-2xl p-5 hover:border-moss-700 transition flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="flex items-center justify-between">
                      <Icon className="w-4 h-4 text-moss-900" />
                      <span className="text-[10px] font-mono font-bold text-sand-500 group-hover:text-moss-900">
                        {m.count}
                      </span>
                    </div>
                    <div className="font-bold text-sm text-sand-950 mt-3 group-hover:text-moss-900 transition">
                      {m.title}
                    </div>
                    <p className="text-xs text-sand-700 mt-1 leading-relaxed line-clamp-2">
                      {m.desc}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-sand-200 flex items-center justify-between text-[11px] font-mono font-semibold text-moss-900">
                    <span>EXPLORE</span>
                    <ArrowUpRight size={13} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
