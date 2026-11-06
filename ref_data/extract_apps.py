import re

with open('zero_launch.html', 'r', encoding='utf-8') as f:
    html = f.read()

# find all occurrences of app cards or titles in html
# We saw text: 라이브브릿지, 오늘도 감정일기, zemix, 싹 - 습관 트래커, 이모지가 되는 이모지 생성기, CareerFlow, etc.

# Let's extract items from the RSC chunks
rsc_chunks = re.findall(r'self\.__next_f\.push\(\[1,"(.*?)"\]\)', html)
full_rsc = "".join(rsc_chunks).encode('utf-8').decode('unicode_escape')

print(f"Full RSC length: {len(full_rsc)}")

# Let's search for some strings
apps = re.findall(r'"title":"([^"]+)","tagline":"([^"]+)"', full_rsc)
print(f"Found {len(apps)} apps with title and tagline:")
for a in apps[:10]:
    print(a)
