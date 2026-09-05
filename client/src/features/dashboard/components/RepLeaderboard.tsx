import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import { TeamRep } from '../types';

interface RepLeaderboardProps {
  reps: TeamRep[];
  isLoading?: boolean;
}

export const RepLeaderboard: React.FC<RepLeaderboardProps> = ({ reps, isLoading = false }) => {
  const navigate = useNavigate();

  return (
    <div className="rounded-3xl border border-[#e7ebf7] bg-white p-6 shadow-[0_8px_24px_rgba(64,86,145,0.05)]">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#17213a]">Sales Representative Performance</h2>
          <p className="text-xs text-[#59657d]">Rep deal volume, active quotations, and discount governance discipline.</p>
        </div>
        <button
          onClick={() => navigate('/quotations')}
          className="text-xs font-bold text-[#3568ed] hover:underline cursor-pointer"
        >
          View Team Quotes ›
        </button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-xs text-gray-400 animate-pulse">
          Loading sales representative performance metrics...
        </div>
      ) : reps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Users className="h-8 w-8 text-gray-300 mb-2" />
          <p className="text-xs font-semibold text-[#17213a]">No sales representative activity recorded yet</p>
          <p className="text-[11px] text-[#8491aa] mt-0.5">
            Representative metrics will automatically compute as quotations are submitted.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reps.map((rep) => (
            <div
              key={rep.name}
              className="flex flex-col justify-between gap-3 rounded-2xl border border-[#f0f3fa] p-4 transition hover:border-[#d9e2f5] hover:bg-[#fafcff] sm:flex-row sm:items-center"
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold ${rep.avatarBg}`}>
                  {rep.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#17213a]">{rep.name}</p>
                  <p className="text-xs text-[#8491aa]">
                    {rep.role} • {rep.activeQuotes} active {rep.activeQuotes === 1 ? 'quote' : 'quotes'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {/* Quota / Volume */}
                <div className="w-28 text-left">
                  <div className="flex justify-between text-[11px] font-semibold">
                    <span className="text-[#59657d]">Volume</span>
                    <span className="text-[#17213a]">{rep.quotaAchieved}</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full ${
                        rep.quotaPercent >= 85
                          ? 'bg-emerald-500'
                          : rep.quotaPercent >= 50
                          ? 'bg-blue-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(10, rep.quotaPercent))}%` }}
                    />
                  </div>
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
      )}
    </div>
  );
};

export default RepLeaderboard;
