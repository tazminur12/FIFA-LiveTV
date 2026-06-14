"use client";

import {
  Cloud,
  Film,
  Flag,
  Flame,
  Globe,
  Globe2,
  MapPin,
  Newspaper,
  Play,
  Radio,
  Star,
  Tag,
  Trophy,
  Tv,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  All: Tv,
  Sports: Trophy,
  News: Newspaper,
  Movies: Film,
  Entertainment: Star,
  ESPN: Zap,
  Fox: Flame,
  beIN: Globe,
  DAZN: Play,
  Sky: Cloud,
  Argentina: MapPin,
  Mexico: MapPin,
  USA: Flag,
  Latino: Globe2,
  "Eastern Europe": Globe,
  "Live Sports": Radio,
};

type CategoryStripProps = {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
};

export function CategoryStrip({
  categories,
  activeCategory,
  onCategoryChange,
}: CategoryStripProps) {
  return (
    <div
      className="flex gap-2 overflow-x-auto py-1"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
    >
      {categories.map((cat) => {
        const Icon = CATEGORY_ICONS[cat] ?? Tag;
        const isActive = cat === activeCategory;

        return (
          <button
            key={cat}
            type="button"
            onClick={() => onCategoryChange(cat)}
            className={[
              "inline-flex flex-shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200",
              isActive
                ? "bg-[#d5ff5f] text-[#08090d] shadow-[0_2px_12px_rgba(213,255,95,0.35)]"
                : "border border-white/10 bg-white/5 text-[#a5abb8] hover:bg-white/10 hover:text-white",
            ].join(" ")}
          >
            <Icon size={14} aria-hidden="true" />
            {cat}
          </button>
        );
      })}
    </div>
  );
}
