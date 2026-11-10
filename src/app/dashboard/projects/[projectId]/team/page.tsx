"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Mail, MessageSquare, Send, Loader2, CheckCircle2, X, Clock } from "lucide-react";

export default function TeamPage() {
  const params = useParams();
  const projectId = (params?.projectId as string) || "proj-apollo-9";
  const { data: session } = useSession();
  const currentUserName = session?.user?.name || "Sarah Connor";

  const [contactTarget, setContactTarget] = useState<any>(null);
  const [channel, setChannel] = useState<"IN_APP" | "SYNC_REQUEST" | "EMAIL">("IN_APP");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sentNotice, setSentNotice] = useState("");
  const [messagesLog, setMessagesLog] = useState<any[]>([]);
  const [loadingLog, setLoadingLog] = useState(true);

  useEffect(() => {
    let active = true;
    fetch(`/api/projects/${projectId}/team/contact`)
      .then((res) => res.json())
      .then((data) => {
        if (active && data.success) {
          setMessagesLog(data.messages || []);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingLog(false);
      });
    return () => {
      active = false;
    };
  }, [projectId]);

  const members = [
    {
      id: "m1",
      name: "Alex Chen",
      role: "Principal Backend Architect",
      email: "alex.chen@acme.com",
      avatar:
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
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
      avatar:
        "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80",
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
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
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
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
      isDeparting: false,
      commitsCount: 28,
      prsMerged: 9,
      primaryModules: ["PostgreSQL Pooling (82%)", "CI/CD Pipelines (90%)"],
    },
  ];

  const modulesOwnership = [
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

  const openContactModal = (member: any) => {
    setContactTarget(member);
    setChannel("IN_APP");
    setSubject(`Handover Follow-up: ${member.primaryModules[0] || "Project Continuity"}`);
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

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans text-sand-950">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-sand-300 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-sand-950 font-sans">
            Team &amp; Knowledge Ownership Map
          </h1>
          <p className="text-xs text-sand-700 mt-1 font-medium">
            Contact contributors, track module ownership concentrations, and resolve single points of failure.
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
      <div className="p-4 rounded-2xl bg-sand-50 border border-red-300 flex items-start gap-3 text-xs text-sand-900">
        <span className="font-mono text-red-700 font-bold uppercase text-[10px] shrink-0 mt-0.5">
          [SINGLE POINT OF FAILURE ALERT]
        </span>
        <div>
          3 critical modules have &gt;60% author concentration in departing engineer Alex Chen. Contact teammates directly below to coordinate knowledge transfer sessions.
        </div>
      </div>

      {/* Members Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {members.map((m) => (
          <div
            key={m.id}
            className={`p-5 rounded-2xl border bg-sand-50 shadow-sm flex flex-col justify-between gap-4 ${
              m.isDeparting ? "border-moss-700" : "border-sand-300"
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-sand-400 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
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
                  {m.primaryModules.map((mod) => (
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
                  href={`mailto:${m.email}?subject=${encodeURIComponent(`Ex Officio Handover: ${m.primaryModules[0]}`)}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-sand-200 hover:bg-sand-300 text-sand-900 font-semibold transition"
                >
                  <Mail size={11} />
                  <span>EMAIL</span>
                </a>
                <button
                  onClick={() => openContactModal(m)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-moss-900 hover:bg-moss-800 text-sand-50 font-semibold transition"
                >
                  <MessageSquare size={11} />
                  <span>CONTACT / PING</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Ownership Map Table */}
      <div className="bg-sand-50 rounded-2xl p-6 border border-sand-300 shadow-sm space-y-4">
        <div className="text-xs font-mono font-bold uppercase tracking-wider text-sand-600">
          MODULE CODE BLAME CONCENTRATION
        </div>

        <div className="space-y-3 font-mono text-xs">
          {modulesOwnership.map((item, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-sand-100 border border-sand-300 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="font-bold text-sand-950 font-sans text-xs">{item.module}</span>
                <span className="text-moss-900 font-bold">{item.percent}% OWNERSHIP</span>
              </div>

              <div className="w-full bg-sand-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${item.critical ? "bg-moss-900" : "bg-moss-600"}`}
                  style={{ width: `${item.percent}%` }}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-sand-600">
                <span>
                  Primary: <strong>{item.owner}</strong>
                </span>
                <span className={item.critical ? "text-red-800 font-bold" : "text-sand-600"}>
                  Backup: {item.backup}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Teammate Outreach Log */}
      <div className="bg-sand-50 rounded-2xl p-6 border border-sand-300 shadow-sm space-y-3">
        <div className="text-xs font-mono font-bold uppercase tracking-wider text-sand-600 flex items-center justify-between">
          <span>TEAMMATE HANDOVER OUTREACH LOG ({messagesLog.length})</span>
          {loadingLog && <Loader2 size={13} className="animate-spin text-moss-800" />}
        </div>

        {messagesLog.length === 0 ? (
          <p className="text-xs text-sand-600 font-mono">
            No handover pings dispatched yet. Use &ldquo;CONTACT / PING&rdquo; on any teammate card above to assign questions or request a sync.
          </p>
        ) : (
          <div className="space-y-2">
            {messagesLog.map((msg) => (
              <div
                key={msg.id}
                className="p-3.5 rounded-xl bg-sand-100 border border-sand-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 font-mono text-[10px]">
                    <span className="px-1.5 py-0.5 rounded bg-moss-100 text-moss-900 font-bold">
                      {msg.channel}
                    </span>
                    <span className="font-bold text-sand-900">
                      To: {msg.toMember} ({msg.toEmail})
                    </span>
                  </div>
                  <div className="font-bold text-sand-950">{msg.subject}</div>
                  <p className="text-sand-700">{msg.message}</p>
                </div>
                <span className="text-[10px] font-mono text-sand-500 shrink-0 flex items-center gap-1">
                  <Clock size={11} />
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contact Teammate Modal */}
      {contactTarget && (
        <div className="fixed inset-0 z-50 bg-sand-950/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-sand-50 border border-sand-300 rounded-2xl p-6 max-w-lg w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-sand-200">
              <div>
                <h3 className="font-bold text-sm text-sand-950">
                  Contact {contactTarget.name}
                </h3>
                <p className="text-[11px] font-mono text-sand-600">{contactTarget.email}</p>
              </div>
              <button
                onClick={() => setContactTarget(null)}
                className="p-1 text-sand-500 hover:text-sand-950"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSendContact} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-sand-800 font-bold mb-1">DISPATCH CHANNEL</label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as any)}
                  className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-sand-950"
                >
                  <option value="IN_APP">IN-APP NOTIFICATION + TIMELINE LOG</option>
                  <option value="SYNC_REQUEST">REQUEST HANDOVER SYNC SESSION</option>
                  <option value="EMAIL">LOG &amp; OPEN MAIL CLIENT ({contactTarget.email})</option>
                </select>
              </div>

              <div>
                <label className="block text-sand-800 font-bold mb-1">SUBJECT</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-sand-950 focus:outline-none focus:border-moss-700"
                  required
                />
              </div>

              <div>
                <label className="block text-sand-800 font-bold mb-1">MESSAGE / HANDOVER QUESTION</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder={`Ask ${contactTarget.name} about module behavior, undocumented secrets, or request walkthrough pairing...`}
                  className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-sand-950 font-sans focus:outline-none focus:border-moss-700"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setContactTarget(null)}
                  className="px-3 py-1.5 text-sand-600 hover:text-sand-950 uppercase"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="px-4 py-2 rounded-xl bg-moss-900 hover:bg-moss-800 text-sand-50 font-bold uppercase flex items-center gap-1.5 transition disabled:opacity-70"
                >
                  {sending ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>SENDING...</span>
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      <span>DISPATCH MESSAGE</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
