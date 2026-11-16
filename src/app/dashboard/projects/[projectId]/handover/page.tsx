"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Share2,
  Loader2,
  Copy,
  Check,
  ExternalLink,
  Download,
  Lock,
  X,
  HelpCircle,
  MessageSquare,
  Send,
  Sparkles,
} from "lucide-react";

export default function HandoverDashboardPage() {
  const params = useParams();
  const projectId = (params?.projectId as string) || "proj-apollo-9";
  const { data: session } = useSession();
  const currentUserName = session?.user?.name || "Sarah Connor";

  const [activeTab, setActiveTab] = useState("q1");
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [togglingStepId, setTogglingStepId] = useState<string | null>(null);
  const [statusFeedback, setStatusFeedback] = useState("");

  const [summaryData, setSummaryData] = useState<any>(null);
  const [reportStatus, setReportStatus] = useState<"IN_REVIEW" | "PUBLISHED">("IN_REVIEW");
  const [publishedAt, setPublishedAt] = useState<string | undefined>(undefined);
  const [publishedBy, setPublishedBy] = useState<string | undefined>(undefined);
  const [transitionSteps, setTransitionSteps] = useState<any[]>([]);
  const [leadNotes, setLeadNotes] = useState("");

  // Continuity Q&A State
  const [questions, setQuestions] = useState<any[]>([]);
  const [showAskModal, setShowAskModal] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newQuestionCategory, setNewQuestionCategory] = useState("GENERAL");
  const [autoGenerateAI, setAutoGenerateAI] = useState(true);
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [generatingAIAnswerId, setGeneratingAIAnswerId] = useState<string | null>(null);
  const [leadAnswerInputs, setLeadAnswerInputs] = useState<Record<string, string>>({});
  const [submittingLeadAnswerId, setSubmittingLeadAnswerId] = useState<string | null>(null);

  // Share Access Modal State
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareRole, setShareRole] = useState<"INCOMING_LEAD" | "TEAM_MEMBER" | "EXECUTIVE_AUDITOR">("INCOMING_LEAD");
  const [redactSecrets, setRedactSecrets] = useState(true);
  const [expiresInDays, setExpiresInDays] = useState(14);
  const [generatingShare, setGeneratingShare] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [shareLinks, setShareLinks] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/projects/${projectId}/summary`)
      .then((res) => res.json())
      .then((data) => {
        if (!active || !data.success) return;
        setSummaryData(data);
        setReportStatus(data.handover?.status || "IN_REVIEW");
        setPublishedAt(data.handover?.publishedAt);
        setPublishedBy(data.handover?.publishedBy);
        setTransitionSteps(data.handover?.transitionSteps || []);
        setLeadNotes(data.handover?.leadNotes || "");
        setShareLinks(data.shareLinks || []);
        setQuestions(data.handoverQuestions || []);
      })
      .catch((err) => console.error("Failed to load handover dossier:", err))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [projectId]);

  const handleAskQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;
    setSubmittingQuestion(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/handover/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: newQuestionText.trim(),
          category: newQuestionCategory,
          askedBy: currentUserName,
          autoGenerateAI,
        }),
      });
      const data = await res.json();
      if (data.success && data.question) {
        setQuestions((prev) => [data.question, ...prev]);
        setNewQuestionText("");
        setShowAskModal(false);
        setActiveTab("q7");
      } else {
        alert(data.error || "Failed to post question.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const handleGenerateAIAnswer = async (questionId: string) => {
    setGeneratingAIAnswerId(questionId);
    try {
      const res = await fetch(`/api/projects/${projectId}/handover/questions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, generateAI: true }),
      });
      const data = await res.json();
      if (data.success && data.question) {
        setQuestions((prev) =>
          prev.map((q) => (q.id === questionId ? data.question : q))
        );
      } else {
        alert(data.error || "Failed to generate AI answer.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setGeneratingAIAnswerId(null);
    }
  };

  const handleLeadAnswerSubmit = async (questionId: string) => {
    const answer = leadAnswerInputs[questionId]?.trim();
    if (!answer) return;
    setSubmittingLeadAnswerId(questionId);
    try {
      const res = await fetch(`/api/projects/${projectId}/handover/questions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId,
          answer,
          answeredBy: currentUserName,
        }),
      });
      const data = await res.json();
      if (data.success && data.question) {
        setQuestions((prev) =>
          prev.map((q) => (q.id === questionId ? data.question : q))
        );
        setLeadAnswerInputs((prev) => ({ ...prev, [questionId]: "" }));
      } else {
        alert(data.error || "Failed to submit lead answer.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setSubmittingLeadAnswerId(null);
    }
  };

  const project = summaryData?.project || {
    name: "Apollo Core Platform",
    repoOwner: "acme-corp",
    repoName: "apollo-core",
    departingMember: {
      name: "Alex Chen",
      role: "Principal Backend Architect",
      leavingDate: "November 14, 2026 (in 4 days)",
      avatar:
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=140&auto=format&fit=crop&q=80",
      criticalOwnership: "68% of Auth, 82% of Kafka Consumer modules",
    },
  };

  const departingMember = {
    name: project.departingMember?.name || "Alex Chen",
    role: project.departingMember?.role || "Principal Backend Architect",
    leavingDate: project.departingMember?.leavingDate || "November 14, 2026",
    tenure: "2 years, 8 months",
    successor: "Priya Sharma (Incoming Lead)",
  };

  const insights: any[] = summaryData?.insights || [];
  const documents: any[] = summaryData?.documents || [];
  const readinessScore = summaryData?.metrics?.readinessScore ?? 78;

  // Categorize live insights for the 6 questions
  const decisionInsights = insights.filter((i) => i.category === "TECHNICAL_DECISION" && i.status !== "REJECTED");
  const dependencyInsights = insights.filter((i) => i.category === "HIDDEN_DEPENDENCY" && i.status !== "REJECTED");
  const gapInsights = insights.filter((i) => i.category === "KNOWLEDGE_GAP" && i.status !== "REJECTED");
  const unfinishedOrRiskInsights = insights.filter(
    (i) => (i.category === "UNFINISHED_TASK" || i.category === "RISK" || i.severity === "CRITICAL") && i.status !== "REJECTED"
  );

  const handlePublishToggle = async (targetStatus: "PUBLISHED" | "IN_REVIEW") => {
    setPublishing(true);
    setStatusFeedback("");
    try {
      const res = await fetch(`/api/projects/${projectId}/handover/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: targetStatus,
          publishedBy: currentUserName,
          leadNotes,
        }),
      });
      const data = await res.json();
      if (data.success && data.handover) {
        setReportStatus(data.handover.status);
        setPublishedAt(data.handover.publishedAt);
        setPublishedBy(data.handover.publishedBy);
        setStatusFeedback(data.message);
        setTimeout(() => setStatusFeedback(""), 4500);
      }
    } catch (err) {
      console.error("Failed to publish handover:", err);
    } finally {
      setPublishing(false);
    }
  };

  const handleToggleStep = async (stepId: string) => {
    setTogglingStepId(stepId);
    try {
      const res = await fetch(`/api/projects/${projectId}/handover/publish`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepId }),
      });
      const data = await res.json();
      if (data.success && data.handover) {
        setTransitionSteps(data.handover.transitionSteps || []);
      }
    } catch (err) {
      console.error("Failed to toggle transition step:", err);
    } finally {
      setTogglingStepId(null);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 3000);
    } catch (err) {
      console.error("Clipboard copy error:", err);
    }
  };

  const handleGenerateShareLink = async () => {
    setGeneratingShare(true);
    setCopiedUrl(false);
    try {
      const res = await fetch(`/api/projects/${projectId}/handover/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessRole: shareRole,
          redactSecrets,
          expiresInDays,
          createdBy: currentUserName,
        }),
      });
      const data = await res.json();
      if (data.success && data.sharePath) {
        const fullUrl = `${window.location.origin}${data.sharePath}`;
        setGeneratedUrl(fullUrl);
        setShareLinks((prev) => [data.shareLink, ...prev]);
        await copyToClipboard(fullUrl);
      }
    } catch (err) {
      console.error("Share generation failed:", err);
    } finally {
      setGeneratingShare(false);
    }
  };

  const handleExportPdf = () => {
    setActiveTab("all");
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleDownloadMarkdown = () => {
    const lines = [
      `# EX OFFICIO — OFFICIAL HANDOVER DOSSIER`,
      `Project: ${project.name} (${project.repoOwner}/${project.repoName})`,
      `Status: ${reportStatus}${publishedAt ? ` (Published ${new Date(publishedAt).toLocaleString()} by ${publishedBy})` : ""}`,
      `Departing Member: ${departingMember.name} (${departingMember.role})`,
      `Successor: ${departingMember.successor}`,
      `Continuity Readiness: ${readinessScore}%`,
      ``,
      `## Lead Notes`,
      leadNotes || "None provided.",
      ``,
      `## 1. Architectural Knowledge & Modules Owned`,
      ...gapInsights.map((i) => `- **${i.title}** (${Math.round(i.confidenceScore * 100)}% match): ${i.content}`),
      ``,
      `## 2. Key Technical Decisions Influenced`,
      ...decisionInsights.map((i) => `- **${i.title}**: ${i.content}`),
      ``,
      `## 3. Critical Dependencies & Infrastructure`,
      ...dependencyInsights.map((i) => `- **${i.title}**: ${i.content}`),
      ``,
      `## 4. Ingested Knowledge Base Documents (${documents.length})`,
      ...documents.map((d) => `- **${d.title}** (${d.fileName}, ${d.category}): ${d.aiSummary || d.content.slice(0, 180)}`),
      ``,
      `## 5. Post-Departure Risks & Unfinished Work`,
      ...unfinishedOrRiskInsights.map((i) => `- [${i.severity}] **${i.title}**: ${i.content}`),
      ``,
      `## 6. Transition Checklist`,
      ...transitionSteps.map((s) => `- [${s.done ? "x" : " "}] ${s.task} (@${s.owner})`),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.slug || projectId}-handover-dossier.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading && !summaryData) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-pulse">
        <div className="h-14 bg-sand-200 rounded-xl w-full" />
        <div className="h-28 bg-sand-200 rounded-2xl w-full" />
        <div className="h-64 bg-sand-200 rounded-2xl w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans text-sand-950">
      {/* SCREEN UI (Hidden during Print / PDF Export) */}
      <div className="no-print space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-sand-300 pb-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-sand-950 font-sans">
                Handover Dossier
              </h1>
              {reportStatus === "PUBLISHED" ? (
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded bg-moss-900 text-sand-50 uppercase flex items-center gap-1">
                  <CheckCircle2 size={11} /> PUBLISHED & DISTRIBUTED
                </span>
              ) : (
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded bg-moss-200 text-moss-950 border border-moss-300 uppercase">
                  DRAFT IN LEAD REVIEW
                </span>
              )}
            </div>
            <p className="text-xs text-sand-700 mt-1 font-medium">
              Evidence-linked knowledge transition report answering the 6 critical handover questions across {documents.length} documents and {insights.length} insights.
            </p>
            {publishedAt && reportStatus === "PUBLISHED" && (
              <p className="text-[11px] font-mono text-moss-800 mt-1">
                Signed & published by {publishedBy} on {new Date(publishedAt).toLocaleString()}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAskModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-moss-900 hover:bg-moss-800 text-sand-50 text-xs font-mono font-semibold transition cursor-pointer shadow-sm"
              title="Submit a continuity question for this project"
            >
              <HelpCircle size={13} />
              <span>ASK QUESTION</span>
            </button>

            <button
              onClick={handleExportPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-sand-200 hover:bg-sand-300 border border-sand-300 text-sand-900 text-xs font-mono font-semibold transition cursor-pointer"
              title="Export complete 7-section handover dossier as PDF"
            >
              <Printer size={13} />
              <span>EXPORT PDF</span>
            </button>

            <button
              onClick={handleDownloadMarkdown}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-sand-200 hover:bg-sand-300 border border-sand-300 text-sand-900 text-xs font-mono font-semibold transition"
              title="Download structured Markdown dossier"
            >
              <Download size={13} />
              <span>.MD DOSSIER</span>
            </button>

            <button
              onClick={() => setShowShareModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-sand-200 hover:bg-sand-300 border border-sand-300 text-sand-900 text-xs font-mono font-semibold transition"
            >
              <Share2 size={13} />
              <span>SHARE ACCESS</span>
            </button>

            {reportStatus !== "PUBLISHED" ? (
              <button
                onClick={() => handlePublishToggle("PUBLISHED")}
                disabled={publishing}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-moss-900 text-sand-50 text-xs font-mono font-semibold uppercase tracking-wider hover:bg-moss-800 disabled:opacity-70 transition"
              >
                {publishing ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>PUBLISHING...</span>
                  </>
                ) : (
                  <span>[✓] APPROVE &amp; PUBLISH</span>
                )}
              </button>
            ) : (
              <button
                onClick={() => handlePublishToggle("IN_REVIEW")}
                disabled={publishing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-sand-800 text-sand-50 text-xs font-mono font-semibold uppercase tracking-wider hover:bg-sand-700 disabled:opacity-70 transition"
              >
                {publishing ? <Loader2 size={13} className="animate-spin" /> : null}
                <span>REOPEN DRAFT</span>
              </button>
            )}
          </div>
        </div>

        {statusFeedback && (
          <div className="p-3 rounded-xl bg-moss-100 border border-moss-300 text-moss-950 text-xs font-mono font-semibold flex items-center gap-2">
            <CheckCircle2 size={14} className="text-moss-800 shrink-0" />
            <span>{statusFeedback}</span>
          </div>
        )}

        {/* Departing Profile Banner */}
        <div className="p-5 rounded-2xl bg-sand-50 border border-sand-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl overflow-hidden border border-sand-400 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  project.departingMember?.avatar ||
                  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=140&auto=format&fit=crop&q=80"
                }
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-moss-900">
                DEPARTING: {departingMember.name.toUpperCase()}
              </div>
              <div className="text-xs text-sand-700">
                {departingMember.role} • Tenured {departingMember.tenure}
              </div>
              <div className="text-xs font-mono text-moss-800 font-semibold mt-1">
                Departure: {departingMember.leavingDate}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 border-t md:border-t-0 md:border-l border-sand-200 pt-3 md:pt-0 md:pl-6 text-xs font-mono">
            <div>
              <span className="text-sand-500 uppercase text-[10px]">Successor</span>
              <div className="font-bold text-sand-900 mt-0.5">{departingMember.successor}</div>
            </div>
            <div>
              <span className="text-sand-500 uppercase text-[10px]">Continuity Score</span>
              <div className="font-bold text-moss-900 mt-0.5">{readinessScore}% Verified</div>
            </div>
            <div>
              <span className="text-sand-500 uppercase text-[10px]">Knowledge Docs</span>
              <div className="font-bold text-sand-900 mt-0.5">{documents.length} Ingested</div>
            </div>
          </div>
        </div>

        {/* Lead Review Sign-Off Note */}
        <div className="p-4 rounded-2xl bg-sand-50 border border-sand-300 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-sand-600">
              LEAD SIGN-OFF NOTES &amp; MANUAL CONTEXT
            </label>
            <Link
              href={`/dashboard/projects/${projectId}/analysis`}
              className="text-[10px] font-mono font-bold text-moss-900 hover:underline"
            >
              [REVIEW {insights.filter((i) => i.status === "NEEDS_REVIEW").length} PENDING INSIGHTS ↗]
            </Link>
          </div>
          <textarea
            value={leadNotes}
            onChange={(e) => setLeadNotes(e.target.value)}
            rows={2}
            placeholder="Add final transition directives or missing runbook instructions..."
            className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-xs font-sans text-sand-950 focus:outline-none focus:border-moss-700"
          />
        </div>

        {/* The 6 Critical Questions Tabs */}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5 pb-2 border-b border-sand-300">
            {[
              { id: "all", label: "★ COMPLETE REPORT (ALL)" },
              { id: "q1", label: "1. KNOWLEDGE POSSESSED" },
              { id: "q2", label: `2. DECISIONS INFLUENCED (${decisionInsights.length})` },
              { id: "q3", label: `3. CRITICAL DEPENDENCIES (${dependencyInsights.length})` },
              { id: "q4", label: `4. DOCUMENTS & GAPS (${documents.length})` },
              { id: "q5", label: `5. POST-DEPARTURE RISKS (${unfinishedOrRiskInsights.length})` },
              { id: "q6", label: `6. TRANSITION STEPS (${transitionSteps.filter((s) => s.done).length}/${transitionSteps.length})` },
              { id: "q7", label: `7. CONTINUITY Q&A (${questions.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`text-[10px] font-mono tracking-wider px-3 py-1.5 rounded transition ${
                  activeTab === tab.id
                    ? "bg-moss-900 text-sand-50 font-bold"
                    : "bg-sand-200/70 text-sand-800 hover:bg-sand-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab 1 */}
          {(activeTab === "all" || activeTab === "q1") && (
            <div className="bg-sand-50 rounded-2xl p-6 border border-sand-300 space-y-4 shadow-sm">
              <div className="text-sm font-bold text-sand-950 font-sans">
                Question 1: What architectural knowledge did {departingMember.name} uniquely possess?
              </div>
              <p className="text-xs text-sand-700 leading-relaxed font-sans">
                Analysis across commits, pull requests, and {documents.length} project knowledge artifacts identifies key modules &amp; institutional expertise:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-4 rounded-xl bg-sand-100 border border-sand-300 space-y-2">
                  <div className="font-bold text-moss-900">Auth Token Revocation &amp; Direct DB Querying</div>
                  <p className="text-sand-700 text-[11px] leading-relaxed font-sans">
                    Bypasses Redis cluster lookups in eu-central to prevent 200ms replica lag during revocation events.
                  </p>
                  <div className="text-[10px] text-sand-500">EVIDENCE: Commit c8f49b1 (96% MATCH)</div>
                </div>

                {gapInsights.map((g) => (
                  <div key={g.id} className="p-4 rounded-xl bg-sand-100 border border-sand-300 space-y-2">
                    <div className="font-bold text-moss-900">{g.title}</div>
                    <p className="text-sand-700 text-[11px] leading-relaxed font-sans">{g.content}</p>
                    <div className="text-[10px] text-sand-500">
                      EVIDENCE: {g.evidence?.[0]?.sourceId || "Verified Repo History"} ({Math.round(g.confidenceScore * 100)}% MATCH)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2 */}
          {(activeTab === "all" || activeTab === "q2") && (
            <div className="bg-sand-50 rounded-2xl p-6 border border-sand-300 space-y-3 shadow-sm text-xs font-sans">
              <div className="text-sm font-bold text-sand-950">
                Question 2: Which technical decisions did {departingMember.name} &amp; recent knowledge artifacts record?
              </div>
              {decisionInsights.map((d) => (
                <div key={d.id} className="p-3.5 rounded-xl bg-sand-100 border border-sand-300 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-bold text-sand-900">{d.title}</div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-moss-100 text-moss-900">
                      {d.status}
                    </span>
                  </div>
                  <p className="text-sand-700 text-xs">{d.content}</p>
                  <div className="text-[10px] font-mono text-moss-800">
                    SOURCE EVIDENCE: {d.evidence?.[0]?.sourceTitle || d.evidence?.[0]?.sourceId || "Documented"}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 3 */}
          {(activeTab === "all" || activeTab === "q3") && (
            <div className="bg-sand-50 rounded-2xl p-6 border border-sand-300 space-y-3 shadow-sm text-xs font-sans">
              <div className="text-sm font-bold text-sand-950">
                Question 3: What dependencies and infrastructure relied on their expertise?
              </div>
              {dependencyInsights.map((dep) => (
                <div
                  key={dep.id}
                  className={`p-4 rounded-xl border space-y-2 ${
                    dep.isConflicting
                      ? "bg-red-100/70 border-red-300 text-red-950"
                      : "bg-sand-100 border-sand-300 text-sand-950"
                  }`}
                >
                  <div className="font-bold flex items-center gap-2">
                    <AlertTriangle size={14} className={dep.isConflicting ? "text-red-700" : "text-moss-800"} />
                    {dep.title}
                  </div>
                  <p className="leading-relaxed">{dep.content}</p>
                  {dep.conflictDetails && (
                    <div className="text-[10px] font-mono text-red-800">
                      ⚠️ CONTRADICTION: {dep.conflictDetails}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Tab 4 */}
          {(activeTab === "all" || activeTab === "q4") && (
            <div className="bg-sand-50 rounded-2xl p-6 border border-sand-300 space-y-4 shadow-sm text-xs font-sans">
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold text-sand-950">
                  Question 4: Knowledge Base Documentation &amp; Identified Gaps ({documents.length} Files Ingested)
                </div>
                <Link
                  href={`/dashboard/projects/${projectId}/knowledge`}
                  className="font-mono text-[11px] font-bold text-moss-900 hover:underline"
                >
                  [+] UPLOAD MORE DOCS
                </Link>
              </div>

              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="p-4 rounded-xl bg-sand-100 border border-sand-300 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sand-950">{doc.title}</span>
                      <span className="text-[10px] font-mono text-sand-600">
                        {doc.fileName} • {doc.fileSize}
                      </span>
                    </div>
                    {doc.aiSummary && (
                      <p className="text-moss-900 font-medium text-xs bg-moss-100/60 p-2 rounded border border-moss-200">
                        <strong>AI Summary:</strong> {doc.aiSummary}
                      </p>
                    )}
                    <p className="text-sand-700 text-[11px] line-clamp-2">{doc.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 5 */}
          {(activeTab === "all" || activeTab === "q5") && (
            <div className="bg-sand-50 rounded-2xl p-6 border border-sand-300 space-y-3 shadow-sm text-xs font-sans">
              <div className="text-sm font-bold text-sand-950">
                Question 5: What specific continuity risks arise after their departure?
              </div>
              {unfinishedOrRiskInsights.map((risk) => (
                <div key={risk.id} className="p-4 rounded-xl bg-sand-100 border border-sand-300 space-y-2">
                  <div className="font-bold text-sand-950 flex items-center justify-between">
                    <span>{risk.title}</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-200 text-red-950">
                      {risk.severity}
                    </span>
                  </div>
                  <p className="text-sand-700 leading-relaxed">{risk.content}</p>
                  <div className="text-[10px] font-mono text-sand-600">
                    EVIDENCE: {risk.evidence?.[0]?.sourceTitle || "Tracked in Issue Stream"}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 6 */}
          {(activeTab === "all" || activeTab === "q6") && (
            <div className="bg-sand-50 rounded-2xl p-6 border border-sand-300 space-y-3 shadow-sm text-xs font-sans">
              <div className="text-sm font-bold text-sand-950">
                Question 6: Concrete transition steps required (click any task to toggle completion)
              </div>
              {transitionSteps.map((step) => (
                <button
                  key={step.id}
                  onClick={() => handleToggleStep(step.id)}
                  disabled={togglingStepId === step.id}
                  className="w-full text-left p-3.5 rounded-xl bg-sand-100 hover:bg-sand-200/80 border border-sand-300 flex items-center justify-between gap-3 font-mono text-xs transition"
                >
                  <div className="flex items-center gap-2.5">
                    {togglingStepId === step.id ? (
                      <Loader2 size={13} className="animate-spin text-moss-800 shrink-0" />
                    ) : (
                      <span className={step.done ? "text-moss-800 font-bold" : "text-sand-500"}>
                        {step.done ? "[✓]" : "[ ]"}
                      </span>
                    )}
                    <span className={step.done ? "line-through text-sand-500 font-sans" : "text-sand-900 font-sans"}>
                      {step.task}
                    </span>
                  </div>
                  <span className="text-[11px] text-sand-600 shrink-0">@{step.owner}</span>
                </button>
              ))}
            </div>
          )}

          {/* Tab 7: CONTINUITY Q&A */}
          {(activeTab === "all" || activeTab === "q7") && (
            <div className="bg-sand-50 rounded-2xl p-6 border border-sand-300 space-y-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sand-200 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-sand-950 font-sans">
                    Handover Continuity Q&amp;A Knowledge Base
                  </h3>
                  <p className="text-xs text-sand-600 font-sans mt-0.5">
                    Live questions asked by incoming engineers, resolved by departing leads and AI evidence reconstruction.
                  </p>
                </div>
                <button
                  onClick={() => setShowAskModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-moss-900 text-sand-50 text-xs font-mono font-bold hover:bg-moss-800 transition flex items-center gap-1.5 self-start cursor-pointer shadow-sm"
                >
                  <HelpCircle size={13} />
                  <span>ASK CONTINUITY QUESTION</span>
                </button>
              </div>

              {questions.length > 0 ? (
                <div className="space-y-4">
                  {questions.map((q) => (
                    <div
                      key={q.id}
                      className="p-4 rounded-xl bg-sand-100 border border-sand-300 space-y-3 font-mono text-xs"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sand-950 font-sans text-sm">
                              Q: {q.question}
                            </span>
                          </div>
                          <div className="text-[10px] text-sand-500 mt-0.5">
                            Asked by {q.userName} ({q.userRole}) • {new Date(q.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase shrink-0 ${
                            q.status === "ANSWERED"
                              ? "bg-moss-900 text-sand-50"
                              : "bg-moss-200 text-moss-900 border border-moss-300"
                          }`}
                        >
                          {q.status}
                        </span>
                      </div>

                      {q.answer ? (
                        <div className="p-3 rounded-lg bg-sand-50 border border-moss-200 space-y-1">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-moss-800 uppercase">
                            <CheckCircle2 size={12} />
                            <span>Verified Continuity Answer (by {q.answeredBy}):</span>
                          </div>
                          <p className="text-xs text-sand-800 font-sans leading-relaxed">
                            {q.answer}
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 rounded-lg bg-sand-200/60 border border-sand-300 space-y-2">
                          <div className="text-[10px] text-sand-600 font-bold uppercase">
                            Pending Response:
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              disabled={generatingAIAnswerId === q.id}
                              onClick={() => handleGenerateAIAnswer(q.id)}
                              className="px-2.5 py-1 rounded bg-moss-900 text-sand-50 text-[10px] font-bold hover:bg-moss-800 transition flex items-center gap-1 cursor-pointer"
                            >
                              {generatingAIAnswerId === q.id ? (
                                <Loader2 size={11} className="animate-spin" />
                              ) : (
                                <Sparkles size={11} />
                              )}
                              <span>GENERATE AI ANSWER</span>
                            </button>
                          </div>

                          <div className="pt-2 flex gap-2">
                            <input
                              type="text"
                              placeholder="Type lead verification answer..."
                              value={leadAnswerInputs[q.id] || ""}
                              onChange={(e) =>
                                setLeadAnswerInputs((prev) => ({
                                  ...prev,
                                  [q.id]: e.target.value,
                                }))
                              }
                              className="flex-1 bg-sand-50 border border-sand-300 rounded px-2.5 py-1 text-xs text-sand-950 focus:outline-none focus:border-moss-700"
                            />
                            <button
                              disabled={submittingLeadAnswerId === q.id}
                              onClick={() => handleLeadAnswerSubmit(q.id)}
                              className="px-3 py-1 rounded bg-sand-300 hover:bg-sand-400 text-sand-900 text-xs font-bold transition cursor-pointer"
                            >
                              SUBMIT ANSWER
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs font-mono text-sand-500 bg-sand-100/50 rounded-xl border border-dashed border-sand-300">
                  No continuity questions have been submitted for this handover. Click &quot;Ask Continuity Question&quot; above to log an inquiry.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SHARE ACCESS MODAL */}
      {showShareModal && (
        <div className="no-print fixed inset-0 z-50 bg-sand-950/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-sand-50 border border-sand-300 rounded-2xl p-6 max-w-lg w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-sand-200">
              <div className="flex items-center gap-2">
                <Lock size={15} className="text-moss-900" />
                <h3 className="font-bold text-sm text-sand-950">
                  Permission-Aware Report Sharing
                </h3>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1 text-sand-500 hover:text-sand-950"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-sand-800 font-bold mb-1">RECIPIENT ACCESS ROLE</label>
                <select
                  value={shareRole}
                  onChange={(e) => setShareRole(e.target.value as any)}
                  className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-sand-950"
                >
                  <option value="INCOMING_LEAD">INCOMING PROJECT LEAD (FULL DOSSIER)</option>
                  <option value="TEAM_MEMBER">ENGINEERING TEAM MEMBER</option>
                  <option value="EXECUTIVE_AUDITOR">EXECUTIVE / AUDITOR READ-ONLY</option>
                </select>
              </div>

              <div>
                <label className="block text-sand-800 font-bold mb-1">EXPIRATION WINDOW</label>
                <select
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(Number(e.target.value))}
                  className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-sand-950"
                >
                  <option value={7}>7 Days</option>
                  <option value={14}>14 Days (Recommended)</option>
                  <option value={30}>30 Days</option>
                </select>
              </div>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-sand-100 border border-sand-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={redactSecrets}
                  onChange={(e) => setRedactSecrets(e.target.checked)}
                  className="accent-moss-900 w-4 h-4"
                />
                <span className="text-sand-900 text-[11px]">
                  Redact internal host paths, cron scripts, and API keys automatically
                </span>
              </label>

              <button
                onClick={handleGenerateShareLink}
                disabled={generatingShare}
                className="w-full py-2.5 rounded-xl bg-moss-900 hover:bg-moss-800 text-sand-50 font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition"
              >
                {generatingShare ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>GENERATING PERMISSIONED LINK...</span>
                  </>
                ) : (
                  <span>[⚡] GENERATE &amp; COPY SHARE LINK</span>
                )}
              </button>

              {generatedUrl && (
                <div className="p-3 rounded-xl bg-moss-100 border border-moss-300 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-moss-950">
                    <span>{copiedUrl ? "✓ COPIED LINK TO CLIPBOARD!" : "SHAREABLE LINK READY:"}</span>
                    <a
                      href={generatedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 underline"
                    >
                      <span>OPEN LINK</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={generatedUrl}
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      className="flex-1 bg-white border border-moss-300 rounded-lg px-2.5 py-1.5 text-[11px] text-sand-950"
                    />
                    <button
                      onClick={() => copyToClipboard(generatedUrl)}
                      className="px-2.5 py-1.5 rounded-lg bg-moss-900 text-white hover:bg-moss-800 flex items-center gap-1"
                    >
                      {copiedUrl ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
              )}

              {shareLinks.length > 0 && (
                <div className="pt-2 border-t border-sand-200 space-y-1.5">
                  <div className="text-[10px] text-sand-500 uppercase font-bold">
                    RECENT GENERATED ACCESS TOKENS ({shareLinks.length})
                  </div>
                  <div className="max-h-28 overflow-y-auto space-y-1">
                    {shareLinks.slice(0, 3).map((sl) => {
                      const full =
                        typeof window !== "undefined"
                          ? `${window.location.origin}/shared/${sl.token}`
                          : `/shared/${sl.token}`;
                      return (
                        <div
                          key={sl.token}
                          className="flex items-center justify-between text-[10px] bg-sand-100 px-2.5 py-1.5 rounded border border-sand-200"
                        >
                          <span className="truncate pr-2">
                            {sl.accessRole} {sl.redactSecrets ? "(Redacted)" : "(Full)"} • {sl.token}
                          </span>
                          <div className="flex items-center gap-2 shrink-0 font-mono">
                            <a
                              href={full}
                              target="_blank"
                              rel="noreferrer"
                              className="text-moss-900 font-bold hover:underline flex items-center gap-0.5"
                            >
                              <span>TEST VIEW</span>
                              <ExternalLink size={10} />
                            </a>
                            <button
                              onClick={() => copyToClipboard(full)}
                              className="text-sand-700 font-bold hover:underline"
                            >
                              COPY
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ASK QUESTION MODAL */}
      {showAskModal && (
        <div className="no-print fixed inset-0 z-50 bg-sand-950/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-sand-50 border border-sand-300 rounded-2xl p-6 max-w-lg w-full shadow-xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-sand-200">
              <div className="flex items-center gap-2">
                <HelpCircle size={16} className="text-moss-900" />
                <h3 className="font-bold text-sm text-sand-950 font-sans">
                  Ask Handover Continuity Question
                </h3>
              </div>
              <button
                onClick={() => setShowAskModal(false)}
                className="p-1 text-sand-500 hover:text-sand-950 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAskQuestionSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-sand-800 mb-1">
                  QUESTION DETAILS
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Where is the production AWS EventBridge secret sync scheduled, and who owns the IAM role?"
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-xs text-sand-950 font-sans focus:outline-none focus:border-moss-700"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-sand-800 mb-1">
                  CATEGORY
                </label>
                <select
                  value={newQuestionCategory}
                  onChange={(e) => setNewQuestionCategory(e.target.value)}
                  className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-xs text-sand-950 focus:outline-none focus:border-moss-700"
                >
                  <option value="ARCHITECTURE">Architecture &amp; Design</option>
                  <option value="INFRASTRUCTURE">Infrastructure &amp; Hosting</option>
                  <option value="CREDENTIALS">Secrets &amp; Credential Vault</option>
                  <option value="RUNBOOKS">Operational Runbooks</option>
                  <option value="UNFINISHED">Unfinished Tasks</option>
                  <option value="GENERAL">General Continuity</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="autoAiCheck"
                  checked={autoGenerateAI}
                  onChange={(e) => setAutoGenerateAI(e.target.checked)}
                  className="rounded text-moss-900"
                />
                <label htmlFor="autoAiCheck" className="text-xs text-sand-800 cursor-pointer">
                  Auto-generate AI answer immediately using project docs &amp; commit evidence
                </label>
              </div>

              <div className="pt-3 border-t border-sand-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAskModal(false)}
                  className="px-3 py-2 rounded-xl bg-sand-200 hover:bg-sand-300 text-sand-800 font-bold transition cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={submittingQuestion}
                  className="px-4 py-2 rounded-xl bg-moss-900 hover:bg-moss-800 text-sand-50 font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  {submittingQuestion ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  <span>SUBMIT QUESTION</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPLETE PRINTABLE DOSSIER VIEW (Rendered exclusively on Export PDF / Print!) */}
      <div className="hidden print-only space-y-6 text-black bg-white p-2">
        <div className="border-b-2 border-black pb-4">
          <div className="text-xs font-mono uppercase tracking-widest text-gray-600">
            EX OFFICIO • EVIDENCE-FIRST KNOWLEDGE HANDOVER REPORT
          </div>
          <h1 className="text-3xl font-bold mt-1">{project.name} — Official Handover Dossier</h1>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono mt-3">
            <div><strong>Repository:</strong> {project.repoOwner}/{project.repoName}</div>
            <div><strong>Status:</strong> {reportStatus} ({readinessScore}% Verified)</div>
            <div><strong>Departing Architect:</strong> {departingMember.name}</div>
            <div><strong>Incoming Successor:</strong> {departingMember.successor}</div>
            {publishedBy && <div><strong>Approved By:</strong> {publishedBy}</div>}
            {publishedAt && <div><strong>Published Date:</strong> {new Date(publishedAt).toLocaleString()}</div>}
          </div>
        </div>

        {leadNotes && (
          <div className="p-3 border border-gray-400 rounded text-xs">
            <strong>Lead Sign-Off Directives:</strong> {leadNotes}
          </div>
        )}

        <section className="space-y-2 print-avoid-break">
          <h2 className="text-lg font-bold border-b border-gray-300 pb-1">
            1. What knowledge did {departingMember.name} uniquely possess?
          </h2>
          <ul className="list-disc pl-5 text-xs space-y-1.5">
            <li>
              <strong>Auth Token Revocation &amp; Direct DB Querying:</strong> Bypasses Redis cluster lookups in eu-central to prevent 200ms replica lag. <em>(Evidence: Commit c8f49b1)</em>
            </li>
            {gapInsights.map((g) => (
              <li key={`p-${g.id}`}>
                <strong>{g.title}:</strong> {g.content} <em>(Confidence: {Math.round(g.confidenceScore * 100)}%)</em>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-2 print-avoid-break">
          <h2 className="text-lg font-bold border-b border-gray-300 pb-1">
            2. Which technical decisions did they influence?
          </h2>
          <ul className="list-disc pl-5 text-xs space-y-1.5">
            {decisionInsights.map((d) => (
              <li key={`p-${d.id}`}>
                <strong>{d.title} [{d.status}]:</strong> {d.content}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-2 print-avoid-break">
          <h2 className="text-lg font-bold border-b border-gray-300 pb-1">
            3. Which critical dependencies relied on their expertise?
          </h2>
          <ul className="list-disc pl-5 text-xs space-y-1.5">
            {dependencyInsights.map((dep) => (
              <li key={`p-${dep.id}`}>
                <strong>{dep.title}:</strong> {dep.content}
                {dep.conflictDetails ? ` [CONFLICT: ${dep.conflictDetails}]` : ""}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-2 print-avoid-break">
          <h2 className="text-lg font-bold border-b border-gray-300 pb-1">
            4. Ingested Knowledge Base Documents ({documents.length})
          </h2>
          <table className="w-full text-xs border-collapse border border-gray-400">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 p-1.5 text-left">Document</th>
                <th className="border border-gray-400 p-1.5 text-left">Category</th>
                <th className="border border-gray-400 p-1.5 text-left">AI Executive Summary</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={`p-${doc.id}`}>
                  <td className="border border-gray-400 p-1.5 font-semibold">{doc.title} ({doc.fileName})</td>
                  <td className="border border-gray-400 p-1.5 font-mono">{doc.category}</td>
                  <td className="border border-gray-400 p-1.5">{doc.aiSummary || doc.content.slice(0, 140)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="space-y-2 print-avoid-break">
          <h2 className="text-lg font-bold border-b border-gray-300 pb-1">
            5. Post-Departure Risks &amp; Unfinished Tasks
          </h2>
          <ul className="list-disc pl-5 text-xs space-y-1.5">
            {unfinishedOrRiskInsights.map((r) => (
              <li key={`p-${r.id}`}>
                <strong>[{r.severity}] {r.title}:</strong> {r.content}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-2 print-avoid-break">
          <h2 className="text-lg font-bold border-b border-gray-300 pb-1">
            6. Concrete Transition Checklist
          </h2>
          <ul className="space-y-1 text-xs font-mono">
            {transitionSteps.map((s) => (
              <li key={`p-${s.id}`}>
                {s.done ? "[X]" : "[ ]"} {s.task} — Owner: @{s.owner}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-2 print-avoid-break">
          <h2 className="text-lg font-bold border-b border-gray-300 pb-1">
            7. Continuity Q&amp;A Knowledge Base ({questions.length} Questions)
          </h2>
          <div className="space-y-3 text-xs">
            {questions.map((q) => (
              <div key={`p-q-${q.id}`} className="border-b border-gray-200 pb-2">
                <div className="font-bold text-black">Q: {q.question}</div>
                <div className="text-gray-700 mt-0.5">
                  {q.answer ? (
                    <span><strong>A:</strong> {q.answer} <em>(Verified by: {q.answeredBy})</em></span>
                  ) : (
                    <em>Pending lead verification.</em>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
