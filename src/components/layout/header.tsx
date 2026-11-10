"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  UserCircle,
  Settings,
  LogOut,
  X,
} from "lucide-react";

interface HeaderProps {
  onMenuToggle: () => void;
}

const routeTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/projects": "Projects",
  "/dashboard/ai-analysis": "AI Analysis",
  "/dashboard/insights": "Insights",
  "/dashboard/reports": "Handover Reports",
  "/dashboard/meetings": "Meetings",
  "/dashboard/risks": "Risks & Dependencies",
  "/dashboard/notifications": "Notifications",
  "/dashboard/settings": "Settings",
  "/dashboard/profile": "Profile",
};

function getPageTitle(pathname: string): string {
  if (routeTitles[pathname]) return routeTitles[pathname];

  // Project sub-routes
  const projectMatch = pathname.match(
    /^\/dashboard\/projects\/([^/]+)(?:\/(.+))?$/
  );
  if (projectMatch) {
    const subRoute = projectMatch[2];
    if (!subRoute) return "Project Overview";
    const subTitles: Record<string, string> = {
      timeline: "Timeline",
      knowledge: "Knowledge Base",
      team: "Team",
      github: "GitHub",
      structure: "Structure",
    };
    return subTitles[subRoute] || "Project";
  }

  return "Ex Officio";
}

export function Header({ onMenuToggle }: HeaderProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationCount] = useState(3);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const pageTitle = getPageTitle(pathname);

  // Close user menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  return (
    <header className="sticky top-0 z-30 flex items-center h-[var(--header-height)] px-4 md:px-6 bg-card/80 backdrop-blur-md border-b border-border">
      {/* Left: Menu toggle + Title */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>

        <h2 className="text-lg font-semibold text-foreground truncate">
          {pageTitle}
        </h2>
      </div>

      {/* Center: Search */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
        <div className="relative w-full">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search projects, documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 transition-shadow"
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Mobile search toggle */}
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Toggle search"
        >
          {searchOpen ? <X size={20} /> : <Search size={20} />}
        </button>

        {/* Notifications */}
        <Link
          href="/dashboard/notifications"
          className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Notifications"
        >
          <Bell size={20} />
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-destructive rounded-full">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </Link>

        {/* User menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1.5 pr-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="User menu"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs font-semibold text-primary">
                  {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
                </span>
              )}
            </div>
            <ChevronDown
              size={14}
              className={`hidden sm:block text-muted-foreground transition-transform ${
                userMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown */}
          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-card rounded-xl border border-border shadow-lg py-1 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-medium text-foreground truncate">
                  {session?.user?.name || "User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {session?.user?.email}
                </p>
              </div>
              <div className="py-1">
                <Link
                  href="/dashboard/profile"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <UserCircle size={16} />
                  Profile
                </Link>
                <Link
                  href="/dashboard/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <Settings size={16} />
                  Settings
                </Link>
              </div>
              <div className="border-t border-border py-1">
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile search bar (expanded) */}
      {searchOpen && (
        <div className="absolute left-0 top-full w-full p-3 bg-card border-b border-border md:hidden">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search projects, documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>
        </div>
      )}
    </header>
  );
}
