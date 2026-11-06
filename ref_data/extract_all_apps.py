import re, json

with open('zero_launch.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Let's find each app block in html
# A card typically contains href=\"/ko/test/SLUG\", img src=\"...\", title, tagline
apps = []
card_pattern = re.compile(
    r'href\\":\\"/ko/test/(?P<slug>[^\\"]+)\\"(?:.*?)\\"src\\":\\"(?P<img_src>[^\\"]+)\\"(?:.*?)\\"children\\":\\"(?P<title>[^\\"]+)\\"(?:.*?)\\"children\\":\\"(?P<tagline>[^\\"]+)\\"(?:.*?)\\"children\\":\\[(?P<count>[0-9]+)',
    re.DOTALL
)

for m in card_pattern.finditer(html):
    d = m.groupdict()
    apps.append(d)

print(f"Matched {len(apps)} apps via strict regex")

if len(apps) < 15:
    # Let's inspect smaller patterns
    # Find all img src, title, tagline occurrences
    chunks = html.split('href\\":\\"/ko/test/')
    print(f"Total chunks: {len(chunks)}")
    apps = []
    for c in chunks[1:]:
        slug = c.split('\\"')[0]
        # find img src
        img_match = re.search(r'\\"src\\":\\"([^\\"]+)\\"', c[:1000])
        img = img_match.group(1) if img_match else ""
        # find title and tagline
        # Usually: ["$", "h2", null, {"className": "...", "children": "TITLE"}]
        title_match = re.search(r'\\"h2\\"[^}]+{\\"className\\":\\"[^\\"]+\\",\\"children\\":\\"([^\\"]+)\\"', c[:1000])
        if not title_match:
            title_match = re.search(r'\\"h3\\"[^}]+{\\"className\\":\\"[^\\"]+\\",\\"children\\":\\"([^\\"]+)\\"', c[:1000])
        title = title_match.group(1) if title_match else slug
        
        # tagline
        tagline_match = re.search(r'\\"p\\"[^}]+{\\"className\\":\\"[^\\"]+\\",\\"children\\":\\"([^\\"]+)\\"', c[:1500])
        tagline = tagline_match.group(1) if tagline_match else ""
        
        # feedback count
        fb_match = re.search(r'aria-label\\":\\"피드백\\"[^0-9]*([0-9]+)', c[:2000])
        if not fb_match:
            fb_match = re.search(r'\\"children\\":([0-9]+)', c[:2000])
        count = int(fb_match.group(1)) if fb_match else 0
        
        # credits
        cred_match = re.search(r'\+([0-9]+)\s*크레딧', c[:2000])
        credits = int(cred_match.group(1)) if cred_match else 1
        
        apps.append({
            'slug': slug,
            'title': title,
            'tagline': tagline,
            'img': img,
            'feedbackCount': count,
            'credits': credits
        })

print(f"Extracted {len(apps)} apps:")
for a in apps[:8]:
    print(a)

with open('apps_data.json', 'w', encoding='utf-8') as f:
    json.dump(apps, f, ensure_ascii=False, indent=2)
