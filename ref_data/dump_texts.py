from html.parser import HTMLParser
import json

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

with open('zero_launch.html', 'r', encoding='utf-8') as f:
    html = f.read()

p = TextExtractor()
p.feed(html)

with open('extracted_texts.txt', 'w', encoding='utf-8') as f:
    for t in p.text:
        f.write(t + '\n')

print(f"Total extracted texts: {len(p.text)}")
