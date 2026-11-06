import re, json

with open("ref_data/zero_community.html", "r", encoding="utf-8") as f:
    comm_html = f.read()

# find community posts
# Look for author names, time, tags, titles, bodies
posts = [
    {
        "id": "c1",
        "author": "focus RPG",
        "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
        "timeAgo": "6시간 전",
        "tag": "런치",
        "title": "한글공부 런칭했어요 🚀",
        "content": "자음을 모음에 끌어 합치면 소리가 나요! 방금 demon에 런칭했습니다. 많은 응원과 피드백 부탁드려요!",
        "linkedApp": {
            "title": "한글공부",
            "tagline": "자음을 모음에 끌어 합치면 소리가 나요!",
            "icon": "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=120&auto=format&fit=crop&q=80"
        },
        "likes": 5,
        "comments": 2
    },
    {
        "id": "c2",
        "author": "focus RPG",
        "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
        "timeAgo": "16시간 전",
        "tag": "런치",
        "title": "Voice Fun Changer 런칭했어요 🚀",
        "content": "실시간 마이크 입력으로 재밌는 목소리 변조를 경험해보세요. 디스코드 통화용으로도 딱입니다!",
        "linkedApp": {
            "title": "Voice Fun Changer",
            "tagline": "재밌는 목소리로 실시간 변조",
            "icon": "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=120&auto=format&fit=crop&q=80"
        },
        "likes": 8,
        "comments": 4
    },
    {
        "id": "c3",
        "author": "김민기",
        "avatar": "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80",
        "timeAgo": "1일 전",
        "tag": "질문",
        "title": "첫 런칭 후 유저 피드백 반영할 때 어떤 순서로 하시나요?",
        "content": "초기 테스터분들이 주신 버그 제보와 기능 제안이 15건 정도 쌓였는데, 다들 치명적 버그 우선 -> UI 개선 순으로 가시나요?",
        "likes": 12,
        "comments": 7
    },
    {
        "id": "c4",
        "author": "yubin hong",
        "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
        "timeAgo": "2일 전",
        "tag": "팁",
        "title": "크레딧 4개 벌면서 느낀 좋은 테스터 피드백 작성법",
        "content": "단순히 '좋아요' 대신 브라우저 환경(크롬/사파리)과 구체적인 클릭 경로를 적어주면 메이커분들이 바로 수락해주시더라구요!",
        "likes": 24,
        "comments": 9
    }
]

with open("community_data.json", "w", encoding="utf-8") as f:
    json.dump(posts, f, ensure_ascii=False, indent=2)

leaderboard = [
    {"rank": 1, "name": "yubin hong", "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80", "accepted": 4, "credits": 4, "badge": "🥇 1위"},
    {"rank": 2, "name": "홍산", "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80", "accepted": 2, "credits": 2, "badge": "🥈 2위"},
    {"rank": 3, "name": "김민기", "avatar": "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80", "accepted": 1, "credits": 1, "badge": "🥉 3위"},
    {"rank": 4, "name": "Muffins Mini", "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80", "accepted": 1, "credits": 1, "badge": ""},
    {"rank": 5, "name": "데몬빌더", "avatar": "demon-mascot.png", "accepted": 1, "credits": 1, "badge": ""}
]

with open("leaderboard_data.json", "w", encoding="utf-8") as f:
    json.dump(leaderboard, f, ensure_ascii=False, indent=2)

quotes = [
    {"text": "무엇이든 해내기 전까지는 항상 불가능해 보인다.", "author": "넬슨 만델라"},
    {"text": "완벽함이란 더 이상 보탤 것이 없을 때가 아니라, 더 이상 뺄 것이 없을 때 완성된다.", "author": "생텍쥐페리"},
    {"text": "작은 기회로부터 종종 위대한 업적이 시작된다.", "author": "데모스테네스"},
    {"text": "빨리 가고 싶으면 혼자 가고, 멀리 가고 싶으면 함께 가라.", "author": "아프리카 속담"},
    {"text": "오늘 시작하지 않은 일은 내일 끝낼 수 없다.", "author": "괴테"}
]

with open("quotes_data.json", "w", encoding="utf-8") as f:
    json.dump(quotes, f, ensure_ascii=False, indent=2)

print("Generated community, leaderboard, quotes data!")
