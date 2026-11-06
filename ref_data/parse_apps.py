import re, json

with open('zero_launch.html', 'r', encoding='utf-8') as f:
    html = f.read()

chunks = html.split('href\\":\\"/ko/test/')
apps = []
seen = set()

for c in chunks[1:]:
    slug = c.split('\\"')[0]
    if slug in seen:
        continue
    seen.add(slug)
    
    # img src
    img_match = re.search(r'\\"src\\":\\"([^\\"]+)\\"', c[:1000])
    img = img_match.group(1) if img_match else ""
    
    # title
    title_match = re.search(r'\\"children\\":\\"([^\\"]{1,40})\\"', c[:800])
    title = title_match.group(1) if title_match else slug
    
    # tagline
    # look for korean text or description
    tag_matches = re.findall(r'\\"children\\":\\"([^\\"]{10,120})\\"', c[:2000])
    tagline = ""
    for tm in tag_matches:
        if tm != title and "http" not in tm and "icon" not in tm:
            tagline = tm
            break
            
    # count
    cnt_match = re.search(r'\\"children\\":([0-9]+)', c[:2000])
    count = int(cnt_match.group(1)) if cnt_match else 0
    
    apps.append({
        'slug': slug,
        'title': title,
        'tagline': tagline,
        'img': img,
        'feedbackCount': count,
        'credits': 1
    })

print(f"Extracted {len(apps)} apps:")
for a in apps[:5]:
    print(a)

with open('apps_data.json', 'w', encoding='utf-8') as f:
    json.dump(apps, f, ensure_ascii=False, indent=2)
