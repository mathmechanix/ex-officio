"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ShieldAlert,
  Users,
  FolderKanban,
  Clock,
  Layers,
  Edit3,
  UserPlus,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  ExternalLink,
  KeyRound,
  BadgeCheck,
  Building2,
  Trash2,
  Sparkles,
} from "lucide-react";

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<"projects" | "hours" | "matrix" | "members" | "teams">("projects");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionFeedback, setActionFeedback] = useState("");

  // Data states
  const [projects, setProjects] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [workHoursData, setWorkHoursData] = useState<any>(null);
  const [teamsData, setTeamsData] = useState<any[]>([]);
  const [flatSubTeams, setFlatSubTeams] = useState<any[]>([]);

  // Search & filter
  const [memberSearch, setMemberSearch] = useState("");
  const [projectSearch, setProjectSearch] = useState("");

  // Modals
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState<{ projectId: string; projectName: string } | null>(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showNewTeamModal, setShowNewTeamModal] = useState(false);
  const [showNewSubTeamModal, setShowNewSubTeamModal] = useState(false);
  const [showLogHoursModal, setShowLogHoursModal] = useState(false);

  // Form states
  const [newMemberForm, setNewMemberForm] = useState({
    name: "",
    email: "",
    password: "password123",
    role: "MEMBER",
    employeeId: "",
    clearanceBadge: "LEVEL_1_MEMBER",
    teamId: "team-platform",
    subTeamId: "sub-auth",
    workHoursWeekly: 40,
  });

  const [assignForm, setAssignForm] = useState({
    userId: "",
    role: "CONTRIBUTOR",
  });

  const [newProjectForm, setNewProjectForm] = useState({
    name: "",
    description: "",
    techStack: "TypeScript, Next.js, Kafka",
    teamId: "team-platform",
    subTeamId: "sub-auth",
    isExclusive: true,
    departingName: "Alex Chen",
    departingRole: "Principal Architect",
  });

  const [newTeamForm, setNewTeamForm] = useState({
    name: "",
    description: "",
  });

  const [newSubTeamForm, setNewSubTeamForm] = useState({
    teamId: "",
    name: "",
    description: "",
  });

  const [logHoursForm, setLogHoursForm] = useState({
    userId: "",
    projectId: "",
    hours: 8,
    taskDescription: "",
    logDate: new Date().toISOString().split("T")[0],
  });

  const [submitting, setSubmitting] = useState(false);

  // Fetch all admin data
  const loadAdminData = async () => {
    setLoading(true);
    setError("");
    try {
      const [projRes, membRes, hoursRes, teamsRes] = await Promise.all([
        fetch("/api/admin/projects"),
        fetch("/api/admin/members"),
        fetch("/api/admin/work-hours"),
        fetch("/api/admin/teams"),
      ]);

      const [projData, membData, hoursData, teamsDataRes] = await Promise.all([
        projRes.json(),
        membRes.json(),
        hoursRes.json(),
        teamsRes.json(),
      ]);

      if (!projData.success) {
        setError(projData.error || "Failed to load admin projects.");
      } else {
        setProjects(projData.projects || []);
      }

      if (membData.success) {
        setMembers(membData.members || []);
      }

      if (hoursData.success) {
        setWorkHoursData(hoursData);
      }

      if (teamsDataRes.success) {
        setTeamsData(teamsDataRes.teams || []);
        setFlatSubTeams(teamsDataRes.flatSubTeams || []);
      }
    } catch (err: any) {
      setError("Network error loading administrator console data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const showToast = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(""), 4500);
  };

  // Handlers
  const handleEditMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editingMember.id,
          name: editingMember.name,
          role: editingMember.role,
          employeeId: editingMember.employeeId,
          clearanceBadge: editingMember.clearanceBadge,
          teamId: editingMember.teamId,
          subTeamId: editingMember.subTeamId,
          workHoursWeekly: Number(editingMember.workHoursWeekly),
          status: editingMember.status,
          password: editingMember.newPassword || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "Member profile updated.");
        setEditingMember(null);
        loadAdminData();
      } else {
        alert(data.error || "Failed to update member.");
      }
    } catch (err) {
      alert("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMemberForm),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "New member provisioned.");
        setShowAddMemberModal(false);
        setNewMemberForm({
          name: "",
          email: "",
          password: "password123",
          role: "MEMBER",
          employeeId: "",
          clearanceBadge: "LEVEL_1_MEMBER",
          teamId: "team-platform",
          subTeamId: "sub-auth",
          workHoursWeekly: 40,
        });
        loadAdminData();
      } else {
        alert(data.error || "Failed to provision member.");
      }
    } catch (err) {
      alert("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAssignModal || !assignForm.userId) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assign",
          projectId: showAssignModal.projectId,
          userId: assignForm.userId,
          role: assignForm.role,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Member assigned to project.");
        setShowAssignModal(null);
        setAssignForm({ userId: "", role: "CONTRIBUTOR" });
        loadAdminData();
      } else {
        alert(data.error || "Assignment failed.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (projectId: string, userId: string, memberName: string) => {
    if (!confirm(`Revoke project clearance for ${memberName}?`)) return;
    try {
      const res = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", projectId, userId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Clearance revoked for ${memberName}.`);
        loadAdminData();
      } else {
        alert(data.error || "Failed to remove member.");
      }
    } catch {
      alert("Network error.");
    }
  };

  const handleNewProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          name: newProjectForm.name,
          description: newProjectForm.description,
          techStack: newProjectForm.techStack.split(",").map((s) => s.trim()),
          teamId: newProjectForm.teamId,
          subTeamId: newProjectForm.subTeamId,
          isExclusive: newProjectForm.isExclusive,
          departingMember: {
            name: newProjectForm.departingName,
            role: newProjectForm.departingRole,
            leavingDate: "in 2 weeks",
            criticalOwnership: "Core Subsystems",
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "Project provisioned.");
        setShowNewProjectModal(false);
        loadAdminData();
      } else {
        alert(data.error || "Failed to create project.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "team",
          name: newTeamForm.name,
          description: newTeamForm.description,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "Team created.");
        setShowNewTeamModal(false);
        setNewTeamForm({ name: "", description: "" });
        loadAdminData();
      } else {
        alert(data.error || "Failed to create team.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewSubTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "subteam",
          teamId: newSubTeamForm.teamId,
          name: newSubTeamForm.name,
          description: newSubTeamForm.description,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "Sub-team created.");
        setShowNewSubTeamModal(false);
        setNewSubTeamForm({ teamId: "", name: "", description: "" });
        loadAdminData();
      } else {
        alert(data.error || "Failed to create sub-team.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogHoursSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/work-hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(logHoursForm),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "Hours logged.");
        setShowLogHoursModal(false);
        setLogHoursForm({
          userId: "",
          projectId: "",
          hours: 8,
          taskDescription: "",
          logDate: new Date().toISOString().split("T")[0],
        });
        loadAdminData();
      } else {
        alert(data.error || "Failed to log hours.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered members & projects
  const filteredMembers = members.filter((m) => {
    const q = memberSearch.toLowerCase();
    return (
      m.name?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.employeeId?.toLowerCase().includes(q) ||
      m.teamName?.toLowerCase().includes(q) ||
      m.subTeamName?.toLowerCase().includes(q)
    );
  });

  const filteredProjects = projects.filter((p) => {
    const q = projectSearch.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.teamName?.toLowerCase().includes(q) ||
      p.subTeamName?.toLowerCase().includes(q)
    );
  });

  // Calculate totals
  const totalLoggedHours = workHoursData?.metrics?.totalHours || 0;
  const totalWeeklyCapacity = workHoursData?.metrics?.totalWeeklyCapacity || 1;
  const overallUtilization = Math.round((totalLoggedHours / totalWeeklyCapacity) * 100);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans text-sand-950">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-sand-300 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-moss-900 text-sand-50">
              <ShieldAlert size={16} />
            </span>
            <span className="font-mono text-xs font-bold tracking-widest uppercase text-moss-900">
              OPERATIONS ADMINISTRATOR CONSOLE
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-moss-200 text-moss-900 font-bold border border-moss-300">
              LEVEL 3 CLEARANCE
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-sand-950 mt-1 font-sans">
            Enterprise Admin &amp; Governance Center
          </h1>
          <p className="text-xs text-sand-600 mt-1">
            Global authority over projects exclusivity, work hours burndown, current project members matrix, and employee security ID maintenance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <button
            onClick={() => setShowAddMemberModal(true)}
            className="px-3 py-2 rounded-xl bg-moss-900 hover:bg-moss-800 text-sand-50 font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
          >
            <UserPlus size={14} />
            <span>PROVISION MEMBER</span>
          </button>
          <button
            onClick={() => setShowNewProjectModal(true)}
            className="px-3 py-2 rounded-xl bg-sand-200 hover:bg-sand-300 border border-sand-300 text-sand-900 font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <PlusCircle size={14} />
            <span>NEW PROJECT</span>
          </button>
        </div>
      </div>

      {actionFeedback && (
        <div className="p-3 rounded-xl bg-moss-100 border border-moss-300 text-moss-900 text-xs font-mono flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={15} />
          <span>{actionFeedback}</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-red-100 border border-red-300 text-red-900 text-xs font-mono flex items-center gap-2">
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-sand-50 border border-sand-300 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-sand-500 text-xs font-mono">
            <span>ACTIVE PROJECTS</span>
            <FolderKanban size={15} />
          </div>
          <div className="text-2xl font-black text-sand-950 font-sans">{projects.length}</div>
          <div className="text-[10px] font-mono text-moss-800">
            {projects.filter((p) => p.isExclusive).length} Exclusive Isolation
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-sand-50 border border-sand-300 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-sand-500 text-xs font-mono">
            <span>TOTAL PERSONNEL</span>
            <Users size={15} />
          </div>
          <div className="text-2xl font-black text-sand-950 font-sans">{members.length}</div>
          <div className="text-[10px] font-mono text-moss-800">
            {members.filter((m) => m.status === "ACTIVE").length} Active on Rosters
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-sand-50 border border-sand-300 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-sand-500 text-xs font-mono">
            <span>WORK HOURS LOGGED</span>
            <Clock size={15} />
          </div>
          <div className="text-2xl font-black text-sand-950 font-sans">{totalLoggedHours}h</div>
          <div className="text-[10px] font-mono text-moss-800">
            Across {workHoursData?.workLogs?.length || 0} Task Entries
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-sand-50 border border-sand-300 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-sand-500 text-xs font-mono">
            <span>CAPACITY UTILIZATION</span>
            <BadgeCheck size={15} />
          </div>
          <div className="text-2xl font-black text-sand-950 font-sans">{overallUtilization}%</div>
          <div className="text-[10px] font-mono text-moss-800">
            {totalWeeklyCapacity}h/week Capacity
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-sand-300 pb-2">
        {[
          { id: "projects", label: `1. ALL PROJECTS & PROGRESS (${projects.length})`, icon: FolderKanban },
          { id: "hours", label: `2. WORK HOURS BURNDOWN (${totalLoggedHours}h)`, icon: Clock },
          { id: "matrix", label: "3. PROJECT MEMBERS MATRIX", icon: Users },
          { id: "members", label: `4. EDIT MEMBERS & ID MAINTENANCE (${members.length})`, icon: Edit3 },
          { id: "teams", label: `5. TEAMS & SUB-TEAMS (${teamsData.length})`, icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                active
                  ? "bg-moss-900 text-sand-50 shadow-sm"
                  : "bg-sand-200/80 text-sand-800 hover:bg-sand-300"
              }`}
            >
              <Icon size={13} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="p-12 text-center text-xs font-mono text-moss-800 flex items-center justify-center gap-2">
          <Loader2 size={16} className="animate-spin" />
          <span>Synchronizing enterprise governance records...</span>
        </div>
      )}

      {/* TAB 1: ALL PROJECTS & PROGRESS */}
      {!loading && activeTab === "projects" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-sand-500" />
              <input
                type="text"
                placeholder="Filter projects or teams..."
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                className="w-full bg-sand-50 border border-sand-300 rounded-xl pl-8 pr-3 py-2 text-xs font-mono text-sand-950 focus:outline-none focus:border-moss-700"
              />
            </div>
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="px-3 py-2 rounded-xl bg-moss-900 text-sand-50 text-xs font-mono font-bold hover:bg-moss-800 transition flex items-center gap-1.5 self-start cursor-pointer"
            >
              <PlusCircle size={14} />
              <span>PROVISION NEW PROJECT</span>
            </button>
          </div>

          <div className="bg-sand-50 border border-sand-300 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-sand-200/70 border-b border-sand-300 text-sand-700">
                  <tr>
                    <th className="p-3.5">PROJECT / REPOSITORY</th>
                    <th className="p-3.5">TEAM / SUB-TEAM</th>
                    <th className="p-3.5">EXCLUSIVITY</th>
                    <th className="p-3.5">HANDOVER PROGRESS</th>
                    <th className="p-3.5">ASSIGNED MEMBERS</th>
                    <th className="p-3.5">HOURS LOGGED</th>
                    <th className="p-3.5 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-200">
                  {filteredProjects.map((proj) => (
                    <tr key={proj.id} className="hover:bg-sand-100/70 transition">
                      <td className="p-3.5">
                        <div className="font-bold text-sand-950 font-sans text-sm">{proj.name}</div>
                        <div className="text-[10px] text-sand-500 mt-0.5">
                          {proj.repoOwner}/{proj.repoName} • {proj.status}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-sand-800">{proj.teamName}</div>
                        <div className="text-[10px] text-sand-500">{proj.subTeamName}</div>
                      </td>
                      <td className="p-3.5">
                        {proj.isExclusive ? (
                          <span className="px-2 py-0.5 rounded bg-moss-100 text-moss-900 border border-moss-300 text-[10px] font-bold">
                            EXCLUSIVE ISOLATION
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-sand-200 text-sand-700 text-[10px]">
                            PUBLIC TO ALL
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-sand-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-moss-800 rounded-full"
                              style={{ width: `${proj.progressPercent}%` }}
                            />
                          </div>
                          <span className="font-bold text-[11px]">{proj.progressPercent}%</span>
                        </div>
                        <div className="text-[10px] text-sand-500 mt-0.5">
                          Status: {proj.handoverStatus}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-sand-900">{proj.membersCount} Members</span>
                        <div className="text-[10px] text-sand-500">
                          {proj.assignedMembers?.map((m: any) => m.name.split(" ")[0]).join(", ") || "None"}
                        </div>
                      </td>
                      <td className="p-3.5 font-bold text-sand-900">{proj.totalHoursLogged}h</td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => setShowAssignModal({ projectId: proj.id, projectName: proj.name })}
                          className="px-2 py-1 rounded bg-sand-200 hover:bg-sand-300 text-sand-900 text-[10px] font-bold transition cursor-pointer"
                        >
                          + ASSIGN
                        </button>
                        <Link
                          href={`/dashboard/projects/${proj.id}`}
                          className="px-2 py-1 rounded bg-moss-900 text-sand-50 text-[10px] font-bold hover:bg-moss-800 transition inline-flex items-center gap-1"
                        >
                          <span>VIEW</span>
                          <ExternalLink size={10} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WORK HOURS BURNDOWN */}
      {!loading && activeTab === "hours" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold font-sans">Engineering Work Hours &amp; Capacity Burndown</h2>
              <p className="text-xs text-sand-600">Track company-wide time investments across critical handover modules.</p>
            </div>
            <button
              onClick={() => setShowLogHoursModal(true)}
              className="px-3 py-2 rounded-xl bg-moss-900 text-sand-50 text-xs font-mono font-bold hover:bg-moss-800 transition flex items-center gap-1.5 self-start cursor-pointer"
            >
              <Clock size={14} />
              <span>LOG WORK HOURS</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Hours by Project */}
            <div className="p-5 rounded-2xl bg-sand-50 border border-sand-300 shadow-sm space-y-3">
              <div className="text-xs font-mono font-bold uppercase text-sand-600">
                TIME ALLOCATION BY PROJECT
              </div>
              <div className="space-y-3 font-mono text-xs">
                {workHoursData?.hoursByProject?.map((p: any) => {
                  const pct = totalLoggedHours > 0 ? Math.round((p.hours / totalLoggedHours) * 100) : 0;
                  return (
                    <div key={p.projectName} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-sand-950 font-sans">{p.projectName}</span>
                        <span className="text-moss-900 font-bold">{p.hours}h ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 bg-sand-200 rounded-full overflow-hidden">
                        <div className="h-full bg-moss-800 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hours by Member */}
            <div className="p-5 rounded-2xl bg-sand-50 border border-sand-300 shadow-sm space-y-3">
              <div className="text-xs font-mono font-bold uppercase text-sand-600">
                ENGINEER WORK CAPACITY BURNDOWN
              </div>
              <div className="space-y-3 font-mono text-xs">
                {workHoursData?.hoursByMember?.map((m: any) => {
                  const cap = m.weeklyCapacity || 40;
                  const pct = Math.round((m.hours / cap) * 100);
                  return (
                    <div key={m.userName} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-sand-950">{m.userName} ({m.userRole})</span>
                        <span className="text-moss-900 font-bold">{m.hours}h / {cap}h ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 bg-sand-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${pct > 100 ? "bg-red-700" : "bg-moss-800"}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Detailed Work Logs Table */}
          <div className="bg-sand-50 border border-sand-300 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-sand-300 font-mono text-xs font-bold text-sand-800 uppercase">
              RECENT WORK LOG ENTRIES ({workHoursData?.workLogs?.length || 0})
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-sand-200/70 border-b border-sand-300 text-sand-700">
                  <tr>
                    <th className="p-3.5">DATE</th>
                    <th className="p-3.5">ENGINEER</th>
                    <th className="p-3.5">PROJECT</th>
                    <th className="p-3.5">HOURS</th>
                    <th className="p-3.5">TASK DESCRIPTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-200">
                  {workHoursData?.workLogs?.map((log: any) => (
                    <tr key={log.id} className="hover:bg-sand-100/70 transition">
                      <td className="p-3.5 text-sand-500 whitespace-nowrap">{log.logDate}</td>
                      <td className="p-3.5">
                        <div className="font-bold text-sand-950">{log.userName}</div>
                        <div className="text-[10px] text-sand-500">{log.userRole}</div>
                      </td>
                      <td className="p-3.5 font-bold text-sand-900">{log.projectName}</td>
                      <td className="p-3.5 font-bold text-moss-900">+{log.hours}h</td>
                      <td className="p-3.5 text-sand-700 font-sans text-xs">{log.taskDescription}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PROJECT MEMBERS MATRIX */}
      {!loading && activeTab === "matrix" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold font-sans">Current Project Members Clearance Matrix</h2>
            <p className="text-xs text-sand-600">Inspect project assignments, roles, and revoke or grant member clearance per project.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((proj) => (
              <div key={proj.id} className="p-5 rounded-2xl bg-sand-50 border border-sand-300 shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold font-sans text-sm text-sand-950">{proj.name}</h3>
                    <div className="text-[10px] font-mono text-sand-500">
                      Team: {proj.teamName} • {proj.subTeamName}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAssignModal({ projectId: proj.id, projectName: proj.name })}
                    className="px-2.5 py-1 rounded-xl bg-sand-200 hover:bg-sand-300 text-sand-900 font-mono text-[10px] font-bold transition cursor-pointer"
                  >
                    + ASSIGN MEMBER
                  </button>
                </div>

                <div className="space-y-1.5 font-mono text-xs">
                  <div className="text-[10px] text-sand-500 uppercase font-bold">
                    ASSIGNED CLEARANCE ROSTER ({proj.assignedMembers?.length || 0})
                  </div>
                  {proj.assignedMembers && proj.assignedMembers.length > 0 ? (
                    <div className="divide-y divide-sand-200 border border-sand-200 rounded-xl overflow-hidden bg-sand-100/50">
                      {proj.assignedMembers.map((m: any) => (
                        <div key={m.userId} className="p-2.5 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-sand-950">{m.name}</div>
                            <div className="text-[10px] text-sand-500">
                              {m.employeeId || "EMP-XXXX"} • {m.projectRole} • {m.hoursLogged}h logged
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveMember(proj.id, m.userId, m.name)}
                            className="p-1 rounded text-red-600 hover:bg-red-100 transition cursor-pointer"
                            title="Revoke Clearance"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 text-center text-xs text-sand-500 bg-sand-100/50 rounded-xl border border-dashed border-sand-300">
                      No exclusive members assigned. Open to all administrators.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: EDIT MEMBERS & ID MAINTENANCE */}
      {!loading && activeTab === "members" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-sand-500" />
              <input
                type="text"
                placeholder="Search by ID, name, email..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full bg-sand-50 border border-sand-300 rounded-xl pl-8 pr-3 py-2 text-xs font-mono text-sand-950 focus:outline-none focus:border-moss-700"
              />
            </div>
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="px-3 py-2 rounded-xl bg-moss-900 text-sand-50 text-xs font-mono font-bold hover:bg-moss-800 transition flex items-center gap-1.5 self-start cursor-pointer"
            >
              <UserPlus size={14} />
              <span>PROVISION NEW MEMBER</span>
            </button>
          </div>

          <div className="bg-sand-50 border border-sand-300 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-sand-200/70 border-b border-sand-300 text-sand-700">
                  <tr>
                    <th className="p-3.5">EMPLOYEE ID</th>
                    <th className="p-3.5">NAME &amp; CONTACT</th>
                    <th className="p-3.5">ROLE &amp; CLEARANCE BADGE</th>
                    <th className="p-3.5">TEAM / SUB-TEAM</th>
                    <th className="p-3.5">CAPACITY</th>
                    <th className="p-3.5">TOTAL LOGGED</th>
                    <th className="p-3.5">STATUS</th>
                    <th className="p-3.5 text-right">ID MAINTENANCE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-200">
                  {filteredMembers.map((m) => (
                    <tr key={m.id} className="hover:bg-sand-100/70 transition">
                      <td className="p-3.5 font-bold text-moss-900">{m.employeeId || "EMP-XXXX"}</td>
                      <td className="p-3.5">
                        <div className="font-bold text-sand-950 font-sans text-sm">{m.name}</div>
                        <div className="text-[10px] text-sand-500">{m.email}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-sand-900">{m.role}</div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-sand-200 text-sand-700 border border-sand-300">
                          {m.clearanceBadge || "LEVEL_1_MEMBER"}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="text-sand-900 font-bold">{m.teamName}</div>
                        <div className="text-[10px] text-sand-500">{m.subTeamName}</div>
                      </td>
                      <td className="p-3.5">{m.workHoursWeekly || 40}h/wk</td>
                      <td className="p-3.5 font-bold text-moss-900">{m.hoursLoggedTotal || 0}h</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            m.status === "ACTIVE"
                              ? "bg-moss-100 text-moss-900 border border-moss-300"
                              : "bg-sand-200 text-sand-600"
                          }`}
                        >
                          {m.status || "ACTIVE"}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => setEditingMember({ ...m, newPassword: "" })}
                          className="px-2.5 py-1 rounded bg-sand-200 hover:bg-moss-900 hover:text-sand-50 text-sand-900 text-xs font-bold transition flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <Edit3 size={12} />
                          <span>EDIT ID</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: TEAMS & SUB-TEAMS HIERARCHY */}
      {!loading && activeTab === "teams" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold font-sans">Engineering Teams &amp; Sub-teams Hierarchy</h2>
              <p className="text-xs text-sand-600">Model the organizational tree across teams, modules, and child sub-teams.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowNewTeamModal(true)}
                className="px-3 py-2 rounded-xl bg-moss-900 text-sand-50 text-xs font-mono font-bold hover:bg-moss-800 transition flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle size={14} />
                <span>NEW PARENT TEAM</span>
              </button>
              <button
                onClick={() => setShowNewSubTeamModal(true)}
                className="px-3 py-2 rounded-xl bg-sand-200 hover:bg-sand-300 border border-sand-300 text-sand-900 text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Layers size={14} />
                <span>NEW SUB-TEAM</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {teamsData.map((team) => (
              <div key={team.id} className="p-5 rounded-2xl bg-sand-50 border border-sand-300 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-sand-200 pb-3">
                  <div>
                    <h3 className="font-bold text-sm font-sans text-sand-950">{team.name}</h3>
                    <p className="text-[10px] text-sand-500 font-mono mt-0.5">{team.description}</p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-moss-100 text-moss-900 font-bold">
                    {team.totalMembersCount} Members
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="text-[10px] font-mono font-bold uppercase text-sand-600">
                    SUB-TEAMS ({team.subTeams?.length || 0})
                  </div>
                  <div className="space-y-2">
                    {team.subTeams?.map((st: any) => (
                      <div key={st.id} className="p-3 rounded-xl bg-sand-100 border border-sand-200 text-xs font-mono space-y-1">
                        <div className="flex items-center justify-between font-bold text-sand-950">
                          <span>{st.name}</span>
                          <span className="text-[10px] text-moss-800">{st.membersCount} Engineers</span>
                        </div>
                        <p className="text-[10px] text-sand-600 font-sans">{st.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: EDIT MEMBER & ID MAINTENANCE */}
      {editingMember && (
        <div className="fixed inset-0 z-50 bg-sand-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-sand-50 border border-sand-300 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 font-mono text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-sand-300 pb-3">
              <div>
                <h3 className="text-base font-bold text-sand-950 font-sans">
                  Edit Member &amp; ID Maintenance
                </h3>
                <p className="text-[10px] text-sand-500">Employee ID: {editingMember.employeeId}</p>
              </div>
              <button
                onClick={() => setEditingMember(null)}
                className="text-sand-500 hover:text-sand-900 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditMemberSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-sand-800 mb-1">FULL NAME</label>
                <input
                  type="text"
                  value={editingMember.name || ""}
                  onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                  className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-xs text-sand-950 focus:outline-none focus:border-moss-700"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-sand-800 mb-1">EMPLOYEE ID</label>
                  <input
                    type="text"
                    value={editingMember.employeeId || ""}
                    onChange={(e) => setEditingMember({ ...editingMember, employeeId: e.target.value })}
                    className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-xs text-sand-950 focus:outline-none focus:border-moss-700"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-sand-800 mb-1">CLEARANCE BADGE</label>
                  <select
                    value={editingMember.clearanceBadge || "LEVEL_1_MEMBER"}
                    onChange={(e) => setEditingMember({ ...editingMember, clearanceBadge: e.target.value })}
                    className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-xs text-sand-950 focus:outline-none focus:border-moss-700"
                  >
                    <option value="LEVEL_3_ADMIN">LEVEL_3_ADMIN (Full Ops)</option>
                    <option value="LEVEL_2_LEAD">LEVEL_2_LEAD (Project Sign-off)</option>
                    <option value="LEVEL_1_MEMBER">LEVEL_1_MEMBER (Contributor)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-sand-800 mb-1">SYSTEM ROLE</label>
                  <select
                    value={editingMember.role || "MEMBER"}
                    onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value })}
                    className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-xs text-sand-950 focus:outline-none focus:border-moss-700"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="PROJECT_LEAD">PROJECT_LEAD</option>
                    <option value="MEMBER">MEMBER</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-sand-800 mb-1">ROSTER STATUS</label>
                  <select
                    value={editingMember.status || "ACTIVE"}
                    onChange={(e) => setEditingMember({ ...editingMember, status: e.target.value })}
                    className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-xs text-sand-950 focus:outline-none focus:border-moss-700"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="ON_LEAVE">ON_LEAVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-sand-800 mb-1">TEAM</label>
                  <select
                    value={editingMember.teamId || "team-platform"}
                    onChange={(e) => setEditingMember({ ...editingMember, teamId: e.target.value })}
                    className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-xs text-sand-950 focus:outline-none focus:border-moss-700"
                  >
                    {teamsData.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-sand-800 mb-1">SUB-TEAM</label>
                  <select
                    value={editingMember.subTeamId || "sub-auth"}
                    onChange={(e) => setEditingMember({ ...editingMember, subTeamId: e.target.value })}
                    className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-xs text-sand-950 focus:outline-none focus:border-moss-700"
                  >
                    {flatSubTeams.map((st) => (
                      <option key={st.id} value={st.id}>{st.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-sand-800 mb-1">WEEKLY CAPACITY (HOURS)</label>
                <input
                  type="number"
                  value={editingMember.workHoursWeekly || 40}
                  onChange={(e) => setEditingMember({ ...editingMember, workHoursWeekly: Number(e.target.value) })}
                  className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-xs text-sand-950 focus:outline-none focus:border-moss-700"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-sand-800 mb-1">
                  RESET PASSWORD (LEAVE BLANK TO KEEP EXISTING)
                </label>
                <input
                  type="password"
                  placeholder="New password (min 6 chars)..."
                  value={editingMember.newPassword || ""}
                  onChange={(e) => setEditingMember({ ...editingMember, newPassword: e.target.value })}
                  className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-xs text-sand-950 focus:outline-none focus:border-moss-700"
                />
              </div>

              <div className="pt-3 border-t border-sand-300 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-3 py-2 rounded-xl bg-sand-200 hover:bg-sand-300 text-sand-800 font-bold transition cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-moss-900 hover:bg-moss-800 text-sand-50 font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  {submitting ? <Loader2 size={13} className="animate-spin" /> : <BadgeCheck size={13} />}
                  <span>SAVE ID &amp; BADGE</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PROVISION NEW MEMBER */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 bg-sand-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-sand-50 border border-sand-300 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 font-mono text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-sand-300 pb-3">
              <h3 className="text-base font-bold text-sand-950 font-sans">
                Provision New Team Member
              </h3>
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="text-sand-500 hover:text-sand-900 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMemberSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-sand-800 mb-1">FULL NAME</label>
                <input
                  type="text"
                  placeholder="e.g. David Vance"
                  value={newMemberForm.name}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, name: e.target.value })}
                  className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-xs text-sand-950 focus:outline-none focus:border-moss-700"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-sand-800 mb-1">WORK EMAIL</label>
                <input
                  type="email"
                  placeholder="d.vance@acme.com"
                  value={newMemberForm.email}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, email: e.target.value })}
                  className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-xs text-sand-950 focus:outline-none focus:border-moss-700"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-sand-800 mb-1">INITIAL PASSWORD</label>
                <input
                  type="password"
                  placeholder="password123"
                  value={newMemberForm.password}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, password: e.target.value })}
                  className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-xs text-sand-950 focus:outline-none focus:border-moss-700"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-sand-800 mb-1">ROLE</label>
                  <select
                    value={newMemberForm.role}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, role: e.target.value })}
                    className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-xs text-sand-950 focus:outline-none focus:border-moss-700"
                  >
                    <option value="MEMBER">MEMBER (Contributor)</option>
                    <option value="PROJECT_LEAD">PROJECT_LEAD (Approver)</option>
                    <option value="ADMIN">ADMIN (Full Console)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-sand-800 mb-1">EMPLOYEE ID</label>
                  <input
                    type="text"
                    placeholder="EMP-1099"
                    value={newMemberForm.employeeId}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, employeeId: e.target.value })}
                    className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-xs text-sand-950 focus:outline-none focus:border-moss-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-sand-800 mb-1">PARENT TEAM</label>
                  <select
                    value={newMemberForm.teamId}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, teamId: e.target.value })}
                    className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-xs text-sand-950 focus:outline-none focus:border-moss-700"
                  >
                    {teamsData.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-sand-800 mb-1">SUB-TEAM</label>
                  <select
                    value={newMemberForm.subTeamId}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, subTeamId: e.target.value })}
                    className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-xs text-sand-950 focus:outline-none focus:border-moss-700"
                  >
                    {flatSubTeams.map((st) => (
                      <option key={st.id} value={st.id}>{st.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-sand-300 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="px-3 py-2 rounded-xl bg-sand-200 hover:bg-sand-300 text-sand-800 font-bold transition cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-moss-900 hover:bg-moss-800 text-sand-50 font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  {submitting ? <Loader2 size={13} className="animate-spin" /> : <UserPlus size={13} />}
                  <span>PROVISION MEMBER</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ASSIGN MEMBER TO PROJECT */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-sand-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-sand-50 border border-sand-300 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-sand-300 pb-3">
              <div>
                <h3 className="text-base font-bold text-sand-950 font-sans">
                  Assign Project Clearance
                </h3>
                <p className="text-[10px] text-sand-500">Project: {showAssignModal.projectName}</p>
              </div>
              <button
                onClick={() => setShowAssignModal(null)}
                className="text-sand-500 hover:text-sand-900 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignMemberSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-sand-800 mb-1">SELECT MEMBER</label>
                <select
                  value={assignForm.userId}
                  onChange={(e) => setAssignForm({ ...assignForm, userId: e.target.value })}
                  className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-xs text-sand-950 focus:outline-none focus:border-moss-700"
                  required
                >
                  <option value="">-- Choose team member --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.employeeId || "EMP"}) • {m.teamName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-sand-800 mb-1">PROJECT ROLE</label>
                <select
                  value={assignForm.role}
                  onChange={(e) => setAssignForm({ ...assignForm, role: e.target.value })}
                  className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-xs text-sand-950 focus:outline-none focus:border-moss-700"
                >
                  <option value="CONTRIBUTOR">CONTRIBUTOR</option>
                  <option value="MAINTAINER">MAINTAINER</option>
                  <option value="OWNER">OWNER</option>
                </select>
              </div>

              <div className="pt-3 border-t border-sand-300 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(null)}
                  className="px-3 py-2 rounded-xl bg-sand-200 hover:bg-sand-300 text-sand-800 font-bold transition cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-moss-900 hover:bg-moss-800 text-sand-50 font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  {submitting ? <Loader2 size={13} className="animate-spin" /> : <BadgeCheck size={13} />}
                  <span>GRANT CLEARANCE</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: PROVISION NEW PROJECT */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 bg-sand-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-sand-50 border border-sand-300 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 font-mono text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-sand-300 pb-3">
              <h3 className="text-base font-bold text-sand-950 font-sans">
                Provision New Handover Project
              </h3>
              <button
                onClick={() => setShowNewProjectModal(false)}
                className="text-sand-500 hover:text-sand-900 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleNewProjectSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-sand-800 mb-1">PROJECT NAME</label>
                <input
                  type="text"
                  placeholder="e.g. Orion Payment Gateway"
                  value={newProjectForm.name}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, name: e.target.value })}
                  className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-xs text-sand-950 focus:outline-none focus:border-moss-700"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-sand-800 mb-1">DESCRIPTION</label>
                <textarea
                  rows={2}
                  placeholder="Core ledger and payment reconciliation service..."
                  value={newProjectForm.description}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, description: e.target.value })}
                  className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-xs text-sand-950 focus:outline-none focus:border-moss-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-sand-800 mb-1">PARENT TEAM</label>
                  <select
                    value={newProjectForm.teamId}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, teamId: e.target.value })}
                    className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-xs text-sand-950 focus:outline-none focus:border-moss-700"
                  >
                    {teamsData.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-sand-800 mb-1">SUB-TEAM</label>
                  <select
                    value={newProjectForm.subTeamId}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, subTeamId: e.target.value })}
                    className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-xs text-sand-950 focus:outline-none focus:border-moss-700"
                  >
                    {flatSubTeams.map((st) => (
                      <option key={st.id} value={st.id}>{st.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-sand-800 mb-1">DEPARTING LEAD / ARCHITECT</label>
                  <input
                    type="text"
                    value={newProjectForm.departingName}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, departingName: e.target.value })}
                    className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-xs text-sand-950 focus:outline-none focus:border-moss-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-sand-800 mb-1">DEPARTING ROLE</label>
                  <input
                    type="text"
                    value={newProjectForm.departingRole}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, departingRole: e.target.value })}
                    className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-xs text-sand-950 focus:outline-none focus:border-moss-700"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="exclusiveCheck"
                  checked={newProjectForm.isExclusive}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, isExclusive: e.target.checked })}
                  className="rounded text-moss-900"
                />
                <label htmlFor="exclusiveCheck" className="text-xs font-mono text-sand-800">
                  Enforce Exclusive Security Isolation (Only assigned members see this project)
                </label>
              </div>

              <div className="pt-3 border-t border-sand-300 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="px-3 py-2 rounded-xl bg-sand-200 hover:bg-sand-300 text-sand-800 font-bold transition cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-moss-900 hover:bg-moss-800 text-sand-50 font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  {submitting ? <Loader2 size={13} className="animate-spin" /> : <PlusCircle size={13} />}
                  <span>CREATE PROJECT</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: LOG WORK HOURS */}
      {showLogHoursModal && (
        <div className="fixed inset-0 z-50 bg-sand-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-sand-50 border border-sand-300 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-sand-300 pb-3">
              <h3 className="text-base font-bold text-sand-950 font-sans">
                Log Work Hours
              </h3>
              <button
                onClick={() => setShowLogHoursModal(false)}
                className="text-sand-500 hover:text-sand-900 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLogHoursSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-sand-800 mb-1">MEMBER</label>
                <select
                  value={logHoursForm.userId}
                  onChange={(e) => setLogHoursForm({ ...logHoursForm, userId: e.target.value })}
                  className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-xs text-sand-950 focus:outline-none focus:border-moss-700"
                  required
                >
                  <option value="">-- Choose member --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.employeeId})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-sand-800 mb-1">PROJECT</label>
                <select
                  value={logHoursForm.projectId}
                  onChange={(e) => setLogHoursForm({ ...logHoursForm, projectId: e.target.value })}
                  className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-xs text-sand-950 focus:outline-none focus:border-moss-700"
                  required
                >
                  <option value="">-- Choose project --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-sand-800 mb-1">HOURS (NUMBER)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={logHoursForm.hours}
                    onChange={(e) => setLogHoursForm({ ...logHoursForm, hours: Number(e.target.value) })}
                    className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-xs text-sand-950 focus:outline-none focus:border-moss-700"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-sand-800 mb-1">LOG DATE</label>
                  <input
                    type="date"
                    value={logHoursForm.logDate}
                    onChange={(e) => setLogHoursForm({ ...logHoursForm, logDate: e.target.value })}
                    className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-xs text-sand-950 focus:outline-none focus:border-moss-700"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-sand-800 mb-1">TASK DESCRIPTION</label>
                <textarea
                  rows={2}
                  placeholder="Conducted architecture review and secret rotation walkthrough..."
                  value={logHoursForm.taskDescription}
                  onChange={(e) => setLogHoursForm({ ...logHoursForm, taskDescription: e.target.value })}
                  className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-xs text-sand-950 focus:outline-none focus:border-moss-700"
                  required
                />
              </div>

              <div className="pt-3 border-t border-sand-300 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLogHoursModal(false)}
                  className="px-3 py-2 rounded-xl bg-sand-200 hover:bg-sand-300 text-sand-800 font-bold transition cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-moss-900 hover:bg-moss-800 text-sand-50 font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  {submitting ? <Loader2 size={13} className="animate-spin" /> : <Clock size={13} />}
                  <span>RECORD HOURS</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: CREATE PARENT TEAM */}
      {showNewTeamModal && (
        <div className="fixed inset-0 z-50 bg-sand-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-sand-50 border border-sand-300 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-sand-300 pb-3">
              <h3 className="text-base font-bold text-sand-950 font-sans">Create Parent Team</h3>
              <button
                onClick={() => setShowNewTeamModal(false)}
                className="text-sand-500 hover:text-sand-900 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleNewTeamSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-sand-800 mb-1">TEAM NAME</label>
                <input
                  type="text"
                  placeholder="e.g. Security & Compliance"
                  value={newTeamForm.name}
                  onChange={(e) => setNewTeamForm({ ...newTeamForm, name: e.target.value })}
                  className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-xs text-sand-950 focus:outline-none focus:border-moss-700"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-sand-800 mb-1">DESCRIPTION</label>
                <textarea
                  rows={2}
                  placeholder="Oversees application security, pen-testing, and compliance runbooks..."
                  value={newTeamForm.description}
                  onChange={(e) => setNewTeamForm({ ...newTeamForm, description: e.target.value })}
                  className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-xs text-sand-950 focus:outline-none focus:border-moss-700"
                />
              </div>
              <div className="pt-3 border-t border-sand-300 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewTeamModal(false)}
                  className="px-3 py-2 rounded-xl bg-sand-200 hover:bg-sand-300 text-sand-800 font-bold transition cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-moss-900 hover:bg-moss-800 text-sand-50 font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  {submitting ? <Loader2 size={13} className="animate-spin" /> : <PlusCircle size={13} />}
                  <span>CREATE TEAM</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 7: CREATE SUB-TEAM */}
      {showNewSubTeamModal && (
        <div className="fixed inset-0 z-50 bg-sand-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-sand-50 border border-sand-300 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-sand-300 pb-3">
              <h3 className="text-base font-bold text-sand-950 font-sans">Create Child Sub-Team</h3>
              <button
                onClick={() => setShowNewSubTeamModal(false)}
                className="text-sand-500 hover:text-sand-900 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleNewSubTeamSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-sand-800 mb-1">PARENT TEAM</label>
                <select
                  value={newSubTeamForm.teamId}
                  onChange={(e) => setNewSubTeamForm({ ...newSubTeamForm, teamId: e.target.value })}
                  className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-xs text-sand-950 focus:outline-none focus:border-moss-700"
                  required
                >
                  <option value="">-- Select Parent Team --</option>
                  {teamsData.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-sand-800 mb-1">SUB-TEAM NAME</label>
                <input
                  type="text"
                  placeholder="e.g. Identity & Access Mgmt"
                  value={newSubTeamForm.name}
                  onChange={(e) => setNewSubTeamForm({ ...newSubTeamForm, name: e.target.value })}
                  className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-xs text-sand-950 focus:outline-none focus:border-moss-700"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-sand-800 mb-1">DESCRIPTION</label>
                <textarea
                  rows={2}
                  placeholder="Focused on OAuth token revocation and IAM roles..."
                  value={newSubTeamForm.description}
                  onChange={(e) => setNewSubTeamForm({ ...newSubTeamForm, description: e.target.value })}
                  className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-xs text-sand-950 focus:outline-none focus:border-moss-700"
                />
              </div>
              <div className="pt-3 border-t border-sand-300 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewSubTeamModal(false)}
                  className="px-3 py-2 rounded-xl bg-sand-200 hover:bg-sand-300 text-sand-800 font-bold transition cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-moss-900 hover:bg-moss-800 text-sand-50 font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  {submitting ? <Loader2 size={13} className="animate-spin" /> : <Layers size={13} />}
                  <span>CREATE SUB-TEAM</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
