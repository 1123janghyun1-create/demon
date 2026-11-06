import re, json

with open('zero_launch.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Let's find all app data items
# Look for pattern href="/ko/test/..."
pattern = r'href\\":\\"/ko/test/([^\\"]+)\\"'
slugs = list(dict.fromkeys(re.findall(pattern, html)))
print(f"Total slugs: {len(slugs)}")
print("Slugs:", slugs)
