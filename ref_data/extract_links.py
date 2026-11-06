import re

with open('zero_launch.html', 'r', encoding='utf-8') as f:
    html = f.read()

links = set(re.findall(r'href=["\']([^"\']+)["\']', html))
for l in sorted(links):
    if not l.startswith('http') and not l.startswith('/_next'):
        print('Internal Link:', l)
    elif 'zero-launch' in l:
        print('Zero launch Link:', l)
