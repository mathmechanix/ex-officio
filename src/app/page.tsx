"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ShieldCheck,
  GitBranch,
  BrainCircuit,
  FileCheck,
  Layers,
  Users,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
  UserCheck,
  Check,
  Activity,
  Play,
} from "lucide-react";

export default function HomePage() {
  // Interactive Continuity Simulator for Judges
  const [simSteps, setSimSteps] = useState([
    { id: "step-1", title: "Ingest Q4 Architecture RFC & Topology Spec", points: 18, done: true },
    { id: "step-2", title: "Document Redis Token Revocation Bypass in EU-Central", points: 16, done: true },
    { id: "step-3", title: "Transfer Repository Ownership & npm tokens to Successor", points: 14, done: false },
    { id: "step-4", title: "Verify EventBridge Webhook Secret rotation runbook", points: 10, done: false },
  ]);

  const baseScore = 40;
  const currentScore =
    baseScore +
    simSteps.filter((s) => s.done).reduce((acc, s) => acc + s.points, 0);

  const toggleStep = (id: string) => {
    setSimSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s))
    );
  };

  return (
    <div className="min-h-screen bg-sand-100 text-sand-950 font-sans selection:bg-moss-800 selection:text-white">
      {/* Editorial Header */}
      <header className="border-b border-sand-300 bg-sand-50/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 group hover:opacity-90 transition"
            title="Ex Officio Home"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-moss-700 group-hover:scale-125 transition-transform" />
            <span className="font-mono text-xs font-bold tracking-widest text-moss-950 uppercase">
              EX OFFICIO
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sand-200 text-sand-700 uppercase hidden sm:inline">
              EVIDENCE-FIRST HANDOVER
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3 font-mono text-xs">
            <Link
              href="/login"
              className="px-2.5 py-1.5 text-sand-700 hover:text-sand-950 min-h-[38px] flex items-center"
            >
              SIGN IN
            </Link>
            <Link
              href="/dashboard"
              className="px-3.5 py-1.5 rounded-xl bg-moss-900 text-sand-50 font-semibold hover:bg-moss-800 transition min-h-[38px] flex items-center shadow-xs"
            >
              LAUNCH DASHBOARD [↗]
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-20">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-sand-200/80 border border-sand-300 text-sand-800 text-[11px] font-mono mb-6">
            <span className="w-2 h-2 rounded-full bg-moss-700" />
            POWERED BY GEMINI 1.5 PRO &amp; VERIFIED GIT EVIDENCE
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-sand-950 leading-[1.1] font-sans">
            Preserve Project Continuity When Team Members Leave.
          </h1>

          <p className="mt-5 text-base md:text-lg text-sand-700 leading-relaxed font-sans">
            Ex Officio ingests git commits, pull requests, issues, and documentation to reconstruct architectural decisions, hidden dependencies, and unfinished tasks — with every conclusion linked to tamper-evident git references.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3 font-mono text-xs">
            <Link
              href="/dashboard"
              className="px-5 py-3 rounded-xl bg-moss-900 text-sand-50 font-bold uppercase tracking-wider hover:bg-moss-800 transition shadow-sm inline-flex items-center gap-1.5 min-h-[44px]"
            >
              <span>EXPLORE DEMO WORKSPACE</span>
              <ArrowUpRight size={14} />
            </Link>
            <Link
              href="/dashboard/projects"
              className="px-4 py-3 rounded-xl bg-sand-200 hover:bg-sand-300 border border-sand-300 text-sand-900 font-bold uppercase tracking-wider transition min-h-[44px] inline-flex items-center"
            >
              CONNECT GITHUB REPO
            </Link>
          </div>
        </div>

        {/* Fast Role Demo Switcher for Hackathon Judges */}
        <div className="mt-10 p-4 rounded-2xl bg-sand-50 border border-sand-300 shadow-sm space-y-3 font-mono">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-sand-800">
              <Sparkles size={14} className="text-moss-700" />
              <span className="uppercase">Hackathon Judge Instant Role Launchers</span>
            </div>
            <span className="text-[10px] bg-sand-200 text-sand-700 px-2 py-0.5 rounded font-bold">
              1-CLICK ENVIRONMENTS
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href="/dashboard"
              className="p-3 rounded-xl bg-sand-100 hover:bg-moss-900 hover:text-sand-50 border border-sand-300 transition group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-sand-950 group-hover:text-sand-50">
                  <ShieldCheck size={14} className="text-moss-700 group-hover:text-sand-200" />
                  <span>Project Lead Workspace</span>
                </div>
                <p className="text-[10px] text-sand-600 group-hover:text-sand-200 font-sans mt-1">
                  Continuity score, 6-question report approval, PDF export &amp; AI answers.
                </p>
              </div>
              <div className="text-[10px] text-moss-800 group-hover:text-sand-100 font-bold mt-2 flex items-center gap-1">
                <span>LAUNCH LEAD [↗]</span>
              </div>
            </Link>

            <Link
              href="/dashboard/admin"
              className="p-3 rounded-xl bg-sand-100 hover:bg-moss-900 hover:text-sand-50 border border-sand-300 transition group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-sand-950 group-hover:text-sand-50">
                  <ShieldAlert size={14} className="text-moss-700 group-hover:text-sand-200" />
                  <span>Admin Operations Suite</span>
                </div>
                <p className="text-[10px] text-sand-600 group-hover:text-sand-200 font-sans mt-1">
                  Personnel capacity, project exclusivity matrix, and teams hierarchy.
                </p>
              </div>
              <div className="text-[10px] text-moss-800 group-hover:text-sand-100 font-bold mt-2 flex items-center gap-1">
                <span>LAUNCH ADMIN [↗]</span>
              </div>
            </Link>

            <Link
              href="/dashboard/member"
              className="p-3 rounded-xl bg-sand-100 hover:bg-moss-900 hover:text-sand-50 border border-sand-300 transition group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-sand-950 group-hover:text-sand-50">
                  <UserCheck size={14} className="text-moss-700 group-hover:text-sand-200" />
                  <span>Engineer Member Portal</span>
                </div>
                <p className="text-[10px] text-sand-600 group-hover:text-sand-200 font-sans mt-1">
                  Exclusive assigned projects, daily standup check-in, and hour logging.
                </p>
              </div>
              <div className="text-[10px] text-moss-800 group-hover:text-sand-100 font-bold mt-2 flex items-center gap-1">
                <span>LAUNCH MEMBER [↗]</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Live Interactive Continuity Health Simulator */}
        <div className="mt-12 p-6 md:p-8 rounded-2xl bg-sand-50 border border-sand-300 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-sand-200 pb-4">
            <div>
              <div className="text-[10px] font-mono font-bold tracking-widest text-sand-500 uppercase">
                INTERACTIVE SIMULATION
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-sand-950 font-sans mt-0.5">
                Live Knowledge Continuity Readiness Score
              </h2>
              <p className="text-xs text-sand-600 font-sans mt-0.5">
                Toggle handover mitigation steps below to test how Ex Officio measures organizational resilience.
              </p>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-sand-100 border border-sand-300 shrink-0 font-mono">
              <div className="text-right">
                <div className="text-[10px] text-sand-500 uppercase font-bold">READINESS INDEX</div>
                <div className={`text-2xl font-extrabold ${currentScore >= 80 ? "text-moss-900" : "text-amber-700"}`}>
                  {currentScore}%
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-moss-900 text-sand-50 flex items-center justify-center font-bold text-sm">
                {currentScore >= 80 ? "PASS" : "RISK"}
              </div>
            </div>
          </div>

          {/* Interactive Checklist */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
            {simSteps.map((step) => (
              <button
                key={step.id}
                onClick={() => toggleStep(step.id)}
                className={`p-3.5 rounded-xl border text-left transition flex items-center justify-between gap-3 cursor-pointer ${
                  step.done
                    ? "bg-moss-100/60 border-moss-300 text-sand-950"
                    : "bg-sand-100/80 border-sand-300 text-sand-600 hover:bg-sand-200/60"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-xs font-bold ${
                      step.done ? "bg-moss-900 text-sand-50" : "border border-sand-400 bg-sand-50"
                    }`}
                  >
                    {step.done && <Check size={12} />}
                  </div>
                  <span className={`truncate font-sans ${step.done ? "font-bold text-sand-950" : "text-sand-700"}`}>
                    {step.title}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-moss-800 shrink-0">
                  +{step.points}%
                </span>
              </button>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-sand-200/70 text-xs font-mono text-sand-700 flex items-center justify-between">
            <span>Current Status: <strong>{currentScore >= 80 ? "Audit-Certified & Handover Complete" : "Elevated Bus-Factor Risk"}</strong></span>
            <Link href="/dashboard/projects/proj-apollo-9/handover" className="text-moss-900 font-bold hover:underline">
              VIEW LIVE REPORT [↗]
            </Link>
          </div>
        </div>

        {/* The 8-Stage Pipeline */}
        <div className="mt-16 border border-sand-300 rounded-2xl bg-sand-50 p-6 md:p-8 shadow-sm">
          <div className="text-[10px] font-mono font-bold tracking-widest text-sand-500 uppercase mb-4">
            THE 8-STAGE KNOWLEDGE CONTINUITY PIPELINE
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 font-mono">
            {[
              { step: "01", title: "AUTH & ROLES", desc: "Lead, Admin, Member" },
              { step: "02", title: "SELECT REPO", desc: "Multi-repo scope" },
              { step: "03", title: "DASHBOARD", desc: "Continuity score" },
              { step: "04", title: "TIMELINE", desc: "Unified stream" },
              { step: "05", title: "GITHUB INGEST", desc: "Commits, PRs, bugs" },
              { step: "06", title: "GEMINI AI", desc: "Reconstruct state" },
              { step: "07", title: "LEAD REVIEW", desc: "Resolve conflicts" },
              { step: "08", title: "PUBLISH", desc: "6-Question Report" },
            ].map((s) => (
              <div key={s.step} className="p-3 rounded-xl bg-sand-100 border border-sand-300/80">
                <span className="text-[10px] font-bold text-moss-800">{s.step}</span>
                <div className="text-xs font-bold text-sand-950 mt-1">{s.title}</div>
                <div className="text-[10px] text-sand-600 mt-0.5">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Grid */}
        <div className="mt-12 grid md:grid-cols-3 gap-6 font-sans">
          <div className="p-6 rounded-2xl bg-sand-50 border border-sand-300 space-y-2 shadow-sm">
            <div className="font-mono text-xs font-bold text-moss-800 uppercase">[01. RECONSTRUCTION]</div>
            <h3 className="text-base font-bold text-sand-950">AI Knowledge Reconstruction</h3>
            <p className="text-xs text-sand-700 leading-relaxed">
              Automatically surfaces undocumented edge-case fixes, manual shell scripts, and architectural compromises buried in commit histories.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-sand-50 border border-sand-300 space-y-2 shadow-sm">
            <div className="font-mono text-xs font-bold text-moss-800 uppercase">[02. INTEGRITY]</div>
            <h3 className="text-base font-bold text-sand-950">Evidence-Grounding &amp; Conflict Flags</h3>
            <p className="text-xs text-sand-700 leading-relaxed">
              Every insight cites commit SHAs, PR diffs, and meeting audio notes. Contradictions between PR descriptions and code are highlighted with alerts.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-sand-50 border border-sand-300 space-y-2 shadow-sm">
            <div className="font-mono text-xs font-bold text-moss-800 uppercase">[03. RESILIENCE]</div>
            <h3 className="text-base font-bold text-sand-950">Knowledge Ownership Mapping</h3>
            <p className="text-xs text-sand-700 leading-relaxed">
              Detects single points of failure where modules have over 60% author concentration in a departing member to plan successor transitions.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-sand-300 py-8 px-6 text-xs font-mono text-sand-600">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span>EX OFFICIO — KNOWLEDGE CONTINUITY ENGINE</span>
          <div className="flex gap-4">
            <Link href="/dashboard" className="hover:text-sand-950">
              DASHBOARD
            </Link>
            <Link href="/dashboard/projects" className="hover:text-sand-950">
              PROJECTS
            </Link>
            <Link href="/login" className="hover:text-sand-950">
              SIGN IN
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
