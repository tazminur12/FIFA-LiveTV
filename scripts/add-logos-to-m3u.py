#!/usr/bin/env python3

import re
import json
from pathlib import Path
from typing import Dict, List, Tuple

# Logo URLs for popular sports channels
CHANNEL_LOGOS: Dict[str, str] = {
    # Argentine
    "TNT Sports": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/TNT_Sports_logo.svg/512px-TNT_Sports_logo.svg.png",
    "TyC Sports": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/TyC_Sports_logo.svg/512px-TyC_Sports_logo.svg.png",
    "ESPN ARG": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/ESPN_logo.svg/512px-ESPN_logo.svg.png",
    "ESPN": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/ESPN_logo.svg/512px-ESPN_logo.svg.png",
    
    # Win Sports
    "Win Sports": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Win_Sports%2B.svg/512px-Win_Sports%2B.svg.png",
    
    # DAZN
    "DAZN": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/DAZN_logo.svg/512px-DAZN_logo.svg.png",
    
    # beIN Sports
    "BEIN": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/BeIN_Sports_logo.svg/512px-BeIN_Sports_logo.svg.png",
    "Bein": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/BeIN_Sports_logo.svg/512px-BeIN_Sports_logo.svg.png",
    
    # Real Madrid TV
    "REAL MADRID": "https://upload.wikimedia.org/wikipedia/en/thumb/6/6e/Real_Madrid_CF.svg/512px-Real_Madrid_CF.svg.png",
    
    # Fox Sports
    "FOX SPORTS": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Fox_Sports_logo.svg/512px-Fox_Sports_logo.svg.png",
    "FOX": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Fox_Sports_logo.svg/512px-Fox_Sports_logo.svg.png",
    
    # TUDN
    "TUDN": "https://upload.wikimedia.org/wikipedia/en/thumb/7/7f/TUDN_logo.png/512px-TUDN_logo.png",
}

def get_channel_logo(channel_name: str) -> str:
    """Find logo for a channel by name matching"""
    for key, logo_url in CHANNEL_LOGOS.items():
        if key.lower() in channel_name.lower():
            return logo_url
    return ""

def parse_m3u_with_logos(input_file: Path) -> List[Tuple[str, str, str]]:
    """Parse M3U and return (name, url, logo) tuples"""
    channels = []
    
    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        
        if line.startswith("#EXTINF"):
            # Extract channel name
            match = re.search(r',(.+)$', line)
            if match:
                channel_name = match.group(1).strip()
                
                # Check if there's a URL on the next line
                if i + 1 < len(lines):
                    url_line = lines[i + 1].strip()
                    if url_line and url_line.startswith(('http://', 'https://')):
                        logo = get_channel_logo(channel_name)
                        channels.append((channel_name, url_line, logo))
                        i += 2
                        continue
        
        i += 1
    
    return channels

def generate_m3u_with_logos(channels: List[Tuple[str, str, str]]) -> str:
    """Generate M3U content with tvg-logo attributes"""
    m3u = "#EXTM3U tvg-version=\"1\" cache=120\n"
    
    for idx, (name, url, logo) in enumerate(channels, 1):
        extinf_line = f'#EXTINF:-1 tvg-id="ch{idx}" tvg-name="{name}"'
        
        if logo:
            extinf_line += f' tvg-logo="{logo}"'
        
        extinf_line += f' group-title="Football",'
        extinf_line += name
        
        m3u += f"{extinf_line}\n"
        m3u += f"{url}\n"
    
    return m3u

def main():
    input_file = Path(__file__).parent.parent / "Fifa world cup - CLEANED.m3u"
    output_file = Path(__file__).parent.parent / "Fifa world cup - WITH-LOGOS.m3u"
    
    if not input_file.exists():
        print(f"❌ Input file not found: {input_file}")
        return
    
    print(f"📖 Reading: {input_file.name}")
    channels = parse_m3u_with_logos(input_file)
    
    print(f"✨ Processing {len(channels)} channels...")
    
    # Count channels with logos
    with_logos = sum(1 for _, _, logo in channels if logo)
    print(f"   ✅ With logos: {with_logos}")
    print(f"   ⚠️  Without logos: {len(channels) - with_logos}")
    
    # Generate M3U
    m3u_content = generate_m3u_with_logos(channels)
    
    # Write output
    output_file.write_text(m3u_content)
    
    print(f"\n📄 Output: {output_file.name}")
    print(f"📊 Total channels: {len(channels)}")
    
    # Show some samples
    print(f"\n📋 Sample channels:")
    for name, url, logo in channels[:5]:
        logo_status = "✅" if logo else "❌"
        print(f"   {logo_status} {name}")

if __name__ == "__main__":
    main()
