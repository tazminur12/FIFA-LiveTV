"use client";

import { useRef, useEffect } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Cloud,
  Film,
  Flag,
  Flame,
  Globe,
  Globe2,
  Heart,
  MapPin,
  Newspaper,
  Play,
  Radio,
  Star,
  Tag,
  Trophy,
  Tv,
  Zap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

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
  "FIFA World Cup 2026": Trophy,
  "Football World Cup 2026": Trophy,
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

export interface TopNavTabsProps {
  groups: Array<[string, number]>;
  activeGroup: string;
  onGroupChange: (group: string) => void;
}

export function TopNavTabs({ groups, activeGroup, onGroupChange }: TopNavTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll active tab into view whenever it changes
  useEffect(() => {
    activeTabRef.current?.scrollIntoView({ inline: "center", behavior: "smooth" });
  }, [activeGroup]);

  const scroll = (direction: "left" | "right") => {
    const container = scrollRef.current;
    if (!container) return;
    const amount = container.clientWidth * 0.6;
    container.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <div className="sticky top-16 z-40 bg-[#08090d]/96 backdrop-blur-md border-b border-white/5">
      {/* Outer wrapper — `group` enables chevron hover reveal */}
      <div className="relative group">
        {/* Left fade + chevron */}
        <div className="hidden sm:flex absolute left-0 top-0 bottom-0 w-14 items-center justify-start z-10 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-[#08090d] to-transparent" />
          <button
            onClick={() => scroll("left")}
            aria-label="Scroll left"
            className="
              pointer-events-auto relative z-10 ml-1
              flex items-center justify-center
              w-7 h-7 rounded-full
              bg-white/10 border border-white/10 text-[#a5abb8]
              opacity-0 group-hover:opacity-100
              hover:bg-white/20 hover:text-white
              transition-all duration-200
            "
          >
            <ChevronLeft size={15} />
          </button>
        </div>

        {/* Scrollable tab row */}
        <div
          ref={scrollRef}
          className="flex items-center gap-2 overflow-x-auto px-4 sm:px-10 py-2.5"
          style={{ scrollbarWidth: "none" }}
        >
          {groups.map(([group, count]) => {
            const isActive = group === activeGroup;
            const Icon = getIcon(group);

            return (
              <button
                key={group}
                ref={isActive ? activeTabRef : null}
                onClick={() => onGroupChange(group)}
                className={[
                  "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium",
                  "transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d5ff5f]/60",
                  isActive
                    ? "bg-[#d5ff5f] text-[#08090d] shadow-[0_0_20px_rgba(213,255,95,0.35)]"
                    : "bg-white/5 border border-white/8 text-[#a5abb8] hover:bg-white/10 hover:text-white",
                ].join(" ")}
              >
                <Icon size={14} className="shrink-0" />
                <span>{group}</span>
                <span
                  className={[
                    "rounded-full px-1.5 py-0 text-[11px] font-semibold leading-5 min-w-[1.25rem] text-center",
                    isActive
                      ? "bg-[#08090d]/20 text-[#08090d]"
                      : "bg-white/10 text-[#a5abb8]",
                  ].join(" ")}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right fade + chevron */}
        <div className="hidden sm:flex absolute right-0 top-0 bottom-0 w-14 items-center justify-end z-10 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-l from-[#08090d] to-transparent" />
          <button
            onClick={() => scroll("right")}
            aria-label="Scroll right"
            className="
              pointer-events-auto relative z-10 mr-1
              flex items-center justify-center
              w-7 h-7 rounded-full
              bg-white/10 border border-white/10 text-[#a5abb8]
              opacity-0 group-hover:opacity-100
              hover:bg-white/20 hover:text-white
              transition-all duration-200
            "
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
