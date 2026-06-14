"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone, X, Tv, Chrome } from "lucide-react";

// BeforeInstallPromptEvent type (not in standard TS lib yet)
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Platform = "android" | "ios" | "desktop" | null;

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

function isInStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as Record<string, unknown>).standalone === true
  );
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<Platform>(null);
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Already installed as PWA — don't show
    if (isInStandaloneMode()) return;

    // Already dismissed this session
    const wasDismissed = sessionStorage.getItem("pwa-prompt-dismissed");
    if (wasDismissed) return;

    const p = detectPlatform();
    setPlatform(p);

    if (p === "ios") {
      // iOS doesn't fire beforeinstallprompt — show manual guide after 3s
      const t = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(t);
    }

    // Android / Desktop — listen for native prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShow(true), 2000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    setShow(false);
    setDismissed(true);
    sessionStorage.setItem("pwa-prompt-dismissed", "1");
  }

  async function handleInstall() {
    if (platform === "ios") {
      setShowIOSGuide(true);
      return;
    }
    if (!deferredPrompt) return;
    setInstalling(true);
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShow(false);
    }
    setInstalling(false);
    setDeferredPrompt(null);
  }

  if (!show || dismissed) return null;

  // ── iOS Manual Guide Modal ────────────────────────────────────────────────
  if (showIOSGuide) {
    return (
      <div className="fixed inset-0 z-[200] flex items-end justify-center p-4 sm:items-center">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={() => {
            setShowIOSGuide(false);
            dismiss();
          }}
        />

        <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-[#0d1117] p-6 shadow-2xl">
          {/* Close */}
          <button
            onClick={() => {
              setShowIOSGuide(false);
              dismiss();
            }}
            className="absolute right-4 top-4 inline-grid h-7 w-7 place-items-center rounded-full bg-white/5 text-[#a5abb8] hover:bg-white/10 hover:text-white"
          >
            <X size={14} />
          </button>

          {/* Header */}
          <div className="mb-5 flex items-center gap-3">
            <span className="inline-grid h-10 w-10 place-items-center rounded-xl border border-white/15 bg-gradient-to-br from-[#d5ff5f]/20 to-[#52e0d6]/20">
              <Tv size={18} className="text-[#d5ff5f]" />
            </span>
            <div>
              <p className="text-sm font-extrabold text-white">
                Install StreamZone
              </p>
              <p className="text-xs text-[#a5abb8]">iPhone / iPad</p>
            </div>
          </div>

          {/* Steps */}
          <div className="flex flex-col gap-3">
            {[
              {
                step: "1",
                text: "Tap the Share button at the bottom of Safari",
                icon: "⬆️",
              },
              {
                step: "2",
                text: 'Scroll down and tap "Add to Home Screen"',
                icon: "➕",
              },
              {
                step: "3",
                text: 'Tap "Add" — StreamZone will appear on your home screen!',
                icon: "✅",
              },
            ].map(({ step, text, icon }) => (
              <div
                key={step}
                className="flex items-start gap-3 rounded-xl border border-white/6 bg-white/3 p-3"
              >
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#d5ff5f]/15 text-xs font-black text-[#d5ff5f]">
                  {step}
                </span>
                <span className="text-xs leading-relaxed text-[#a5abb8]">
                  {icon} {text}
                </span>
              </div>
            ))}
          </div>

          <p className="mt-4 text-center text-[10px] text-[#a5abb8]/50">
            Works on Safari — use Safari browser for best results
          </p>
        </div>
      </div>
    );
  }

  // ── Main Install Banner ───────────────────────────────────────────────────
  return (
    <div className="fixed bottom-4 left-1/2 z-[100] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 sm:bottom-6 sm:left-auto sm:right-6 sm:translate-x-0">
      {/* Glow */}
      <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-[#d5ff5f]/20 to-[#52e0d6]/20 blur-sm" />

      <div className="relative flex items-start gap-3 rounded-2xl border border-white/10 bg-[#0d1117]/95 p-4 shadow-2xl backdrop-blur-xl">
        {/* App icon */}
        <div className="flex-shrink-0">
          <span className="inline-grid h-12 w-12 place-items-center rounded-xl border border-white/15 bg-gradient-to-br from-[#d5ff5f]/25 to-[#52e0d6]/25">
            <Tv size={22} className="text-[#d5ff5f]" />
          </span>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-extrabold text-white">
                Install StreamZone
              </p>
              <p className="mt-0.5 text-xs text-[#a5abb8]">
                {platform === "ios"
                  ? "Add to your Home Screen"
                  : "Install as an app — works offline"}
              </p>
            </div>
            <button
              onClick={dismiss}
              className="flex-shrink-0 inline-grid h-6 w-6 place-items-center rounded-full bg-white/5 text-[#a5abb8] transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Dismiss"
            >
              <X size={12} />
            </button>
          </div>

          {/* Feature pills */}
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {[
              { icon: Smartphone, label: "Works offline" },
              { icon: Download, label: "No app store" },
              {
                icon: platform === "ios" ? Tv : Chrome,
                label: "Instant access",
              },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-[#a5abb8]"
              >
                <Icon size={9} />
                {label}
              </span>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={handleInstall}
            disabled={installing}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#d5ff5f] to-[#52e0d6] py-2 text-sm font-extrabold text-[#08090d] transition-all duration-200 hover:opacity-90 hover:scale-[1.02] active:scale-95 disabled:opacity-60"
          >
            {installing ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#08090d]/30 border-t-[#08090d]" />
                Installing…
              </>
            ) : (
              <>
                <Download size={14} />
                {platform === "ios" ? "Show me how" : "Install App"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
