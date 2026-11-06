import re
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

for name in ['leaderboard', 'submit', 'community', 'shop', 'detail']:
    with open(f'zero_{name}.html', 'r', encoding='utf-8') as f:
        content = f.read()
    parser = TextExtractor()
    parser.feed(content)
    print(f'=== {name.upper()} (Total texts: {len(parser.text)}) ===')
    print(' / '.join(parser.text[:40]))
    print('\n' + '='*50 + '\n')
