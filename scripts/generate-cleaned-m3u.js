#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const RESULTS_FILE = path.join(__dirname, "stream-test-results.json");
const OUTPUT_M3U = path.join(__dirname, "../Fifa world cup - cleaned.m3u");

function generateM3U(channels) {
  let m3u = "#EXTM3U\n";

  channels.forEach(({ name, url }) => {
    m3u += `#EXTINF:-1 ,${name}\n`;
    m3u += `${url}\n`;
  });

  return m3u;
}

if (!fs.existsSync(RESULTS_FILE)) {
  console.error("❌ Results file not found. Run 'npm run test:streams' first");
  process.exit(1);
}

const results = JSON.parse(fs.readFileSync(RESULTS_FILE, "utf-8"));

if (!results.workingChannels || results.workingChannels.length === 0) {
  console.error("❌ No working channels found!");
  process.exit(1);
}

const m3uContent = generateM3U(results.workingChannels);

fs.writeFileSync(OUTPUT_M3U, m3uContent);

console.log("\n✨ M3U file created successfully!");
console.log(`📄 File: Fifa world cup - cleaned.m3u`);
console.log(`📊 Channels: ${results.workingChannels.length}\n`);
console.log("Working Channels:");
results.workingChannels.forEach(({ name }, i) => {
  console.log(`  ${i + 1}. ${name}`);
});
