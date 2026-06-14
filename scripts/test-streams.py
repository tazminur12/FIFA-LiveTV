#!/usr/bin/env python3

import urllib.request
import urllib.error
import socket
import sys
from pathlib import Path
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
import time

M3U_FILE = Path(__file__).parent.parent / "Fifa world cup.m3u"

def parse_m3u(filepath):
    """Parse M3U file and return list of channels"""
    channels = []
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    current_name = ""
    for line in lines:
        line = line.strip()
        if line.startswith("#EXTINF:-1"):
            # Extract channel name
            if "," in line:
                current_name = line.split(",", 1)[1]
        elif line and not line.startswith("#") and current_name:
            channels.append({
                "name": current_name,
                "url": line
            })
            current_name = ""
    
    return channels

def test_stream(channel, timeout=2):
    """Test if a stream URL is accessible"""
    try:
        req = urllib.request.Request(
            channel['url'],
            headers={'User-Agent': 'Mozilla/5.0'}
        )
        socket.setdefaulttimeout(timeout)
        response = urllib.request.urlopen(req, timeout=timeout)
        return channel, True
    except:
        return channel, False

def test_all_streams():
    """Test all streams in parallel"""
    channels = parse_m3u(M3U_FILE)
    working = []
    failed = []
    
    print(f"\n🔍 Testing {len(channels)} channels...\n")
    
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(test_stream, ch): idx for idx, ch in enumerate(channels)}
        
        for idx, future in enumerate(as_completed(futures), 1):
            channel, is_working = future.result()
            name = channel['name'][:50].ljust(50)
            status = "✅" if is_working else "❌"
            print(f"[{idx}/{len(channels)}] {name} {status}")
            
            if is_working:
                working.append(channel)
            else:
                failed.append(channel)
    
    print("\n" + "="*70)
    print(f"\n✅ Working: {len(working)} | ❌ Failed: {len(failed)}\n")
    
    # Save results
    results = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "total": len(channels),
        "working": len(working),
        "failed": len(failed),
        "workingChannels": working,
        "failedChannels": failed
    }
    
    output_file = Path(__file__).parent / "stream-test-results.json"
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"📊 Results saved to: scripts/stream-test-results.json")
    print(f"\n📋 Working Channels ({len(working)}):")
    for idx, ch in enumerate(working, 1):
        print(f"   {idx}. {ch['name']}")
    
    return results

if __name__ == "__main__":
    test_all_streams()
