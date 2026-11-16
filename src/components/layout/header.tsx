"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
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
  ShieldAlert,
  UserCheck,
  FolderKanban,
  FileText,
  BrainCircuit,
  Clock,
  Users,
  CalendarDays,
  Loader2,
  ArrowUpRight,
} from "lucide-react";

interface HeaderProps {
  onMenuToggle: () => void;
}

interface SearchHit {
  id: string;
  category: "PROJECT" | "DOCUMENT" | "INSIGHT" | "TIMELINE" | "MEETING" | "TEAM";
  title: string;
  subtitle: string;
  href: string;
}

const routeTitles: Record<string, string> = {
  "/dashboard": "Dashboard Overview",
  "/dashboard/admin": "Operations Admin Console",
  "/dashboard/member": "Engineering Member Portal",
  "/dashboard/projects": "All Projects",
  "/dashboard/projects/new": "New Project",
  "/dashboard/ai-analysis": "AI Reconstruction",
  "/dashboard/insights": "Grounded Insights",
  "/dashboard/reports": "Handover Dossiers",
  "/dashboard/meetings": "Meeting Minutes",
  "/dashboard/risks": "Risks & Dependencies",
  "/dashboard/notifications": "Notifications Feed",
  "/dashboard/settings": "Settings & Credentials",
  "/dashboard/profile": "User Profile & Clearance",
};

function getPageTitle(pathname: string): string {
  if (routeTitles[pathname]) return routeTitles[pathname];

  // Project sub-routes
  const projectMatch = pathname.match(
    /^\/dashboard\/projects\/([^/]+)(?:\/(.+))?$/
  );
  if (projectMatch) {
    const subRoute = projectMatch[2];
    if (!subRoute) return "Project Summary";
    const subTitles: Record<string, string> = {
      timeline: "Unified Timeline",
      knowledge: "Knowledge Base",
      team: "Team & Knowledge Map",
      github: "GitHub Source Stream",
      structure: "Structure Explorer",
      analysis: "AI Reconstruction",
      handover: "Handover Report",
      risks: "Risks & Dependencies",
      meetings: "Meeting Minutes",
    };
    return subTitles[subRoute] || "Project Workspace";
  }

  return "Ex Officio";
}

