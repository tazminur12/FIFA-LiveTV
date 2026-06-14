"use client";

import Hls from "hls.js";
import {
  BadgeCheck,
  Clock3,
  Compass,
  Expand,
  Heart,
  History,
  ListVideo,
  Radio,
  Search,
  Signal,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Channel } from "@/lib/playlist";
import Navbar from "@/components/navbar";
import { TopNavTabs } from "@/components/top-nav-tabs";
import {
  MobileBottomNav,
  BOTTOM_NAV_HEIGHT,
} from "@/components/mobile-bottom-nav";
import { HeroCarousel } from "@/components/hero-carousel";
import { ChannelGrid } from "@/components/channel-grid";
import { Footer } from "@/components/footer";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_RECENTS = 12;

const storage = {
  favorites: "livetv:favorites",
  recents: "livetv:recents",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function readList(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const v = window.localStorage.getItem(key);
    return v ? (JSON.parse(v) as string[]) : [];
  } catch {
    return [];
  }
}

function writeList(key: string, value: string[]) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

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
  let s = 0;
  for (const c of value) s += c.charCodeAt(0);
  return (s % 6) + 1;
}

function nowLabel() {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());
}

// ── Props ─────────────────────────────────────────────────────────────────────

type LiveHomepageProps = { channels: Channel[] };

// ── Component ─────────────────────────────────────────────────────────────────

