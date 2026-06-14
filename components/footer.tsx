"use client";

import {
  Code2,
  ExternalLink,
  Github,
  Globe,
  Heart,
  Radio,
  Shield,
  Tv,
  Zap,
} from "lucide-react";

type FooterProps = {
  channelCount: number;
};

const LINKS = {
  product: [
    { label: "Browse Channels", href: "#" },
    { label: "Live Guide", href: "#" },
    { label: "Favorites", href: "#" },
    { label: "Recently Watched", href: "#" },
  ],
  categories: [
    { label: "Live Sports", href: "#" },
    { label: "News", href: "#" },
    { label: "Entertainment", href: "#" },
    { label: "International", href: "#" },
  ],
  tech: [
    { label: "HLS.js", href: "https://github.com/video-dev/hls.js" },
    { label: "Next.js 15", href: "https://nextjs.org" },
    { label: "Tailwind CSS v4", href: "https://tailwindcss.com" },
    { label: "Lucide Icons", href: "https://lucide.dev" },
  ],
};

const STATS = [
  { label: "Uptime", value: "99.9%", icon: Zap },
  { label: "Quality", value: "HD / 4K", icon: Shield },
  { label: "Protocol", value: "HLS", icon: Radio },
];

export function Footer({ channelCount }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-white/5">
      {/* ── Top glow line ── */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#d5ff5f]/30 to-transparent" />

      <div className="mx-auto max-w-[1800px] px-4 sm:px-6">

        {/* ── Main footer body ── */}
        <div className="grid grid-cols-1 gap-10 py-12 md:grid-cols-2 lg:grid-cols-4">

          {/* ── Brand column ── */}
          <div className="flex flex-col gap-5">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <span className="inline-grid h-9 w-9 place-items-center rounded-xl border border-white/15 bg-gradient-to-br from-[#d5ff5f]/20 to-[#52e0d6]/20">
                <Tv size={17} className="text-[#d5ff5f]" />
              </span>
              <span className="text-base font-extrabold tracking-tight text-white">
                Stream<span className="bg-gradient-to-r from-[#d5ff5f] to-[#52e0d6] bg-clip-text text-transparent">Zone</span>
              </span>
            </div>

            {/* Tagline */}
            <p className="text-sm leading-relaxed text-[#a5abb8]">
              Premium live TV streaming — sports, news, entertainment and more,
              all powered by your own M3U playlist.
            </p>

            {/* Live status pill */}
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#ff4f6d]/20 bg-[#ff4f6d]/8 px-3 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff4f6d] opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#ff4f6d]" />
              </span>
              <span className="text-xs font-bold text-[#ff4f6d]">
                {channelCount} Channels Broadcasting
              </span>
            </div>

            {/* Stats row */}
            <div className="flex gap-4">
              {STATS.map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex flex-col gap-1">
                  <div className="flex items-center gap-1 text-[#a5abb8]">
                    <Icon size={11} />
                    <span className="text-[10px] uppercase tracking-wider">{label}</span>
                  </div>
                  <span className="text-sm font-bold text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Product links ── */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#d5ff5f]">
              Product
            </h3>
            <ul className="flex flex-col gap-2.5">
              {LINKS.product.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    className="group flex items-center gap-2 text-sm text-[#a5abb8] transition-colors duration-200 hover:text-white"
                  >
                    <span className="h-px w-3 rounded-full bg-[#a5abb8]/40 transition-all duration-200 group-hover:w-5 group-hover:bg-[#d5ff5f]" />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Categories links ── */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#d5ff5f]">
              Categories
            </h3>
            <ul className="flex flex-col gap-2.5">
              {LINKS.categories.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    className="group flex items-center gap-2 text-sm text-[#a5abb8] transition-colors duration-200 hover:text-white"
                  >
                    <span className="h-px w-3 rounded-full bg-[#a5abb8]/40 transition-all duration-200 group-hover:w-5 group-hover:bg-[#d5ff5f]" />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Tech stack ── */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#d5ff5f]">
              Built With
            </h3>
            <ul className="flex flex-col gap-2.5">
              {LINKS.tech.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2 text-sm text-[#a5abb8] transition-colors duration-200 hover:text-white"
                  >
                    <span className="h-px w-3 rounded-full bg-[#a5abb8]/40 transition-all duration-200 group-hover:w-5 group-hover:bg-[#52e0d6]" />
                    {label}
                    <ExternalLink
                      size={10}
                      className="opacity-0 transition-opacity duration-200 group-hover:opacity-60"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/8 to-transparent" />

        {/* ── Bottom bar ── */}
        <div className="flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">

          {/* Left — copyright */}
          <p className="text-xs text-[#a5abb8]">
            © {year}{" "}
            <span className="font-semibold text-white">StreamZone</span>.
            All rights reserved.
          </p>

          {/* Centre — Developer credit ✨ */}
          <div className="flex items-center gap-2 rounded-full border border-white/8 bg-white/3 px-4 py-2 backdrop-blur-sm">
            <Code2 size={13} className="text-[#52e0d6]" />
            <span className="text-xs text-[#a5abb8]">Designed & Built by</span>
            <a
              href="https://tazminur.me"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-1.5 font-bold text-white transition-colors duration-200 hover:text-[#d5ff5f] text-xs"
            >
              <span className="bg-gradient-to-r from-[#d5ff5f] to-[#52e0d6] bg-clip-text text-transparent font-extrabold">
                Tazminur Rahman Tanim
              </span>
              <ExternalLink
                size={10}
                className="text-[#a5abb8] transition-all duration-200 group-hover:text-[#d5ff5f] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </a>
          </div>

          {/* Right — made with love */}
          <div className="flex items-center gap-1.5 text-xs text-[#a5abb8]">
            <span>Made with</span>
            <Heart size={12} className="text-[#ff4f6d] fill-[#ff4f6d] animate-pulse" />
            <span>in Bangladesh</span>
            <span className="ml-1">🇧🇩</span>
          </div>
        </div>

      </div>

      {/* ── Bottom glow ── */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#52e0d6]/20 to-transparent" />
    </footer>
  );
}
