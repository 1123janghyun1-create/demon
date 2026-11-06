from bs4 import BeautifulSoup

with open('zero_launch.html', 'r', encoding='utf-8') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')

print('Header:')
header = soup.find('header')
if header:
    print(header.prettify()[:1000])

print('\nNav:')
nav = soup.find('nav')
if nav:
    print(nav.prettify()[:1000])

print('\nMain class/id:')
main = soup.find('main')
if main:
    print(main.get('class'))
    # list direct children
    print('Children of main:', [c.name for c in main.children if c.name])

# find footer
footer = soup.find('footer')
if footer:
    print('\nFooter:')
    print(footer.prettify()[:1000])
