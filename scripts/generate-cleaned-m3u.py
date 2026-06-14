#!/usr/bin/env python3

import json
from pathlib import Path

RESULTS_FILE = Path(__file__).parent / "stream-test-results.json"
OUTPUT_M3U = Path(__file__).parent.parent / "Fifa world cup - CLEANED.m3u"

def generate_m3u(channels):
    """Generate M3U content from channels list"""
    m3u = "#EXTM3U\n"
    for channel in channels:
        m3u += f"#EXTINF:-1 ,{channel['name']}\n"
        m3u += f"{channel['url']}\n"
    return m3u

# Load results
with open(RESULTS_FILE, 'r') as f:
    results = json.load(f)

working_channels = results.get("workingChannels", [])

if not working_channels:
    print("❌ No working channels found!")
    exit(1)

# Generate M3U
m3u_content = generate_m3u(working_channels)

# Write to file
OUTPUT_M3U.write_text(m3u_content)

print("\n" + "="*70)
print("✨ NEW M3U FILE CREATED!")
print("="*70)
print(f"\n📄 File: {OUTPUT_M3U.name}")
print(f"📊 Total channels: {len(working_channels)}")
print(f"✅ All channels are working!")

print(f"\n📋 Channel List ({len(working_channels)} working channels):\n")
for idx, ch in enumerate(working_channels, 1):
    print(f"   {idx:3}. {ch['name']}")

print("\n" + "="*70)
print(f"✅ Ready to use! Load the file: {OUTPUT_M3U.name}")
print("="*70 + "\n")
