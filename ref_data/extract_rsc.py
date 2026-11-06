import re, json

with open('zero_launch.html', 'r', encoding='utf-8') as f:
    html = f.read()

# check Next.js data or SSR data
next_data = re.findall(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html)
if next_data:
    data = json.loads(next_data[0])
    print("Found NEXT_DATA keys:", data.keys())
    print("page:", data.get('page'))
    with open('next_data.json', 'w', encoding='utf-8') as out:
        json.dump(data, out, indent=2, ensure_ascii=False)
else:
    print("No NEXT_DATA found (might be app router / RSC)")
    # search for self.__next_f or similar RSC payloads
    rsc = re.findall(r'self\.__next_f\.push\(\[(.*?)\]\)', html, re.DOTALL)
    print(f"Found {len(rsc)} RSC chunks")
