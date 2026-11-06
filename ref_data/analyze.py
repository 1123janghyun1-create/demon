import re

with open('zero_launch.html', 'r', encoding='utf-8') as f:
    content = f.read()

print('Length:', len(content))
scripts = re.findall(r'<script[^>]*src=["\']([^"\']+)["\']', content)
print('Scripts count:', len(scripts))
for s in scripts[:5]:
    print('Script:', s)

css = re.findall(r'<link[^>]*href=["\']([^"\']+\.css[^"\']*)["\']', content)
print('CSS count:', len(css))
for c in css:
    print('CSS:', c)

title = re.findall(r'<title>(.*?)</title>', content)
print('Title:', title)

# Look for visible text / header / nav
from html.parser import HTMLParser

class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text = []
        self.ignore = False
    def handle_starttag(self, tag, attrs):
        if tag in ['script', 'style', 'svg']:
            self.ignore = True
    def handle_endtag(self, tag):
        if tag in ['script', 'style', 'svg']:
            self.ignore = False
    def handle_data(self, data):
        if not self.ignore:
            stripped = data.strip()
            if stripped:
                self.text.append(stripped)

parser = TextExtractor()
parser.feed(content)
print("\n--- FIRST 50 TEXT ITEMS ---")
for t in parser.text[:50]:
    print(t)
