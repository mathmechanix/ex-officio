"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Lock, Printer, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";

export default function SharedHandoverReportPage() {
  const params = useParams();
  const token = params?.token as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`/api/shared/${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((json) => {
        if (!json.success) {
          setError(json.error || "Invalid share link");
        } else {
          setData(json);
        }
      })
      .catch(() => setError("Unable to load shared handover dossier"))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-sand-100 flex flex-col items-center justify-center gap-3 font-mono text-xs text-sand-800">
        <Loader2 className="w-6 h-6 animate-spin text-moss-900" />
        <span>VERIFYING PERMISSION-AWARE SHARE TOKEN...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-sand-100 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="bg-sand-50 border border-sand-300 rounded-2xl p-8 max-w-md space-y-4">
          <Lock className="w-8 h-8 text-red-700 mx-auto" />
          <h1 className="text-xl font-bold text-sand-950">Access Denied or Expired</h1>
          <p className="text-xs text-sand-700">{error}</p>
          <Link
            href="/login"
            className="inline-block px-4 py-2 rounded-xl bg-moss-900 text-sand-50 font-mono text-xs font-bold"
          >
            SIGN IN TO EX OFFICIO
          </Link>
        </div>
      </div>
    );
  }

  const { shareMeta, project, handover, documents, insights } = data;

  return (
    <div className="min-h-screen bg-sand-100 text-sand-950 font-sans pb-16">
      <header className="no-print border-b border-sand-300 bg-sand-50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-moss-700" />
          <span className="font-bold tracking-widest uppercase">EX OFFICIO • SHARED HANDOVER REPORT</span>
          <span className="px-2 py-0.5 rounded bg-moss-200 text-moss-950 text-[10px] font-bold">
            ROLE: {shareMeta.accessRole}
          </span>
          {shareMeta.redactSecrets && (
            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-300">
              SECRETS REDACTED
            </span>
          )}
        </div>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-moss-900 text-sand-50 text-xs font-mono font-bold hover:bg-moss-800 transition"
        >
          <Printer size={13} />
          <span>EXPORT PDF</span>
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        <div className="p-6 rounded-2xl bg-sand-50 border border-sand-300 shadow-sm space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-[10px] font-mono font-bold text-moss-900 uppercase tracking-widest flex items-center gap-1.5">
              <ShieldCheck size={14} /> PERMISSION-AWARE TRANSITION DOSSIER
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-moss-900 text-sand-50 flex items-center gap-1">
              <CheckCircle2 size={11} /> {handover.status}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold font-sans">{project?.name}</h1>
          <p className="text-xs text-sand-700">{project?.description}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-sand-200 text-xs font-mono">
            <div>
              <span className="text-[10px] text-sand-500 block">DEPARTING</span>
              <strong>{project?.departingMember?.name}</strong>
            </div>
            <div>
              <span className="text-[10px] text-sand-500 block">SHARED BY</span>
              <strong>{shareMeta.createdBy}</strong>
            </div>
            <div>
              <span className="text-[10px] text-sand-500 block">VALID FOR</span>
              <strong>{shareMeta.expiresInDays} Days</strong>
            </div>
            <div>
              <span className="text-[10px] text-sand-500 block">DOCS INGESTED</span>
              <strong>{documents.length} Files</strong>
            </div>
          </div>
        </div>

        {/* Insights & Decisions */}
        <section className="space-y-3">
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-sand-700">
            VERIFIED TECHNICAL DECISIONS, DEPENDENCIES &amp; RISKS ({insights.length})
          </h2>
          {insights.map((ins: any) => (
            <div key={ins.id} className="p-5 rounded-2xl bg-sand-50 border border-sand-300 space-y-2 shadow-xs">
              <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                <span className="font-bold px-2 py-0.5 rounded bg-moss-100 text-moss-900">
                  {ins.category.replace("_", " ")}
                </span>
                <span className="text-sand-600">{Math.round(ins.confidenceScore * 100)}% CONFIDENCE</span>
              </div>
              <h3 className="text-sm font-bold text-sand-950">{ins.title}</h3>
              <p className="text-xs text-sand-700 leading-relaxed">{ins.content}</p>
              {ins.conflictDetails && (
                <div className="p-2.5 rounded-lg bg-red-100 border border-red-300 text-[11px] font-mono text-red-900 flex items-center gap-2">
                  <AlertTriangle size={13} className="shrink-0" />
                  <span>{ins.conflictDetails}</span>
                </div>
              )}
            </div>
          ))}
        </section>

        {/* Knowledge Documents */}
        <section className="space-y-3">
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-sand-700">
            INGESTED KNOWLEDGE BASE DOCUMENTS ({documents.length})
          </h2>
          {documents.map((doc: any) => (
            <div key={doc.id} className="p-4 rounded-2xl bg-sand-50 border border-sand-300 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <strong className="text-sand-950">{doc.title}</strong>
                <span className="font-mono text-[10px] text-sand-600">{doc.fileName}</span>
              </div>
              {doc.aiSummary && (
                <p className="text-xs text-moss-950 bg-moss-100/60 p-2 rounded border border-moss-200">
                  {doc.aiSummary}
                </p>
              )}
            </div>
          ))}
        </section>

        {/* Transition Checklist */}
        <section className="p-5 rounded-2xl bg-sand-50 border border-sand-300 space-y-3">
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-sand-700">
            TRANSITION CHECKLIST
          </h2>
          <div className="space-y-2 text-xs font-mono">
            {(handover.transitionSteps || []).map((s: any) => (
              <div key={s.id} className="flex items-center justify-between p-2.5 rounded bg-sand-100 border border-sand-200">
                <span>
                  <strong className={s.done ? "text-moss-800" : "text-sand-500"}>
                    {s.done ? "[✓]" : "[ ]"}
                  </strong>{" "}
                  <span className="font-sans">{s.task}</span>
                </span>
                <span className="text-sand-600">@{s.owner}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
