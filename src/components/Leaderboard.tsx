import React from 'react';
import { Trophy, MessageSquare } from 'lucide-react';
import { useApp } from '../AppContext';

export const Leaderboard: React.FC = () => {
  const { leaderboard, setCurrentTab } = useApp();

  return (
    <div className="mx-auto w-full max-w-[820px]">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-fg flex items-center gap-2">
          <span>리더보드</span>
          <Trophy className="h-6 w-6 text-amber-500" />
        </h1>
        <p className="mt-2 text-sm text-fg-muted leading-relaxed">
          다른 메이커의 앱을 테스트하고 피드백을 남긴 열정적인 테스터 랭킹입니다.
        </p>
      </div>

      {leaderboard.length === 0 ? (
        <div className="rounded-card border border-dashed border-border bg-surface p-12 text-center flex flex-col items-center">
          <div className="size-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
            <Trophy className="w-8 h-8" />
          </div>
          <h2 className="text-base font-bold text-fg">아직 리더보드 순위가 없습니다.</h2>
          <p className="mt-1 text-xs text-fg-muted max-w-[340px]">
            등록된 앱을 직접 테스트하고 첫 번째 피드백을 남겨 리더보드 1위에 이름을 올려보세요!
          </p>
          <button
            onClick={() => setCurrentTab('test')}
            className="mt-5 rounded-btn bg-accent px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-accent-hover"
          >
            앱 둘러보기
          </button>
        </div>
      ) : (
        <>
          {/* Top 3 Podium Highlight */}
          <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {leaderboard.slice(0, 3).map((user, idx) => {
              const colors = [
                'border-amber-400/50 bg-amber-500/5',
                'border-slate-300/60 bg-slate-400/5',
                'border-amber-700/40 bg-amber-700/5'
              ];
              const badgeTexts = ['🥇 1위', '🥈 2위', '🥉 3위'];
              return (
                <div
                  key={user.name}
                  className={`flex flex-col items-center justify-center p-5 rounded-card border ${colors[idx]} shadow-card text-center`}
                >
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-pill bg-surface border border-border mb-3">
                    {badgeTexts[idx]}
                  </span>
                  <div className="relative mb-2">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-14 h-14 rounded-full object-cover ring-2 ring-border"
                    />
                  </div>
                  <h3 className="text-base font-bold text-fg">{user.name}</h3>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-accent font-bold">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>피드백 {user.feedbackCount}건</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Full Leaderboard Table */}
          <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
            <div className="grid grid-cols-12 border-b border-border bg-surface-2 px-5 py-3 text-xs font-bold text-fg-muted">
              <div className="col-span-2">순위</div>
              <div className="col-span-7">메이커 / 테스터</div>
              <div className="col-span-3 text-right">남긴 피드백 수</div>
            </div>

            <div className="divide-y divide-border">
              {leaderboard.map((user) => (
                <div
                  key={user.name}
                  className="grid grid-cols-12 items-center px-5 py-3.5 text-sm transition-colors hover:bg-surface-2"
                >
                  <div className="col-span-2 font-bold text-fg flex items-center gap-1.5">
                    {user.rank === 1 && <span className="text-amber-500 font-extrabold">1</span>}
                    {user.rank === 2 && <span className="text-slate-400 font-extrabold">2</span>}
                    {user.rank === 3 && <span className="text-amber-700 font-extrabold">3</span>}
                    {user.rank > 3 && <span className="text-fg-muted">{user.rank}</span>}
                  </div>

                  <div className="col-span-7 flex items-center gap-3">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="size-8 rounded-full object-cover"
                    />
                    <span className="font-semibold text-fg">{user.name}</span>
                  </div>

                  <div className="col-span-3 text-right">
                    <span className="inline-flex items-center gap-1 font-bold text-accent text-xs">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {user.feedbackCount}건
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