export function LiveHomepage({ channels }: LiveHomepageProps) {
  // refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const chromeTimerRef = useRef<number | undefined>(undefined);

  // state
  const [activeChannelId, setActiveChannelId] = useState(channels[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [activeGroup, setActiveGroup] = useState("All");
  const [view, setView] = useState<"browse" | "guide">("browse");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recents, setRecents] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [playError, setPlayError] = useState("");
  const [clock, setClock] = useState(nowLabel);
  const [showChrome, setShowChrome] = useState(true);
  const [playerVisible, setPlayerVisible] = useState(false);

  // ── Derived ──────────────────────────────────────────────────────────────────

  const activeChannel = useMemo(
    () => channels.find((ch) => ch.id === activeChannelId) ?? channels[0],
    [activeChannelId, channels],
  );

  const groups = useMemo<Array<[string, number]>>(() => {
    const counts = channels.reduce<Record<string, number>>((acc, ch) => {
      acc[ch.group] = (acc[ch.group] ?? 0) + 1;
      return acc;
    }, {});
    return [
      ["All", channels.length],
      ["Favorites", favorites.length],
      ...Object.entries(counts).sort((a, b) => b[1] - a[1]),
    ];
  }, [channels, favorites.length]);

  const recentChannels = useMemo(
    () =>
      recents
        .map((id) => channels.find((ch) => ch.id === id))
        .filter((ch): ch is Channel => Boolean(ch)),
    [channels, recents],
  );

  const filteredChannels = useMemo(() => {
    const q = query.trim().toLowerCase();
    return channels.filter((ch) => {
      const matchesGroup =
        activeGroup === "All" ||
        (activeGroup === "Favorites" && favorites.includes(ch.id)) ||
        ch.group === activeGroup;
      const matchesQuery =
        !q ||
        [ch.name, ch.group, ch.country, ch.host]
          .filter(Boolean)
          .some((v) => v!.toLowerCase().includes(q));
      return matchesGroup && matchesQuery;
    });
  }, [activeGroup, channels, favorites, query]);

  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);

  // ── Effects ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    setFavorites(readList(storage.favorites));
    setRecents(readList(storage.recents));
  }, []);

  useEffect(() => {
    const t = window.setInterval(() => setClock(nowLabel()), 30_000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(
    () => () => {
      if (chromeTimerRef.current) window.clearTimeout(chromeTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    setShowChrome(true);
    if (chromeTimerRef.current) window.clearTimeout(chromeTimerRef.current);
    chromeTimerRef.current = window.setTimeout(
      () => setShowChrome(false),
      2600,
    );
  }, [activeChannelId]);

  useEffect(() => {
    if (!activeChannel || !videoRef.current) return;
    const video = videoRef.current;
    setPlayError("");
    hlsRef.current?.destroy();
    hlsRef.current = null;
    video.pause();
    video.removeAttribute("src");
    video.load();

    if (Hls.isSupported()) {
      const hls = new Hls({
        lowLatencyMode: true,
        backBufferLength: 60,
        enableWorker: true,
      });
      hlsRef.current = hls;
      hls.loadSource(activeChannel.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () =>
        video.play().catch(() => undefined),
      );
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal)
          setPlayError("Stream unavailable. Try another channel.");
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = activeChannel.url;
      video.play().catch(() => undefined);
    } else {
      setPlayError("Your browser cannot play HLS streams.");
    }

    setRecents((cur) => {
      const next = [
        activeChannel.id,
        ...cur.filter((id) => id !== activeChannel.id),
      ].slice(0, MAX_RECENTS);
      writeList(storage.recents, next);
      return next;
    });

    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [activeChannel]);

  // ── Actions ───────────────────────────────────────────────────────────────────

  const revealChrome = useCallback(() => {
    setShowChrome(true);
    if (chromeTimerRef.current) window.clearTimeout(chromeTimerRef.current);
    chromeTimerRef.current = window.setTimeout(
      () => setShowChrome(false),
      2600,
    );
  }, []);

  const selectChannel = useCallback(
    (channel: Channel) => {
      setActiveChannelId(channel.id);
      setPlayerVisible(true);
      revealChrome();
      setTimeout(() => {
        document
          .getElementById("player-section")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    },
    [revealChrome],
  );

  const toggleFavorite = useCallback((channelId: string) => {
    setFavorites((cur) => {
      const next = cur.includes(channelId)
        ? cur.filter((id) => id !== channelId)
        : [channelId, ...cur];
      writeList(storage.favorites, next);
      return next;
    });
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const player = document.querySelector(".player-shell");
    if (player instanceof HTMLElement) player.requestFullscreen?.();
  }, []);

  // ── Empty state ───────────────────────────────────────────────────────────────

  if (!activeChannel) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#08090d] text-[#a5abb8]">
        <Signal size={36} className="opacity-40" />
        <p className="text-sm font-semibold">No channels found</p>
        <p className="text-xs opacity-60">
          Check your M3U file and restart the app.
        </p>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div
      className={`min-h-screen bg-[#08090d] text-[#f7f4ef] ${BOTTOM_NAV_HEIGHT} md:pb-0`}
    >
      {/* ── 1. Sticky Navbar ────────────────────────────────────────────────── */}
      <Navbar searchQuery={query} onSearchChange={setQuery} />

      {/* ── 2. Sticky Horizontal Category Tabs (replaces sidebar) ───────────── */}
      <TopNavTabs
        groups={groups}
        activeGroup={activeGroup}
        onGroupChange={setActiveGroup}
      />

      {/* ── 3. Main Content (full width, no sidebar) ────────────────────────── */}
      <main className="w-full">
        {/* ── Hero Carousel ────────────────────────────────────────────────── */}
        <HeroCarousel
          onWatchNow={() => {
            setPlayerVisible(true);
            setTimeout(() => {
              document
                .getElementById("player-section")
                ?.scrollIntoView({ behavior: "smooth" });
            }, 80);
          }}
        />

        {/* ── Padded content area ──────────────────────────────────────────── */}
        <div className="mx-auto max-w-[1800px] px-3 py-5 sm:px-5 lg:px-8">
          {/* ── Live Player ────────────────────────────────────────────────── */}
          <section
            id="player-section"
            className={[
              "mb-6 overflow-hidden rounded-2xl border border-white/10 bg-[#0d1017]",
              "transition-all duration-500",
              playerVisible
                ? "max-h-[1000px] opacity-100"
                : "max-h-0 opacity-0 pointer-events-none",
            ].join(" ")}
            aria-label="Live player"
          >
            <div className="p-3 sm:p-5">
              {/* Player top bar */}
              <div className="mb-3 flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#d5ff5f]">
                    <Radio size={12} />
                    Live Now
                  </span>
                  <span className="text-[#a5abb8]/40 text-xs hidden sm:inline">
                    ·
                  </span>
                  <span className="text-xs text-[#a5abb8] hidden sm:inline">
                    {clock}
                  </span>
                  <span className="text-[#a5abb8]/40 text-xs hidden sm:inline">
                    ·
                  </span>
                  <span className="text-xs text-[#a5abb8] hidden sm:inline">
                    {channels.length} channels
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPlayerVisible(false)}
                  aria-label="Close player"
                  className="inline-grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/5 text-[#a5abb8] transition-colors hover:border-white/20 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Player + info panel */}
              <div className="player-grid">
                {/* Video */}
                <div
                  className={
                    showChrome || playError
                      ? "player-shell is-chrome-visible"
                      : "player-shell"
                  }
                  onClick={revealChrome}
                  onFocusCapture={revealChrome}
                  onMouseMove={revealChrome}
                  onTouchStart={revealChrome}
                >
                  <video ref={videoRef} muted={isMuted} controls playsInline />
                  <div className="ambient ambient-one" />
                  <div className="ambient ambient-two" />
                  {playError && (
                    <div className="player-error">
                      <Signal size={28} aria-hidden="true" />
                      <span>{playError}</span>
                    </div>
                  )}
                  <div className="player-overlay">
                    <div>
                      <span className="eyebrow">
                        <Radio size={13} aria-hidden="true" />
                        Live now
                      </span>
                      <h1>{activeChannel.name}</h1>
                      <p>
                        Ch {activeChannel.number.toString().padStart(3, "0")} ·{" "}
                        {activeChannel.group} · {activeChannel.quality}
                      </p>
                    </div>
                    <div className="player-actions">
                      <button
                        type="button"
                        className={
                          favoriteSet.has(activeChannel.id)
                            ? "icon-button is-active"
                            : "icon-button"
                        }
                        onClick={() => toggleFavorite(activeChannel.id)}
                        aria-label="Toggle favorite"
                      >
                        <Heart
                          size={18}
                          fill="currentColor"
                          aria-hidden="true"
                        />
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        onClick={toggleMute}
                        aria-label={isMuted ? "Unmute" : "Mute"}
                      >
                        {isMuted ? (
                          <VolumeX size={18} aria-hidden="true" />
                        ) : (
                          <Volume2 size={18} aria-hidden="true" />
                        )}
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        onClick={toggleFullscreen}
                        aria-label="Fullscreen"
                      >
                        <Expand size={18} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Channel info panel */}
                <aside className="now-panel" aria-label="Channel info">
                  <div
                    className={`channel-mark accent-${accentIndex(activeChannel.name)}`}
                  >
                    {activeChannel.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={activeChannel.logo} alt="" />
                    ) : (
                      <span>{channelInitials(activeChannel.name)}</span>
                    )}
                  </div>
                  <span className="eyebrow">
                    <BadgeCheck size={13} aria-hidden="true" />
                    Signal source
                  </span>
                  <h2>{activeChannel.name}</h2>
                  <dl>
                    <div>
                      <dt>Group</dt>
                      <dd>{activeChannel.group}</dd>
                    </div>
                    <div>
                      <dt>Region</dt>
                      <dd>{activeChannel.country ?? "Global"}</dd>
                    </div>
                    <div>
                      <dt>Host</dt>
                      <dd>{activeChannel.host}</dd>
                    </div>
                  </dl>
                </aside>
              </div>
            </div>
          </section>

          {/* ── Channel Browser ─────────────────────────────────────────────── */}
          <section
            className="control-surface !rounded-2xl"
            aria-label="Channel browser"
          >
            <div className="p-3 sm:p-5">
              {/* Toolbar row */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Search */}
                <div className="search-box flex-1">
                  <Search size={16} aria-hidden="true" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search channels, regions, hosts…"
                    aria-label="Search channels"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      aria-label="Clear search"
                    >
                      <X size={15} aria-hidden="true" />
                    </button>
                  )}
                </div>

                {/* View toggle */}
                <div
                  className="segmented self-start sm:self-auto flex-shrink-0"
                  aria-label="View mode"
                >
                  <button
                    type="button"
                    className={view === "browse" ? "selected" : ""}
                    onClick={() => setView("browse")}
                  >
                    <ListVideo size={15} aria-hidden="true" />
                    <span className="hidden xs:inline">Browse</span>
                  </button>
                  <button
                    type="button"
                    className={view === "guide" ? "selected" : ""}
                    onClick={() => setView("guide")}
                  >
                    <Compass size={15} aria-hidden="true" />
                    <span className="hidden xs:inline">Guide</span>
                  </button>
                </div>
              </div>

              {/* Active filter badge — shows which group is selected */}
              {activeGroup !== "All" && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-[#a5abb8]">Filtering:</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d5ff5f]/10 border border-[#d5ff5f]/25 px-3 py-1 text-xs font-semibold text-[#d5ff5f]">
                    {activeGroup}
                    <button
                      type="button"
                      onClick={() => setActiveGroup("All")}
                      aria-label="Clear filter"
                      className="ml-0.5 rounded-full hover:text-white transition-colors"
                    >
                      <X size={11} />
                    </button>
                  </span>
                  <span className="text-xs text-[#a5abb8]">
                    {filteredChannels.length} channel
                    {filteredChannels.length !== 1 ? "s" : ""}
                  </span>
                </div>
              )}

              {/* Recently watched */}
              {recentChannels.length > 0 && (
                <section className="rail mt-4" aria-label="Recently watched">
                  <div className="section-heading">
                    <History size={16} aria-hidden="true" />
                    <h2>Recently watched</h2>
                  </div>
                  <div className="mini-channel-row">
                    {recentChannels.map((ch) => (
                      <button
                        key={ch.id}
                        type="button"
                        className={
                          ch.id === activeChannel.id
                            ? "mini-channel selected"
                            : "mini-channel"
                        }
                        onClick={() => selectChannel(ch)}
                      >
                        <span
                          className={`mini-mark accent-${accentIndex(ch.name)}`}
                        >
                          {channelInitials(ch.name)}
                        </span>
                        <span>{ch.name}</span>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Channel grid / guide */}
              <div className="mt-4">
                {view === "browse" ? (
                  <ChannelGrid
                    channels={filteredChannels}
                    activeChannelId={activeChannel.id}
                    favorites={favorites}
                    onSelect={selectChannel}
                    onToggleFavorite={toggleFavorite}
                  />
                ) : (
                  <section className="guide-table" aria-label="Live guide">
                    {filteredChannels.map((channel, idx) => (
                      <button
                        key={channel.id}
                        type="button"
                        className={
                          channel.id === activeChannel.id
                            ? "guide-row selected"
                            : "guide-row"
                        }
                        onClick={() => selectChannel(channel)}
                      >
                        <span className="guide-number">
                          {channel.number.toString().padStart(3, "0")}
                        </span>
                        <span
                          className={`mini-mark accent-${accentIndex(channel.name)}`}
                        >
                          {channelInitials(channel.name)}
                        </span>
                        <span className="guide-name">{channel.name}</span>
                        <span className="guide-program">
                          <Clock3 size={14} aria-hidden="true" />
                          Live block {(idx % 4) + 1}
                        </span>
                        <span className="guide-spark">
                          <Sparkles size={14} aria-hidden="true" />
                          {channel.quality}
                        </span>
                      </button>
                    ))}
                  </section>
                )}

                {filteredChannels.length === 0 && (
                  <div className="no-results">
                    <Search size={28} aria-hidden="true" />
                    <h2>No matching channels</h2>
                    <p>Try a different search or category.</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ── Footer ──────────────────────────────────────────────────────── */}
          <Footer channelCount={channels.length} />
        </div>
      </main>

      {/* ── 4. Mobile Bottom Navigation ─────────────────────────────────────── */}
      <MobileBottomNav
        activeGroup={activeGroup}
        groups={groups}
        onGroupChange={setActiveGroup}
      />

      {/* ── PWA Install Prompt ───────────────────────────────────────────────── */}
      <PWAInstallPrompt />
    </div>
  );
}
