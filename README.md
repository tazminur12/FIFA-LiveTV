# 📺 StreamZone — Live TV

A modern, high-end **Live TV Streaming** web app built with **Next.js 15**, **React 19**, and **Tailwind CSS v4**.

> **Designed & Built by [Tazminur Rahman Tanim](https://tazminur.me)**

---

## ✨ Features

- 🎬 **Hero Carousel** — Auto-sliding featured channels with Live/HD/4K badges
- 📡 **HLS Playback** — Powered by HLS.js for smooth live streaming
- 🇧🇩 **Bangladeshi Channels** — Auto-fetched from [iptv-org](https://iptv-org.github.io/) (BTV, Jamuna, ATN News, Channel 24, NTV & more)
- 🏆 **FIFA World Cup Channels** — Local M3U playlist support
- 🔍 **Smart Search & Filter** — Search by channel name, group, region
- 📂 **Sidebar Navigation** — Collapsible sidebar with real M3U groups
- ❤️ **Favorites & Recents** — Persisted in localStorage
- 📺 **Guide View** — EPG-style channel guide
- 📱 **PWA Support** — Install on phone/desktop, offline fallback page
- 🌙 **Dark Mode** — Netflix/Hotstar-style deep dark UI
- ⚡ **Glassmorphism** — Blur effects on Navbar & Sidebar
- 🎨 **Responsive** — Mobile (1 col) → Tablet (3 col) → Desktop (6 col)

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🗂️ Project Structure

```
├── app/
│   ├── globals.css        # Global styles + Tailwind v4
│   ├── layout.tsx         # Root layout + PWA meta
│   └── page.tsx           # Home page (server component)
├── components/
│   ├── live-homepage.tsx  # Main shell — all state lives here
│   ├── navbar.tsx         # Sticky glassmorphism navbar
│   ├── sidebar.tsx        # Collapsible category sidebar
│   ├── hero-carousel.tsx  # Auto-sliding hero section
│   ├── channel-grid.tsx   # Responsive channel cards grid
│   ├── category-strip.tsx # Horizontal filter chips
│   ├── footer.tsx         # Professional footer
│   └── pwa-install-prompt.tsx  # PWA install banner
├── lib/
│   └── playlist.ts        # M3U parser + iptv-org BD fetcher
├── public/
│   ├── manifest.json      # PWA manifest
│   ├── sw.js              # Service Worker
│   ├── offline.html       # Offline fallback page
│   └── icon.svg           # App icon
└── Fifa world cup.m3u     # Local FIFA channels playlist
```

---

## 📡 Channel Sources

| Source | Channels | Auto-fetch |
|--------|----------|-----------|
| `iptv-org Bangladesh` | 50+ BD channels | ✅ Yes (1hr cache) |
| `Fifa world cup.m3u` | FIFA/Sports channels | Local file |

---

## 🛠️ Tech Stack

| Technology | Version |
|-----------|---------|
| Next.js | 15.x |
| React | 19.x |
| Tailwind CSS | 4.x |
| HLS.js | 1.5.x |
| Lucide React | 0.468.x |
| TypeScript | 5.x |

---

## 📱 PWA Installation

| Device | How to Install |
|--------|---------------|
| **Android (Chrome)** | Tap "Install App" banner |
| **iPhone (Safari)** | Share → Add to Home Screen |
| **Desktop (Chrome)** | Click install icon in address bar |

---

## 👤 Author

**Tazminur Rahman Tanim**
🌐 [tazminur.me](https://tazminur.me)
📦 [github.com/tazminur12](https://github.com/tazminur12)

---

## 📄 License

MIT — Free to use and modify.
