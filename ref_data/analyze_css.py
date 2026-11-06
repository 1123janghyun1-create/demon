with open('zero_launch.css', 'r', encoding='utf-8') as f:
    css = f.read()

import re
colors = re.findall(r'#([0-9a-fA-F]{3,8})', css)
print('Total hex colors found:', len(colors))
from collections import Counter
common_colors = Counter(colors).most_common(20)
print('Common colors:')
for c, count in common_colors:
    print(f'#{c}: {count}')

# fonts
fonts = re.findall(r'font-family:[^;]+', css)
print('Fonts:', set(fonts[:10]))
