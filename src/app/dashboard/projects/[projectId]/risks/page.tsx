"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function RiskAnalysisPage() {
  const params = useParams();
  const projectId = (params?.projectId as string) || "proj-apollo-9";

  const [filter, setFilter] = useState("ALL");
  const [risksList, setRisksList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/projects/${projectId}/insights`)
      .then((res) => res.json())
      .then((data) => {
        if (!active || !data.success) return;
        const mapped = (data.insights || []).map((ins: any) => ({
          id: ins.id,
          title: ins.title,
          category:
            ins.category === "UNFINISHED_TASK"
              ? "UNRESOLVED_BUGS"
              : ins.category === "HIDDEN_DEPENDENCY"
              ? "DEPENDENCY_RISK"
              : ins.category === "KNOWLEDGE_GAP"
              ? "KNOWLEDGE_CONCENTRATION"
              : "MISSING_DOCS",
          severity: ins.severity || "HIGH",
          likelihood: ins.severity === "CRITICAL" ? "HIGH" : "MEDIUM",
          impact: "HIGH",
          owner: "Alex Chen → Successor Lead",
          status:
            ins.status === "APPROVED"
              ? "MITIGATED"
              : ins.status === "REJECTED"
              ? "DISMISSED"
              : "IDENTIFIED",
          description: ins.content,
          mitigation:
            ins.conflictDetails ||
            `Verify supporting evidence (${ins.evidence?.[0]?.sourceTitle || "Repo Source"}) and complete handover transfer walkthrough.`,
        }));
        setRisksList(mapped);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [projectId]);

  const handleResolveToggle = async (risk: any) => {
    setUpdatingId(risk.id);
    const nextInsightStatus = risk.status === "MITIGATED" ? "NEEDS_REVIEW" : "APPROVED";
    try {
      const res = await fetch(`/api/projects/${projectId}/insights`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ insightId: risk.id, status: nextInsightStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setRisksList((prev) =>
          prev.map((r) =>
            r.id === risk.id
              ? { ...r, status: nextInsightStatus === "APPROVED" ? "MITIGATED" : "IDENTIFIED" }
              : r
          )
        );
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = risksList.filter((r) => filter === "ALL" || r.category === filter);
  const criticalCount = risksList.filter((r) => r.severity === "CRITICAL").length;
  const highCount = risksList.filter((r) => r.severity === "HIGH").length;
  const mitigatedCount = risksList.filter((r) => r.status === "MITIGATED").length;
  const openCount = risksList.filter((r) => r.status === "IDENTIFIED").length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans text-sand-950">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-sand-300 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-sand-950 font-sans">
            Risk &amp; Dependency Matrix
          </h1>
          <p className="text-xs text-sand-700 mt-1 font-medium">
            Detect knowledge gaps, unresolved bugs, hidden operational dependencies, and live mitigation status.
          </p>
        </div>

        <Link
          href={`/dashboard/projects/${projectId}/handover`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-moss-900 text-sand-50 text-xs font-mono font-semibold uppercase tracking-wider hover:bg-moss-800 transition shrink-0"
        >
          <span>[↗] EXPORT TO REPORT</span>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
        {[
          { label: "CRITICAL RISKS", count: criticalCount, bg: "bg-red-100 text-red-950 border-red-300" },
          { label: "HIGH PRIORITY", count: highCount, bg: "bg-sand-50 text-sand-950 border-sand-300" },
          { label: "MITIGATED", count: mitigatedCount, bg: "bg-moss-100 text-moss-950 border-moss-300" },
          { label: "NEEDS ACTION", count: openCount, bg: "bg-sand-50 text-sand-700 border-sand-300" },
        ].map((item, i) => (
          <div key={i} className={`p-4 rounded-2xl border ${item.bg}`}>
            <div className="text-[10px] uppercase font-bold">{item.label}</div>
            <div className="text-3xl font-bold mt-1">{item.count}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1.5 pb-2 border-b border-sand-300">
        {["ALL", "UNRESOLVED_BUGS", "DEPENDENCY_RISK", "KNOWLEDGE_CONCENTRATION", "MISSING_DOCS"].map(
          (cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded transition ${
                filter === cat
                  ? "bg-moss-900 text-sand-50 font-bold"
                  : "bg-sand-200/70 text-sand-800 hover:bg-sand-300"
              }`}
            >
              {cat === "ALL" ? `ALL RISKS (${risksList.length})` : cat.replace("_", " ")}
            </button>
          )
        )}
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-sand-200 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-4 font-sans">
          {filtered.map((risk) => (
            <div
              key={risk.id}
              className="p-5 rounded-2xl bg-sand-50 border border-sand-300 shadow-sm space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
                    <span className="font-bold px-1.5 py-0.5 rounded bg-sand-200 text-sand-900">
                      {risk.category.replace("_", " ")}
                    </span>
                    <span
                      className={`font-bold px-1.5 py-0.5 rounded ${
                        risk.severity === "CRITICAL"
                          ? "bg-red-200 text-red-950"
                          : "bg-sand-200 text-sand-900"
                      }`}
                    >
                      {risk.severity}
                    </span>
                    <span className="text-sand-500">
                      Likelihood: {risk.likelihood} • Impact: {risk.impact}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-sand-950 font-sans">{risk.title}</h3>
                </div>

                <span
                  className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded shrink-0 self-start ${
                    risk.status === "MITIGATED"
                      ? "bg-moss-900 text-sand-50"
                      : "bg-sand-200 text-sand-900"
                  }`}
                >
                  {risk.status}
                </span>
              </div>

              <p className="text-xs text-sand-700 leading-relaxed font-sans">{risk.description}</p>

              <div className="p-3 rounded-xl bg-sand-100 border border-sand-300 text-xs text-sand-900 space-y-1">
                <div className="font-bold font-mono text-[10px] uppercase text-moss-900">
                  RECOMMENDED MITIGATION:
                </div>
                <p className="font-sans text-xs">{risk.mitigation}</p>
              </div>

              <div className="pt-2 border-t border-sand-200 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-sand-600">
                <span>
                  Assignee: <strong className="text-sand-950">{risk.owner}</strong>
                </span>
                <button
                  onClick={() => handleResolveToggle(risk)}
                  disabled={updatingId === risk.id}
                  className="px-2.5 py-1 rounded bg-moss-900 hover:bg-moss-800 text-sand-50 font-bold text-[10px] inline-flex items-center gap-1 transition"
                >
                  {updatingId === risk.id ? <Loader2 size={10} className="animate-spin" /> : null}
                  <span>
                    {risk.status === "MITIGATED" ? "REOPEN RISK" : "[✓] MARK MITIGATED"}
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
