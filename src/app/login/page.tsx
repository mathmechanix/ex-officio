"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Lock } from "lucide-react";

function LoginForm() {
  const searchParams = useSearchParams();
  const rawCallback = searchParams.get("callbackUrl") || "/dashboard";
  const callbackUrl = rawCallback.startsWith("/") ? rawCallback : "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgotInfo, setShowForgotInfo] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

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

      // Single-click hard navigation avoids Next.js router/cookie race conditions
      window.location.assign(callbackUrl);
    } catch {
      setError("Network error occurred during authentication.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-sand-50 border border-sand-300 rounded-2xl p-6 md:p-8 shadow-sm space-y-5">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-moss-100 text-moss-900 mb-2 border border-moss-200">
          <Lock size={16} />
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
          Please contact your Project Lead or Workspace Admin to issue a password reset, or create a new member account via Sign Up.
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
          <input
            type="password"
            autoComplete="current-password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2.5 text-xs font-mono text-sand-950 placeholder:text-sand-400 focus:outline-none focus:border-moss-700"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-moss-900 hover:bg-moss-800 disabled:opacity-70 text-sand-50 text-xs font-mono font-bold tracking-wider uppercase transition flex items-center justify-center gap-2"
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

      <div className="pt-4 border-t border-sand-200 text-center text-xs font-mono text-sand-600">
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
        <Link href="/" className="inline-flex items-center gap-2 mb-2">
          <span className="w-3 h-3 rounded-full bg-moss-700" />
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
