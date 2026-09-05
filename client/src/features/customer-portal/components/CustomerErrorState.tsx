import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface CustomerErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const CustomerErrorState: React.FC<CustomerErrorStateProps> = ({
  title = 'Unable to Load Data',
  message = 'An unexpected error occurred while communicating with the DealFlow360 platform.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50/50 p-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h3 className="mt-4 text-base font-bold text-red-900">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-red-700">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white border border-red-200 px-4 py-2 text-xs font-semibold text-red-700 shadow-sm transition hover:bg-red-100/60"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
};
