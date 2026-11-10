"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ChevronDown, ArrowUpRight, Loader2 } from "lucide-react";

export default function DashboardOverviewPage() {
  const { data: session } = useSession();
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("10:00 am");
  const [selectedProjectId, setSelectedProjectId] = useState("proj-apollo-9");
  const [summaryData, setSummaryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/projects/${selectedProjectId}/summary`)
      .then((res) => res.json())
      .then((data) => {
        if (active && data.success) {
          setSummaryData(data);
        }
      })
      .catch((err) => console.error("Dashboard summary load failed:", err))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedProjectId]);

  const userName = session?.user?.name || "Sarah Connor";

  const metrics = summaryData?.metrics || {
    documentsCount: 3,
    insightsCount: 4,
    timelineCount: 6,
    approvedCount: 1,
    highRiskCount: 3,
    needsReviewCount: 3,
    readinessScore: 78,
  };

  const insights: any[] = summaryData?.insights || [];
  const documents: any[] = summaryData?.documents || [];

  // Combine latest documents & NEEDS_REVIEW insights for "READY FOR REVIEW"
  const docItems = documents.slice(0, 3).map((d) => ({
    id: d.id,
    label: `DOC: ${d.title.slice(0, 28).toUpperCase()}`,
    href: `/dashboard/projects/${selectedProjectId}/knowledge`,
  }));
  const insightItems = insights
    .filter((i) => i.status === "NEEDS_REVIEW")
    .slice(0, 3)
    .map((i) => ({
      id: i.id,
      label: i.title.slice(0, 34).toUpperCase(),
      href: `/dashboard/projects/${selectedProjectId}/analysis`,
    }));
  const reviewQueue = [...docItems.slice(0, 2), ...insightItems, ...docItems.slice(2)].slice(0, 5);

  const highRiskList = insights
    .filter((i) => i.severity === "CRITICAL" || i.severity === "HIGH")
    .slice(0, 3);

  const formatTwoDigit = (n: number) => String(n).padStart(2, "0");

  const scheduleSlots = [
    { time: "10:00 am", label: "Auth Bypass Sync", person: "Alex Chen", duration: "30m" },
    { time: "10:30 am", label: "Kafka Partition RFC", person: "Priya Sharma", duration: "45m" },
    { time: "01:00 pm", label: "Staging Secrets Audit", person: "David Kim", duration: "30m" },
    { time: "02:15 pm", label: "Prisma ADR Signoff", person: "Sarah Connor", duration: "45m" },
    { time: "03:10 pm", label: "Final Handover Signoff", person: "Alex & Lead", duration: "60m" },
    { time: "04:20 pm", label: "Publish Dossier", person: "Team", duration: "20m" },
  ];

  const dotColumns = [
    { day: "MO", dots: [true, true, true, false, false, false, false, false] },
    { day: "TU", dots: [true, true, true, true, true, false, false, false] },
    { day: "WE", dots: [true, true, true, true, false, false, false, false] },
    { day: "TH", dots: [true, true, true, true, true, true, false, false] },
    { day: "FR", dots: [true, true, true, true, true, true, true, true] },
    { day: "SA", dots: [true, true, false, false, false, false, false, false] },
    { day: "SU", dots: [true, true, true, true, true, true, true, false] },
  ];

  const densityRows = [
    { time: "5 PM", values: [1, 1, 2, 1, 3, 1, 1] },
    { time: "3 PM", values: [2, 1, 4, 3, 4, 2, 1] },
    { time: "1 PM", values: [1, 3, 4, 4, 4, 1, 2] },
    { time: "11 AM", values: [3, 2, 3, 4, 3, 2, 1] },
    { time: "9 AM", values: [1, 4, 2, 3, 1, 3, 2] },
  ];

  const getTileColor = (val: number) => {
    switch (val) {
      case 4:
        return "bg-[#28381f] text-sand-50";
      case 3:
        return "bg-[#4a6339] text-sand-100";
      case 2:
        return "bg-[#8b9f7a] text-sand-900";
      case 1:
      default:
        return "bg-[#d9d5c5] text-sand-700";
    }
  };

  const cautionCount = insights.filter((i) => i.severity === "MEDIUM").length;
  const criticalOrHighCount = metrics.highRiskCount;
  const normalCount = metrics.approvedCount + metrics.documentsCount;

  if (loading && !summaryData) {
    return (
      <div className="max-w-[1360px] mx-auto space-y-6 animate-pulse pb-12">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pt-2">
          <div className="space-y-2">
            <div className="h-10 w-64 bg-sand-300/70 rounded-xl" />
            <div className="h-4 w-80 bg-sand-200 rounded" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-36 bg-sand-200 rounded-md" />
            <div className="h-8 w-36 bg-sand-300/70 rounded-md" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-3 h-64 bg-sand-300/60 rounded-2xl" />
          <div className="md:col-span-3 h-64 bg-sand-200/80 rounded-2xl border border-sand-300" />
          <div className="md:col-span-3 h-64 bg-sand-200/80 rounded-2xl border border-sand-300" />
          <div className="md:col-span-3 h-64 bg-sand-200/80 rounded-2xl border border-sand-300" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-3 h-60 bg-sand-200/80 rounded-2xl border border-sand-300" />
          <div className="md:col-span-6 h-60 bg-sand-200/80 rounded-2xl border border-sand-300" />
          <div className="md:col-span-3 h-60 bg-sand-200/80 rounded-2xl border border-sand-300" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1360px] mx-auto space-y-6 text-sand-950 font-sans pb-16">
      {/* 1. Header Banner & Status Badges */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pt-2">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif tracking-tight text-sand-950">
            Today&apos;s Overview
          </h1>
          <p className="text-xs md:text-sm text-sand-700 mt-1 font-medium">
            Hello, <strong className="text-sand-950">{userName}</strong>! You have{" "}
            <Link
              href={`/dashboard/projects/${selectedProjectId}/risks`}
              className="text-red-800 font-semibold underline decoration-red-400 hover:text-red-950"
            >
              {metrics.highRiskCount} high-risk continuity alerts
            </Link>{" "}
            and {metrics.documentsCount} ingested knowledge artifacts.
          </p>
        </div>

        {/* Right Status Pill Badges + Project Switcher */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] shrink-0">
          <Link
            href={`/dashboard/projects/${selectedProjectId}/risks`}
            className="flex items-center bg-sand-200/90 border border-sand-300 rounded-md overflow-hidden shadow-xs hover:border-moss-700 transition"
          >
            <span className="bg-[#1e2e18] text-sand-100 font-bold px-2 py-1">
              {metrics.highRiskCount}
            </span>
            <span className="px-2.5 py-1 text-sand-800 uppercase tracking-wider font-semibold">
              HIGH-RISK ALERTS
            </span>
          </Link>

          <Link
            href={`/dashboard/projects/${selectedProjectId}/knowledge`}
            className="flex items-center bg-sand-200/90 border border-sand-300 rounded-md overflow-hidden shadow-xs hover:border-moss-700 transition"
          >
            <span className="bg-[#1e2e18] text-sand-100 font-bold px-2 py-1">
              {metrics.documentsCount + metrics.insightsCount}
            </span>
            <span className="px-2.5 py-1 text-sand-800 uppercase tracking-wider font-semibold">
              NEW EVIDENCE READY
            </span>
          </Link>

          <div className="relative">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="appearance-none pl-3 pr-7 py-1 bg-[#1e2e18] text-sand-100 rounded-md font-semibold text-[11px] tracking-wider uppercase hover:bg-[#273d1f] transition cursor-pointer focus:outline-none"
            >
              <option value="proj-apollo-9">APOLLO CORE</option>
              <option value="proj-mercury-2">MERCURY MOBILE</option>
              <option value="proj-nexus-vault">NEXUS VAULT</option>
            </select>
            <ChevronDown
              size={12}
              className="text-sand-200 absolute right-2 top-2 pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* 2. Top Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Box A: QUICK ACCESS */}
        <div className="md:col-span-6 lg:col-span-3 bg-[#1e2e18] text-sand-100 p-5 rounded-2xl flex flex-col justify-between shadow-xs border border-[#273d1f]">
          <div>
            <div className="border-b border-[#384e2f] pb-3 mb-4">
              <span className="text-[11px] font-mono tracking-widest text-moss-300 uppercase font-bold">
                QUICK ACCESS
              </span>
            </div>

            <nav className="space-y-3 font-mono text-xs">
              <Link
                href={`/dashboard/projects/${selectedProjectId}/handover`}
                className="flex items-center justify-between text-sand-200 hover:text-white transition group"
              >
                <span className="tracking-wide">[+] VIEW HANDOVER DOSSIER</span>
                <ArrowUpRight size={14} className="opacity-70 group-hover:opacity-100 transition" />
              </Link>
              <Link
                href="/dashboard/projects"
                className="flex items-center justify-between text-sand-200 hover:text-white transition group"
              >
                <span className="tracking-wide">[↗] ALL PROJECTS</span>
                <ArrowUpRight size={14} className="opacity-70 group-hover:opacity-100 transition" />
              </Link>
              <Link
                href={`/dashboard/projects/${selectedProjectId}/analysis`}
                className="flex items-center justify-between text-sand-200 hover:text-white transition group"
              >
                <span className="tracking-wide">[λ] GENERATE AI INSIGHTS</span>
                <ArrowUpRight size={14} className="opacity-70 group-hover:opacity-100 transition" />
              </Link>
              <Link
                href={`/dashboard/projects/${selectedProjectId}/knowledge`}
                className="flex items-center justify-between text-sand-200 hover:text-white transition group"
              >
                <span className="tracking-wide">[↑] UPLOAD KNOWLEDGE / PDF</span>
                <ArrowUpRight size={14} className="opacity-70 group-hover:opacity-100 transition" />
              </Link>
            </nav>
          </div>

          <div className="pt-6 border-t border-[#384e2f]/70 mt-6 text-[10px] font-mono text-sand-400 flex items-center justify-between">
            <span>
              READINESS:{" "}
              <strong className="text-white font-semibold">{metrics.readinessScore}%</strong>
            </span>
            {loading && <Loader2 size={12} className="animate-spin text-moss-300" />}
          </div>
        </div>

        {/* Box B: READY FOR REVIEW */}
        <div className="md:col-span-6 lg:col-span-3 bg-sand-50/80 border border-sand-300 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-sand-200 pb-2 mb-3">
              <span className="text-[10px] font-mono tracking-widest text-sand-600 uppercase font-bold">
                READY FOR REVIEW
              </span>
              <span className="text-3xl lg:text-4xl font-serif text-sand-950 font-normal">
                {formatTwoDigit(metrics.needsReviewCount + metrics.documentsCount)}
              </span>
            </div>

            <div className="space-y-2.5 font-mono text-[11px]">
              {reviewQueue.map((item, idx) => (
                <div
                  key={`${item.id}-${idx}`}
                  className={`flex items-center justify-between ${
                    idx < reviewQueue.length - 1 ? "border-b border-sand-200/80 pb-2" : ""
                  }`}
                >
                  <span className="truncate pr-2 font-medium text-sand-900">{item.label}</span>
                  <Link
                    href={item.href}
                    className="text-moss-900 hover:underline shrink-0 text-[10px]"
                  >
                    [VIEW ↗]
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Box C: HIGH-RISK KNOWLEDGE GAPS */}
        <div className="md:col-span-6 lg:col-span-3 bg-sand-50/80 border border-sand-300 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-sand-200 pb-2 mb-3">
              <span className="text-[10px] font-mono tracking-widest text-sand-600 uppercase font-bold">
                HIGH-RISK KNOWLEDGE GAPS
              </span>
              <span className="text-3xl lg:text-4xl font-serif text-sand-950 font-normal">
                {formatTwoDigit(metrics.highRiskCount)}
              </span>
            </div>

            <div className="space-y-3 font-mono text-[11px] pt-1">
              {highRiskList.length > 0 ? (
                highRiskList.map((r, idx) => (
                  <div
                    key={r.id}
                    className={`flex items-center justify-between ${
                      idx < highRiskList.length - 1 ? "border-b border-sand-200/80 pb-2.5" : ""
                    }`}
                  >
                    <span className="text-sand-900 truncate pr-2">
                      <strong>{r.severity}</strong> | {r.title.slice(0, 22)}
                    </span>
                    <Link
                      href={`/dashboard/projects/${selectedProjectId}/analysis`}
                      className="text-moss-900 hover:underline shrink-0 text-[10px]"
                    >
                      [VIEW ↗]
                    </Link>
                  </div>
                ))
              ) : (
                <div className="text-sand-600 text-[11px]">No unresolved critical gaps.</div>
              )}
            </div>
          </div>

          <div className="pt-4 text-[10px] font-mono text-sand-600">
            STATUS:{" "}
            <span className="text-red-800 font-bold">
              {metrics.highRiskCount} PENDING MITIGATION
            </span>
          </div>
        </div>

        {/* Box D: TIME TO INSIGHT */}
        <div className="md:col-span-6 lg:col-span-3 bg-sand-50/80 border border-sand-300 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-sand-200 pb-2 mb-3">
              <span className="text-[10px] font-mono tracking-widest text-sand-600 uppercase font-bold">
                TIME TO INSIGHT
              </span>
              <span className="text-[10px] font-mono text-sand-500 uppercase font-semibold">
                WEEKLY AVERAGE
              </span>
            </div>

            <div className="py-2 flex items-end justify-between h-32 px-1">
              <div className="flex flex-col justify-between text-[8px] font-mono text-sand-400 h-28 pr-1">
                <span>92%</span>
                <span>80%</span>
                <span>65%</span>
                <span>40%</span>
                <span>0%</span>
              </div>

              {dotColumns.map((col) => (
                <div key={col.day} className="flex flex-col items-center gap-1">
                  <div className="flex flex-col-reverse gap-1">
                    {col.dots.map((active, i) => (
                      <div
                        key={i}
                        className={`w-2.5 h-2.5 rounded-full border transition ${
                          active
                            ? "bg-[#647c50] border-[#4a6339]"
                            : "bg-transparent border-sand-300 opacity-40"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[9px] font-mono font-semibold text-sand-600 mt-1">
                    {col.day}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 text-[10px] font-mono text-sand-600 text-center">
            AVERAGE CONFIDENCE: <span className="font-bold text-moss-900">94.2% GROUNDED</span>
          </div>
        </div>
      </div>

      {/* 3. Bottom Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Box E: TODAY'S SCHEDULE */}
        <div className="md:col-span-6 lg:col-span-3 bg-sand-50/90 border border-sand-300 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="border-b border-sand-200 pb-2 mb-4">
              <span className="text-[10px] font-mono tracking-widest text-sand-600 uppercase font-bold">
                TODAY&apos;S SCHEDULE
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              {scheduleSlots.map((slot) => {
                const isActive = selectedTimeSlot === slot.time;
                return (
                  <button
                    key={slot.time}
                    onClick={() => setSelectedTimeSlot(slot.time)}
                    className={`py-2 px-2.5 rounded-xl border text-center transition font-semibold ${
                      isActive
                        ? "bg-[#1e2e18] text-sand-50 border-[#1e2e18] shadow-xs"
                        : "bg-sand-100 hover:bg-sand-200 border-sand-300/80 text-sand-800"
                    }`}
                  >
                    {slot.time}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-sand-200 mt-4 text-[11px] font-mono text-sand-700 flex items-center justify-between gap-2">
            {scheduleSlots.find((s) => s.time === selectedTimeSlot) && (
              <div>
                <span className="text-moss-900 font-bold block">
                  ▶ {scheduleSlots.find((s) => s.time === selectedTimeSlot)?.label}
                </span>
                <span className="text-[10px] text-sand-500">
                  With {scheduleSlots.find((s) => s.time === selectedTimeSlot)?.person} (
                  {scheduleSlots.find((s) => s.time === selectedTimeSlot)?.duration})
                </span>
              </div>
            )}
            <Link
              href={`/dashboard/projects/${selectedProjectId}/meetings`}
              className="text-[10px] text-moss-900 font-bold hover:underline shrink-0"
            >
              [OPEN ↗]
            </Link>
          </div>
        </div>

        {/* Box F: UPCOMING WEEK / ACTIVITY DENSITY */}
        <div className="md:col-span-6 lg:col-span-6 bg-sand-50/80 border border-sand-300 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-sand-200 pb-2 mb-3">
              <span className="text-[10px] font-mono tracking-widest text-sand-600 uppercase font-bold">
                UPCOMING WEEK
              </span>
              <span className="text-[10px] font-mono text-sand-500 uppercase font-semibold">
                HANDOVER DENSITY
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[10px] font-mono text-sand-600 mb-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#d9d5c5]" />
                <span>AVAILABLE</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#8b9f7a]" />
                <span>2 SESSIONS</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#4a6339]" />
                <span>3 SESSIONS</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#28381f]" />
                <span>FULLY BOOKED</span>
              </div>
            </div>

            <div className="space-y-1.5">
              {densityRows.map((row) => (
                <div key={row.time} className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-sand-500 w-10 text-right shrink-0">
                    {row.time}
                  </span>
                  <div className="grid grid-cols-7 gap-1.5 flex-1">
                    {row.values.map((val, idx) => (
                      <div
                        key={idx}
                        className={`h-5 rounded-xs flex items-center justify-center text-[9px] font-mono transition ${getTileColor(
                          val
                        )}`}
                        title={`Day ${idx + 1}: Intensity ${val}`}
                      />
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex items-center gap-2 pt-1">
                <span className="w-10 shrink-0" />
                <div className="grid grid-cols-7 gap-1.5 flex-1 text-center font-mono text-[9px] text-sand-500">
                  <span>MO</span>
                  <span>TU</span>
                  <span>WE</span>
                  <span>TH</span>
                  <span>FR</span>
                  <span>SA</span>
                  <span>SU</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Box G: TODAY'S RESULTS */}
        <div className="md:col-span-12 lg:col-span-3 bg-sand-50/80 border border-sand-300 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="border-b border-sand-200 pb-2 mb-3">
              <span className="text-[10px] font-mono tracking-widest text-sand-600 uppercase font-bold">
                TODAY&apos;S RESULTS
              </span>
            </div>

            <div className="space-y-2 font-mono">
              <div className="flex items-center justify-between p-3 rounded-xl bg-sand-100/90 border border-sand-200">
                <span className="text-3xl font-serif text-sand-900">
                  {formatTwoDigit(cautionCount)}
                </span>
                <span className="text-[10px] tracking-widest uppercase font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded">
                  CAUTION
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#dbe4d0] border border-[#b8cbb0]">
                <span className="text-3xl font-serif text-moss-950 font-normal">
                  {formatTwoDigit(criticalOrHighCount)}
                </span>
                <span className="text-[10px] tracking-widest uppercase font-bold text-moss-900 bg-[#c3d5b4] px-2 py-0.5 rounded">
                  HIGH RISK
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-sand-100/90 border border-sand-200">
                <span className="text-3xl font-serif text-sand-900">
                  {formatTwoDigit(normalCount)}
                </span>
                <span className="text-[10px] tracking-widest uppercase font-bold text-sand-600 bg-sand-200 px-2 py-0.5 rounded">
                  VERIFIED
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 text-[10px] font-mono text-sand-500 text-center">
            {metrics.insightsCount + metrics.documentsCount} TOTAL ARTIFACTS TRACKED
          </div>
        </div>
      </div>

      {/* 4. Action Banner */}
      <div className="p-4 rounded-2xl bg-sand-200/50 border border-sand-300 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#1e2e18] text-sand-50 flex items-center justify-center font-bold shrink-0">
            λ
          </div>
          <div>
            <div className="font-semibold text-sand-950">
              Handover Reconstruction Ready for Review
            </div>
            <div className="text-[11px] text-sand-600">
              {metrics.insightsCount} evidence-grounded insights reconstructed from{" "}
              {metrics.documentsCount} knowledge documents and {metrics.timelineCount} timeline
              activities.
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            href={`/dashboard/projects/${selectedProjectId}/timeline`}
            className="px-3 py-1.5 rounded-lg bg-sand-100 hover:bg-sand-300 border border-sand-300 font-semibold transition"
          >
            EXPLORE TIMELINE
          </Link>
          <Link
            href={`/dashboard/projects/${selectedProjectId}/handover`}
            className="px-3.5 py-1.5 rounded-lg bg-[#1e2e18] text-sand-50 hover:bg-[#273d1f] font-semibold transition shadow-xs"
          >
            PROCEED TO APPROVALS [→]
          </Link>
        </div>
      </div>
    </div>
  );
}
