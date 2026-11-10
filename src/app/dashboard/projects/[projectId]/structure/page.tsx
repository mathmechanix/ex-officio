"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Network, FileCode, AlertTriangle, ArrowUpRight } from "lucide-react";

export default function StructureExplorerPage() {
  const params = useParams();
  const projectId = (params?.projectId as string) || "proj-apollo-9";

  const [selectedModule, setSelectedModule] = useState<any>(null);

  const modules = [
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

  const active = selectedModule || modules[0];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans text-sand-950">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-sand-300 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-sand-950 font-sans">
            Structure Explorer
          </h1>
          <p className="text-xs text-sand-700 mt-1 font-medium">
            Map components, dependencies, author distribution, and undocumented code risks across your repository.
          </p>
        </div>

        <Link
          href={`/dashboard/projects/${projectId}/handover`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-moss-900 text-sand-50 text-xs font-mono font-semibold uppercase tracking-wider hover:bg-moss-800 transition"
        >
          <span>[↗] HANDOVER REPORT</span>
        </Link>
      </div>

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
                active.id === m.id
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

              <div className="text-[10px] text-sand-500 truncate mt-1">{m.path}</div>

              <div className="flex items-center justify-between text-[10px] text-sand-600 mt-2 pt-2 border-t border-sand-200">
                <span>{m.primaryOwner}</span>
                <span className="font-bold text-moss-900">{m.ownerPercentage}%</span>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Module Detail */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-sand-50 rounded-2xl p-6 border border-sand-300 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 pb-3 border-b border-sand-200">
              <div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sand-200 text-sand-800">
                  {active.path}
                </span>
                <h3 className="text-xl font-bold text-sand-950 font-sans mt-2">{active.name}</h3>
              </div>
              <div className="text-right font-mono">
                <div className="text-2xl font-bold text-sand-950">{active.linesOfCode}</div>
                <div className="text-[10px] text-sand-500 uppercase">Lines of Code</div>
              </div>
            </div>

            <p className="text-xs text-sand-700 leading-relaxed font-sans">{active.description}</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-sand-100 border border-sand-300">
                <div className="text-sand-500 text-[10px]">PRIMARY AUTHOR</div>
                <div className="font-bold text-sand-900 mt-0.5">{active.primaryOwner}</div>
                <div className="text-moss-900 text-[10px] mt-0.5 font-bold">
                  {active.ownerPercentage}% BLAME
                </div>
              </div>

              <div className="p-3 rounded-xl bg-sand-100 border border-sand-300">
                <div className="text-sand-500 text-[10px]">DOC COVERAGE</div>
                <div className="font-bold text-sand-900 mt-0.5">{active.docCoverage}</div>
                <div className="text-sand-500 text-[10px] mt-0.5">Automated Scan</div>
              </div>

              <div className="p-3 rounded-xl bg-sand-100 border border-sand-300">
                <div className="text-sand-500 text-[10px]">RECENT COMMITS</div>
                <div className="font-bold text-sand-900 mt-0.5">{active.recentCommits} Commits</div>
                <div className="text-sand-500 text-[10px] mt-0.5">Past 60 Days</div>
              </div>
            </div>

            <div className="font-mono text-xs">
              <div className="text-[10px] uppercase font-bold text-sand-500 mb-1.5">
                MODULE DEPENDENCIES
              </div>
              <div className="flex flex-wrap gap-1.5">
                {active.dependencies.map((dep: string) => (
                  <span
                    key={dep}
                    className="px-2 py-0.5 rounded bg-sand-200 text-sand-800 text-[11px]"
                  >
                    {dep}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
