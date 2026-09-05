import React from 'react';

export type BadgeVariant =
  | 'default'
  | 'draft'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'negotiating'
  | 'won'
  | 'lost'
  | 'warning'
  | 'danger'
  | 'success'
  | 'gold'
  | 'silver'
  | 'bronze';

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  children,
  icon,
  className = '',
}) => {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-medium gap-1',
    md: 'text-xs px-2.5 py-1 font-semibold gap-1.5',
  };

  const variantStyles: Record<BadgeVariant, string> = {
    default: 'bg-[#f1f3f9] text-[#475467] border border-[#e4e7ec]',
    draft: 'bg-[#f0f2f5] text-[#475467] border border-[#d0d5dd]',
    pending: 'bg-[#fff9eb] text-[#b54708] border border-[#fedf89]',
    approved: 'bg-[#ecfdf3] text-[#027a48] border border-[#a6f4c5]',
    rejected: 'bg-[#fef3f2] text-[#b42318] border border-[#fecdca]',
    negotiating: 'bg-[#eff8ff] text-[#175cd3] border border-[#b2ddff]',
    won: 'bg-[#ecfdf3] text-[#027a48] border border-[#6ce9a6]',
    lost: 'bg-[#fef3f2] text-[#b42318] border border-[#fecdca]',
    warning: 'bg-[#fffaeb] text-[#b54708] border border-[#fedf89]',
    danger: 'bg-[#fef3f2] text-[#b42318] border border-[#fecdca]',
    success: 'bg-[#ecfdf3] text-[#027a48] border border-[#a6f4c5]',
    gold: 'bg-amber-50 text-amber-800 border border-amber-300 font-bold',
    silver: 'bg-slate-100 text-slate-700 border border-slate-300 font-bold',
    bronze: 'bg-orange-50 text-orange-800 border border-orange-200 font-bold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full transition-colors ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
