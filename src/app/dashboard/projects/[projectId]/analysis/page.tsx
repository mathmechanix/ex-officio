"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";

export default function AIAnalysisPage() {
  const params = useParams();
  const projectId = (params?.projectId as string) || "proj-apollo-9";

  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [insights, setInsights] = useState<any[]>([]);
  const [analysisSummary, setAnalysisSummary] = useState("");

  // Manual Insight Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualCategory, setManualCategory] = useState("TECHNICAL_DECISION");
  const [manualSeverity, setManualSeverity] = useState("HIGH");
  const [manualContent, setManualContent] = useState("");
  const [addingManual, setAddingManual] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/projects/${projectId}/insights`)
      .then((res) => res.json())
      .then((data) => {
        if (active && data.success && data.insights) {
          setInsights(data.insights);
        }
      })
      .catch((err) => console.error("Failed to load insights:", err))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [projectId]);

  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    setAnalysisSummary("");
    try {
      const res = await fetch(`/api/projects/${projectId}/analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: "Apollo Core Platform",
          departingMemberName: "Alex Chen",
        }),
      });
      const data = await res.json();
      if (data.success && data.insights) {
        setInsights(data.insights);
        if (data.summary) setAnalysisSummary(data.summary);
      }
    } catch (err) {
      console.error("AI reconstruction error:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleStatusChange = async (insightId: string, newStatus: "APPROVED" | "REJECTED") => {
    setUpdatingId(insightId);
    try {
      const res = await fetch(`/api/projects/${projectId}/insights`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ insightId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success && data.insight) {
        setInsights((prev) =>
          prev.map((ins) => (ins.id === insightId ? data.insight : ins))
        );
      }
    } catch (err) {
      console.error("Failed updating status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateManualInsight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle || !manualContent) return;
    setAddingManual(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/insights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: manualTitle,
          content: manualContent,
          category: manualCategory,
          severity: manualSeverity,
        }),
      });
      const data = await res.json();
      if (data.success && data.insight) {
        setInsights((prev) => [data.insight, ...prev]);
        setShowAddModal(false);
        setManualTitle("");
        setManualContent("");
      }
    } catch (err) {
      console.error("Failed adding insight:", err);
    } finally {
      setAddingManual(false);
    }
  };

  const categories = [
    "ALL",
    "TECHNICAL_DECISION",
    "HIDDEN_DEPENDENCY",
    "UNFINISHED_TASK",
    "KNOWLEDGE_GAP",
  ];

  const filtered = insights.filter(
    (ins) => selectedCategory === "ALL" || ins.category === selectedCategory
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans text-sand-950">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-sand-300 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-sand-950 font-sans">
            AI Knowledge Reconstruction
          </h1>
          <p className="text-xs text-sand-700 mt-1 font-medium">
            Gemini AI categorizes decisions, dependencies, and risks from GitHub sources &amp; uploaded PDFs — verified with evidence links.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-sand-200 hover:bg-sand-300 border border-sand-300 text-sand-900 text-xs font-mono font-semibold transition"
          >
            <Plus size={13} />
            <span>ADD INSIGHT</span>
          </button>

          <button
            onClick={handleRunAnalysis}
            disabled={analyzing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-moss-900 text-sand-50 text-xs font-mono font-semibold uppercase tracking-wider hover:bg-moss-800 disabled:opacity-70 transition"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>RECONSTRUCTING...</span>
              </>
            ) : (
              <span>[λ] RUN RECONSTRUCTION</span>
            )}
          </button>

          <Link
            href={`/dashboard/projects/${projectId}/handover`}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-sand-200 hover:bg-sand-300 border border-sand-300 text-sand-900 text-xs font-mono font-semibold transition"
          >
            <span>HANDOVER REPORT [↗]</span>
          </Link>
        </div>
      </div>

      {analysisSummary && (
        <div className="p-4 rounded-2xl bg-moss-100 border border-moss-300 text-xs text-moss-950 font-mono">
          <strong>[λ RECONSTRUCTION COMPLETE]:</strong> {analysisSummary}
        </div>
      )}

      {/* Grounding Callout */}
      <div className="p-4 rounded-2xl bg-sand-50 border border-sand-300 flex items-start gap-3 text-xs text-sand-800">
        <span className="font-mono text-moss-800 font-bold uppercase text-[10px] shrink-0 mt-0.5">
          [VERIFIED EVIDENCE]
        </span>
        <div>
          Every AI conclusion below is explicitly tethered to specific commit SHAs, PR diffs, or uploaded Knowledge Base documents. Lead approval decisions persist directly to the Handover Dossier.
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1.5 pb-2 border-b border-sand-300">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded transition ${
              selectedCategory === cat
                ? "bg-moss-900 text-sand-50 font-bold"
                : "bg-sand-200/70 text-sand-800 hover:bg-sand-300"
            }`}
          >
            {cat === "ALL" ? `ALL INSIGHTS (${insights.length})` : cat.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-sand-200/80 rounded-2xl border border-sand-300" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((ins) => (
            <div
              key={ins.id}
              id={ins.id}
              className={`bg-sand-50 rounded-2xl p-5 border transition shadow-sm space-y-3 ${
                ins.isConflicting ? "border-red-400 bg-red-50/20" : "border-sand-300"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sand-200 text-sand-900">
                      {ins.category.replace("_", " ")}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        ins.severity === "CRITICAL"
                          ? "bg-red-200 text-red-900"
                          : "bg-moss-200 text-moss-950"
                      }`}
                    >
                      {ins.severity}
                    </span>
                    {ins.isConflicting && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-800 text-white">
                        ⚠️ CONTRADICTION DETECTED
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-sand-950 font-sans">{ins.title}</h3>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <div className="text-sm font-mono font-bold text-moss-900">
                    {(ins.confidenceScore * 100).toFixed(0)}% AI CONFIDENCE
                  </div>
                </div>
              </div>

              <p className="text-xs text-sand-700 leading-relaxed font-sans">{ins.content}</p>

              {ins.isConflicting && ins.conflictDetails && (
                <div className="p-3 rounded-xl bg-red-100/70 border border-red-300 text-xs text-red-950 font-mono">
                  <strong>⚠️ CONFLICT:</strong> {ins.conflictDetails}
                </div>
              )}

              {/* Supporting Evidence */}
              <div className="pt-2 border-t border-sand-200 space-y-2">
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-sand-600">
                  SUPPORTING SOURCE EVIDENCE ({(ins.evidence || []).length})
                </div>
                {(ins.evidence || []).map((ev: any) => (
                  <div
                    key={ev.id}
                    className="p-3 rounded-xl bg-sand-100 border border-sand-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-mono font-bold text-sand-900 text-[11px]">
                        {ev.sourceId} • {ev.sourceTitle}
                      </div>
                      <div className="text-[11px] font-mono text-sand-600 italic">
                        &quot;{ev.excerpt}&quot;
                      </div>
                    </div>
                    {ev.sourceUrl && ev.sourceUrl.startsWith("/") ? (
                      <Link
                        href={ev.sourceUrl}
                        className="text-moss-900 font-mono font-bold hover:underline shrink-0 text-[10px]"
                      >
                        [OPEN SOURCE ↗]
                      </Link>
                    ) : (
                      <a
                        href={ev.sourceUrl || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="text-moss-900 font-mono font-bold hover:underline shrink-0 text-[10px]"
                      >
                        [INSPECT SOURCE ↗]
                      </a>
                    )}
                  </div>
                ))}
              </div>

              {/* Human-in-the-loop controls */}
              <div className="pt-2 border-t border-sand-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="text-sand-600">LEAD STATUS:</span>
                  {ins.status === "APPROVED" ? (
                    <span className="font-bold text-moss-800">✓ APPROVED FOR REPORT</span>
                  ) : ins.status === "REJECTED" ? (
                    <span className="font-bold text-red-700">✕ EXCLUDED</span>
                  ) : (
                    <span className="font-bold text-sand-900">NEEDS VERIFICATION</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStatusChange(ins.id, "REJECTED")}
                    disabled={updatingId === ins.id}
                    className="px-2.5 py-1 rounded bg-sand-200 hover:bg-sand-300 text-sand-900 text-[10px] font-bold transition disabled:opacity-60"
                  >
                    [REJECT]
                  </button>
                  <button
                    onClick={() => handleStatusChange(ins.id, "APPROVED")}
                    disabled={updatingId === ins.id}
                    className="px-2.5 py-1 rounded bg-moss-900 hover:bg-moss-800 text-sand-50 text-[10px] font-bold transition inline-flex items-center gap-1 disabled:opacity-60"
                  >
                    {updatingId === ins.id ? <Loader2 size={10} className="animate-spin" /> : null}
                    <span>[✓ APPROVE]</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manual Insight Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-sand-950/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-sand-50 border border-sand-300 rounded-2xl p-6 max-w-lg w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-sand-200">
              <h3 className="font-bold text-sm text-sand-950">Add Verified Lead Insight</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-sand-500 hover:text-sand-950"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateManualInsight} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-sand-800 font-bold mb-1">INSIGHT TITLE</label>
                <input
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="e.g. Manual failover procedure for eu-central cluster"
                  className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-sand-950"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sand-800 font-bold mb-1">CATEGORY</label>
                  <select
                    value={manualCategory}
                    onChange={(e) => setManualCategory(e.target.value)}
                    className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-sand-950"
                  >
                    <option value="TECHNICAL_DECISION">TECHNICAL DECISION</option>
                    <option value="HIDDEN_DEPENDENCY">HIDDEN DEPENDENCY</option>
                    <option value="UNFINISHED_TASK">UNFINISHED TASK</option>
                    <option value="KNOWLEDGE_GAP">KNOWLEDGE GAP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sand-800 font-bold mb-1">SEVERITY</label>
                  <select
                    value={manualSeverity}
                    onChange={(e) => setManualSeverity(e.target.value)}
                    className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-sand-950"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sand-800 font-bold mb-1">DETAILED EXPLANATION</label>
                <textarea
                  value={manualContent}
                  onChange={(e) => setManualContent(e.target.value)}
                  rows={4}
                  placeholder="Describe the context, evidence, and required follow-up..."
                  className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-sand-950 font-sans"
                  required
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-sand-600 uppercase"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={addingManual}
                  className="px-4 py-2 rounded-xl bg-moss-900 text-sand-50 font-bold uppercase flex items-center gap-1.5"
                >
                  {addingManual ? <Loader2 size={13} className="animate-spin" /> : null}
                  <span>SAVE &amp; APPROVE</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
