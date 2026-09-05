import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

interface TimelineStep {
  stage: 'CONFIRMED' | 'PROCESSING' | 'PACKED' | 'SHIPPED' | 'DELIVERED';
  timestamp: string;
  completed: boolean;
  description: string;
}

interface OrderTimelineProps {
  timeline: TimelineStep[];
  currentStatus: string;
}

const STAGE_LABELS: Record<string, string> = {
  CONFIRMED: 'Order Confirmed',
  PROCESSING: 'Warehouse Processing',
  PACKED: 'Package Verified',
  SHIPPED: 'Carrier Dispatched',
  DELIVERED: 'Delivered to Site',
};

export const OrderTimeline: React.FC<OrderTimelineProps> = ({ timeline }) => {
  return (
    <div className="relative border-l-2 border-[#e7ebf7] ml-4 pl-6 space-y-6">
      {timeline.map((step, idx) => {
        return (
          <div key={idx} className="relative">
            <span
              className={`absolute -left-[35px] top-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white shadow-sm ${
                step.completed
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-200 text-slate-400'
              }`}
            >
              {step.completed ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Circle className="h-3 w-3" />
              )}
            </span>

            <div
              className={`rounded-2xl border p-4 transition ${
                step.completed
                  ? 'border-[#e7ebf7] bg-white shadow-sm'
                  : 'border-slate-200 bg-slate-50/50 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-[#17213a]">
                  {STAGE_LABELS[step.stage] || step.stage}
                </h4>
                {step.timestamp && (
                  <span className="text-xs text-[#8491aa]">
                    {new Date(step.timestamp).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-[#647592]">{step.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
