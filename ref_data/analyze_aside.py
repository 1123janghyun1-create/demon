import re

with open('zero_launch.html', 'r', encoding='utf-8') as f:
    html = f.read()

aside_match = re.search(r'<aside[^>]*>(.*?)</aside>', html, re.DOTALL)
if aside_match:
    print("=== ASIDE ===")
    print(aside_match.group(0)[:2000])
