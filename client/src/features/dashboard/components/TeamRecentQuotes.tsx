import React from 'react';
import toast from 'react-hot-toast';
import { RecentTeamQuote } from '../types';

interface TeamRecentQuotesProps {
  quotes: RecentTeamQuote[];
}

export const TeamRecentQuotes: React.FC<TeamRecentQuotesProps> = ({ quotes }) => {
  return (
    <section className="rounded-3xl border border-[#e7ebf7] bg-white p-6 shadow-[0_8px_24px_rgba(64,86,145,0.05)]">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#17213a]">Recent Team Quotation Activity</h2>
          <p className="text-xs text-[#59657d]">Cross-team stream of generated quotations and margin statuses.</p>
        </div>
        <button
          onClick={() => toast('Navigating to Quotations module...')}
          className="text-xs font-bold text-[#3568ed] hover:underline"
        >
          View All Quotes ›
        </button>
      </div>

      <div className="divide-y divide-[#eef1f8]">
        {quotes.map((q) => (
          <div key={q.id} className="flex items-center justify-between py-3.5 transition hover:bg-[#fbfcfe]">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 font-bold text-indigo-600 text-xs">
                {q.id.replace('Q-', '')}
              </span>
              <div>
                <p className="text-xs font-bold text-[#17213a]">{q.customer}</p>
                <p className="text-[11px] text-[#8491aa]">
                  Rep: {q.rep} • Discount: {q.discount}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-right">
              <span className="text-xs font-bold text-[#17213a]">{q.amount}</span>
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  q.tone === 'green'
                    ? 'bg-emerald-50 text-emerald-700'
                    : q.tone === 'amber'
                    ? 'bg-amber-50 text-amber-700'
                    : q.tone === 'blue'
                    ? 'bg-blue-50 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {q.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TeamRecentQuotes;
