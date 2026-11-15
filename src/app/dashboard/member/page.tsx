"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  UserCheck,
  FolderKanban,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";

export default function MemberDashboardPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const [profile, setProfile] = useState<any>(null);
  const [assignedProjects, setAssignedProjects] = useState<any[]>([]);
  const [workLogs, setWorkLogs] = useState<any[]>([]);

  // Form to log hours
  const [logForm, setLogForm] = useState({
    projectId: "",
    hours: 4,
    taskDescription: "",
    logDate: new Date().toISOString().split("T")[0],
  });
  const [submitting, setSubmitting] = useState(false);

  const loadMemberData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/member/work-hours");
      const data = await res.json();
      if (data.success) {
        setProfile(data.profile);
        setAssignedProjects(data.assignedProjects || []);
        setWorkLogs(data.workLogs || []);
        if (data.assignedProjects?.length > 0 && !logForm.projectId) {
          setLogForm((prev) => ({ ...prev, projectId: data.assignedProjects[0].id }));
        }
      } else {
        setError(data.error || "Failed to load member profile.");
      }
    } catch {
      setError("Network error loading member workspace.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMemberData();
  }, []);

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logForm.projectId || !logForm.hours || !logForm.taskDescription) {
      alert("Please fill in project, hours, and task description.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/member/work-hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(logForm),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback(`Logged ${logForm.hours} hours successfully.`);
        setTimeout(() => setFeedback(""), 4500);
        setLogForm((prev) => ({
          ...prev,
          hours: 4,
          taskDescription: "",
        }));
        loadMemberData();
      } else {
        alert(data.error || "Failed to log hours.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="p-12 text-center text-xs font-mono text-moss-800 flex items-center justify-center gap-2">
        <Loader2 size={16} className="animate-spin" />
        <span>Loading member clearance portal...</span>
      </div>
    );
  }

  const capacity = profile?.weeklyCapacity || 40;
  const logged = profile?.totalHoursLogged || 0;
  const utilization = Math.round((logged / capacity) * 100);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 font-sans text-sand-950">
      {/* Top Banner */}
      <div className="border-b border-sand-300 pb-5">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded bg-moss-900 text-sand-50">
            <UserCheck size={16} />
          </span>
          <span className="font-mono text-xs font-bold tracking-widest uppercase text-moss-900">
            ENGINEERING MEMBER PORTAL
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-moss-200 text-moss-900 font-bold border border-moss-300">
            {profile?.clearanceBadge || "LEVEL_1_MEMBER"}
          </span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-sand-950 mt-1 font-sans">
          Welcome back, {profile?.name || session?.user?.name}
        </h1>
        <p className="text-xs text-sand-600 mt-1">
          Assigned to {profile?.team || "Platform Engineering"} • {profile?.subTeam || "Core Infrastructure"} (ID: {profile?.employeeId || "EMP-XXXX"})
        </p>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-moss-100 border border-moss-300 text-moss-900 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 size={15} />
          <span>{feedback}</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-red-100 border border-red-300 text-red-900 text-xs font-mono flex items-center gap-2">
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* Profile Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-sand-50 border border-sand-300 shadow-sm space-y-1">
          <div className="text-sand-500 text-xs font-mono">ASSIGNED PROJECTS</div>
          <div className="text-2xl font-black text-sand-950 font-sans">{assignedProjects.length}</div>
          <div className="text-[10px] font-mono text-moss-800">Clearance Granted</div>
        </div>

        <div className="p-4 rounded-2xl bg-sand-50 border border-sand-300 shadow-sm space-y-1">
          <div className="text-sand-500 text-xs font-mono">HOURS LOGGED</div>
          <div className="text-2xl font-black text-sand-950 font-sans">{logged}h</div>
          <div className="text-[10px] font-mono text-moss-800">Total Recorded</div>
        </div>

        <div className="p-4 rounded-2xl bg-sand-50 border border-sand-300 shadow-sm space-y-1">
          <div className="text-sand-500 text-xs font-mono">WEEKLY CAPACITY</div>
          <div className="text-2xl font-black text-sand-950 font-sans">{capacity}h</div>
          <div className="text-[10px] font-mono text-moss-800">Contract Standard</div>
        </div>

        <div className="p-4 rounded-2xl bg-sand-50 border border-sand-300 shadow-sm space-y-1">
          <div className="text-sand-500 text-xs font-mono">CAPACITY TARGET</div>
          <div className="text-2xl font-black text-sand-950 font-sans">{utilization}%</div>
          <div className="text-[10px] font-mono text-moss-800">Tracking Normal</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Assigned Projects & Logged Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assigned Projects */}
          <div className="p-5 rounded-2xl bg-sand-50 border border-sand-300 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold font-sans flex items-center gap-2">
                <FolderKanban size={16} className="text-moss-900" />
                <span>My Assigned Clearance Projects</span>
              </h2>
              <span className="text-[10px] font-mono text-sand-500">
                Project Exclusivity Active
              </span>
            </div>

            {assignedProjects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                {assignedProjects.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-xl bg-sand-100 border border-sand-300 hover:border-moss-700 transition flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="font-bold text-sand-950 font-sans text-sm">{p.name}</div>
                      <div className="text-[10px] text-sand-500 mt-0.5">Status: {p.status}</div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {p.techStack?.map((t: string) => (
                          <span
                            key={t}
                            className="px-1.5 py-0.5 rounded bg-sand-200 text-sand-700 text-[9px]"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-sand-200">
                      <Link
                        href={`/dashboard/projects/${p.id}/handover`}
                        className="text-[10px] font-bold text-moss-900 hover:underline inline-flex items-center gap-1"
                      >
                        <span>HANDOVER REPORT</span>
                        <ExternalLink size={10} />
                      </Link>
                      <Link
                        href={`/dashboard/projects/${p.id}`}
                        className="px-2 py-1 rounded bg-moss-900 text-sand-50 text-[10px] font-bold hover:bg-moss-800 transition"
                      >
                        OPEN WORKSPACE
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs font-mono text-sand-600 bg-sand-100/60 rounded-xl border border-dashed border-sand-300">
                You have not yet been granted clearance to any exclusive projects. Contact your workspace administrator to assign clearance.
              </div>
            )}
          </div>

          {/* Recent Work Logs Table */}
          <div className="p-5 rounded-2xl bg-sand-50 border border-sand-300 shadow-sm space-y-4">
            <h2 className="text-base font-bold font-sans flex items-center gap-2">
              <Clock size={16} className="text-moss-900" />
              <span>My Recorded Work Logs ({workLogs.length})</span>
            </h2>

            {workLogs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-sand-200/70 border-b border-sand-300 text-sand-700">
                    <tr>
                      <th className="p-2.5">DATE</th>
                      <th className="p-2.5">PROJECT</th>
                      <th className="p-2.5">HOURS</th>
                      <th className="p-2.5">TASK DESCRIPTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand-200">
                    {workLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-sand-100/70 transition">
                        <td className="p-2.5 text-sand-500 whitespace-nowrap">{log.logDate}</td>
                        <td className="p-2.5 font-bold text-sand-900">{log.projectName}</td>
                        <td className="p-2.5 font-bold text-moss-900">+{log.hours}h</td>
                        <td className="p-2.5 text-sand-700 font-sans text-xs">{log.taskDescription}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-xs font-mono text-sand-600 bg-sand-100/60 rounded-xl border border-dashed border-sand-300">
                No work hours logged yet. Use the Log Work Hours panel to register your contributions.
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Quick Log Work Hours Card & Security Info */}
        <div className="space-y-6">
          {/* Quick Log Form */}
          <div className="p-5 rounded-2xl bg-sand-50 border border-sand-300 shadow-sm space-y-4 font-mono text-xs">
            <div>
              <h2 className="text-base font-bold font-sans text-sand-950 flex items-center gap-1.5">
                <Clock size={16} className="text-moss-900" />
                <span>Log My Work Hours</span>
              </h2>
              <p className="text-[10px] text-sand-500">Record engineering time directly to your database profile.</p>
            </div>

            <form onSubmit={handleLogSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-sand-800 mb-1">
                  ASSIGNED PROJECT
                </label>
                <select
                  value={logForm.projectId}
                  onChange={(e) => setLogForm({ ...logForm, projectId: e.target.value })}
                  className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-xs text-sand-950 focus:outline-none focus:border-moss-700"
                  required
                >
                  {assignedProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-sand-800 mb-1">HOURS</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={logForm.hours}
                    onChange={(e) => setLogForm({ ...logForm, hours: Number(e.target.value) })}
                    className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-xs text-sand-950 focus:outline-none focus:border-moss-700"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-sand-800 mb-1">DATE</label>
                  <input
                    type="date"
                    value={logForm.logDate}
                    onChange={(e) => setLogForm({ ...logForm, logDate: e.target.value })}
                    className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-xs text-sand-950 focus:outline-none focus:border-moss-700"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-sand-800 mb-1">
                  TASK DESCRIPTION
                </label>
                <textarea
                  rows={3}
                  placeholder="Shadowed Kafka partition rebalances and reviewed HMAC key rotation script..."
                  value={logForm.taskDescription}
                  onChange={(e) => setLogForm({ ...logForm, taskDescription: e.target.value })}
                  className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-xs text-sand-950 focus:outline-none focus:border-moss-700"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting || assignedProjects.length === 0}
                className="w-full py-2.5 rounded-xl bg-moss-900 hover:bg-moss-800 text-sand-50 font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {submitting ? <Loader2 size={13} className="animate-spin" /> : <Clock size={13} />}
                <span>RECORD WORK LOG</span>
              </button>
            </form>
          </div>

          {/* Security & Clearance Card */}
          <div className="p-5 rounded-2xl bg-sand-50 border border-sand-300 shadow-sm space-y-3 font-mono text-xs">
            <div className="flex items-center gap-2 text-moss-900 font-bold text-xs">
              <ShieldCheck size={16} />
              <span>SECURITY &amp; ACCESS PRIVILEGES</span>
            </div>
            <div className="space-y-1.5 text-[11px] text-sand-700">
              <div className="flex justify-between py-1 border-b border-sand-200">
                <span className="text-sand-500">Employee ID:</span>
                <span className="font-bold text-sand-950">{profile?.employeeId || "EMP-XXXX"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-sand-200">
                <span className="text-sand-500">Clearance:</span>
                <span className="font-bold text-moss-900">{profile?.clearanceBadge || "LEVEL_1_MEMBER"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-sand-200">
                <span className="text-sand-500">Parent Team:</span>
                <span className="font-bold text-sand-950">{profile?.team}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-sand-200">
                <span className="text-sand-500">Sub-Team:</span>
                <span className="font-bold text-sand-950">{profile?.subTeam}</span>
              </div>
            </div>
            <p className="text-[10px] text-sand-500 font-sans pt-1">
              Project isolation is active. You only hold view and contributor permissions on repositories explicitly cleared by workspace administrators.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
