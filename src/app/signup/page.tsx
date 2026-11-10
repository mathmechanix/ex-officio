"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"PROJECT_LEAD" | "MEMBER">("PROJECT_LEAD");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Registration failed.");
        setLoading(false);
        return;
      }

      // Automatically sign in with credentials
      const signInRes = await signIn("credentials", {
        redirect: false,
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInRes?.error || !signInRes?.ok) {
        window.location.assign("/login");
      } else {
        window.location.assign("/dashboard");
      }
    } catch (err: any) {
      setError("Network or server error during sign up.");
      setLoading(false);
    }
  };

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
          STRICT PASSWORD-PROTECTED WORKSPACE
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-sand-50 border border-sand-300 rounded-2xl p-6 md:p-8 shadow-sm space-y-5">
          <div className="text-center">
            <h2 className="text-xl font-extrabold text-sand-950 font-sans tracking-tight">
              Create Account
            </h2>
            <p className="text-xs text-sand-600 mt-1 font-mono">
              STRICT CREDENTIAL-BASED REGISTRATION
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-100 border border-red-300 text-red-900 text-xs font-mono">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
            <div>
              <label className="block text-xs font-bold text-sand-800 mb-1">
                FULL NAME
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sarah Connor"
                className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-xs font-mono text-sand-950 focus:outline-none focus:border-moss-700"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-sand-800 mb-1">
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="s.connor@acme.com"
                className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-xs font-mono text-sand-950 focus:outline-none focus:border-moss-700"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-sand-800 mb-1">
                PASSWORD (STRICT)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-xs font-mono text-sand-950 focus:outline-none focus:border-moss-700"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-sand-800 mb-1">
                WORKSPACE ROLE
              </label>
              <div className="grid grid-cols-2 gap-2 font-mono">
                <button
                  type="button"
                  onClick={() => setRole("PROJECT_LEAD")}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    role === "PROJECT_LEAD"
                      ? "border-moss-900 bg-moss-900 text-sand-50"
                      : "border-sand-300 bg-sand-100 text-sand-800"
                  }`}
                >
                  <div className="font-bold">Project Lead</div>
                  <div className="text-[10px] opacity-80">Full approvals</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("MEMBER")}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    role === "MEMBER"
                      ? "border-moss-900 bg-moss-900 text-sand-50"
                      : "border-sand-300 bg-sand-100 text-sand-800"
                  }`}
                >
                  <div className="font-bold">Member</div>
                  <div className="text-[10px] opacity-80">Viewer / Contributor</div>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-moss-900 hover:bg-moss-800 text-sand-50 text-xs font-mono font-bold tracking-wider uppercase transition flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>CREATING ACCOUNT...</span>
                </>
              ) : (
                <span>REGISTER & ENTER DASHBOARD [↗]</span>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-sand-200 text-center text-xs font-mono text-sand-600">
            Already have an account?{" "}
            <Link href="/login" className="text-moss-900 font-bold hover:underline">
              SIGN IN
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
