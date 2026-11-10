"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Menu,
  Bell,
  Search,
  Loader2,
  X,
  ArrowUpRight,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";

interface SearchHit {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  href: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      if (typeof window !== "undefined") {
        window.location.replace(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      }
    },
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const pathname = usePathname();

  const projectMatch = pathname.match(/\/dashboard\/projects\/([^/]+)/);
  const currentProjectId =
    projectMatch?.[1] && projectMatch[1] !== "new" ? projectMatch[1] : "proj-apollo-9";

  // Refresh notification count periodically and on route changes
  useEffect(() => {
    if (status !== "authenticated") return;
    let active = true;
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => {
        if (active && data.success) {
          setUnreadCount(data.unreadCount || 0);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [pathname, status]);

  // Global keyboard shortcut (Ctrl+K or /) and click outside handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
      } else if (e.key === "Escape") {
        setSearchOpen(false);
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Debounced live global search against /api/search
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}&projectId=${encodeURIComponent(currentProjectId)}`
        );
        const data = await res.json();
        if (data.success) {
          setSearchResults(data.results || []);
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setSearching(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [searchQuery, currentProjectId]);

  const topNavTabs = [
    { label: "DASHBOARD", href: "/dashboard" },
    { label: "PROJECTS", href: "/dashboard/projects" },
    { label: "TIMELINE", href: `/dashboard/projects/${currentProjectId}/timeline` },
    { label: "AI ANALYSIS", href: `/dashboard/projects/${currentProjectId}/analysis` },
    { label: "HANDOVER", href: `/dashboard/projects/${currentProjectId}/handover` },
    { label: "ACCOUNT", href: "/dashboard/settings" },
  ];

  // Strict auth loading screen so unauthenticated UI never renders
  if (status !== "authenticated") {
    return (
      <div className="h-screen w-screen bg-sand-100 flex flex-col items-center justify-center gap-3 text-sand-900 font-mono text-xs">
        <Loader2 className="w-6 h-6 animate-spin text-moss-900" />
        <span className="tracking-widest uppercase font-semibold">
          VERIFYING WORKSPACE SESSION...
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-sand-100 text-sand-950 font-sans selection:bg-moss-700 selection:text-white">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentProjectId={currentProjectId}
        currentProjectName="Apollo Core Platform"
        unreadCount={unreadCount}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Editorial Top Navigation */}
        <header className="no-print flex flex-col border-b border-sand-300 bg-sand-50/90 backdrop-blur z-30 shrink-0">
          <div className="flex items-center justify-between h-14 px-3 sm:px-4 lg:px-8 gap-2">
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded text-sand-600 hover:text-sand-900 hover:bg-sand-200 lg:hidden"
                aria-label="Open sidebar"
              >
                <Menu size={18} />
              </button>
              <Link href="/dashboard" className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold tracking-widest text-moss-900 uppercase">
                  EX OFFICIO
                </span>
              </Link>
            </div>

            {/* Interactive Global Search Bar (Desktop) */}
            <div ref={searchContainerRef} className="hidden md:block flex-1 max-w-md mx-4 relative">
              <div className="relative w-full">
                {searching ? (
                  <Loader2 className="w-3.5 h-3.5 text-moss-800 animate-spin absolute left-3 top-2.5" />
                ) : (
                  <Search className="w-3.5 h-3.5 text-sand-500 absolute left-3 top-2.5" />
                )}
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onFocus={() => setSearchOpen(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchOpen(true);
                  }}
                  placeholder="SEARCH REPOS, COMMITS, DOCS, TEAM... (CTRL+K)"
                  className="w-full bg-sand-100/90 border border-sand-300 rounded-full pl-8 pr-8 py-1.5 text-[11px] font-mono placeholder:text-sand-500 text-sand-900 focus:outline-none focus:border-moss-700 focus:bg-white transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                    className="absolute right-2.5 top-2 text-sand-500 hover:text-sand-900"
                    aria-label="Clear search"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Search Popover Dropdown */}
              {searchOpen && searchQuery.trim().length > 0 && (
                <div className="absolute left-0 right-0 mt-1.5 bg-sand-50 border border-sand-300 rounded-2xl shadow-lg overflow-hidden z-50 max-h-96 overflow-y-auto">
                  {searching && searchResults.length === 0 ? (
                    <div className="p-4 text-center text-xs font-mono text-sand-600 flex items-center justify-center gap-2">
                      <Loader2 size={14} className="animate-spin text-moss-800" />
                      <span>Searching workspace...</span>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-4 text-center text-xs font-mono text-sand-600">
                      No matches found for &ldquo;{searchQuery}&rdquo;.
                    </div>
                  ) : (
                    <div className="divide-y divide-sand-200">
                      {searchResults.map((hit) => (
                        <Link
                          key={`${hit.category}-${hit.id}`}
                          href={hit.href}
                          onClick={() => {
                            setSearchOpen(false);
                            setMobileSearchOpen(false);
                            setSearchQuery("");
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-sand-200/70 transition flex items-start justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-moss-100 text-moss-900 uppercase">
                                {hit.category}
                              </span>
                              <span className="text-xs font-bold text-sand-950 truncate font-sans">
                                {hit.title}
                              </span>
                            </div>
                            <p className="text-[11px] text-sand-600 truncate font-mono">
                              {hit.subtitle}
                            </p>
                          </div>
                          <ArrowUpRight size={13} className="text-sand-500 shrink-0 mt-1" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Controls & Tabs */}
            <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {/* Mobile Search Trigger */}
              <button
                onClick={() => setMobileSearchOpen((v) => !v)}
                className="md:hidden p-1.5 rounded text-sand-700 hover:bg-sand-200"
                aria-label="Search workspace"
              >
                <Search size={16} />
              </button>

              <div className="hidden sm:flex items-center gap-1">
                {topNavTabs.map((tab) => {
                  const isActive =
                    tab.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname.startsWith(tab.href);
                  return (
                    <Link
                      key={tab.label}
                      href={tab.href}
                      className={`text-[10px] lg:text-[11px] font-mono tracking-wider px-2.5 lg:px-3 py-1.5 rounded whitespace-nowrap transition ${
                        isActive
                          ? "bg-moss-900 text-sand-50 font-semibold"
                          : "bg-sand-200/70 text-sand-800 hover:bg-sand-300/80 hover:text-sand-950"
                      }`}
                    >
                      {tab.label}
                    </Link>
                  );
                })}
              </div>

              <Link
                href="/dashboard/notifications"
                className="ml-1 p-1.5 rounded text-sand-700 hover:text-moss-900 hover:bg-sand-200 relative transition shrink-0"
                title="Notifications"
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-1 rounded-full bg-moss-800 text-white text-[9px] font-mono font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Link>
            </nav>
          </div>

          {/* Mobile Search Bar Drawer */}
          {mobileSearchOpen && (
            <div className="md:hidden px-3 pb-3 border-t border-sand-200 pt-2 space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-sand-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="SEARCH REPOS, COMMITS, DOCS, TEAM..."
                  className="w-full bg-sand-100 border border-sand-300 rounded-full pl-8 pr-8 py-1.5 text-xs font-mono text-sand-950 focus:outline-none focus:border-moss-700"
                />
              </div>
              {searchQuery.trim().length > 0 && (
                <div className="bg-sand-50 border border-sand-300 rounded-xl max-h-60 overflow-y-auto divide-y divide-sand-200">
                  {searching ? (
                    <div className="p-3 text-xs font-mono text-sand-600 flex items-center gap-2">
                      <Loader2 size={13} className="animate-spin" /> Searching...
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-3 text-xs font-mono text-sand-600">No matches found.</div>
                  ) : (
                    searchResults.map((hit) => (
                      <Link
                        key={`mob-${hit.category}-${hit.id}`}
                        href={hit.href}
                        onClick={() => {
                          setSearchOpen(false);
                          setMobileSearchOpen(false);
                          setSearchQuery("");
                        }}
                        className="w-full text-left p-2.5 hover:bg-sand-200/70 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <span className="text-[9px] font-mono font-bold text-moss-900 mr-1.5">
                            [{hit.category}]
                          </span>
                          <span className="text-xs font-bold text-sand-950">{hit.title}</span>
                        </div>
                        <ArrowUpRight size={13} className="text-sand-500 shrink-0" />
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </header>

        {/* Main Content */}
        <main className="print-container flex-1 overflow-y-auto bg-sand-100 p-3 sm:p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
