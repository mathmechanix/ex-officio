"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Mail, MessageSquare, Send, Loader2, CheckCircle2, X, Clock, Users, ArrowUpRight } from "lucide-react";
import { clientCache } from "@/lib/client-cache";

export default function TeamPage() {
  const params = useParams();
  const projectId = (params?.projectId as string) || "proj-apollo-9";
  const isApollo = projectId === "proj-apollo-9";
  const { data: session } = useSession();
  const currentUserName = session?.user?.name || "Team Lead";

  const [contactTarget, setContactTarget] = useState<any>(null);
  const [channel, setChannel] = useState<"IN_APP" | "SYNC_REQUEST" | "EMAIL">("IN_APP");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sentNotice, setSentNotice] = useState("");
  const [messagesLog, setMessagesLog] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const cached = clientCache.get(`summary_${projectId}`);
    if (cached) {
      setSummaryData(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    Promise.all([
      fetch(`/api/projects/${projectId}/summary`).then((r) => r.json()),
      fetch(`/api/projects/${projectId}/team/contact`).then((r) => r.json()).catch(() => ({})),
    ])
      .then(([summaryRes, contactRes]) => {
        if (!active) return;
        if (summaryRes.success) {
          clientCache.set(`summary_${projectId}`, summaryRes);
          setSummaryData(summaryRes);
        }
        if (contactRes.success && Array.isArray(contactRes.messages)) {
          setMessagesLog(contactRes.messages);
        }
      })
      .catch((err) => console.error("Failed to load team data:", err))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [projectId]);

  // Derive contributors and modules dynamically
  const apolloMembers = [
    {
      id: "m1",
      name: "Alex Chen",
      role: "Principal Backend Architect",
      email: "alex.chen@acme.com",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
      isDeparting: true,
      departingDate: "Nov 14, 2026",
      commitsCount: 284,
      prsMerged: 42,
      primaryModules: ["Auth & Sessions (68%)", "Data Sanitizer (88%)", "Kafka Consumer (64%)"],
    },
    {
      id: "m2",
      name: "Priya Sharma",
      role: "Senior Full Stack Engineer (Successor Lead)",
      email: "priya.sharma@acme.com",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80",
      isDeparting: false,
      commitsCount: 86,
      prsMerged: 18,
      primaryModules: ["Billing Integration (74%)", "Frontend Dashboard (62%)"],
    },
    {
      id: "m3",
      name: "Sarah Connor",
      role: "Engineering Manager & Project Lead",
      email: "sarah.connor@acme.com",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
      isDeparting: false,
      commitsCount: 14,
      prsMerged: 5,
      primaryModules: ["Architecture RFCs", "Security Policies"],
    },
    {
      id: "m4",
      name: "David Kim",
      role: "DevOps & Reliability Engineer",
      email: "david.kim@acme.com",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
      isDeparting: false,
      commitsCount: 28,
      prsMerged: 9,
      primaryModules: ["PostgreSQL Pooling (82%)", "CI/CD Pipelines (90%)"],
    },
  ];

  const apolloModulesOwnership = [
    {
      module: "Data Sanitizer & Export Pipeline (/src/workers/sanitizer.ts)",
      owner: "Alex Chen (Departing)",
      percent: 88,
      critical: true,
      backup: "None (Knowledge Gap Risk)",
    },
    {
      module: "Auth Session Direct DB Revocation (/src/auth/sessions.ts)",
      owner: "Alex Chen (Departing)",
      percent: 68,
      critical: true,
      backup: "Priya Sharma (Transitioning)",
    },
    {
      module: "Kafka Event Consumer Partitioning (/src/events/kafka.ts)",
      owner: "Alex Chen (Departing)",
      percent: 64,
      critical: true,
      backup: "David Kim (Taking over)",
    },
    {
      module: "Stripe Billing & Invoicing Engine (/src/billing/)",
      owner: "Priya Sharma",
      percent: 74,
      critical: false,
      backup: "Alex Chen",
    },
  ];

  const rawContributors: any[] = summaryData?.contributors || [];
  const rawModules: any[] = summaryData?.modules || [];

  const members = isApollo
    ? apolloMembers
    : rawContributors.map((c, idx) => ({
        id: c.login || `c-${idx}`,
        name: c.name || c.login || "Contributor",
        role: c.role || (idx === 0 ? "Key Lead Architect (Top Contributor)" : "Core Contributor"),
        email: c.email || `${(c.login || c.name || "contributor").toLowerCase().replace(/[^a-z0-9]/g, "")}@github.com`,
        avatar: c.avatar || `https://github.com/${c.login || "octocat"}.png`,
        isDeparting: Boolean(c.isDeparting ?? idx === 0),
        departingDate: c.departingDate || "In Schedule",
        commitsCount: c.commitsCount || c.contributions || 12,
        prsMerged: c.prsMerged ?? Math.max(1, Math.round((c.commitsCount || 12) / 3)),
        primaryModules: c.primaryModules || [summaryData?.project?.repoName || "Core Repository"],
      }));

  const modulesOwnership = isApollo
    ? apolloModulesOwnership
    : rawModules.map((m) => ({
        module: `${m.name} (${m.path})`,
        owner: `${m.primaryOwner || members[0]?.name || "Lead Contributor"}`,
        percent: m.ownerPercentage || 75,
        critical: (m.ownerPercentage || 75) > 65,
        backup: members.length > 1 ? members[1]?.name : "Assigned Successor",
      }));

  const departingPerson = members.find((m) => m.isDeparting) || members[0];

  const openContactModal = (member: any) => {
    setContactTarget(member);
    setChannel("IN_APP");
    setSubject(`Handover Follow-up: ${member.primaryModules?.[0] || "Project Continuity"}`);
    setMessage("");
  };

  const handleSendContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactTarget || !subject || !message) return;

    setSending(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/team/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toMember: contactTarget.name,
          toEmail: contactTarget.email,
          fromUser: currentUserName,
          subject,
          message,
          channel,
        }),
      });
      const data = await res.json();
      if (data.success && data.teamMessage) {
        setMessagesLog((prev) => [data.teamMessage, ...prev]);
        setSentNotice(`✓ Handover message sent to ${contactTarget.name} (${contactTarget.email})!`);
        setTimeout(() => setSentNotice(""), 4500);

        if (channel === "EMAIL") {
          window.location.href = `mailto:${contactTarget.email}?subject=${encodeURIComponent(
            subject
          )}&body=${encodeURIComponent(message)}`;
        }
        setContactTarget(null);
      }
    } catch (err) {
      console.error("Failed to contact teammate:", err);
    } finally {
      setSending(false);
    }
  };

  if (loading && !summaryData) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-pulse">
        <div className="h-10 bg-sand-200 rounded-xl w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-44 bg-sand-200 rounded-2xl" />
          <div className="h-44 bg-sand-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans text-sand-950">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-sand-300 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-sand-950 font-sans">
            Team &amp; Knowledge Ownership Map
          </h1>
          <p className="text-xs text-sand-700 mt-1 font-medium">
            Contact contributors, track module ownership concentrations, and resolve single points of failure across {members.length} team member(s).
          </p>
        </div>

        <Link
          href={`/dashboard/projects/${projectId}/handover`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-moss-900 text-sand-50 text-xs font-mono font-semibold uppercase tracking-wider hover:bg-moss-800 transition shrink-0"
        >
          <span>[↗] HANDOVER REPORT</span>
        </Link>
      </div>

      {sentNotice && (
        <div className="p-3 rounded-xl bg-moss-100 border border-moss-300 text-moss-950 text-xs font-mono font-bold flex items-center gap-2">
          <CheckCircle2 size={15} className="text-moss-800 shrink-0" />
          <span>{sentNotice}</span>
        </div>
      )}

      {/* Alert */}
      {departingPerson && (
        <div className="p-4 rounded-2xl bg-sand-50 border border-sand-300 flex items-start gap-3 text-xs text-sand-900">
          <span className="font-mono text-moss-800 font-bold uppercase text-[10px] shrink-0 mt-0.5">
            [OWNERSHIP CONCENTRATION]
          </span>
          <div>
            Key knowledge holder: <strong>{departingPerson.name}</strong> ({departingPerson.role}). Tracked across {departingPerson.commitsCount} commit(s) in this repository.
          </div>
        </div>
      )}

      {/* Members Cards */}
      {members.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {members.map((m) => (
            <div
              key={m.id}
              className={`p-5 rounded-2xl border bg-sand-50 shadow-sm flex flex-col justify-between gap-4 ${
                m.isDeparting ? "border-moss-700" : "border-sand-300"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-sand-400 shrink-0 bg-sand-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.avatar}
                    alt={m.name}
                    className="w-full h-full object-cover"
                    onError={(e: any) => {
                      e.target.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80";
                    }}
                  />
                </div>

                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-bold text-sand-950 text-sm font-sans truncate">{m.name}</h3>
                      <p className="text-xs text-sand-600 font-sans truncate">{m.role}</p>
                      <p className="text-[11px] font-mono text-moss-800 mt-0.5 truncate">{m.email}</p>
                    </div>
                    {m.isDeparting ? (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-moss-900 text-sand-50 uppercase shrink-0">
                        DEPARTING {m.departingDate}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sand-200 text-sand-800 uppercase shrink-0">
                        ACTIVE
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {(m.primaryModules || []).map((mod: string) => (
                      <span
                        key={mod}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-sand-100 text-sand-800"
                      >
                        {mod}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-sand-200 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
                <div className="text-sand-500 flex items-center gap-3">
                  <span>{m.commitsCount} COMMITS</span>
                  <span>{m.prsMerged} PRS</span>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`mailto:${m.email}?subject=${encodeURIComponent(`Ex Officio Handover: ${m.primaryModules?.[0] || "Project Continuity"}`)}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-sand-200 hover:bg-sand-300 text-sand-900 font-semibold transition"
                  >
                    <Mail size={11} />
                    <span>EMAIL</span>
                  </a>
                  <button
                    onClick={() => openContactModal(m)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-moss-900 hover:bg-moss-800 text-sand-50 font-semibold transition cursor-pointer"
                  >
                    <MessageSquare size={11} />
                    <span>CONTACT / PING</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-sand-50 border border-sand-300 text-center space-y-3 font-mono text-xs text-sand-600">
          <Users size={28} className="mx-auto text-sand-400" />
          <div className="font-bold text-sand-950 font-sans text-sm">No Contributors Identified Yet</div>
          <p className="max-w-md mx-auto text-sand-600 font-sans">
            Connect your GitHub repository or click &quot;Sync Now&quot; in the GitHub Source Stream to automatically import repository contributors and ownership maps.
          </p>
        </div>
      )}

      {/* Module Ownership Concentration Table */}
      <div className="bg-sand-50 rounded-2xl p-6 border border-sand-300 space-y-4 shadow-sm">
        <h2 className="text-sm font-bold text-sand-950 font-sans uppercase tracking-wider">
          Single-Source Ownership &amp; Knowledge Distribution
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-sand-200 text-sand-500 text-[10px] uppercase">
                <th className="pb-2 font-bold">MODULE / DIRECTORY</th>
                <th className="pb-2 font-bold">PRIMARY OWNER</th>
                <th className="pb-2 font-bold">CONCENTRATION</th>
                <th className="pb-2 font-bold">CONTINUITY STATUS</th>
                <th className="pb-2 font-bold">DESIGNATED SUCCESSOR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-200">
              {modulesOwnership.map((row, idx) => (
                <tr key={idx} className="hover:bg-sand-100/60 transition">
                  <td className="py-3 font-bold text-sand-950 font-sans text-xs">{row.module}</td>
                  <td className="py-3 text-sand-800">{row.owner}</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded font-bold ${
                        row.percent >= 70
                          ? "bg-moss-200 text-moss-950 border border-moss-300"
                          : "bg-sand-200 text-sand-800"
                      }`}
                    >
                      {row.percent}%
                    </span>
                  </td>
                  <td className="py-3">
                    {row.critical ? (
                      <span className="text-[10px] font-bold text-moss-800">
                        CONCENTRATED
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-sand-600">DISTRIBUTED</span>
                    )}
                  </td>
                  <td className="py-3 text-sand-600">{row.backup}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Teammate Contact Audit Log */}
      <div className="bg-sand-50 rounded-2xl p-6 border border-sand-300 space-y-4 shadow-sm font-mono text-xs">
        <h2 className="text-sm font-bold text-sand-950 font-sans uppercase tracking-wider">
          Handover Escalation &amp; Outreach Audit Log ({messagesLog.length})
        </h2>
        {messagesLog.length > 0 ? (
          <div className="space-y-2">
            {messagesLog.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl bg-sand-100 border border-sand-300 flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sand-950">{log.subject}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-sand-200 text-sand-700 font-bold uppercase">
                      {log.channel}
                    </span>
                  </div>
                  <p className="text-sand-700 font-sans text-xs">{log.message}</p>
                  <div className="text-[10px] text-sand-500">
                    To: {log.toMember} ({log.toEmail}) &bull; From: {log.fromUser}
                  </div>
                </div>
                <div className="text-[10px] text-sand-500 shrink-0 flex items-center gap-1">
                  <Clock size={11} />
                  <span>{new Date(log.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-sand-100 border border-dashed border-sand-300 text-center text-sand-500 text-xs">
            No outreach dispatched yet. Click &quot;CONTACT / PING&quot; on any teammate above to record a handover inquiry.
          </div>
        )}
      </div>

      {/* CONTACT MODAL */}
      {contactTarget && (
        <div className="fixed inset-0 z-50 bg-sand-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-sand-50 border border-sand-300 rounded-2xl p-6 max-w-lg w-full shadow-xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-sand-200">
              <div className="flex items-center gap-2">
                <MessageSquare size={16} className="text-moss-900" />
                <h3 className="font-bold text-sm text-sand-950 font-sans">
                  Coordinate Handover with {contactTarget.name}
                </h3>
              </div>
              <button
                onClick={() => setContactTarget(null)}
                className="p-1 text-sand-500 hover:text-sand-950"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSendContact} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-sand-800 mb-1">
                  RECIPIENT
                </label>
                <input
                  type="text"
                  disabled
                  value={`${contactTarget.name} <${contactTarget.email}>`}
                  className="w-full bg-sand-200/60 border border-sand-300 rounded-xl px-3 py-2 text-sand-700 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-sand-800 mb-1">CHANNEL</label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as any)}
                  className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-sand-950"
                >
                  <option value="IN_APP">In-App Notification &amp; Audit Trail</option>
                  <option value="SYNC_REQUEST">Live Sync Walkthrough Request</option>
                  <option value="EMAIL">Email Dispatch via mailto:</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-sand-800 mb-1">SUBJECT</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-sand-950 focus:outline-none focus:border-moss-700"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-sand-800 mb-1">MESSAGE</label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Schedule a 30-minute knowledge transfer session or request missing runbooks..."
                  className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-sand-950 font-sans text-xs focus:outline-none focus:border-moss-700"
                  required
                />
              </div>

              <div className="pt-3 border-t border-sand-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setContactTarget(null)}
                  className="px-3 py-2 rounded-xl bg-sand-200 hover:bg-sand-300 text-sand-800 font-bold transition"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="px-4 py-2 rounded-xl bg-moss-900 hover:bg-moss-800 text-sand-50 font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  <span>DISPATCH MESSAGE</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
