"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Heart,
  Play,
  Radio,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FeaturedItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  badge: "LIVE" | "HD" | "4K";
  gradient: string; // Tailwind gradient classes
  channelName: string;
  viewers: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const featuredItems: FeaturedItem[] = [
  {
    id: "fifa-world-cup",
    title: "FIFA World Cup 2026",
    subtitle: "Argentina vs Brazil — Group Stage · Lusail Stadium",
    category: "SPORTS",
    badge: "LIVE",
    gradient: "from-emerald-950 via-green-900 to-teal-900",
    channelName: "FIFA Official",
    viewers: "2.4M watching",
  },
  {
    id: "uefa-champions-league",
    title: "UEFA Champions League",
    subtitle: "Real Madrid vs Manchester City — Round of 16",
    category: "FOOTBALL",
    badge: "HD",
    gradient: "from-blue-950 via-indigo-900 to-blue-900",
    channelName: "UEFA TV",
    viewers: "1.8M watching",
  },
  {
    id: "nba-finals",
    title: "NBA Finals 2026",
    subtitle: "Golden State Warriors vs Boston Celtics — Game 7",
    category: "BASKETBALL",
    badge: "4K",
    gradient: "from-orange-950 via-amber-900 to-yellow-900",
    channelName: "NBA League Pass",
    viewers: "3.1M watching",
  },
  {
    id: "breaking-news-live",
    title: "Breaking News Live",
    subtitle: "24/7 global coverage — World Developments Tonight",
    category: "NEWS",
    badge: "LIVE",
    gradient: "from-slate-950 via-gray-900 to-zinc-900",
    channelName: "World News Network",
    viewers: "890K watching",
  },
  {
    id: "movie-premier-night",
    title: "Movie Premiere Night",
    subtitle: "Exclusive world premiere — The Last Horizon (2026)",
    category: "MOVIES",
    badge: "4K",
    gradient: "from-purple-950 via-violet-900 to-fuchsia-900",
    channelName: "Cinema Max",
    viewers: "1.2M watching",
  },
];

// ─── Badge colours ────────────────────────────────────────────────────────────

const badgeStyles: Record<FeaturedItem["badge"], string> = {
  LIVE: "bg-[#ff4f6d] text-white",
  HD: "bg-[#52e0d6] text-[#08090d]",
  "4K": "bg-[#d5ff5f] text-[#08090d]",
};

// ─── Category chip colour ──────────────────────────────────────────────────────

