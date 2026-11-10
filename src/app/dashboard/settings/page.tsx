"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("PROJECT_LEAD");
  const [geminiKey, setGeminiKey] = useState("");
  const [geminiConfigured, setGeminiConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "Sarah Connor");
      setEmail(session.user.email || "");
      setRole((session.user as any).role || "PROJECT_LEAD");
    }
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setGeminiConfigured(Boolean(data.geminiConfigured));
          if (data.user?.name) setName(data.user.name);
          if (data.user?.email) setEmail(data.user.email);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, geminiKey }),
      });
      const data = await res.json();
      if (data.success) {
        setGeminiConfigured(Boolean(data.geminiConfigured));
        setGeminiKey("");
        setSaved(true);
        setTimeout(() => setSaved(false), 3500);
      }
    } catch (err) {
      console.error("Failed saving settings:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-pulse">
        <div className="h-14 bg-sand-200 rounded-xl w-2/3" />
        <div className="h-44 bg-sand-200 rounded-2xl" />
        <div className="h-44 bg-sand-200 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 font-sans text-sand-950">
      <div className="border-b border-sand-300 pb-5">
        <h1 className="text-3xl font-extrabold tracking-tight text-sand-950 font-sans">
          Settings &amp; Credentials
        </h1>
        <p className="text-xs text-sand-700 mt-1 font-medium">
          Manage your organization profile, role authorization, and live Gemini AI credentials.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Card */}
        <div className="bg-sand-50 rounded-2xl p-6 border border-sand-300 space-y-4 shadow-sm">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-sand-600">
            USER PROFILE &amp; PERMISSIONS
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-semibold text-sand-800 mb-1">
                FULL NAME
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-xs font-mono text-sand-950 focus:outline-none focus:border-moss-700"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-sand-800 mb-1">
                EMAIL ADDRESS
              </label>
              <input
                value={email}
                disabled
                className="w-full bg-sand-200/50 border border-sand-300 rounded-xl px-3 py-2 text-xs font-mono text-sand-600 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-moss-200 text-moss-950 border border-moss-300 uppercase">
              {role.replace("_", " ")}
            </span>
            <span className="text-xs text-sand-600">
              Authorized to review insights, edit dossiers, upload knowledge documents, and share reports.
            </span>
          </div>
        </div>

        {/* Gemini AI API Card */}
        <div className="bg-sand-50 rounded-2xl p-6 border border-sand-300 space-y-4 shadow-sm">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-sand-600 flex items-center justify-between">
            <span>GEMINI AI CONFIGURATION</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded ${
                geminiConfigured
                  ? "bg-moss-900 text-sand-50 font-bold"
                  : "bg-sand-200 text-sand-800"
              }`}
            >
              {geminiConfigured ? "LIVE API KEY ACTIVE" : "SEMANTIC EXTRACTOR READY"}
            </span>
          </div>

          <p className="text-xs text-sand-700 leading-relaxed font-sans">
            Ex Officio connects to the Gemini 1.5 Pro API to analyze commits and PDF documents. When no API key is configured, the local semantic engine analyzes uploaded texts automatically.
          </p>

          <div>
            <label className="block text-xs font-mono font-semibold text-sand-800 mb-1">
              {geminiConfigured ? "UPDATE GEMINI API KEY" : "GEMINI API KEY (OPTIONAL)"}
            </label>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder={geminiConfigured ? "•••••••••••••••••••• (Configured)" : "AIzaSy..."}
              className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-xs font-mono text-sand-950 focus:outline-none focus:border-moss-700"
            />
          </div>
        </div>

        {/* GitHub OAuth Connection */}
        <div className="bg-sand-50 rounded-2xl p-6 border border-sand-300 space-y-3 shadow-sm">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-sand-600">
            CONNECTED GITHUB WORKSPACE
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-sand-100 border border-sand-300">
            <div>
              <div className="font-mono text-xs font-bold text-sand-950">
                github.com/acme-corp/apollo-core
              </div>
              <div className="text-[11px] text-sand-600">
                Webhook Active • Ingestion permissions verified
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-moss-200 text-moss-950 border border-moss-300 uppercase">
              CONNECTED
            </span>
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center justify-between pt-2">
          {saved ? (
            <span className="text-xs font-mono text-moss-800 font-bold flex items-center gap-1.5">
              <CheckCircle2 size={14} />
              PREFERENCES SAVED SUCCESSFULLY
            </span>
          ) : (
            <span />
          )}

          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-moss-900 hover:bg-moss-800 text-sand-50 text-xs font-mono font-bold uppercase tracking-wider transition flex items-center gap-1.5 disabled:opacity-70"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : null}
            <span>{saving ? "SAVING..." : "[SAVE CHANGES]"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
