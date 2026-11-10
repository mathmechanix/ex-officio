import Link from "next/link";
import { ArrowUpRight, ShieldCheck, GitBranch, BrainCircuit, FileCheck, Layers, Users } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-sand-100 text-sand-950 font-sans selection:bg-moss-800 selection:text-white">
      {/* Editorial Header */}
      <header className="border-b border-sand-300 bg-sand-50/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-moss-700" />
            <span className="font-mono text-xs font-bold tracking-widest text-moss-950 uppercase">
              EX OFFICIO
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sand-200 text-sand-700 uppercase">
              EVIDENCE-FIRST HANDOVER
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <Link href="/login" className="px-3 py-1.5 text-sand-700 hover:text-sand-950">
              SIGN IN
            </Link>
            <Link
              href="/dashboard"
              className="px-3.5 py-1.5 rounded bg-moss-900 text-sand-50 font-semibold hover:bg-moss-800 transition"
            >
              LAUNCH DASHBOARD [↗]
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-16 pb-20">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-sand-200/80 border border-sand-300 text-sand-800 text-[11px] font-mono mb-6">
            <span className="w-2 h-2 rounded-full bg-moss-700" />
            POWERED BY GEMINI 1.5 PRO & VERIFIED GIT EVIDENCE
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-sand-950 leading-[1.1] font-sans">
            Preserve Project Continuity When Team Members Leave.
          </h1>

          <p className="mt-5 text-base md:text-lg text-sand-700 leading-relaxed font-sans">
            Ex Officio ingests git commits, pull requests, issues, and documentation to reconstruct architectural decisions, hidden dependencies, and unfinished tasks — with every conclusion linked to tamper-evident git references.
          </p>

          <div className="mt-8 flex items-center gap-3 font-mono text-xs">
            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded bg-moss-900 text-sand-50 font-bold uppercase tracking-wider hover:bg-moss-800 transition shadow-sm inline-flex items-center gap-1.5"
            >
              <span>EXPLORE DEMO WORKSPACE</span>
              <ArrowUpRight size={14} />
            </Link>
            <Link
              href="/dashboard/projects"
              className="px-4 py-2.5 rounded bg-sand-200 hover:bg-sand-300 border border-sand-300 text-sand-900 font-bold uppercase tracking-wider transition"
            >
              CONNECT GITHUB REPO
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
            <h3 className="text-base font-bold text-sand-950">Evidence-Grounding & Conflict Flags</h3>
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
