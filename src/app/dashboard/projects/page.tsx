"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, Clock, Search, ArrowUpRight } from "lucide-react";

export default function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [projectList, setProjectList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        if (active && data.success && data.projects) {
          setProjectList(data.projects);
        }
      })
      .catch((err) => console.error("Failed to load projects:", err))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = projectList.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase())) ||
      (p.techStack || []).some((t: string) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-sand-950">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-sand-300 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-sand-950 font-sans">
            Project Workspaces
          </h1>
          <p className="text-xs text-sand-700 mt-1 font-medium">
            Connect repositories and manage continuity across your team&apos;s active codebases.
          </p>
        </div>

        <Link
          href="/dashboard/projects/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-moss-900 text-sand-50 text-xs font-mono font-semibold uppercase tracking-wider hover:bg-moss-800 transition shrink-0"
        >
          <span>[+] CONNECT REPOSITORY</span>
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-3.5 h-3.5 text-sand-500 absolute left-3 top-3" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="SEARCH PROJECTS BY NAME OR STACK..."
          className="w-full bg-sand-50 border border-sand-300 rounded-xl pl-9 pr-3 py-2 text-xs font-mono placeholder:text-sand-500 text-sand-950 focus:outline-none focus:border-moss-700"
        />
      </div>

      {/* Loading Skeleton or Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 bg-sand-200 rounded-2xl border border-sand-300" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((project) => {
            const departingName =
              typeof project.departingMember === "string"
                ? project.departingMember
                : project.departingMember?.name;
            const hasDeparting = departingName && departingName !== "None";

            return (
              <div
                key={project.id}
                className="bg-sand-50 border border-sand-300 rounded-2xl p-5 flex flex-col justify-between hover:border-moss-700 transition shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Link
                      href={`/dashboard/projects/${project.id}`}
                      className="font-bold text-base text-sand-950 hover:text-moss-900 transition"
                    >
                      {project.name}
                    </Link>
                    {project.status === "HANDOVER_IN_PROGRESS" ? (
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-moss-200 text-moss-950 border border-moss-300 uppercase shrink-0">
                        HANDOVER ACTIVE
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-sand-200 text-sand-800 border border-sand-300 uppercase shrink-0">
                        ACTIVE
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-sand-700 line-clamp-2 leading-relaxed">
                    {project.description}
                  </p>

                  <div className="flex flex-wrap gap-1 mt-3">
                    {(project.techStack || []).map((tech: string) => (
                      <span
                        key={tech}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-sand-200/80 text-sand-800"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  {hasDeparting && (
                    <div className="mt-4 p-2.5 rounded-xl bg-moss-100 border border-moss-200 text-xs text-moss-950 flex items-center justify-between">
                      <span>
                        Departing: <strong>{departingName}</strong>
                      </span>
                      <Link
                        href={`/dashboard/projects/${project.id}/handover`}
                        className="font-mono text-[10px] font-bold text-moss-900 hover:underline"
                      >
                        [REPORT ↗]
                      </Link>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-sand-200 flex items-center justify-between text-[11px] font-mono text-sand-600">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Users size={13} className="text-sand-500" /> {project.membersCount || 4}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={13} className="text-sand-500" />{" "}
                      {project.lastSyncedAt || project.lastSynced || "Just now"}
                    </span>
                  </div>

                  <Link
                    href={`/dashboard/projects/${project.id}`}
                    className="text-moss-900 font-bold hover:underline flex items-center gap-0.5"
                  >
                    <span>OPEN</span>
                    <ArrowUpRight size={13} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="p-12 text-center text-xs font-mono text-sand-500 bg-sand-50 rounded-2xl border border-sand-300">
          NO PROJECTS MATCH YOUR SEARCH.
        </div>
      )}
    </div>
  );
}
