"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Network, FileCode, AlertTriangle, ArrowUpRight, FolderTree, RefreshCw, Loader2 } from "lucide-react";
import { clientCache } from "@/lib/client-cache";

export default function StructureExplorerPage() {
  const params = useParams();
  const projectId = (params?.projectId as string) || "proj-apollo-9";
  const isApollo = projectId === "proj-apollo-9";

  const [summaryData, setSummaryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<any>(null);

  useEffect(() => {
    let active = true;
    const cached = clientCache.get(`summary_${projectId}`);
    if (cached) {
      setSummaryData(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    fetch(`/api/projects/${projectId}/summary`)
      .then((r) => r.json())
      .then((data) => {
        if (!active || !data.success) return;
        clientCache.set(`summary_${projectId}`, data);
        setSummaryData(data);
      })
      .catch((err) => console.error("Structure load failed:", err))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [projectId]);

  const apolloModules = [
    {
      id: "mod-auth",
      path: "src/auth/sessions.ts",
      name: "Auth Session Revocation Engine",
      primaryOwner: "Alex Chen (Departing)",
      ownerPercentage: 68,
      status: "UNDOCUMENTED_EDGE_CASES",
      linesOfCode: 420,
      recentCommits: 24,
      docCoverage: "Low (30%)",
      dependencies: ["PostgreSQL Driver", "Crypto (HMAC-SHA256)"],
      description:
        "Handles token revocation with direct primary DB fallback to bypass replica lag in multi-region deployments.",
    },
    {
      id: "mod-sanitizer",
      path: "src/workers/sanitizer.ts",
      name: "GDPR Data Sanitizer Worker",
      primaryOwner: "Alex Chen (Departing)",
      ownerPercentage: 88,
      status: "HIGH_RISK_CONCENTRATION",
      linesOfCode: 650,
      recentCommits: 18,
      docCoverage: "Missing (0%)",
      dependencies: ["Node Stream API", "Prisma Batch Client"],
      description:
        "Zero peer reviews. Exports user transaction data while pseudonymizing PII under compliance rules.",
    },
    {
      id: "mod-kafka",
      path: "src/events/kafka.ts",
      name: "Kafka Event Consumer Group",
      primaryOwner: "Alex Chen (Departing)",
      ownerPercentage: 64,
      status: "UNRESOLVED_BUG",
      linesOfCode: 580,
      recentCommits: 32,
      docCoverage: "Moderate (55%)",
      dependencies: ["kafkajs", "Zookeeper / Kraft"],
      description:
        "Partition rebalancing triggers heartbeat timeouts under high loads. Unfinished patch in Issue #104.",
    },
    {
      id: "mod-billing",
      path: "src/billing/stripe.ts",
      name: "Billing & Idempotent Invoicing",
      primaryOwner: "Priya Sharma",
      ownerPercentage: 74,
      status: "STABLE",
      linesOfCode: 380,
      recentCommits: 14,
      docCoverage: "High (85%)",
      dependencies: ["Stripe SDK", "Prisma Transactional"],
      description:
        "Handles webhook signatures and idempotent ledger writes for monthly subscriptions.",
    },
  ];

  const rawModules: any[] = summaryData?.modules || [];
  const modules = isApollo
    ? apolloModules
    : rawModules.length > 0
    ? rawModules
    : [];

  const active = selectedModule || (modules.length > 0 ? modules[0] : null);

  if (loading && !summaryData) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-pulse">
        <div className="h-10 bg-sand-200 rounded-xl w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="h-72 bg-sand-200 rounded-2xl" />
          <div className="lg:col-span-2 h-72 bg-sand-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans text-sand-950">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-sand-300 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-sand-950 font-sans">
            Structure Explorer
          </h1>
          <p className="text-xs text-sand-700 mt-1 font-medium">
            Map components, dependencies, author distribution, and undocumented code risks across {modules.length} repository module(s).
          </p>
        </div>

        <Link
          href={`/dashboard/projects/${projectId}/handover`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-moss-900 text-sand-50 text-xs font-mono font-semibold uppercase tracking-wider hover:bg-moss-800 transition"
        >
          <span>[↗] HANDOVER REPORT</span>
        </Link>
      </div>

      {modules.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Module List */}
          <div className="space-y-2 font-mono text-xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-sand-500 mb-1">
              REPOSITORY MODULES ({modules.length})
            </div>

            {modules.map((m) => (
              <div
                key={m.id}
                onClick={() => setSelectedModule(m)}
                className={`p-3.5 rounded-xl border cursor-pointer transition shadow-sm ${
                  active?.id === m.id
                    ? "border-moss-800 bg-sand-50 ring-1 ring-moss-800"
                    : "border-sand-300 bg-sand-50/70 hover:bg-sand-50 hover:border-sand-400"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-sand-950 truncate font-sans text-xs">
                    {m.name}
                  </span>
                  {m.status !== "STABLE" ? (
                    <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-moss-700 shrink-0" />
                  )}
                </div>
                <div className="text-[10px] text-sand-500 mt-1 truncate">{m.path}</div>
                <div className="text-[10px] text-sand-600 mt-2 flex items-center justify-between">
                  <span>{m.primaryOwner}</span>
                  <span className="font-bold text-moss-900">{m.ownerPercentage}% code share</span>
                </div>
              </div>
            ))}
          </div>

          {/* Module Deep Dive */}
          {active && (
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-sand-50 rounded-2xl p-6 border border-sand-300 space-y-5 shadow-sm">
                <div className="flex items-start justify-between gap-3 border-b border-sand-200 pb-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sand-500">
                      FILE COMPONENT INSPECTOR
                    </span>
                    <h2 className="text-xl font-bold text-sand-950 font-sans mt-0.5">{active.name}</h2>
                    <div className="text-xs font-mono text-moss-800 mt-1">{active.path}</div>
                  </div>

                  <span
                    className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded uppercase ${
                      active.status === "STABLE"
                        ? "bg-moss-200 text-moss-950 border border-moss-300"
                        : "bg-red-200 text-red-950 border border-red-300"
                    }`}
                  >
                    {active.status}
                  </span>
                </div>

                <p className="text-xs text-sand-700 leading-relaxed font-sans">{active.description}</p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-sand-100 border border-sand-300">
                    <span className="text-[10px] text-sand-500 uppercase block">Lines of Code</span>
                    <span className="text-base font-bold text-sand-950 mt-1 block">
                      {active.linesOfCode} LOC
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-sand-100 border border-sand-300">
                    <span className="text-[10px] text-sand-500 uppercase block">Doc Coverage</span>
                    <span className="text-base font-bold text-sand-950 mt-1 block">
                      {active.docCoverage}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-sand-100 border border-sand-300">
                    <span className="text-[10px] text-sand-500 uppercase block">Primary Owner</span>
                    <span className="text-xs font-bold text-sand-950 mt-1 block truncate">
                      {active.primaryOwner}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-sand-100 border border-sand-300">
                    <span className="text-[10px] text-sand-500 uppercase block">Concentration</span>
                    <span className="text-base font-bold text-moss-900 mt-1 block">
                      {active.ownerPercentage}%
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-sand-500">
                    DETECTED DEPENDENCIES &amp; RUNTIME LIBRARIES
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(active.dependencies || []).map((dep: string) => (
                      <span
                        key={dep}
                        className="px-2.5 py-1 rounded-md bg-sand-200 text-sand-800 text-[11px] font-mono"
                      >
                        {dep}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-sand-200 flex items-center justify-between">
                  <span className="text-[11px] text-sand-600 font-sans">
                    Mapped from repository commits, file trees, and AST analysis.
                  </span>
                  <Link
                    href={`/dashboard/projects/${projectId}/handover`}
                    className="inline-flex items-center gap-1 text-xs font-mono font-bold text-moss-900 hover:underline"
                  >
                    <span>EXPORT TRANSITION BRIEF</span>
                    <ArrowUpRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-12 rounded-2xl bg-sand-50 border border-sand-300 text-center space-y-4 max-w-xl mx-auto shadow-sm">
          <FolderTree size={36} className="mx-auto text-sand-400" />
          <h2 className="text-lg font-serif font-bold text-sand-950">
            Repository Structure Unindexed
          </h2>
          <p className="text-xs text-sand-600 leading-relaxed font-sans">
            Connect a GitHub repository or click &quot;Sync Now&quot; in the GitHub Source Stream to parse the repository directory tree, lines of code, and single-source module ownerships.
          </p>
          <Link
            href={`/dashboard/projects/${projectId}/github`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-moss-900 text-sand-50 text-xs font-mono font-bold hover:bg-moss-800 transition"
          >
            <RefreshCw size={12} />
            <span>OPEN GITHUB STREAM &amp; SYNC</span>
          </Link>
        </div>
      )}
    </div>
  );
}
