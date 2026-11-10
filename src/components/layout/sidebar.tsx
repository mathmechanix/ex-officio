"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FolderKanban,
  Clock,
  BookOpen,
  Users,
  Github,
  Network,
  BrainCircuit,
  FileText,
  CalendarDays,
  AlertTriangle,
  Bell,
  Settings,
  X,
  ShieldCheck,
  LogOut,
  Loader2,
} from "lucide-react";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  currentProjectId?: string;
  currentProjectName?: string;
  unreadCount?: number;
}

export function Sidebar({
  open,
  onClose,
  currentProjectId = "proj-apollo-9",
  currentProjectName = "Apollo Core Platform",
  unreadCount = 0,
}: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [signingOut, setSigningOut] = useState(false);

  const userName = session?.user?.name || "Team Member";
  const userRole = (session?.user as any)?.role || "PROJECT_LEAD";

  const mainNav = [
    { label: "Dashboard Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "All Projects", href: "/dashboard/projects", icon: FolderKanban },
  ];

  const projectNav = [
    { label: "Project Summary", href: `/dashboard/projects/${currentProjectId}`, icon: ShieldCheck },
    { label: "Unified Timeline", href: `/dashboard/projects/${currentProjectId}/timeline`, icon: Clock },
    { label: "GitHub Source Stream", href: `/dashboard/projects/${currentProjectId}/github`, icon: Github },
    { label: "AI Reconstruction", href: `/dashboard/projects/${currentProjectId}/analysis`, icon: BrainCircuit },
    { label: "Handover Report", href: `/dashboard/projects/${currentProjectId}/handover`, icon: FileText },
    { label: "Team & Knowledge Map", href: `/dashboard/projects/${currentProjectId}/team`, icon: Users },
    { label: "Knowledge Base", href: `/dashboard/projects/${currentProjectId}/knowledge`, icon: BookOpen },
    { label: "Structure Explorer", href: `/dashboard/projects/${currentProjectId}/structure`, icon: Network },
    { label: "Risks & Dependencies", href: `/dashboard/projects/${currentProjectId}/risks`, icon: AlertTriangle },
    { label: "Meeting Minutes", href: `/dashboard/projects/${currentProjectId}/meetings`, icon: CalendarDays },
  ];

  const footerNav = [
    { label: "Notifications", href: "/dashboard/notifications", icon: Bell, badge: unreadCount },
    { label: "Settings & Credentials", href: "/dashboard/settings", icon: Settings },
  ];

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut({ redirect: false });
    window.location.assign("/login");
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-sand-950/40 backdrop-blur-sm lg:hidden no-print"
          onClick={onClose}
        />
      )}

      <aside
        className={`no-print fixed inset-y-0 left-0 z-50 w-64 bg-sand-50 border-r border-sand-300 flex flex-col justify-between transition-transform duration-200 lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          <div className="flex items-center justify-between h-14 px-5 border-b border-sand-300 shrink-0">
            <Link href="/dashboard" onClick={onClose} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-moss-700" />
              <span className="font-mono text-xs font-bold tracking-widest text-moss-950 uppercase">
                EX OFFICIO
              </span>
            </Link>
            <button
              onClick={onClose}
              className="p-1 rounded text-sand-500 hover:text-sand-900 lg:hidden"
              aria-label="Close sidebar"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-3 space-y-5">
            <div>
              <div className="px-2 pb-1 text-[10px] font-mono uppercase tracking-wider text-sand-500 font-semibold">
                Overview
              </div>
              <div className="space-y-0.5">
                {mainNav.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs transition ${
                        active
                          ? "bg-moss-900 text-sand-50 font-medium"
                          : "text-sand-700 hover:text-sand-950 hover:bg-sand-200/70"
                      }`}
                    >
                      <Icon size={14} className={active ? "text-sand-200" : "text-sand-500"} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="px-2 pb-1 text-[10px] font-mono uppercase tracking-wider text-moss-800 font-semibold flex items-center justify-between">
                <span>Active Project</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-moss-100 text-moss-800 truncate max-w-[90px]">
                  {currentProjectName.split(" ")[0].toUpperCase()}
                </span>
              </div>
              <div className="space-y-0.5">
                {projectNav.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs transition ${
                        active
                          ? "bg-moss-900 text-sand-50 font-medium"
                          : "text-sand-700 hover:text-sand-950 hover:bg-sand-200/70"
                      }`}
                    >
                      <Icon size={14} className={active ? "text-sand-200" : "text-sand-500"} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 border-t border-sand-300 bg-sand-100/50 space-y-1 shrink-0">
          {footerNav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center justify-between px-2 py-1.5 rounded text-xs transition ${
                  active
                    ? "bg-moss-900 text-sand-50 font-medium"
                    : "text-sand-700 hover:text-sand-950 hover:bg-sand-200"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Icon size={14} className={active ? "text-sand-200" : "text-sand-500"} />
                  <span>{item.label}</span>
                </span>
                {typeof item.badge === "number" && item.badge > 0 && (
                  <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold rounded-full bg-moss-800 text-sand-50">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="pt-2 mt-1 border-t border-sand-200 flex items-center justify-between px-2 text-[11px] text-sand-600">
            <div className="min-w-0 pr-2">
              <span className="font-semibold text-sand-900 block truncate">{userName}</span>
              <span className="text-[10px] font-mono text-sand-500 uppercase">{userRole.replace("_", " ")}</span>
            </div>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              title="Sign Out"
              className="p-1.5 rounded hover:bg-red-100 text-sand-600 hover:text-red-800 transition shrink-0"
            >
              {signingOut ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
