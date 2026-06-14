#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");

const M3U_FILE = path.join(__dirname, "../Fifa world cup.m3u");

function parseM3U(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const channels = [];
  let currentName = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith("#EXTINF:-1")) {
      const match = line.match(/,(.+)$/);
      currentName = match ? match[1].trim() : `Channel ${i}`;
    } else if (line && !line.startsWith("#") && currentName) {
      channels.push({
        name: currentName,
        url: line,
      });
      currentName = "";
    }
  }

  return channels;
}

function testStream(url, timeout = 3000) {
  return new Promise((resolve) => {
    const protocol = url.startsWith("https") ? https : http;
    let isResolved = false;

    const timeoutHandle = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        resolve(false);
      }
    }, timeout);

    try {
      const request = protocol.get(
        url,
        { timeout, headers: { "User-Agent": "Mozilla/5.0" } },
        (response) => {
          if (!isResolved) {
            isResolved = true;
            clearTimeout(timeoutHandle);
            resolve(response.statusCode >= 200 && response.statusCode < 400);
            response.destroy();
          }
        }
      );

      request.on("error", () => {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeoutHandle);
          resolve(false);
        }
      });

      request.on("timeout", () => {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeoutHandle);
          request.destroy();
          resolve(false);
        }
      });
    } catch (e) {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timeoutHandle);
        resolve(false);
      }
    }
  });
}

async function testAllStreams() {
  const channels = parseM3U(M3U_FILE);
  const workingChannels = [];
  const failedChannels = [];

  console.log(`\n🔍 Testing ${channels.length} channels (timeout: 3 seconds per channel)...\n`);

  // Test streams with concurrency limit
  const concurrency = 5;
  for (let i = 0; i < channels.length; i += concurrency) {
    const batch = channels.slice(i, i + concurrency);
    const promises = batch.map(async (channel, idx) => {
      const currentIndex = i + idx + 1;
      process.stdout.write(
        `[${currentIndex}/${channels.length}] ${channel.name.substring(0, 40).padEnd(40)}... `
      );

      const isWorking = await testStream(channel.url);
      console.log(isWorking ? "✅" : "❌");

      return { channel, isWorking };
    });

    const results = await Promise.all(promises);
    results.forEach(({ channel, isWorking }) => {
      if (isWorking) {
        workingChannels.push(channel);
      } else {
        failedChannels.push(channel);
      }
    });
  }

  console.log("\n" + "=".repeat(70));
  console.log(`\n✅ Working: ${workingChannels.length} | ❌ Failed: ${failedChannels.length}\n`);

  // Save results
  const results = {
    timestamp: new Date().toISOString(),
    total: channels.length,
    working: workingChannels.length,
    failed: failedChannels.length,
    workingChannels,
    failedChannels,
  };

  fs.writeFileSync(
    path.join(__dirname, "stream-test-results.json"),
    JSON.stringify(results, null, 2)
  );

  console.log("📊 Results saved to: scripts/stream-test-results.json");
  console.log("\n📋 Working Channels List:");
  workingChannels.forEach((ch, idx) => {
    console.log(`   ${idx + 1}. ${ch.name}`);
  });

  return results;
}

testAllStreams().catch(console.error);