const categoryColour = (cat: string) => {
  switch (cat) {
    case "SPORTS":
    case "FOOTBALL":
    case "BASKETBALL":
      return "text-[#d5ff5f] border-[#d5ff5f]/40";
    case "NEWS":
      return "text-[#ff6f61] border-[#ff6f61]/40";
    case "MOVIES":
      return "text-[#52e0d6] border-[#52e0d6]/40";
    default:
      return "text-white/60 border-white/20";
  }
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface HeroCarouselProps {
  onWatchNow?: (itemId: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function HeroCarousel({ onWatchNow }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(0); // the slide actually rendered (lags for fade)
  const [fading, setFading] = useState(false);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const total = featuredItems.length;

  // Cross-fade to a new slide index
  const goTo = useCallback(
    (next: number) => {
      if (next === current || fading) return;
      setFading(true);
      // After the fade-out completes, swap slide & fade back in
      setTimeout(() => {
        setVisible(next);
        setCurrent(next);
        setFading(false);
      }, 350); // half of duration-700
    },
    [current, fading]
  );

  const next = useCallback(
    () => goTo((current + 1) % total),
    [current, total, goTo]
  );
  const prev = useCallback(
    () => goTo((current - 1 + total) % total),
    [current, total, goTo]
  );

  // Auto-advance
  useEffect(() => {
    if (paused) return;
    intervalRef.current = setInterval(next, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused, next]);

  const item = featuredItems[visible];

  return (
    <div
      className="relative w-full min-h-[480px] md:min-h-[580px] overflow-hidden select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* ── Slide background ── */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${item.gradient} transition-opacity duration-700 ${fading ? "opacity-0" : "opacity-100"}`}
      />

      {/* Cinematic noise/grain overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNjUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48ZmVDb2xvck1hdHJpeCB0eXBlPSJzYXR1cmF0ZSIgdmFsdWVzPSIwIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNub2lzZSkiIG9wYWNpdHk9IjAuMDUiLz48L3N2Zz4=')] opacity-40 pointer-events-none" />

      {/* ── Dark gradient overlay (bottom) ── */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#08090d] via-[#08090d]/60 to-transparent pointer-events-none" />

      {/* ── Slide content ── */}
      <div
        className={`relative z-10 flex h-full min-h-[480px] md:min-h-[580px] flex-col justify-end px-6 pb-20 md:px-14 md:pb-24 transition-opacity duration-700 ${fading ? "opacity-0" : "opacity-100"}`}
      >
        {/* Category chip */}
        <span
          className={`mb-3 inline-flex w-fit items-center rounded-full border px-3 py-0.5 text-xs font-bold tracking-widest uppercase ${categoryColour(item.category)}`}
        >
          {item.category}
        </span>

        {/* Live / HD / 4K badge + channel name row */}
        <div className="mb-3 flex items-center gap-3">
          {item.badge === "LIVE" ? (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider animate-pulse ${badgeStyles.LIVE}`}
            >
              <Radio size={11} />
              LIVE
            </span>
          ) : (
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${badgeStyles[item.badge]}`}
            >
              {item.badge}
            </span>
          )}
          <span className="text-xs font-medium text-white/50">
            {item.channelName}
          </span>
        </div>

        {/* Title */}
        <h1
          className="mb-2 max-w-2xl text-3xl font-extrabold leading-tight text-white md:text-5xl lg:text-6xl"
          style={{ textShadow: "0 2px 24px rgba(0,0,0,0.7)" }}
        >
          {item.title}
        </h1>

        {/* Subtitle */}
        <p className="mb-4 max-w-xl text-sm text-white/55 md:text-lg">
          {item.subtitle}
        </p>

        {/* Viewers */}
        <div className="mb-6 flex items-center gap-1.5 text-white/40">
          <Eye size={14} />
          <span className="text-xs font-medium">{item.viewers}</span>
        </div>

        {/* CTA row */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onWatchNow?.(item.id)}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#d5ff5f] to-[#52e0d6] px-6 py-2.5 text-sm font-bold text-[#08090d] shadow-lg shadow-[#d5ff5f]/20 transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            <Play size={15} fill="currentColor" />
            Watch Now
          </button>
          <button className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/80 backdrop-blur-sm transition-colors duration-200 hover:border-white/40 hover:bg-white/10 hover:text-white active:scale-95">
            <Heart size={14} />
            Add to Favorites
          </button>
        </div>
      </div>

      {/* ── Prev / Next arrow buttons ── */}
      <button
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/15 bg-black/30 p-2.5 text-white/70 opacity-0 backdrop-blur-sm transition-all duration-200 hover:border-white/30 hover:bg-black/50 hover:text-white group-hover:opacity-100 [.group:hover_&]:opacity-100 md:left-6 [div:hover>&]:opacity-100"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={next}
        aria-label="Next slide"
        className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/15 bg-black/30 p-2.5 text-white/70 opacity-0 backdrop-blur-sm transition-all duration-200 hover:border-white/30 hover:bg-black/50 hover:text-white md:right-6 [div:hover>&]:opacity-100"
      >
        <ChevronRight size={20} />
      </button>

      {/* ── Dot indicators ── */}
      <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
        {featuredItems.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === current
                ? "w-8 bg-[#d5ff5f]"
                : "w-2 bg-white/30 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
