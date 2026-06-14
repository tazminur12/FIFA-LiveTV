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
  Play,
  Radio,
  Search,
  Signal,
  Sparkles,
  Star,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Channel } from "@/lib/playlist";
import Navbar from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { HeroCarousel } from "@/components/hero-carousel";
import { CategoryStrip } from "@/components/category-strip";
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
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as string[]) : [];
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
  let sum = 0;
  for (const char of value) sum += char.charCodeAt(0);
  return (sum % 6) + 1;
}

function nowLabel() {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());
}

// ── Props ─────────────────────────────────────────────────────────────────────

type LiveHomepageProps = {
  channels: Channel[];
};

// ── Component ─────────────────────────────────────────────────────────────────

export function LiveHomepage({ channels }: LiveHomepageProps) {
  // ── Player refs ──
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const chromeTimerRef = useRef<number | undefined>(undefined);

  // ── State ──
  const [activeChannelId, setActiveChannelId] = useState(channels[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [activeGroup, setActiveGroup] = useState("All");
  const [view, setView] = useState<"browse" | "guide">("browse");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recents, setRecents] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [playError, setPlayError] = useState("");
  const [clock, setClock] = useState(nowLabel);
  const [showPlayerChrome, setShowPlayerChrome] = useState(true);
  const [playerVisible, setPlayerVisible] = useState(false); // slides player in when a channel is selected from hero

  // ── Derived ──
  const activeChannel = useMemo(
    () => channels.find((ch) => ch.id === activeChannelId) ?? channels[0],
    [activeChannelId, channels],
  );

  const groups = useMemo(() => {
    const counts = channels.reduce<Record<string, number>>((acc, ch) => {
      acc[ch.group] = (acc[ch.group] ?? 0) + 1;
      return acc;
    }, {});
    return [
      ["All", channels.length] as const,
      ["Favorites", favorites.length] as const,
      ...Object.entries(counts).sort((a, b) => b[1] - a[1]),
    ];
  }, [channels, favorites.length]);

  const categoryList = useMemo(
    () => groups.map(([g]) => g as string),
    [groups],
  );

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

  // ── Bootstrap from localStorage ──
  useEffect(() => {
    setFavorites(readList(storage.favorites));
    setRecents(readList(storage.recents));
  }, []);

  // ── Clock ──
  useEffect(() => {
    const t = window.setInterval(() => setClock(nowLabel()), 30_000);
    return () => window.clearInterval(t);
  }, []);

  // ── Chrome auto-hide cleanup ──
  useEffect(() => {
    return () => {
      if (chromeTimerRef.current) window.clearTimeout(chromeTimerRef.current);
    };
  }, []);

  // ── Reset chrome timer on channel change ──
  useEffect(() => {
    setShowPlayerChrome(true);
    if (chromeTimerRef.current) window.clearTimeout(chromeTimerRef.current);
    chromeTimerRef.current = window.setTimeout(() => {
      setShowPlayerChrome(false);
    }, 2600);
  }, [activeChannelId]);

  // ── HLS playback ──
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
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => undefined);
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setPlayError("This stream did not respond. Try another channel.");
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = activeChannel.url;
      video.play().catch(() => undefined);
    } else {
      setPlayError("Your browser cannot play HLS streams directly.");
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

  // ── Actions ──
  const revealPlayerChrome = useCallback(() => {
    setShowPlayerChrome(true);
    if (chromeTimerRef.current) window.clearTimeout(chromeTimerRef.current);
    chromeTimerRef.current = window.setTimeout(
      () => setShowPlayerChrome(false),
      2600,
    );
  }, []);

  const selectChannel = useCallback(
    (channel: Channel) => {
      setActiveChannelId(channel.id);
      setPlayerVisible(true);
      revealPlayerChrome();
      // Scroll player into view
      setTimeout(() => {
        document
          .getElementById("player-section")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    },
    [revealPlayerChrome],
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

  // ── Empty state ──
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

  return (
    <div className="min-h-screen bg-[#08090d] text-[#f7f4ef]">
      {/* ── Sticky Navbar ─────────────────────────────────────────────────── */}
      <Navbar searchQuery={query} onSearchChange={setQuery} />

      {/* ── Body: Sidebar + Main content ──────────────────────────────────── */}
      <div className="flex">
        {/* Sidebar — real groups from M3U, synced with activeGroup filter */}
        <Sidebar
          groups={groups as Array<[string, number]>}
          activeGroup={activeGroup}
          onGroupChange={setActiveGroup}
        />

        {/* Main scroll area */}
        <main className="min-w-0 flex-1 overflow-x-hidden">
          {/* ── Hero Carousel ──────────────────────────────────────────────── */}
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

          {/* ── Inner content padded ───────────────────────────────────────── */}
          <div className="mx-auto max-w-[1800px] px-4 py-6 sm:px-6">
            {/* ── Player Section ─────────────────────────────────────────── */}
            <section
              id="player-section"
              className={[
                "mb-8 overflow-hidden rounded-2xl border border-white/10 bg-[#0d1017] transition-all duration-500",
                playerVisible
                  ? "max-h-[1000px] opacity-100"
                  : "max-h-0 opacity-0",
              ].join(" ")}
              aria-label="Live player"
            >
              <div className="p-4 sm:p-6">
                {/* Player header */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#d5ff5f]">
                      <Radio size={13} />
                      Live Now
                    </span>
                    <span className="text-[#a5abb8] text-xs">·</span>
                    <span className="text-xs text-[#a5abb8]">{clock}</span>
                    <span className="text-[#a5abb8] text-xs">·</span>
                    <span className="text-xs text-[#a5abb8]">
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

                {/* Player grid */}
                <div className="player-grid">
                  {/* Video shell */}
                  <div
                    className={
                      showPlayerChrome || playError
                        ? "player-shell is-chrome-visible"
                        : "player-shell"
                    }
                    onClick={revealPlayerChrome}
                    onFocusCapture={revealPlayerChrome}
                    onMouseMove={revealPlayerChrome}
                    onTouchStart={revealPlayerChrome}
                  >
                    <video
                      ref={videoRef}
                      muted={isMuted}
                      controls
                      playsInline
                    />
                    <div className="ambient ambient-one" />
                    <div className="ambient ambient-two" />
                    {playError ? (
                      <div className="player-error">
                        <Signal size={30} aria-hidden="true" />
                        <span>{playError}</span>
                      </div>
                    ) : null}
                    <div className="player-overlay">
                      <div>
                        <span className="eyebrow">
                          <Radio size={14} aria-hidden="true" />
                          Live now
                        </span>
                        <h1>{activeChannel.name}</h1>
                        <p>
                          Channel{" "}
                          {activeChannel.number.toString().padStart(3, "0")} ·{" "}
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
                          title="Favorite"
                        >
                          <Heart
                            size={19}
                            fill="currentColor"
                            aria-hidden="true"
                          />
                        </button>
                        <button
                          type="button"
                          className="icon-button"
                          onClick={toggleMute}
                          aria-label={isMuted ? "Unmute" : "Mute"}
                          title={isMuted ? "Unmute" : "Mute"}
                        >
                          {isMuted ? (
                            <VolumeX size={19} aria-hidden="true" />
                          ) : (
                            <Volume2 size={19} aria-hidden="true" />
                          )}
                        </button>
                        <button
                          type="button"
                          className="icon-button"
                          onClick={toggleFullscreen}
                          aria-label="Fullscreen"
                          title="Fullscreen"
                        >
                          <Expand size={19} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Now playing panel */}
                  <aside
                    className="now-panel"
                    aria-label="Current channel details"
                  >
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
                      <BadgeCheck size={14} aria-hidden="true" />
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

            {/* ── Channel Browser ────────────────────────────────────────── */}
            <section
              className="control-surface !rounded-2xl"
              aria-label="Channel browser"
            >
              <div className="p-4 sm:p-6">
                {/* Toolbar: search + view toggle */}
                <div className="toolbar mb-0">
                  <div className="search-box">
                    <Search size={18} aria-hidden="true" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search channels, regions, hosts"
                      aria-label="Search channels"
                    />
                    {query ? (
                      <button
                        type="button"
                        onClick={() => setQuery("")}
                        aria-label="Clear search"
                        title="Clear"
                      >
                        <X size={16} aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>
                  <div className="segmented" aria-label="View mode">
                    <button
                      type="button"
                      className={view === "browse" ? "selected" : ""}
                      onClick={() => setView("browse")}
                    >
                      <ListVideo size={16} aria-hidden="true" />
                      Browse
                    </button>
                    <button
                      type="button"
                      className={view === "guide" ? "selected" : ""}
                      onClick={() => setView("guide")}
                    >
                      <Compass size={16} aria-hidden="true" />
                      Guide
                    </button>
                  </div>
                </div>

                {/* Category strip */}
                <div className="mt-4">
                  <CategoryStrip
                    categories={categoryList}
                    activeCategory={activeGroup}
                    onCategoryChange={setActiveGroup}
                  />
                </div>

                {/* Recently watched */}
                {recentChannels.length > 0 && (
                  <section className="rail mt-5" aria-label="Recently watched">
                    <div className="section-heading">
                      <History size={17} aria-hidden="true" />
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

                {/* Channel content: Browse grid or Guide table */}
                <div className="mt-5">
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
                      {filteredChannels.map((channel, index) => (
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
                            <Clock3 size={15} aria-hidden="true" />
                            Live coverage block {((index % 4) + 1).toString()}
                          </span>
                          <span className="guide-spark">
                            <Sparkles size={15} aria-hidden="true" />
                            {channel.quality}
                          </span>
                        </button>
                      ))}
                    </section>
                  )}

                  {filteredChannels.length === 0 && (
                    <div className="no-results">
                      <Search size={30} aria-hidden="true" />
                      <h2>No matching channels</h2>
                      <p>Try a different search or group.</p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* ── Footer ─────────────────────────────────────────────────── */}
            <Footer channelCount={channels.length} />
          </div>
        </main>
      </div>

      {/* PWA Install Prompt — floats above everything */}
      <PWAInstallPrompt />
    </div>
  );
}
