import { promises as fs } from "fs";
import path from "path";
import { FIFA_WORLD_CUP_GROUP } from "@/lib/constants";

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

const LOCAL_PLAYLIST = "football.m3u";

// Bangladesh channels from iptv-org (optional — football.m3u is the primary source)

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

// ── Channel logo matcher ──────────────────────────────────────────────────────

const CHANNEL_LOGO_MAP: Record<string, string> = {
  // Major Sports Networks
  ESPN: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/ESPN_logo.svg/512px-ESPN_logo.svg.png",
  "TNT Sports": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/TNT_Sports_logo.svg/512px-TNT_Sports_logo.svg.png",
  TyC: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/TyC_Sports_logo.svg/512px-TyC_Sports_logo.svg.png",
  "Win Sports": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Win_Sports%2B.svg/512px-Win_Sports%2B.svg.png",
  DAZN: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/DAZN_logo.svg/512px-DAZN_logo.svg.png",
  beIN: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/BeIN_Sports_logo.svg/512px-BeIN_Sports_logo.svg.png",
  "Real Madrid": "https://upload.wikimedia.org/wikipedia/en/thumb/6/6e/Real_Madrid_CF.svg/512px-Real_Madrid_CF.svg.png",
  "Fox Sports": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Fox_Sports_logo.svg/512px-Fox_Sports_logo.svg.png",
  TUDN: "https://upload.wikimedia.org/wikipedia/en/thumb/7/7f/TUDN_logo.png/512px-TUDN_logo.png",
  "Red Bull": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Red_Bull_logo.svg/512px-Red_Bull_logo.svg.png",
  Telemundo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Telemundo_logo.svg/512px-Telemundo_logo.svg.png",
  Claro: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Claro_%28company%29_logo.svg/512px-Claro_%28company%29_logo.svg.png",
  Azteca: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Azteca_7.png/512px-Azteca_7.png",
};

function getAutoLogo(channelName: string): string | undefined {
  // Try to match channel name with known logos
  for (const [key, logoUrl] of Object.entries(CHANNEL_LOGO_MAP)) {
    if (channelName.toLowerCase().includes(key.toLowerCase())) {
      return logoUrl;
    }
  }
  return undefined;
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

function normalizeGroup(raw: string) {
  if (/football world cup 2026|fifa world cup 2026/i.test(raw)) {
    return FIFA_WORLD_CUP_GROUP;
  }
  return raw.trim();
}

function inferGroup(name: string, groupTitle?: string) {
  if (groupTitle?.trim()) return normalizeGroup(groupTitle);
  const match = groupPatterns.find(([p]) => p.test(name));
  return match?.[1] ?? "Live Sports";
}

function disambiguateNames(channels: Channel[]): Channel[] {
  const totals = channels.reduce<Record<string, number>>((acc, ch) => {
    const key = `${ch.group}::${ch.name}`;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const seen = new Map<string, number>();

  return channels.map((channel) => {
    const key = `${channel.group}::${channel.name}`;
    if ((totals[key] ?? 0) <= 1) return channel;

    const index = (seen.get(key) ?? 0) + 1;
    seen.set(key, index);
    return { ...channel, name: `${channel.name} #${index}` };
  });
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
      logo: attrs["tvg-logo"] || getAutoLogo(name),
      host: parsedUrl.hostname.replace(/^www\./, ""),
    });

    currentInfo = undefined;
  }

  return channels;
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function getPlaylist(): Promise<Channel[]> {
  const localChannels = await loadLocal();
  return disambiguateNames(localChannels);
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
