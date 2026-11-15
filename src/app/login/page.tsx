"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Lock, Eye, EyeOff, ShieldCheck, Sparkles, UserCheck } from "lucide-react";

function LoginForm() {
  const searchParams = useSearchParams();
  const rawCallback = searchParams.get("callbackUrl") || "/dashboard";
  const callbackUrl = rawCallback.startsWith("/") ? rawCallback : "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showForgotInfo, setShowForgotInfo] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || demoLoading) return;

    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: email.trim(),
        password,
        callbackUrl,
      });

      if (res?.error || !res?.ok) {
        setError("Invalid email or password. Please verify your credentials.");
        setLoading(false);
        return;
      }

      window.location.assign(callbackUrl);
    } catch {
      setError("Network error occurred during authentication.");
      setLoading(false);
    }
  };

  const handleDemoSignIn = async (demoEmail: string, demoTarget: string, label: string) => {
    if (loading || demoLoading) return;
    setDemoLoading(label);
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: demoEmail,
        password: "password123",
        callbackUrl: demoTarget,
      });

      if (res?.error || !res?.ok) {
        setError("Unable to launch demo credentials.");
        setDemoLoading(null);
        return;
      }

      window.location.assign(demoTarget);
    } catch {
      setError("Network error occurred during demo login.");
      setDemoLoading(null);
    }
  };

  return (
    <div className="bg-sand-50 border border-sand-300 rounded-2xl p-6 md:p-8 shadow-sm space-y-5">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-moss-100 text-moss-900 mb-2 border border-moss-200">
          <Lock size={18} />
        </div>
        <h2 className="text-xl font-extrabold text-sand-950 font-sans tracking-tight">
          Sign In
        </h2>
        <p className="text-xs text-sand-600 mt-1 font-mono">
          STRICT PASSWORD-PROTECTED WORKSPACE
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-100 border border-red-300 text-red-900 text-xs font-mono">
          {error}
        </div>
      )}

      {showForgotInfo && (
        <div className="p-3 rounded-xl bg-sand-100 border border-sand-300 text-sand-800 text-xs font-mono">
          Contact your Workspace Administrator to reissue credentials or use the 1-Click Demo Profiles below.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-mono font-semibold text-sand-800 mb-1">
            WORK EMAIL ADDRESS
          </label>
          <input
            type="email"
            autoComplete="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2.5 text-xs font-mono text-sand-950 placeholder:text-sand-400 focus:outline-none focus:border-moss-700"
            required
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-mono font-semibold text-sand-800">
              PASSWORD
            </label>
            <button
              type="button"
              onClick={() => setShowForgotInfo((v) => !v)}
              className="text-[10px] font-mono text-moss-800 hover:underline cursor-pointer"
            >
              FORGOT?
            </button>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-sand-100 border border-sand-300 rounded-xl pl-3 pr-10 py-2.5 text-xs font-mono text-sand-950 placeholder:text-sand-400 focus:outline-none focus:border-moss-700"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sand-500 hover:text-sand-800 transition p-1"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !!demoLoading}
          className="w-full py-2.5 rounded-xl bg-moss-900 hover:bg-moss-800 disabled:opacity-70 text-sand-50 text-xs font-mono font-bold tracking-wider uppercase transition flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>VERIFYING & ENTERING...</span>
            </>
          ) : (
            <span>SIGN IN [↗]</span>
          )}
        </button>
      </form>

      {/* 1-Click Fast Demo Dashboards */}
      <div className="pt-4 border-t border-sand-300 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-sand-500 font-bold">
            Or Test 1-Click Demo Profiles
          </span>
          <span className="text-[9px] font-mono text-moss-800 bg-moss-100 px-1.5 py-0.5 rounded">
            INSTANT LAUNCH
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            disabled={loading || !!demoLoading}
            onClick={() => handleDemoSignIn("lead@exofficio.dev", "/dashboard", "lead")}
            className="p-2.5 rounded-xl border border-sand-300 bg-sand-100 hover:bg-moss-900 hover:text-sand-50 hover:border-moss-900 text-sand-900 text-left transition group cursor-pointer"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold font-mono">
              <Sparkles size={13} className="text-moss-700 group-hover:text-sand-100" />
              <span>Project Lead</span>
            </div>
            <div className="text-[10px] text-sand-500 group-hover:text-sand-200 truncate mt-0.5 font-mono">
              Sarah Connor (Lead)
            </div>
          </button>

          <button
            type="button"
            disabled={loading || !!demoLoading}
            onClick={() => handleDemoSignIn("admin@exofficio.dev", "/dashboard/admin", "admin")}
            className="p-2.5 rounded-xl border border-sand-300 bg-sand-100 hover:bg-moss-900 hover:text-sand-50 hover:border-moss-900 text-sand-900 text-left transition group cursor-pointer"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold font-mono">
              <ShieldCheck size={13} className="text-moss-700 group-hover:text-sand-100" />
              <span>Admin Center</span>
            </div>
            <div className="text-[10px] text-sand-500 group-hover:text-sand-200 truncate mt-0.5 font-mono">
              Level 3 Ops Admin
            </div>
          </button>

          <button
            type="button"
            disabled={loading || !!demoLoading}
            onClick={() => handleDemoSignIn("priya.sharma@acme.com", "/dashboard/member", "member")}
            className="p-2.5 rounded-xl border border-sand-300 bg-sand-100 hover:bg-moss-900 hover:text-sand-50 hover:border-moss-900 text-sand-900 text-left transition group cursor-pointer"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold font-mono">
              <UserCheck size={13} className="text-moss-700 group-hover:text-sand-100" />
              <span>Member View</span>
            </div>
            <div className="text-[10px] text-sand-500 group-hover:text-sand-200 truncate mt-0.5 font-mono">
              Priya (Engineer)
            </div>
          </button>
        </div>

        {demoLoading && (
          <div className="text-center py-1 text-xs font-mono text-moss-800 flex items-center justify-center gap-2">
            <Loader2 size={13} className="animate-spin" />
            <span>Launching {demoLoading} environment...</span>
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-sand-200 text-center text-xs font-mono text-sand-600">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-moss-900 font-bold hover:underline">
          CREATE ACCOUNT
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-sand-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative font-sans text-sand-950">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 mb-2 p-2 rounded-xl hover:bg-sand-200/60 transition group"
          title="Ex Officio Home"
        >
          <span className="w-3 h-3 rounded-full bg-moss-700 group-hover:scale-125 transition-transform" />
          <span className="text-xl font-mono font-bold text-sand-950 tracking-widest uppercase">
            EX OFFICIO
          </span>
        </Link>
        <p className="text-xs font-mono text-sand-600">
          EVIDENCE-FIRST KNOWLEDGE HANDOVER
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Suspense
          fallback={
            <div className="bg-sand-50 border border-sand-300 rounded-2xl p-8 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-moss-800" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
