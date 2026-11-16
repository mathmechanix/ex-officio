"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import {
  UserCircle,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  Building2,
  Clock,
  KeyRound,
  CheckCircle2,
  ExternalLink,
  Layers,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Password update form
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const userName = session?.user?.name || "Sarah Connor";
  const userEmail = session?.user?.email || "lead@exofficio.dev";
  const userRole = (session?.user as any)?.role || "PROJECT_LEAD";
  const userImage = session?.user?.image;

  useEffect(() => {
    let active = true;
    fetch("/api/member/work-hours")
      .then((res) => res.json())
      .then((data) => {
        if (active && data.success) {
          setProfileData(data);
        }
      })
      .catch((err) => console.error("Failed to load profile details:", err))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordNotice({ type: "error", msg: "Password must be at least 6 characters long." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordNotice({ type: "error", msg: "Passwords do not match." });
      return;
    }

    setSavingPassword(true);
    setPasswordNotice(null);
    try {
      const res = await fetch("/api/admin/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: (session?.user as any)?.id || profileData?.profile?.id,
          password: newPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPasswordNotice({ type: "success", msg: "Password successfully updated with bcrypt hashing!" });
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setShowPasswordModal(false), 2000);
      } else {
        setPasswordNotice({ type: "error", msg: data.error || "Update failed." });
      }
    } catch {
      setPasswordNotice({ type: "error", msg: "Network error updating password." });
    } finally {
      setSavingPassword(false);
    }
  };

  const badgeConfig: Record<string, { label: string; color: string; icon: any }> = {
    ADMIN: { label: "Level 3 - Global Administrator", color: "bg-red-100 text-red-900 border-red-300", icon: ShieldAlert },
    PROJECT_LEAD: { label: "Level 2 - Handover Project Lead", color: "bg-moss-100 text-moss-900 border-moss-300", icon: ShieldCheck },
    MEMBER: { label: "Level 1 - Engineering Contributor", color: "bg-sand-200 text-sand-800 border-sand-300", icon: UserCheck },
  };

  const badge = badgeConfig[userRole] || badgeConfig.MEMBER;
  const BadgeIcon = badge.icon;

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-sand-950 font-sans pb-16 pt-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sand-300 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-sand-950 font-sans">
            User Profile &amp; Clearance
          </h1>
          <p className="text-xs text-sand-600 mt-1 font-mono">
            MANAGE AUTHENTICATION, ENTERPRISE BADGES, AND ASSIGNED WORKSPACES
          </p>
        </div>

        <div className="flex items-center gap-2">
          {userRole === "ADMIN" && (
            <Link
              href="/dashboard/admin"
              className="px-3.5 py-2 rounded-xl bg-moss-900 text-sand-50 text-xs font-mono font-bold tracking-wider hover:bg-moss-800 transition flex items-center gap-1.5 shadow-xs"
            >
              <ShieldAlert size={14} />
              <span>ADMIN CONSOLE</span>
            </Link>
          )}
          {userRole === "MEMBER" && (
            <Link
              href="/dashboard/member"
              className="px-3.5 py-2 rounded-xl bg-moss-900 text-sand-50 text-xs font-mono font-bold tracking-wider hover:bg-moss-800 transition flex items-center gap-1.5 shadow-xs"
            >
              <UserCheck size={14} />
              <span>MEMBER PORTAL</span>
            </Link>
          )}
        </div>
      </div>

      {/* Main Identity Card */}
      <div className="bg-sand-50 border border-sand-300 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 pb-6 border-b border-sand-200">
          <div className="w-20 h-20 rounded-2xl bg-moss-900 text-sand-50 flex items-center justify-center font-bold text-2xl overflow-hidden shrink-0 shadow-sm border border-sand-300">
            {userImage ? (
              <img src={userImage} alt={userName} className="w-full h-full object-cover" />
            ) : (
              <span>{userName.charAt(0).toUpperCase()}</span>
            )}
          </div>

          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-sand-950 font-sans truncate">{userName}</h2>
              <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border text-[11px] font-mono font-bold ${badge.color}`}>
                <BadgeIcon size={12} />
                <span>{badge.label}</span>
              </div>
            </div>
            <p className="text-xs text-sand-600 font-mono truncate">{userEmail}</p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-mono text-sand-700">
              <span className="bg-sand-200/80 px-2 py-0.5 rounded">
                ID: {profileData?.profile?.employeeId || "EMP-1002"}
              </span>
              <span className="bg-sand-200/80 px-2 py-0.5 rounded">
                TEAM: {profileData?.profile?.team || "Platform Engineering"}
              </span>
              <span className="bg-sand-200/80 px-2 py-0.5 rounded">
                SUB-TEAM: {profileData?.profile?.subTeam || "Auth & Identity Systems"}
              </span>
            </div>
          </div>
        </div>

        {/* Operational Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
          <div className="p-4 rounded-xl bg-sand-100 border border-sand-300 space-y-1">
            <span className="text-[10px] font-bold text-sand-500 uppercase tracking-wider">Weekly Quota</span>
            <div className="text-lg font-bold text-moss-950">
              {profileData?.profile?.weeklyCapacity || 40} hrs / week
            </div>
            <p className="text-[10px] text-sand-600">Standard full-time allocation</p>
          </div>

          <div className="p-4 rounded-xl bg-sand-100 border border-sand-300 space-y-1">
            <span className="text-[10px] font-bold text-sand-500 uppercase tracking-wider">Logged This Period</span>
            <div className="text-lg font-bold text-moss-950">
              {profileData?.profile?.totalHoursLogged || 0} hrs
            </div>
            <p className="text-[10px] text-sand-600">Across verified daily standup logs</p>
          </div>

          <div className="p-4 rounded-xl bg-sand-100 border border-sand-300 space-y-1">
            <span className="text-[10px] font-bold text-sand-500 uppercase tracking-wider">Assigned Projects</span>
            <div className="text-lg font-bold text-moss-950">
              {profileData?.assignedProjects?.length || 1} active
            </div>
            <p className="text-[10px] text-sand-600">Project exclusivity enabled</p>
          </div>
        </div>

        {/* Security & Password Section */}
        <div className="p-5 rounded-xl bg-sand-100/70 border border-sand-300 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound size={16} className="text-moss-800" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-sand-950">
                Security &amp; Credentials
              </h3>
            </div>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="px-3 py-1.5 rounded-lg bg-sand-200 hover:bg-sand-300 text-sand-900 font-mono text-[11px] font-bold transition cursor-pointer"
            >
              CHANGE PASSWORD
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono text-sand-700">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-moss-700" />
              <span>Password Algorithm: <strong>bcrypt (10 rounds)</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-moss-700" />
              <span>Session Strategy: <strong>Encrypted JWT (30 days)</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-moss-700" />
              <span>Database Persistence: <strong>SQLite with WAL mode</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-moss-700" />
              <span>RBAC Enforcement: <strong>Active on all API endpoints</strong></span>
            </div>
          </div>
        </div>

        {/* Assigned Projects Directory */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-sand-700">
            Accessible Workspaces ({profileData?.assignedProjects?.length || 1})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(profileData?.assignedProjects || [{ id: "proj-apollo-9", name: "Apollo Core Platform", status: "HANDOVER_IN_PROGRESS" }]).map((p: any) => (
              <Link
                key={p.id}
                href={`/dashboard/projects/${p.id}`}
                className="p-3.5 rounded-xl bg-sand-100 hover:bg-sand-200/80 border border-sand-300 transition flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-bold text-sand-950 group-hover:text-moss-900 transition">
                    {p.name}
                  </div>
                  <div className="text-[10px] font-mono text-sand-500 uppercase mt-0.5">
                    {p.status?.replace(/_/g, " ")}
                  </div>
                </div>
                <ExternalLink size={14} className="text-sand-400 group-hover:text-moss-800 transition" />
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Role Switcher for Hackathon Testing */}
        <div className="pt-4 border-t border-sand-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-sand-500 font-bold">
              Hackathon Evaluation Fast Profile Switcher
            </span>
            <span className="text-[9px] font-mono text-moss-800 bg-moss-100 px-1.5 py-0.5 rounded">
              JUDGE TOOL
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Link
              href="/login"
              className="p-2.5 rounded-xl border border-sand-300 bg-sand-100 hover:bg-moss-900 hover:text-sand-50 text-sand-900 text-left transition text-xs font-mono font-bold"
            >
              <div>Project Lead View</div>
              <div className="text-[10px] opacity-75 font-normal">Sarah Connor (Lead)</div>
            </Link>

            <Link
              href="/login"
              className="p-2.5 rounded-xl border border-sand-300 bg-sand-100 hover:bg-moss-900 hover:text-sand-50 text-sand-900 text-left transition text-xs font-mono font-bold"
            >
              <div>Admin Console View</div>
              <div className="text-[10px] opacity-75 font-normal">Level 3 Admin</div>
            </Link>

            <Link
              href="/login"
              className="p-2.5 rounded-xl border border-sand-300 bg-sand-100 hover:bg-moss-900 hover:text-sand-50 text-sand-900 text-left transition text-xs font-mono font-bold"
            >
              <div>Member View</div>
              <div className="text-[10px] opacity-75 font-normal">Priya (Engineer)</div>
            </Link>
          </div>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-sand-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-sand-50 border border-sand-300 rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-sand-200 pb-3">
              <div className="flex items-center gap-2">
                <Lock size={16} className="text-moss-800" />
                <h3 className="font-bold text-sand-950 uppercase">Update Account Password</h3>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-sand-500 hover:text-sand-900 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {passwordNotice && (
              <div
                className={`p-3 rounded-xl border text-xs ${
                  passwordNotice.type === "success"
                    ? "bg-green-100 border-green-300 text-green-900"
                    : "bg-red-100 border-red-300 text-red-900"
                }`}
              >
                {passwordNotice.msg}
              </div>
            )}

            <form onSubmit={handlePasswordUpdate} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-sand-800 mb-1">
                  NEW PASSWORD (MIN 6 CHARS)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    minLength={6}
                    className="w-full bg-sand-100 border border-sand-300 rounded-xl pl-3 pr-10 py-2 text-xs font-mono text-sand-950 focus:outline-none focus:border-moss-700"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sand-500 hover:text-sand-800"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-sand-800 mb-1">
                  CONFIRM NEW PASSWORD
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  minLength={6}
                  className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-xs font-mono text-sand-950 focus:outline-none focus:border-moss-700"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-2 rounded-xl bg-sand-200 hover:bg-sand-300 text-sand-800 font-bold uppercase transition cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="flex-1 py-2 rounded-xl bg-moss-900 hover:bg-moss-800 text-sand-50 font-bold uppercase transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {savingPassword ? <Loader2 size={14} className="animate-spin" /> : <span>SAVE PASSWORD</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
