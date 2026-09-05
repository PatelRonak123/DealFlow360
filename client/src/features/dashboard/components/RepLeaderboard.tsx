import React from 'react';
import toast from 'react-hot-toast';
import { TeamRep } from '../types';

interface RepLeaderboardProps {
  reps: TeamRep[];
}

export const RepLeaderboard: React.FC<RepLeaderboardProps> = ({ reps }) => {
  return (
    <div className="rounded-3xl border border-[#e7ebf7] bg-white p-6 shadow-[0_8px_24px_rgba(64,86,145,0.05)]">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#17213a]">Sales Representative Performance</h2>
          <p className="text-xs text-[#59657d]">Rep quota progress, active deal volume, and discount discipline.</p>
        </div>
        <button
          onClick={() => toast('Exporting rep analytics data...')}
          className="text-xs font-bold text-[#3568ed] hover:underline"
        >
          View Full Team
        </button>
      </div>

      <div className="space-y-4">
        {reps.map((rep) => (
          <div
            key={rep.name}
            className="flex flex-col justify-between gap-3 rounded-2xl border border-[#f0f3fa] p-4 transition hover:border-[#d9e2f5] hover:bg-[#fafcff] sm:flex-row sm:items-center"
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold ${rep.avatarBg}`}>
                {rep.name.split(' ').map((n) => n[0]).join('')}
              </div>
              <div>
                <p className="text-sm font-bold text-[#17213a]">{rep.name}</p>
                <p className="text-xs text-[#8491aa]">{rep.role} • {rep.activeQuotes} active quotes</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* Quota bar */}
              <div className="w-28 text-left">
                <div className="flex justify-between text-[11px] font-semibold">
                  <span className="text-[#59657d]">Target</span>
                  <span className="text-[#17213a]">{rep.quotaPercent}%</span>
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full ${
                      rep.quotaPercent >= 85
                        ? 'bg-emerald-500'
                        : rep.quotaPercent >= 75
                        ? 'bg-blue-500'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${rep.quotaPercent}%` }}
                  />
                </div>
                <span className="text-[10px] text-[#8491aa]">{rep.quotaAchieved}</span>
              </div>

              {/* Avg Discount */}
              <div className="text-right">
                <span className="text-[10px] font-semibold text-[#8491aa] block">Avg Discount</span>
                <span
                  className={`inline-block rounded px-1.5 py-0.5 text-xs font-bold ${
                    rep.avgDiscount > 14
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {rep.avgDiscount}%
                </span>
              </div>

              {/* Win rate */}
              <div className="text-right">
                <span className="text-[10px] font-semibold text-[#8491aa] block">Win Rate</span>
                <span className="text-xs font-bold text-[#17213a]">{rep.winRate}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RepLeaderboard;
