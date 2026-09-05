import React from 'react';
import { FolderOpen, LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CustomerEmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
}

export const CustomerEmptyState: React.FC<CustomerEmptyStateProps> = ({
  title,
  description,
  icon: Icon = FolderOpen,
  actionText,
  actionHref,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#dce4f0] bg-white p-12 text-center shadow-sm">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#edf4ff] text-[#3568ed] shadow-inner">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="mt-4 text-base font-bold text-[#17213a]">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-[#647592]">{description}</p>
      {actionText && (
        <div className="mt-6">
          {actionHref ? (
            <Link
              to={actionHref}
              className="inline-flex items-center gap-2 rounded-xl bg-[#3568ed] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-[#3568ed]/20 transition hover:bg-[#274fc1]"
            >
              {actionText}
            </Link>
          ) : (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center gap-2 rounded-xl bg-[#3568ed] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-[#3568ed]/20 transition hover:bg-[#274fc1]"
            >
              {actionText}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
