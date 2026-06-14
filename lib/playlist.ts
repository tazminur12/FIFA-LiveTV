import { promises as fs } from "fs";
import path from "path";

// ── Types ─────────────────────────────────────────────────────────────────────

export type Channel = {
  id: string;
  number: number;
  name: string;
  url: string;
  group: string;
  country?: string;
  quality?: string;
  logo?: string;
  host: string;
};

// ── Sources ───────────────────────────────────────────────────────────────────

const LOCAL_PLAYLIST = "Fifa world cup.m3u";

// Bangladesh channels from iptv-org (always fresh)
const BD_PLAYLIST_URL = "https://iptv-org.github.io/iptv/countries/bd.m3u";

// ── Country map ───────────────────────────────────────────────────────────────

const countryNames: Record<string, string> = {
  "🇦🇱": "Albania",
  "🇦🇷": "Argentina",
  "🇦🇹": "Austria",
  "🇧🇩": "Bangladesh",
  "🇧🇬": "Bulgaria",
  "🇧🇷": "Brazil",
  "🇨🇱": "Chile",
  "🇨🇴": "Colombia",
  "🇨🇿": "Czechia",
  "🇩🇪": "Germany",
  "🇪🇸": "Spain",
  "🇫🇷": "France",
  "🇬🇧": "United Kingdom",
  "🇭🇰": "Hong Kong",
  "🇭🇺": "Hungary",
  "🇮🇳": "India",
  "🇮🇱": "Israel",
  "🇮🇹": "Italy",
  "🇲🇴": "Macau",
  "🇲🇽": "Mexico",
  "🇳🇱": "Netherlands",
  "🇳🇴": "Norway",
  "🇵🇹": "Portugal",
  "🇶🇦": "Qatar",
  "🇷🇴": "Romania",
  "🇷🇺": "Russia",
  "🇸🇦": "Saudi Arabia",
  "🇹🇲": "Turkmenistan",
  "🇹🇷": "Turkey",
  "🇺🇦": "Ukraine",
};

// ── Group patterns for local M3U ──────────────────────────────────────────────

const groupPatterns: Array<[RegExp, string]> = [
  [/^(AR\s*\||.*\bARG\b|.*Argentina|.*🇦🇷)/i, "Argentina"],
  [/^(MX\s*\||.*Mexico|.*🇲🇽)/i, "Mexico"],
  [/^(USA\s*\||.*NBC|.*NBA|.*Fox Soccer|.*Universo)/i, "USA"],
  [/Latino|TUDN|Claro|Telemundo|Azteca|Win Sports|TyC|Tigo/i, "Latino"],
  [/ESPN/i, "ESPN"],
  [/FOX/i, "Fox"],
  [/beIN|BEIN/i, "beIN"],
  [/DAZN/i, "DAZN"],
  [/SKY|Sky/i, "Sky"],
  [/Матч|Setanta|OTT|🇷🇺/i, "Eastern Europe"],
  [/SPORT|Sports|Sport|Deportes|Futbol|Football|Golf|Liga|LALIGA/i, "Sports"],
];

// ── Bangladesh group normalizer ───────────────────────────────────────────────
// iptv-org uses English group-title values — map them to clean Bengali categories

const BD_GROUP_MAP: Record<string, string> = {
  Entertainment: "🇧🇩 Entertainment",
  General: "🇧🇩 General",
  News: "🇧🇩 News",
  Sports: "🇧🇩 Sports",
  Music: "🇧🇩 Music",
  Kids: "🇧🇩 Kids",
  Movies: "🇧🇩 Movies",
  Religious: "🇧🇩 Religious",
  Documentary: "🇧🇩 Documentary",
  Business: "🇧🇩 Business",
  Family: "🇧🇩 Family",
  Culture: "🇧🇩 Culture",
  Legislative: "🇧🇩 Legislative",
  Undefined: "🇧🇩 General",
};

function normalizeBdGroup(raw: string): string {
  // Handle composite groups like "Entertainment;Music"
  const first = raw.split(";")[0].trim();
  return BD_GROUP_MAP[first] ?? "🇧🇩 General";
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function parseAttributes(value: string) {
  const attrs: Record<string, string> = {};
  const pattern = /([\w-]+)="([^"]*)"/g;
  let m = pattern.exec(value);
  while (m) {
    attrs[m[1]] = m[2];
    m = pattern.exec(value);
  }
  return attrs;
}

