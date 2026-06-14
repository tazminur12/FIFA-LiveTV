"use client";

import { Bell, Search, Tv } from "lucide-react";

type NavbarProps = {
  searchQuery: string;
  onSearchChange: (q: string) => void;
};

export default function Navbar({ searchQuery, onSearchChange }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#0f172a]/80 border-b border-white/10">
      <div className="mx-auto flex h-16 max-w-[1800px] items-center gap-4 px-4 sm:px-6">

        {/* ── Logo ── */}
        <div className="flex flex-shrink-0 items-center gap-2.5">
          <span className="inline-grid h-9 w-9 place-items-center rounded-lg border border-white/20 bg-gradient-to-br from-[#d5ff5f]/20 to-[#52e0d6]/20">
            <Tv size={18} className="text-[#d5ff5f]" />
          </span>
          <span className="text-[1.1rem] font-extrabold tracking-tight text-white">
            Stream
            <span className="bg-gradient-to-r from-[#d5ff5f] to-[#52e0d6] bg-clip-text text-transparent">
              Zone
            </span>
          </span>
        </div>

        {/* ── Search (centre) ── */}
        <div className="mx-auto w-full max-w-md">
          <label className="flex items-center gap-3 h-10 rounded-full border border-white/10 bg-white/5 px-4 transition-colors focus-within:border-[#d5ff5f]/40 focus-within:bg-white/8">
            <Search size={15} className="flex-shrink-0 text-[#a5abb8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search channels, sports, news..."
              className="w-full min-w-0 border-0 bg-transparent text-sm text-[#f7f4ef] outline-none placeholder:text-[#858c9a]"
            />
          </label>
        </div>

        {/* ── Right controls ── */}
        <div className="flex flex-shrink-0 items-center gap-3">

          {/* Notification bell */}
          <button
            aria-label="Notifications"
            className="relative inline-grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-[#a5abb8] transition-all duration-150 hover:-translate-y-px hover:border-[#d5ff5f]/40 hover:text-[#d5ff5f]"
          >
            <Bell size={17} />
            {/* Unread dot */}
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#ff4f6d]" />
          </button>

          {/* User avatar */}
          <button
            aria-label="User account"
            className="inline-grid h-9 w-9 flex-shrink-0 place-items-center rounded-full border border-white/20 bg-gradient-to-br from-[#d5ff5f]/30 to-[#52e0d6]/30 text-xs font-black text-white transition-all duration-150 hover:-translate-y-px hover:border-[#d5ff5f]/50"
          >
            JD
          </button>

          {/* Live badge */}
          <div className="flex items-center gap-1.5 rounded-full border border-[#ff4f6d]/30 bg-[#ff4f6d]/10 px-3 py-1">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff4f6d] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#ff4f6d]" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-[#ff4f6d]">
              Live
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
