"use client";

import { Home, Trophy, Newspaper, Heart, Tv, type LucideIcon } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type NavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Returns which group to activate from available groups */
  resolve: (availableGroups: string[]) => string;
  /** Returns true if this item is currently active */
  isActive: (currentGroup: string) => boolean;
};

// ─── Nav item definitions ─────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  {
    id: "home",
    label: "Home",
    icon: Home,
    resolve: () => "All",
    isActive: (g) => g === "All",
  },
  {
    id: "bd",
    label: "BD Live",
    icon: Tv,
    resolve: (gs) => gs.find((g) => g.includes("🇧🇩")) ?? "All",
    isActive: (g) => g.includes("🇧🇩"),
  },
  {
    id: "sports",
    label: "Sports",
    icon: Trophy,
    resolve: (gs) =>
      gs.find((g) => g.toLowerCase().includes("sport")) ?? "All",
    isActive: (g) => g.toLowerCase().includes("sport"),
  },
  {
    id: "news",
    label: "News",
    icon: Newspaper,
    resolve: (gs) =>
      gs.find((g) => g.toLowerCase().includes("news")) ?? "All",
    isActive: (g) => g.toLowerCase().includes("news"),
  },
  {
    id: "favorites",
    label: "Saved",
    icon: Heart,
    resolve: () => "Favorites",
    isActive: (g) => g === "Favorites",
  },
];

// ─── Exported constant ────────────────────────────────────────────────────────

/** Apply this Tailwind class to page content so it clears the bottom nav on mobile. */
export const BOTTOM_NAV_HEIGHT = "pb-20";

// ─── Props ────────────────────────────────────────────────────────────────────

interface MobileBottomNavProps {
  activeGroup: string;
  groups: Array<[string, number]>;
  onGroupChange: (group: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MobileBottomNav({
  activeGroup,
  groups,
  onGroupChange,
}: MobileBottomNavProps) {
  const availableGroups = groups.map(([name]) => name);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#08090d]/96 backdrop-blur-md border-t border-white/10"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {/* Top-edge glow line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#d5ff5f]/20 to-transparent" />

      {/* Nav items */}
      <div className="flex items-stretch">
        {NAV_ITEMS.map((item) => {
          const active = item.isActive(activeGroup);
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onGroupChange(item.resolve(availableGroups))}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 relative active:scale-90 transition-transform duration-150"
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              {/* Active dot indicator */}
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#d5ff5f]" />
              )}

              {/* Icon — special-case BD Live to show flag emoji */}
              {item.id === "bd" ? (
                <span
                  className="text-xl leading-none"
                  style={
                    active
                      ? { filter: "drop-shadow(0 0 6px rgba(213,255,95,0.8))" }
                      : undefined
                  }
                >
                  🇧🇩
                </span>
              ) : (
                <Icon
                  size={22}
                  strokeWidth={active ? 2.2 : 1.8}
                  className={active ? "text-[#d5ff5f]" : "text-[#a5abb8]"}
                  style={
                    active
                      ? { filter: "drop-shadow(0 0 6px rgba(213,255,95,0.8))" }
                      : undefined
                  }
                />
              )}

              {/* Label */}
              <span
                className={`text-[10px] font-semibold leading-none ${
                  active ? "text-[#d5ff5f]" : "text-[#a5abb8]"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