export function Header({ onMenuToggle }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  // Search states
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // User menu & notifications
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const pageTitle = getPageTitle(pathname);

  // Fetch unread notifications count
  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.notifications)) {
          const unread = data.notifications.filter((n: any) => !n.read).length;
          setNotificationCount(unread);
        }
      })
      .catch(() => {});
  }, [pathname]);

  // Live debounced search
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      setSearching(false);
      return;
    }

    setSearching(true);
    setShowSearchDropdown(true);

    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.results)) {
            setSearchResults(data.results);
          } else {
            setSearchResults([]);
          }
        })
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close search and user menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard navigation for search
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSearchDropdown || searchResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = selectedIndex >= 0 ? searchResults[selectedIndex] : searchResults[0];
      if (target) {
        router.push(target.href);
        setShowSearchDropdown(false);
        setSearchQuery("");
        setSearchOpen(false);
      }
    } else if (e.key === "Escape") {
      setShowSearchDropdown(false);
    }
  };

  const getCategoryIcon = (category: SearchHit["category"]) => {
    switch (category) {
      case "PROJECT":
        return <FolderKanban size={13} className="text-moss-700" />;
      case "DOCUMENT":
        return <FileText size={13} className="text-sand-600" />;
      case "INSIGHT":
        return <BrainCircuit size={13} className="text-moss-800" />;
      case "TIMELINE":
        return <Clock size={13} className="text-sand-500" />;
      case "TEAM":
        return <Users size={13} className="text-sand-600" />;
      case "MEETING":
        return <CalendarDays size={13} className="text-moss-700" />;
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center h-14 px-4 md:px-6 bg-sand-50/90 backdrop-blur-md border-b border-sand-300">
      {/* Left: Menu toggle + EX OFFICIO clickable logo + Title */}
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-1.5 rounded-lg text-sand-700 hover:text-sand-950 hover:bg-sand-200 transition-colors cursor-pointer"
          aria-label="Toggle menu"
        >
          <Menu size={18} />
        </button>

        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-sand-200/70 hover:bg-sand-300 transition group shrink-0"
          title="Return to Dashboard"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-moss-700 group-hover:scale-125 transition-transform" />
          <span className="font-mono text-xs font-bold tracking-widest text-moss-950 uppercase hidden sm:inline">
            EX OFFICIO
          </span>
        </Link>

        <span className="text-sand-400 hidden sm:inline">/</span>
        <h2 className="text-xs sm:text-sm font-bold text-sand-950 truncate font-sans">
          {pageTitle}
        </h2>
      </div>

      {/* Center: Global Real-Time Search (Desktop) */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-4 relative" ref={searchContainerRef}>
        <div className="relative w-full">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-sand-500 pointer-events-none"
          />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search projects, documents, insights..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.trim() && setShowSearchDropdown(true)}
            onKeyDown={handleKeyDown}
            className="w-full h-8.5 pl-9 pr-8 rounded-xl border border-sand-300 bg-sand-100 text-xs font-mono text-sand-950 placeholder:text-sand-500 focus:outline-none focus:border-moss-700 focus:bg-sand-50 transition"
          />
          {searching && (
            <Loader2
              size={13}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-moss-800 animate-spin"
            />
          )}
          {searchQuery && !searching && (
            <button
              onClick={() => {
                setSearchQuery("");
                setShowSearchDropdown(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sand-400 hover:text-sand-700 p-0.5 cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Global Search Results Dropdown */}
        {showSearchDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-sand-50 border border-sand-300 rounded-2xl shadow-xl overflow-hidden z-50 max-h-96 overflow-y-auto">
            <div className="px-3.5 py-2 border-b border-sand-200 bg-sand-100/60 flex items-center justify-between text-[10px] font-mono text-sand-600">
              <span>SEARCH RESULTS ({searchResults.length})</span>
              <span>PRESS ↵ TO OPEN</span>
            </div>

            {searchResults.length === 0 && !searching && (
              <div className="p-6 text-center text-xs font-mono text-sand-600">
                No matching projects, documents, or insights found for &quot;{searchQuery}&quot;.
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="py-1">
                {searchResults.map((item, idx) => (
                  <Link
                    key={`${item.category}-${item.id}-${idx}`}
                    href={item.href}
                    onClick={() => {
                      setShowSearchDropdown(false);
                      setSearchQuery("");
                    }}
                    className={`flex items-start gap-2.5 px-3.5 py-2.5 transition text-xs font-sans ${
                      selectedIndex === idx
                        ? "bg-moss-900 text-sand-50"
                        : "hover:bg-sand-200/70 text-sand-950"
                    }`}
                  >
                    <div className="pt-0.5 shrink-0">{getCategoryIcon(item.category)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold truncate">{item.title}</span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase shrink-0 ${
                            selectedIndex === idx
                              ? "bg-moss-800 text-sand-100"
                              : "bg-sand-200 text-sand-700"
                          }`}
                        >
                          {item.category}
                        </span>
                      </div>
                      <p
                        className={`text-[11px] truncate mt-0.5 ${
                          selectedIndex === idx ? "text-sand-200" : "text-sand-600"
                        }`}
                      >
                        {item.subtitle}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Mobile search toggle */}
        <button
          onClick={() => {
            setSearchOpen(!searchOpen);
            setTimeout(() => mobileInputRef.current?.focus(), 100);
          }}
          className="md:hidden p-2 rounded-lg text-sand-700 hover:text-sand-950 hover:bg-sand-200 transition-colors"
          aria-label="Toggle search"
        >
          {searchOpen ? <X size={18} /> : <Search size={18} />}
        </button>

        {/* Notifications */}
        <Link
          href="/dashboard/notifications"
          className="relative p-2 rounded-lg text-sand-700 hover:text-sand-950 hover:bg-sand-200 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={18} />
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-700 rounded-full font-mono">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </Link>

        {/* User menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl hover:bg-sand-200 transition-colors cursor-pointer border border-sand-300/80 bg-sand-100"
            aria-label="User menu"
          >
            <div className="w-7 h-7 rounded-lg bg-moss-900 text-sand-50 flex items-center justify-center overflow-hidden shrink-0 font-mono text-xs font-bold">
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{session?.user?.name?.charAt(0)?.toUpperCase() || "U"}</span>
              )}
            </div>
            <span className="text-xs font-mono font-bold text-sand-950 hidden sm:inline max-w-[100px] truncate">
              {session?.user?.name?.split(" ")[0] || "User"}
            </span>
            <ChevronDown
              size={12}
              className={`text-sand-600 transition-transform ${
                userMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* User Dropdown */}
          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-60 bg-sand-50 rounded-2xl border border-sand-300 shadow-xl py-1.5 animate-in fade-in slide-in-from-top-2 duration-200 z-50 font-mono">
              <div className="px-4 py-2.5 border-b border-sand-200">
                <p className="text-xs font-bold text-sand-950 truncate font-sans">
                  {session?.user?.name || "User"}
                </p>
                <p className="text-[10px] text-sand-600 truncate">
                  {session?.user?.email}
                </p>
                <div className="inline-block mt-1 text-[9px] font-mono px-2 py-0.5 rounded bg-sand-200 text-sand-800 uppercase font-semibold">
                  {(session?.user as any)?.role || "MEMBER"}
                </div>
              </div>

              <div className="py-1 text-xs">
                {(session?.user as any)?.role === "ADMIN" && (
                  <Link
                    href="/dashboard/admin"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-moss-900 font-bold hover:bg-moss-100 transition-colors"
                  >
                    <ShieldAlert size={14} />
                    <span>ADMIN OPERATIONS</span>
                  </Link>
                )}
                {(session?.user as any)?.role === "MEMBER" && (
                  <Link
                    href="/dashboard/member"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-moss-900 font-bold hover:bg-moss-100 transition-colors"
                  >
                    <UserCheck size={14} />
                    <span>MEMBER PORTAL</span>
                  </Link>
                )}
                <Link
                  href="/dashboard/profile"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sand-900 hover:bg-sand-200 transition-colors font-semibold"
                >
                  <UserCircle size={14} />
                  <span>PROFILE &amp; CLEARANCE</span>
                </Link>
                <Link
                  href="/dashboard/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sand-900 hover:bg-sand-200 transition-colors font-semibold"
                >
                  <Settings size={14} />
                  <span>SETTINGS</span>
                </Link>
              </div>

              <div className="border-t border-sand-200 pt-1">
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex items-center gap-2.5 w-full px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>SIGN OUT</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile search bar (expanded) */}
      {searchOpen && (
        <div className="absolute left-0 top-full w-full p-3 bg-sand-50 border-b border-sand-300 md:hidden shadow-lg z-50">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sand-500"
            />
            <input
              ref={mobileInputRef}
              type="text"
              placeholder="Search projects, documents, insights..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full h-10 pl-9 pr-8 rounded-xl border border-sand-300 bg-sand-100 text-xs font-mono text-sand-950 focus:outline-none focus:border-moss-700"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sand-500 p-0.5"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {showSearchDropdown && searchResults.length > 0 && (
            <div className="mt-2 bg-sand-50 border border-sand-300 rounded-xl max-h-72 overflow-y-auto divide-y divide-sand-200">
              {searchResults.map((item, idx) => (
                <Link
                  key={`m-${item.category}-${item.id}-${idx}`}
                  href={item.href}
                  onClick={() => {
                    setSearchOpen(false);
                    setShowSearchDropdown(false);
                    setSearchQuery("");
                  }}
                  className="flex items-start gap-2.5 p-3 hover:bg-sand-200 transition text-xs"
                >
                  <div className="pt-0.5 shrink-0">{getCategoryIcon(item.category)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sand-950 truncate">{item.title}</div>
                    <div className="text-[10px] text-sand-600 truncate">{item.subtitle}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
