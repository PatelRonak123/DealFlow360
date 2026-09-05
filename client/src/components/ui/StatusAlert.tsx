import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

export type AlertType = 'info' | 'success' | 'warning' | 'error';

export interface StatusAlertProps {
  type?: AlertType;
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const StatusAlert: React.FC<StatusAlertProps> = ({
  type = 'info',
  title,
  children,
  action,
  className = '',
}) => {
  const styles: Record<AlertType, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
    info: {
      bg: 'bg-[#eff6ff]',
      border: 'border-[#bfdbfe]',
      text: 'text-[#1e40af]',
      icon: <Info className="h-5 w-5 text-[#3b82f6] shrink-0 mt-0.5" />,
    },
    success: {
      bg: 'bg-[#ecfdf5]',
      border: 'border-[#a7f3d0]',
      text: 'text-[#065f46]',
      icon: <CheckCircle2 className="h-5 w-5 text-[#10b981] shrink-0 mt-0.5" />,
    },
    warning: {
      bg: 'bg-[#fffbeb]',
      border: 'border-[#fde68a]',
      text: 'text-[#92400e]',
      icon: <AlertTriangle className="h-5 w-5 text-[#f59e0b] shrink-0 mt-0.5" />,
    },
    error: {
      bg: 'bg-[#fef2f2]',
      border: 'border-[#fecaca]',
      text: 'text-[#991b1b]',
      icon: <AlertCircle className="h-5 w-5 text-[#ef4444] shrink-0 mt-0.5" />,
    },
  };

  const current = styles[type];

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-4 ${current.bg} ${current.border} ${className}`}
    >
      {current.icon}
      <div className="flex-1 text-sm">
        {title && <h4 className={`font-semibold mb-1 ${current.text}`}>{title}</h4>}
        <div className={current.text}>{children}</div>
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  );
};
