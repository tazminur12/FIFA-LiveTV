"use client";

import Hls from "hls.js";
import {
  Expand,
  Heart,
  Minimize2,
  Radio,
  RefreshCw,
  Signal,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Channel } from "@/lib/playlist";

// ── Types ─────────────────────────────────────────────────────────────────────

type Status = "loading" | "buffering" | "playing" | "retrying" | "error";

export type VideoPlayerProps = {
  channel: Channel;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onClose: () => void;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_RETRIES = 3;
const RETRY_DELAY = 5_000; // ms between retries

// ── Small helpers ─────────────────────────────────────────────────────────────

function initials(name: string) {
  const w = name
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!w.length) return "TV";
  if (w.length === 1) return w[0].slice(0, 2).toUpperCase();
  return `${w[0][0]}${w[1][0]}`.toUpperCase();
}

const GRADIENTS: Record<number, string> = {
  1: "linear-gradient(135deg,#d5ff5f,#52e0d6)",
  2: "linear-gradient(135deg,#ffcf5a,#ff6f61)",
  3: "linear-gradient(135deg,#8bd3ff,#f8a5ff)",
  4: "linear-gradient(135deg,#43d38b,#d5ff5f)",
  5: "linear-gradient(135deg,#ff4f6d,#ffcf5a)",
  6: "linear-gradient(135deg,#52e0d6,#ffffff)",
};

