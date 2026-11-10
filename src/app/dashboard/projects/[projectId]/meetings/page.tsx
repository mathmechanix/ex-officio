"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Loader2, X, CheckCircle2 } from "lucide-react";

export default function MeetingsPage() {
  const params = useParams();
  const projectId = (params?.projectId as string) || "proj-apollo-9";

  const [meetings, setMeetings] = useState<any[]>([]);
  const [activeMeeting, setActiveMeeting] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  // Modal state
  const [showLogModal, setShowLogModal] = useState(false);
  const [title, setTitle] = useState("");
  const [attendeesInput, setAttendeesInput] = useState("Alex Chen, Priya Sharma, Sarah Connor");
  const [duration, setDuration] = useState("45 mins");
  const [summary, setSummary] = useState("");
  const [actionTask, setActionTask] = useState("");
  const [actionAssignee, setActionAssignee] = useState("Priya Sharma");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/projects/${projectId}/meetings`)
      .then((res) => res.json())
      .then((data) => {
        if (active && data.success && data.meetings) {
          setMeetings(data.meetings);
          if (data.meetings.length > 0) setActiveMeeting(data.meetings[0]);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [projectId]);

  const handleLogMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !summary) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/meetings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          duration,
          attendees: attendeesInput
            .split(",")
            .map((a) => a.trim())
            .filter(Boolean),
          summary,
          actionItems: actionTask.trim()
            ? [{ task: actionTask.trim(), assignee: actionAssignee, done: false }]
            : undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.meeting) {
        setMeetings((prev) => [data.meeting, ...prev]);
        setActiveMeeting(data.meeting);
        setShowLogModal(false);
        setTitle("");
        setSummary("");
        setActionTask("");
      }
    } catch (err) {
      console.error("Failed logging meeting:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleTask = async (meetingId: string, itemIndex: number) => {
    const key = `${meetingId}-${itemIndex}`;
    setTogglingKey(key);
    try {
      const res = await fetch(`/api/projects/${projectId}/meetings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId, itemIndex }),
      });
      const data = await res.json();
      if (data.success && data.meeting) {
        setMeetings((prev) => prev.map((m) => (m.id === meetingId ? data.meeting : m)));
        setActiveMeeting(data.meeting);
      }
    } catch (err) {
      console.error("Failed toggling meeting task:", err);
    } finally {
      setTogglingKey(null);
    }
  };

  const current = activeMeeting || meetings[0];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans text-sand-950">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-sand-300 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-sand-950 font-sans">
            Meeting &amp; Discussion Management
          </h1>
          <p className="text-xs text-sand-700 mt-1 font-medium">
            Capture handover sync notes and automatically extract decisions, action items, and timeline entries.
          </p>
        </div>

        <button
          onClick={() => setShowLogModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-moss-900 text-sand-50 text-xs font-mono font-semibold uppercase tracking-wider hover:bg-moss-800 transition shrink-0"
        >
          <span>[+] LOG MEETING SYNC</span>
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-pulse">
          <div className="space-y-3">
            <div className="h-28 bg-sand-200 rounded-2xl" />
            <div className="h-28 bg-sand-200 rounded-2xl" />
          </div>
          <div className="lg:col-span-2 h-80 bg-sand-200 rounded-2xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Meeting List */}
          <div className="space-y-3 font-mono text-xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-sand-500 mb-1">
              HANDOVER SYNCS ({meetings.length})
            </div>

            {meetings.map((m) => (
              <div
                key={m.id}
                onClick={() => setActiveMeeting(m)}
                className={`p-4 rounded-2xl border cursor-pointer transition shadow-sm ${
                  current?.id === m.id
                    ? "border-moss-800 bg-sand-50 ring-1 ring-moss-800"
                    : "border-sand-300 bg-sand-50/70 hover:bg-sand-50"
                }`}
              >
                <div className="text-[10px] text-sand-500 flex items-center gap-2 mb-1">
                  <span>{m.date}</span>
                  <span>•</span>
                  <span>{m.duration}</span>
                </div>
                <h3 className="text-xs font-bold text-sand-950 leading-snug font-sans">{m.title}</h3>
                <p className="text-[11px] text-sand-600 mt-2 line-clamp-2 font-sans">{m.summary}</p>
              </div>
            ))}
          </div>

          {/* Selected Meeting Details */}
          {current && (
            <div className="lg:col-span-2 space-y-4 font-sans">
              <div className="bg-sand-50 rounded-2xl p-6 border border-sand-300 shadow-sm space-y-5">
                <div className="space-y-1 pb-3 border-b border-sand-200">
                  <div className="flex items-center gap-2 font-mono text-[10px] text-sand-500">
                    <span>{current.date}</span>
                    <span>•</span>
                    <span>{current.duration}</span>
                  </div>
                  <h2 className="text-lg font-bold text-sand-950 font-sans">{current.title}</h2>
                  <div className="flex flex-wrap gap-1 pt-1 font-mono text-[10px]">
                    {(current.attendees || []).map((att: string) => (
                      <span key={att} className="px-2 py-0.5 rounded bg-sand-200 text-sand-800">
                        {att}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-sand-100 border border-sand-300 space-y-1">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-sand-600">
                    CONTEXT &amp; DISCUSSION TRANSCRIPT
                  </div>
                  <p className="text-xs text-sand-700 leading-relaxed font-sans">{current.summary}</p>
                </div>

                {/* Decisions */}
                <div className="space-y-2">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-moss-900">
                    GEMINI-EXTRACTED TECHNICAL DECISIONS
                  </div>
                  <div className="space-y-2">
                    {(current.decisions || []).map((dec: string, i: number) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-sand-100 border border-sand-300 text-xs font-sans text-sand-900 flex items-start gap-2"
                      >
                        <CheckCircle2 size={14} className="text-moss-800 shrink-0 mt-0.5" />
                        <span>{dec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Items */}
                <div className="space-y-2">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-sand-600">
                    HANDOVER ACTION ITEMS (CLICK TO TOGGLE)
                  </div>
                  <div className="space-y-2 font-mono text-xs">
                    {(current.actionItems || []).map((item: any, i: number) => {
                      const isToggling = togglingKey === `${current.id}-${i}`;
                      return (
                        <button
                          key={i}
                          onClick={() => handleToggleTask(current.id, i)}
                          disabled={isToggling}
                          className="w-full text-left p-3 rounded-xl bg-sand-100 hover:bg-sand-200/80 border border-sand-300 flex items-center justify-between text-xs transition"
                        >
                          <div className="flex items-center gap-2">
                            {isToggling ? (
                              <Loader2 size={12} className="animate-spin text-moss-800" />
                            ) : (
                              <span className={item.done ? "text-moss-800 font-bold" : "text-sand-400"}>
                                {item.done ? "[✓]" : "[ ]"}
                              </span>
                            )}
                            <span className={item.done ? "line-through text-sand-500 font-sans" : "text-sand-900 font-sans"}>
                              {item.task}
                            </span>
                          </div>
                          <span className="text-[10px] text-sand-500 shrink-0">@{item.assignee}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Log Meeting Sync Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-sand-950/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-sand-50 border border-sand-300 rounded-2xl p-6 max-w-lg w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-sand-200">
              <h3 className="font-bold text-sm text-sand-950">Log Handover Sync / Transcript</h3>
              <button
                onClick={() => setShowLogModal(false)}
                className="p-1 text-sand-500 hover:text-sand-950"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleLogMeeting} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-sand-800 font-bold mb-1">MEETING TITLE</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Handover Sync #2: Kafka & Failover Runbook"
                  className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-sand-950"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sand-800 font-bold mb-1">ATTENDEES</label>
                  <input
                    value={attendeesInput}
                    onChange={(e) => setAttendeesInput(e.target.value)}
                    className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-sand-950"
                  />
                </div>
                <div>
                  <label className="block text-sand-800 font-bold mb-1">DURATION</label>
                  <input
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-sand-950"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sand-800 font-bold mb-1">DISCUSSION SUMMARY / MINUTES</label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={4}
                  placeholder="Paste transcript notes. Sentences containing 'decided', 'approved', or 'migrated' automatically extract into key technical decisions..."
                  className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-sand-950 font-sans"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-sand-800 font-bold mb-1">FOLLOW-UP ACTION ITEM</label>
                  <input
                    value={actionTask}
                    onChange={(e) => setActionTask(e.target.value)}
                    placeholder="Optional transition task..."
                    className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-sand-950"
                  />
                </div>
                <div>
                  <label className="block text-sand-800 font-bold mb-1">ASSIGNEE</label>
                  <input
                    value={actionAssignee}
                    onChange={(e) => setActionAssignee(e.target.value)}
                    className="w-full bg-sand-100 border border-sand-300 rounded-xl px-3 py-2 text-sand-950"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-3 py-1.5 text-sand-600 uppercase"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-moss-900 text-sand-50 font-bold uppercase flex items-center gap-1.5"
                >
                  {saving ? <Loader2 size={13} className="animate-spin" /> : null}
                  <span>SAVE &amp; EXTRACT DECISIONS</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
