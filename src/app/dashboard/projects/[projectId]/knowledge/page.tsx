"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  UploadCloud,
  Search,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from "lucide-react";

export default function KnowledgeBasePage() {
  const params = useParams();
  const projectId = (params?.projectId as string) || "proj-apollo-9";
  const { data: session } = useSession();
  const currentUserName = session?.user?.name || "Sarah Connor";

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("ALL");
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [summarizingId, setSummarizingId] = useState<string | null>(null);
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const [showManualModal, setShowManualModal] = useState(false);

  const [manualTitle, setManualTitle] = useState("");
  const [manualCategory, setManualCategory] = useState("TECHNICAL_DECISION");
  const [manualContent, setManualContent] = useState("");
  const [savingManual, setSavingManual] = useState(false);

  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/projects/${projectId}/documents`)
      .then((res) => res.json())
      .then((data) => {
        if (active && data.success && data.documents) {
          setDocs(data.documents);
        }
      })
      .catch((err) => console.error("Failed to load docs:", err))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [projectId]);

  const uploadFile = async (file: File) => {
    setUploading(true);
    setUploadMessage("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", activeTab !== "ALL" ? activeTab : "TECHNICAL_DECISION");
      formData.append("title", file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
      formData.append("uploadedBy", currentUserName);

      const res = await fetch(`/api/projects/${projectId}/documents`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.document) {
        setDocs((prev) => [data.document, ...prev]);
        setUploadMessage(
          `Ingested & summarized "${file.name}". Updated Timeline, AI Insights, Handover Report & Overview.`
        );
        setTimeout(() => setUploadMessage(""), 6000);
      } else {
        setUploadMessage(`Error: ${data.error || "Upload failed"}`);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setUploadMessage("Error: Failed to upload file to knowledge base.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };

  const handleCreateManualDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle || !manualContent) return;

    setSavingManual(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: manualTitle,
          category: manualCategory,
          content: manualContent,
          uploadedBy: currentUserName,
          fileName: `${manualTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md`,
        }),
      });

      const data = await res.json();
      if (data.success && data.document) {
        setDocs((prev) => [data.document, ...prev]);
        setShowManualModal(false);
        setManualTitle("");
        setManualContent("");
        setUploadMessage(
          `Saved "${data.document.title}". Synced with Timeline, AI Insights, Handover Report & Overview.`
        );
        setTimeout(() => setUploadMessage(""), 6000);
      }
    } catch {
      alert("Failed to save note");
    } finally {
      setSavingManual(false);
    }
  };

  const handleSummarize = async (docId: string) => {
    setSummarizingId(docId);
    try {
      const res = await fetch(`/api/projects/${projectId}/documents/${docId}/summarize`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success && data.aiSummary) {
        setDocs((prev) =>
          prev.map((d) => (d.id === docId ? { ...d, aiSummary: data.aiSummary } : d))
        );
      }
    } catch (err) {
      console.error("Summarization error:", err);
    } finally {
      setSummarizingId(null);
    }
  };

  const categories = ["ALL", "ARCHITECTURE", "TECHNICAL_DECISION", "MEETING_MINUTES", "BUG_FIX"];

  const filtered = docs.filter(
    (d) =>
      (activeTab === "ALL" || d.category === activeTab) &&
      (d.title.toLowerCase().includes(search.toLowerCase()) ||
        (d.content && d.content.toLowerCase().includes(search.toLowerCase())) ||
        (d.aiSummary && d.aiSummary.toLowerCase().includes(search.toLowerCase())))
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans text-sand-950">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-sand-300 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-sand-950 font-sans">
            Knowledge Base
          </h1>
          <p className="text-xs text-sand-700 mt-1 font-medium">
            Central repository of architectural RFCs, ADRs, meeting transcripts, and uploaded PDFs. Uploads sync across Timeline, AI Insights, Dashboard &amp; Handover Report.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setShowManualModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-sand-200 hover:bg-sand-300 border border-sand-300 text-sand-900 text-xs font-mono font-semibold transition"
          >
            <span>[+] NEW MANUAL NOTE</span>
          </button>
          <Link
            href={`/dashboard/projects/${projectId}/analysis`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-moss-900 text-sand-50 text-xs font-mono font-semibold uppercase tracking-wider hover:bg-moss-800 transition"
          >
            <span>[λ] VIEW AI INSIGHTS</span>
          </Link>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".txt,.md,.pdf,.docx,.json,.csv"
      />

      {/* Drag & Drop Upload Zone */}
      <div
        onClick={() => !uploading && fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition shadow-sm group ${
          isDragging
            ? "border-moss-900 bg-moss-100/50"
            : "border-sand-300 hover:border-moss-700 bg-sand-50"
        }`}
      >
        <UploadCloud className="w-8 h-8 text-sand-500 group-hover:text-moss-800 mx-auto mb-1.5 transition" />
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-sand-950">
          {uploading
            ? "EXTRACTING TEXT & SUMMARIZING WITH GEMINI..."
            : "CLICK OR DRAG-DROP PDF / MARKDOWN / DOCS HERE"}
        </h3>
        <p className="text-[11px] text-sand-600 mt-1">
          Supports PDF, TXT, Markdown, DOCX, JSON, CSV. Extracted content automatically propagates across all project views.
        </p>
        {uploading && (
          <div className="mt-2.5 text-xs font-mono text-moss-800 font-bold flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Extracting text streams &amp; synthesizing AI handover insights...</span>
          </div>
        )}
        {uploadMessage && !uploading && (
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-moss-100 border border-moss-300 text-xs font-mono text-moss-900 font-bold">
            <CheckCircle2 size={13} />
            <span>{uploadMessage}</span>
          </div>
        )}
      </div>

      {/* Manual Entry Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-sand-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-sand-50 border border-sand-300 rounded-2xl p-6 max-w-xl w-full shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-sand-200">
              <h3 className="font-bold text-sm text-sand-950 font-sans">Add Knowledge Entry</h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-sand-500 hover:text-sand-950 font-mono text-xs"
              >
                [CLOSE]
              </button>
            </div>
            <form onSubmit={handleCreateManualDoc} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-sand-800 font-bold mb-1">NOTE TITLE</label>
                <input
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="e.g. Database read-replica fallback mechanism"
                  className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-sand-950 focus:outline-none focus:border-moss-700"
                  required
                />
              </div>
              <div>
                <label className="block text-sand-800 font-bold mb-1">CATEGORY</label>
                <select
                  value={manualCategory}
                  onChange={(e) => setManualCategory(e.target.value)}
                  className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-sand-950 focus:outline-none focus:border-moss-700"
                >
                  <option value="TECHNICAL_DECISION">TECHNICAL DECISION</option>
                  <option value="ARCHITECTURE">ARCHITECTURE</option>
                  <option value="MEETING_MINUTES">MEETING MINUTES</option>
                  <option value="BUG_FIX">BUG FIX</option>
                </select>
              </div>
              <div>
                <label className="block text-sand-800 font-bold mb-1">CONTENT / NOTES</label>
                <textarea
                  value={manualContent}
                  onChange={(e) => setManualContent(e.target.value)}
                  placeholder="Paste or write detailed architecture notes, rationale, and instructions..."
                  className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-sand-950 min-h-[140px] focus:outline-none focus:border-moss-700 font-sans"
                  required
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-3 py-1.5 text-sand-600 hover:text-sand-950 uppercase"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={savingManual}
                  className="px-4 py-2 rounded-xl bg-moss-900 text-sand-50 font-bold uppercase hover:bg-moss-800 transition flex items-center gap-1.5 disabled:opacity-70"
                >
                  {savingManual ? <Loader2 size={13} className="animate-spin" /> : null}
                  <span>{savingManual ? "SAVING & ANALYZING..." : "SAVE & ANALYZE"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 font-mono text-xs">
        <div className="flex flex-wrap gap-1">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveTab(c)}
              className={`px-2.5 py-1 rounded transition text-[10px] ${
                activeTab === c
                  ? "bg-moss-900 text-sand-50 font-bold"
                  : "bg-sand-200/70 text-sand-800 hover:bg-sand-300"
              }`}
            >
              {c.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-sand-500 absolute left-2.5 top-2.5" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="SEARCH DOCS & SUMMARIES..."
            className="w-full bg-sand-50 border border-sand-300 rounded-xl pl-8 pr-3 py-1.5 text-xs font-mono placeholder:text-sand-500 text-sand-950 focus:outline-none focus:border-moss-700"
          />
        </div>
      </div>

      {/* Skeleton or Document Cards List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-56 bg-sand-200/80 rounded-2xl border border-sand-300" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((doc) => {
            const isExpanded = expandedDocId === doc.id;
            const isSummarizing = summarizingId === doc.id;

            return (
              <div
                key={doc.id}
                className="p-5 rounded-2xl bg-sand-50 border border-sand-300 hover:border-moss-700 transition shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-sand-200 text-sand-800">
                      {doc.category.replace("_", " ")}
                    </span>
                    <span className="text-[10px] font-mono text-sand-500">{doc.fileSize}</span>
                  </div>

                  <h3 className="font-bold text-sm text-sand-950 mt-2 font-sans">{doc.title}</h3>

                  {doc.aiSummary ? (
                    <div className="mt-2.5 p-3 rounded-xl bg-moss-100/80 border border-moss-200 text-xs text-moss-950 space-y-1">
                      <div className="text-[10px] font-mono font-bold uppercase text-moss-900 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Sparkles size={11} className="text-moss-800" />
                          GEMINI AI SUMMARY
                        </span>
                        <button
                          onClick={() => handleSummarize(doc.id)}
                          disabled={isSummarizing}
                          className="text-moss-900 hover:underline uppercase text-[9px] inline-flex items-center gap-1"
                        >
                          {isSummarizing ? (
                            <>
                              <Loader2 size={9} className="animate-spin" />
                              <span>SUMMARIZING...</span>
                            </>
                          ) : (
                            <span>[RE-SUMMARIZE]</span>
                          )}
                        </button>
                      </div>
                      <p className="font-sans text-xs leading-relaxed text-sand-900">
                        {doc.aiSummary}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-2.5">
                      <button
                        onClick={() => handleSummarize(doc.id)}
                        disabled={isSummarizing}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-sand-200 hover:bg-sand-300 border border-sand-300 text-sand-900 text-[10px] font-mono font-semibold transition"
                      >
                        {isSummarizing ? (
                          <>
                            <Loader2 size={11} className="animate-spin" />
                            <span>SUMMARIZING...</span>
                          </>
                        ) : (
                          <span>[λ SUMMARIZE WITH GEMINI]</span>
                        )}
                      </button>
                    </div>
                  )}

                  <div className="mt-3 text-xs text-sand-700 leading-relaxed font-sans">
                    {isExpanded ? (
                      <div className="p-3 rounded-xl bg-sand-100 border border-sand-200 font-mono text-[11px] whitespace-pre-wrap max-h-60 overflow-y-auto">
                        {doc.content}
                      </div>
                    ) : (
                      <p className="line-clamp-2">{doc.content}</p>
                    )}
                    <button
                      onClick={() => setExpandedDocId(isExpanded ? null : doc.id)}
                      className="mt-1 font-mono text-[10px] text-moss-800 hover:underline font-bold flex items-center gap-0.5"
                    >
                      <span>{isExpanded ? "HIDE DETAILS" : "EXPAND FULL CONTENT"}</span>
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-sand-200 flex items-center justify-between text-[10px] font-mono text-sand-500">
                  <span>By {doc.uploadedBy}</span>
                  <span className="text-moss-900 font-bold truncate max-w-[160px]">
                    {doc.fileName}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filtered.length === 0 && !loading && (
        <div className="p-12 text-center text-xs font-mono text-sand-500 bg-sand-50 rounded-2xl border border-sand-300">
          NO DOCUMENTS FOUND IN THIS CATEGORY. UPLOAD A FILE ABOVE OR ADD A NOTE.
        </div>
      )}
    </div>
  );
}
