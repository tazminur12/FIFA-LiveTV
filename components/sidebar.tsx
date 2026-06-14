"use client";

import {
  ChevronLeft,
  ChevronRight,
  Film,
  Flame,
  Globe,
  Globe2,
  Heart,
  MapPin,
  Menu,
  Newspaper,
  Play,
  Radio,
  Star,
  Tag,
  Trophy,
  Tv,
  X,
  Zap,
  Cloud,
  Flag,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

type SidebarProps = {
  groups: Array<[string, number]>; // [groupName, channelCount]
  activeGroup: string;
  onGroupChange: (group: string) => void;
};

// ── Icon map — group name → icon ─────────────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  All: Tv,
  Favorites: Heart,
  Sports: Trophy,
  "Live Sports": Radio,
  News: Newspaper,
  Movies: Film,
  Entertainment: Star,
  International: Globe,
  ESPN: Zap,
  Fox: Flame,
  beIN: Globe,
  DAZN: Play,
  Sky: Cloud,
  Argentina: MapPin,
  Mexico: MapPin,
  USA: Flag,
  Latino: Globe2,
  "Eastern Europe": Globe2,
  // 🇧🇩 Bangladesh groups
  "🇧🇩 General": Tv,
  "🇧🇩 News": Newspaper,
  "🇧🇩 Entertainment": Star,
  "🇧🇩 Sports": Trophy,
  "🇧🇩 Music": Radio,
  "🇧🇩 Kids": Film,
  "🇧🇩 Movies": Film,
  "🇧🇩 Religious": Globe,
  "🇧🇩 Documentary": Globe2,
  "🇧🇩 Business": Zap,
  "🇧🇩 Family": Heart,
  "🇧🇩 Culture": Globe,
  "🇧🇩 Legislative": Flag,
};

function getIcon(group: string): LucideIcon {
  return ICON_MAP[group] ?? Tag;
}

// ── Component ────────────────────────────────────────────────────────────────

export function Sidebar({ groups, activeGroup, onGroupChange }: SidebarProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <aside
      className={[
        "sticky top-16 flex flex-col gap-1 py-4 h-[calc(100vh-4rem)] overflow-y-auto overflow-x-hidden",
        "bg-[#0a0e1a]/95 backdrop-blur-md border-r border-white/10",
        "transition-[width] duration-300 ease-in-out flex-shrink-0",
        expanded ? "w-56" : "w-16",
      ].join(" ")}
      style={{ scrollbarWidth: "none" }}
    >
      {/* Toggle button */}
      <div
        className={[
          "flex mb-3 px-2 flex-shrink-0",
          expanded ? "justify-end" : "justify-center",
        ].join(" ")}
      >
        <button
          aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-white/10 bg-white/5 text-[#a5abb8] transition-all duration-200 hover:border-[#d5ff5f]/50 hover:text-[#d5ff5f] hover:bg-[#d5ff5f]/10"
        >
          {expanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {/* Group list */}
      <nav className="flex flex-col gap-0.5 px-2 flex-1">
        {groups.map(([group, count]) => {
          const Icon = getIcon(group);
          const isActive = activeGroup === group;

          return (
            <button
              key={group}
              onClick={() => onGroupChange(group)}
              title={!expanded ? `${group} (${count})` : undefined}
              className={[
                "group relative flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-left w-full",
                "transition-all duration-200",
                "whitespace-nowrap overflow-hidden",
                isActive
                  ? "bg-[#d5ff5f]/15 text-[#d5ff5f] border border-[#d5ff5f]/30 shadow-[0_0_12px_rgba(213,255,95,0.1)]"
                  : "border border-transparent text-[#a5abb8] hover:bg-white/5 hover:text-[#f7f4ef] hover:border-white/10",
              ].join(" ")}
            >
              {/* Active left bar */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full bg-[#d5ff5f]" />
              )}

              {/* Icon */}
              <span className="flex-shrink-0 flex items-center justify-center w-5 h-5">
                <Icon
                  size={18}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  className="transition-transform duration-200 group-hover:scale-110"
                />
              </span>

              {/* Label + count — visible only when expanded */}
              <span
                className={[
                  "flex items-center justify-between flex-1 min-w-0 transition-all duration-200",
                  expanded
                    ? "opacity-100"
                    : "opacity-0 w-0 pointer-events-none",
                ].join(" ")}
              >
                <span className="text-sm font-semibold truncate">{group}</span>
                <span
                  className={[
                    "ml-2 flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                    isActive
                      ? "bg-[#d5ff5f]/20 text-[#d5ff5f]"
                      : "bg-white/8 text-[#a5abb8]",
                  ].join(" ")}
                >
                  {count}
                </span>
              </span>
            </button>
          );
        })}
      </nav>

      {/* Bottom branding — only when expanded */}
      {expanded && (
        <div className="px-4 pt-3 border-t border-white/5 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff4f6d] animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#a5abb8]">
              Live
            </span>
          </div>
          <p className="text-[10px] text-[#a5abb8]/50 mt-0.5">StreamZone</p>
        </div>
      )}
    </aside>
  );
}
