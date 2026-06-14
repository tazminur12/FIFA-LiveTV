"use client";

import { Heart, Tv } from "lucide-react";
import type { Channel } from "@/lib/playlist";

// ── helpers ──────────────────────────────────────────────────────────────────

function channelInitials(name: string) {
  const words = name
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return "TV";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function accentIndex(value: string) {
  let sum = 0;
  for (const char of value) sum += char.charCodeAt(0);
  return (sum % 6) + 1;
}

const ACCENT_GRADIENTS: Record<number, string> = {
  1: "from-[#d5ff5f] to-[#52e0d6]",
  2: "from-[#ffcf5a] to-[#ff6f61]",
  3: "from-[#8bd3ff] to-[#f8a5ff]",
  4: "from-[#43d38b] to-[#d5ff5f]",
  5: "from-[#ff4f6d] to-[#ffcf5a]",
  6: "from-[#52e0d6] to-[#ffffff]",
};

// ── types ─────────────────────────────────────────────────────────────────────

type ChannelGridProps = {
  channels: Channel[];
  activeChannelId: string;
  favorites: string[];
  onSelect: (channel: Channel) => void;
  onToggleFavorite: (id: string) => void;
};

// ── component ─────────────────────────────────────────────────────────────────

export function ChannelGrid({
  channels,
  activeChannelId,
  favorites,
  onSelect,
  onToggleFavorite,
}: ChannelGridProps) {
  if (channels.length === 0) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-[#a5abb8]">
        <Tv size={36} aria-hidden="true" className="opacity-40" />
        <p className="text-sm font-semibold">No channels found</p>
      </div>
    );
  }

  const favoriteSet = new Set(favorites);

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {channels.map((channel) => {
        const isActive = channel.id === activeChannelId;
        const isFavorited = favoriteSet.has(channel.id);
        const accent = accentIndex(channel.name);
        const gradient = ACCENT_GRADIENTS[accent];

        return (
          <article
            key={channel.id}
            onClick={() => onSelect(channel)}
            className={[
              "relative cursor-pointer overflow-hidden rounded-xl border bg-white/5 transition-all duration-200",
              "hover:scale-[1.03] hover:border-[#d5ff5f]/50 hover:shadow-[0_0_20px_rgba(213,255,95,0.15)]",
              isActive
                ? "border-[#d5ff5f]/70 shadow-[0_0_24px_rgba(213,255,95,0.22)]"
                : "border-white/10",
            ].join(" ")}
          >
            {/* ── thumbnail area ─────────────────────────────────────────── */}
            <div className="relative aspect-video w-full overflow-hidden">
              {channel.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={channel.logo}
                  alt=""
                  className={`h-full w-full bg-white/10 object-contain p-4 bg-gradient-to-br ${gradient}`}
                />
              ) : (
                <div
                  className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradient}`}
                >
                  <span className="text-2xl font-black text-[#08090d]/80 drop-shadow-sm">
                    {channelInitials(channel.name)}
                  </span>
                </div>
              )}

              {/* LIVE badge */}
              <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                LIVE
              </div>
            </div>

            {/* ── favorite button ─────────────────────────────────────────── */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(channel.id);
              }}
              aria-label={isFavorited ? `Remove ${channel.name} from favorites` : `Add ${channel.name} to favorites`}
              title={isFavorited ? "Remove from favorites" : "Add to favorites"}
              className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm transition-all duration-150 hover:bg-black/60"
            >
              <Heart
                size={14}
                aria-hidden="true"
                fill={isFavorited ? "#d5ff5f" : "none"}
                stroke={isFavorited ? "#d5ff5f" : "rgba(255,255,255,0.7)"}
              />
            </button>

            {/* ── card body ──────────────────────────────────────────────── */}
            <div className="p-3">
              <p className="truncate text-sm font-bold text-white">{channel.name}</p>
              <p className="truncate text-xs text-[#a5abb8]">
                {channel.group}
                {channel.quality ? ` · ${channel.quality}` : ""}
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