function hash(value: string) {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h << 5) - h + value.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36);
}

function cleanName(value: string) {
  return value
    .replace(/^✔️\s*/u, "")
    .replace(/\s+/g, " ")
    .trim();
}

function inferCountry(name: string, isBd = false) {
  if (isBd) return "Bangladesh";
  const flag = Object.keys(countryNames).find((e) => name.includes(e));
  if (flag) return countryNames[flag];
  if (/\b(ARG|AR)\b/i.test(name)) return "Argentina";
  if (/\b(MX)\b/i.test(name)) return "Mexico";
  if (/\b(USA)\b/i.test(name)) return "USA";
  if (/Latino/i.test(name)) return "Latin America";
  return undefined;
}

function inferGroup(name: string, groupTitle?: string) {
  if (groupTitle?.trim()) return groupTitle.trim();
  const match = groupPatterns.find(([p]) => p.test(name));
  return match?.[1] ?? "Live Sports";
}

function inferQuality(name: string, url: string) {
  const q = name.match(/\b(4K|1080p|720p|480p|HD|SD)\b/i);
  if (q) return q[1].toUpperCase();
  if (/1080/i.test(url)) return "1080P";
  if (/720/i.test(url)) return "720P";
  if (/mpegts/i.test(url)) return "MPEGTS";
  return "LIVE";
}

// ── M3U parser ────────────────────────────────────────────────────────────────

function parseM3U(text: string, startIndex: number, isBd: boolean): Channel[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const channels: Channel[] = [];
  let currentInfo: string | undefined;

  for (const line of lines) {
    if (line.startsWith("#EXTINF")) {
      currentInfo = line;
      continue;
    }
    if (line.startsWith("#")) {
      continue;
    }
    if (!currentInfo || !/^https?:\/\//i.test(line)) {
      continue;
    }

    const meta = currentInfo.replace(/^#EXTINF:-?\d+\s*/i, "");
    const attrs = parseAttributes(meta);
    const [, fallback = "Untitled"] = meta.match(/,(.*)$/) ?? [];
    const name = cleanName(attrs["tvg-name"] || fallback);
    const rawGroup = attrs["group-title"] ?? "";
    const group = isBd
      ? normalizeBdGroup(rawGroup)
      : inferGroup(name, rawGroup);
    const url = line;
    const parsedUrl = new URL(url);
    const idx = startIndex + channels.length + 1;

    channels.push({
      id: `${hash(`${name}-${url}`)}-${idx}`,
      number: idx,
      name,
      url,
      group,
      country: inferCountry(name, isBd),
      quality: inferQuality(name, url),
      logo: attrs["tvg-logo"] || undefined,
      host: parsedUrl.hostname.replace(/^www\./, ""),
    });

    currentInfo = undefined;
  }

  return channels;
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function getPlaylist(): Promise<Channel[]> {
  // 1️⃣ Load local playlist
  const localChannels = await loadLocal();

  // 2️⃣ Fetch Bangladesh channels (with timeout + graceful fallback)
  const bdChannels = await loadBangladesh(localChannels.length);

  // 3️⃣ Bangladesh channels first (home channels 🇧🇩), then local
  return [...bdChannels, ...localChannels];
}

async function loadLocal(): Promise<Channel[]> {
  try {
    const filePath = path.join(process.cwd(), LOCAL_PLAYLIST);
    const text = await fs.readFile(filePath, "utf8");
    return parseM3U(text, 0, false);
  } catch {
    return [];
  }
}

async function loadBangladesh(offset: number): Promise<Channel[]> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const res = await fetch(BD_PLAYLIST_URL, {
      signal: controller.signal,
      next: { revalidate: 3600 }, // cache 1 hour — fresh enough for live TV
    });

    clearTimeout(timer);

    if (!res.ok) return [];
    const text = await res.text();
    return parseM3U(text, offset, true);
  } catch {
    // Network error or timeout — silently skip BD channels
    return [];
  }
}