function accentOf(name: string) {
  let s = 0;
  for (const c of name) s += c.charCodeAt(0);
  return (s % 6) + 1;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function VideoPlayer({
  channel,
  isFavorite,
  onToggleFavorite,
  onClose,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  // Retry key: increment to re-trigger the HLS setup effect (manual retry)
  const [retryKey, setRetryKey] = useState(0);

  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [retryNum, setRetryNum] = useState(0); // current attempt shown to user
  const [retrySecs, setRetrySecs] = useState(0); // countdown

  const [showCtrl, setShowCtrl] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isFs, setIsFs] = useState(false);

  // ── Core HLS mount — re-runs on channel change OR manual retry ──────────────

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // ── local cleanup refs ────────────────────────────────────────────────────
    let hls: Hls | null = null;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let countdown: ReturnType<typeof setInterval> | undefined;
    let attempt = 0; // local attempt counter within this effect instance

    // ── reset UI state ────────────────────────────────────────────────────────
    setStatus("loading");
    setErrorMsg("");
    setRetryNum(0);
    setShowCtrl(true);

    // ── teardown previous HLS cleanly ─────────────────────────────────────────
    video.pause();
    video.removeAttribute("src");
    video.load();

    // ── schedule a retry after RETRY_DELAY ms ─────────────────────────────────
    function scheduleRetry() {
      if (attempt >= MAX_RETRIES - 1) {
        setStatus("error");
        setErrorMsg(
          `Stream failed after ${MAX_RETRIES} attempts. The channel may be offline or geo-restricted.`,
        );
        return;
      }

      attempt += 1;
      setStatus("retrying");
      setRetryNum(attempt);

      // Countdown display
      let secs = Math.round(RETRY_DELAY / 1000);
      setRetrySecs(secs);
      countdown = setInterval(() => {
        secs = Math.max(0, secs - 1);
        setRetrySecs(secs);
      }, 1000);

      retryTimer = setTimeout(() => {
        clearInterval(countdown);
        mount();
      }, RETRY_DELAY);
    }

    // ── mount HLS ─────────────────────────────────────────────────────────────
    function mount() {
      // Destroy previous HLS instance if any
      hls?.destroy();
      hls = null;

      const v = videoRef.current;
      if (!v) return;
      v.pause();
      v.removeAttribute("src");
      v.load();
      setStatus("loading");

      if (Hls.isSupported()) {
        // re-read the ref in case it changed
        const vid = videoRef.current;
        if (!vid) return;
        hls = new Hls({
          lowLatencyMode: true,
          backBufferLength: 30,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          enableWorker: true,
          // Give each segment a fair chance before giving up
          manifestLoadingMaxRetry: 1,
          levelLoadingMaxRetry: 1,
          fragLoadingMaxRetry: 2,
          manifestLoadingTimeOut: 12_000,
          levelLoadingTimeOut: 12_000,
          fragLoadingTimeOut: 20_000,
        });

        hls.loadSource(channel.url);
        hls.attachMedia(vid);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setStatus("buffering");
          vid.play().catch(() => {
            setStatus("playing");
          });
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (!data.fatal) return;
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR && attempt === 0) {
            hls?.startLoad();
          } else {
            scheduleRetry();
          }
        });
      } else if (v.canPlayType("application/vnd.apple.mpegurl")) {
        // Native HLS (Safari / iOS)
        v.src = channel.url;
        setStatus("buffering");
        v.play().catch(() => setStatus("playing"));
      } else {
        setStatus("error");
        setErrorMsg(
          "HLS playback is not supported in this browser. Please use Chrome or Safari.",
        );
      }
    }

    mount();

    // ── cleanup on unmount / channel change ───────────────────────────────────
    return () => {
      clearTimeout(hideTimer);
      clearTimeout(retryTimer);
      clearInterval(countdown);
      hls?.destroy();
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel.id, channel.url, retryKey]);

  // ── Video element events ───────────────────────────────────────────────────

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onWaiting = () =>
      setStatus((s) => (s === "playing" ? "buffering" : s));
    const onPlaying = () => setStatus("playing");
    const onStalled = () =>
      setStatus((s) => (s === "playing" ? "buffering" : s));

    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("stalled", onStalled);
    return () => {
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("stalled", onStalled);
    };
  }, []);

  // ── Always show controls when not actively playing ─────────────────────────

  useEffect(() => {
    if (status !== "playing") setShowCtrl(true);
  }, [status]);

  // ── Fullscreen detection ───────────────────────────────────────────────────

  useEffect(() => {
    const onChange = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key.toLowerCase() === "m") {
        e.preventDefault();
        handleMute();
      }
      if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        handleFs();
      }
      if (e.key === "Escape" && !document.fullscreenElement) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  let hideCtrlTimer: ReturnType<typeof setTimeout> | undefined;

  function revealControls() {
    setShowCtrl(true);
    clearTimeout(hideCtrlTimer);
    if (status === "playing") {
      hideCtrlTimer = setTimeout(() => setShowCtrl(false), 3000);
    }
  }

  function handleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  }

  function handleFs() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      playerRef.current?.requestFullscreen();
    }
  }

  function handleManualRetry() {
    setRetryKey((k) => k + 1);
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const accent = accentOf(channel.name);
  const ctrlVisible = showCtrl || status !== "playing";
  const isIdle = status !== "playing";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      ref={playerRef}
      className="relative overflow-hidden rounded-2xl bg-black select-none"
      style={{ aspectRatio: "16/9", minHeight: 200 }}
      onMouseMove={revealControls}
      onMouseLeave={() => status === "playing" && setShowCtrl(false)}
      onTouchStart={revealControls}
      onClick={revealControls}
    >
      {/* ── Ambient glow ─────────────────────────────────────────────────── */}
      <div
        className="pointer-events-none absolute bottom-[8%] left-[6%] h-[32%] w-[32%] rounded-full opacity-[0.22] blur-[80px]"
        style={{ background: "#52e0d6" }}
      />
      <div
        className="pointer-events-none absolute right-[8%] top-0 h-[36%] w-[36%] rounded-full opacity-[0.16] blur-[80px]"
        style={{ background: "#ff6f61" }}
      />

      {/* ── The video ────────────────────────────────────────────────────── */}
      <video
        ref={videoRef}
        muted={isMuted}
        playsInline
        className="absolute inset-0 h-full w-full object-contain"
      />

      {/* ═══════════════ STATUS OVERLAYS ═════════════════════════════════ */}

      {/* Loading / Buffering */}
      {(status === "loading" || status === "buffering") && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 bg-black/55">
          {/* Spinner ring */}
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-white/10 border-t-[#d5ff5f]" />
            <div
              className="absolute inset-[5px] animate-spin rounded-full border-[2px] border-white/5 border-b-[#52e0d6]"
              style={{
                animationDirection: "reverse",
                animationDuration: "1.4s",
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Radio size={20} className="text-[#d5ff5f] opacity-90" />
            </div>
          </div>

          {/* Channel info */}
          <div className="text-center px-4">
            <p className="font-bold text-white text-sm sm:text-base truncate max-w-[280px]">
              {channel.name}
            </p>
            <p className="mt-1 text-xs text-[#a5abb8] animate-pulse">
              {status === "loading" ? "Connecting to stream…" : "Buffering…"}
            </p>
          </div>

          {/* Dot pulse row */}
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-[#d5ff5f] animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Retrying */}
      {status === "retrying" && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 bg-black/65">
          {/* Icon */}
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#ff4f6d]/30 bg-[#ff4f6d]/10">
            <Signal size={26} className="animate-pulse text-[#ff4f6d]" />
          </div>

          {/* Text */}
          <div className="text-center">
            <p className="font-bold text-white">Signal Lost</p>
            <p className="mt-1.5 text-xs text-[#a5abb8]">
              Reconnecting in{" "}
              <span className="font-mono font-bold text-white">
                {retrySecs}s
              </span>{" "}
              — Attempt{" "}
              <span className="font-bold text-[#d5ff5f]">{retryNum}</span>/
              {MAX_RETRIES}
            </p>
          </div>

          {/* Progress bar */}
          <div className="h-1 w-40 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[#ff4f6d] transition-all duration-1000 ease-linear"
              style={{
                width: `${Math.max(0, ((RETRY_DELAY / 1000 - retrySecs) / (RETRY_DELAY / 1000)) * 100)}%`,
              }}
            />
          </div>

          {/* Skip retry */}
          <button
            onClick={handleManualRetry}
            className="text-xs text-[#a5abb8] underline underline-offset-2 hover:text-white transition-colors"
          >
            Retry now
          </button>
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 bg-black/75 px-6 text-center">
          {/* Icon */}
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#ff4f6d]/30 bg-[#ff4f6d]/10">
            <Signal size={26} className="text-[#ff4f6d]" />
          </div>

          {/* Message */}
          <div>
            <p className="font-bold text-white text-base">Stream Unavailable</p>
            <p className="mt-2 max-w-xs text-xs leading-relaxed text-[#a5abb8]">
              {errorMsg}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={handleManualRetry}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#d5ff5f] to-[#52e0d6] px-5 py-2.5 text-sm font-extrabold text-[#08090d] shadow-lg shadow-[#d5ff5f]/20 transition-all hover:opacity-90 hover:scale-105 active:scale-95"
            >
              <RefreshCw size={14} />
              Try Again
            </button>
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/80 backdrop-blur-sm transition-all hover:bg-white/10 hover:text-white active:scale-95"
            >
              <X size={14} />
              Close
            </button>
          </div>

          {/* Tip */}
          <p className="text-[10px] text-[#a5abb8]/50 max-w-xs">
            Tip: Some channels are geo-restricted. Try a different channel from
            the same group.
          </p>
        </div>
      )}

      {/* ═══════════════ CONTROL OVERLAY (top + bottom) ══════════════════ */}

      {/* Top bar: channel info + close */}
      <div
        className={[
          "absolute inset-x-0 top-0 z-30 px-3 pb-10 pt-3 sm:px-4 sm:pt-4",
          "bg-gradient-to-b from-black/80 via-black/30 to-transparent",
          "transition-opacity duration-300",
          ctrlVisible ? "opacity-100" : "opacity-0 pointer-events-none",
        ].join(" ")}
      >
        <div className="flex items-start justify-between gap-3">
          {/* Channel identity */}
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Logo / initials */}
            <div
              className="flex h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/20 text-[9px] sm:text-[10px] font-black text-[#08090d]"
              style={{ background: GRADIENTS[accent] }}
            >
              {channel.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={channel.logo}
                  alt=""
                  className="h-full w-full object-contain p-1"
                  style={{ background: "rgba(255,255,255,0.92)" }}
                />
              ) : (
                initials(channel.name)
              )}
            </div>
            <div className="min-w-0">
              <p
                className="truncate text-xs sm:text-sm font-bold text-white leading-tight"
                style={{ textShadow: "0 1px 10px rgba(0,0,0,0.9)" }}
              >
                {channel.name}
              </p>
              <p className="truncate text-[10px] text-white/50">
                {channel.group}
                {channel.quality ? ` · ${channel.quality}` : ""}
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close player"
            className="flex-shrink-0 inline-grid h-7 w-7 place-items-center rounded-full bg-black/50 text-white/80 backdrop-blur-sm transition-all hover:bg-black/70 hover:text-white active:scale-90"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Bottom bar: LIVE + signal + controls */}
      <div
        className={[
          "absolute inset-x-0 bottom-0 z-30 px-3 pb-3 pt-12 sm:px-4 sm:pb-4",
          "bg-gradient-to-t from-black/90 via-black/40 to-transparent",
          "transition-opacity duration-300",
          ctrlVisible ? "opacity-100" : "opacity-0 pointer-events-none",
        ].join(" ")}
      >
        <div className="flex items-center justify-between gap-3">
          {/* Left: LIVE badge + signal bars + quality */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* LIVE badge */}
            <div className="flex items-center gap-1.5 rounded-full bg-[#ff4f6d] px-2 py-0.5 sm:px-2.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white">
                Live
              </span>
            </div>

            {/* Animated signal bars */}
            <div
              className="flex items-end gap-[2px]"
              aria-label="Signal strength"
            >
              {[4, 6, 9].map((h, i) => (
                <div
                  key={i}
                  className={[
                    "w-[3px] rounded-sm transition-all duration-300",
                    status === "playing"
                      ? "bg-[#d5ff5f]"
                      : status === "buffering"
                        ? "bg-[#ffcf5a] animate-pulse"
                        : "bg-white/20",
                  ].join(" ")}
                  style={{
                    height: h,
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </div>

            {/* Channel number + quality */}
            <div className="hidden items-center gap-1.5 sm:flex">
              <span className="text-[10px] font-mono text-white/40">
                Ch {channel.number.toString().padStart(3, "0")}
              </span>
              {channel.quality && (
                <span className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 text-[9px] font-bold text-white/50">
                  {channel.quality}
                </span>
              )}
            </div>
          </div>

          {/* Right: controls */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            {/* Keyboard hints — desktop only */}
            <div className="mr-1 hidden items-center gap-1 lg:flex">
              {[
                ["M", "Mute"],
                ["F", "Fullscreen"],
              ].map(([k, title]) => (
                <kbd
                  key={k}
                  title={title}
                  className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px] font-mono text-white/25"
                >
                  {k}
                </kbd>
              ))}
            </div>

            {/* Mute */}
            <button
              onClick={handleMute}
              aria-label={isMuted ? "Unmute" : "Mute"}
              title={isMuted ? "Unmute (M)" : "Mute (M)"}
              className="inline-grid h-8 w-8 place-items-center rounded-full text-white/70 transition-all hover:bg-white/10 hover:text-white active:scale-90"
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>

            {/* Favorite */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              aria-label={
                isFavorite ? "Remove from favorites" : "Add to favorites"
              }
              className={[
                "inline-grid h-8 w-8 place-items-center rounded-full transition-all active:scale-90",
                isFavorite
                  ? "text-[#d5ff5f] hover:bg-[#d5ff5f]/10"
                  : "text-white/60 hover:bg-white/10 hover:text-white",
              ].join(" ")}
            >
              <Heart size={16} fill={isFavorite ? "currentColor" : "none"} />
            </button>

            {/* Divider */}
            <div className="mx-0.5 h-4 w-px bg-white/15" />

            {/* Fullscreen */}
            <button
              onClick={handleFs}
              aria-label={isFs ? "Exit fullscreen" : "Fullscreen (F)"}
              title={isFs ? "Exit fullscreen" : "Fullscreen (F)"}
              className="inline-grid h-8 w-8 place-items-center rounded-full text-white/70 transition-all hover:bg-white/10 hover:text-white active:scale-90"
            >
              {isFs ? <Minimize2 size={16} /> : <Expand size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Fullscreen: cursor hide when controls hidden ────────────────── */}
      <style>{`
        .player-cursor-hide { cursor: none; }
      `}</style>
      {isFs && !ctrlVisible && (
        <div className="player-cursor-hide absolute inset-0 z-10" />
      )}
    </div>
  );
}
