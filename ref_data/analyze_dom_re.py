import re

with open('zero_launch.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Header content
header_match = re.search(r'<header[^>]*>(.*?)</header>', html, re.DOTALL)
if header_match:
    print("=== HEADER ===")
    print(header_match.group(0)[:1200])

# Navigation
nav_match = re.search(r'<nav[^>]*>(.*?)</nav>', html, re.DOTALL)
if nav_match:
    print("\n=== NAV ===")
    print(nav_match.group(0)[:1200])

# Main section
main_match = re.search(r'<main[^>]*>(.*?)</main>', html, re.DOTALL)
if main_match:
    print("\n=== MAIN (preview) ===")
    print(main_match.group(0)[:1500])

# Footer
footer_match = re.search(r'<footer[^>]*>(.*?)</footer', html, re.DOTALL)
if footer_match:
    print("\n=== FOOTER ===")
    print(footer_match.group(0)[:1200])
else:
    print("\nNo <footer> found")
