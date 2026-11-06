import urllib.request

urls = {
    'leaderboard': 'https://zero-launch.vercel.app/ko/leaderboard',
    'submit': 'https://zero-launch.vercel.app/ko/submit',
    'community': 'https://zero-launch.vercel.app/ko/community',
    'shop': 'https://zero-launch.vercel.app/ko/shop',
    'detail': 'https://zero-launch.vercel.app/ko/test/careerflow'
}

for name, url in urls.items():
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode('utf-8')
            with open(f'zero_{name}.html', 'w', encoding='utf-8') as f:
                f.write(content)
            print(f'Saved {name}: {len(content)} bytes')
    except Exception as e:
        print(f'Error fetching {name}: {e}')
