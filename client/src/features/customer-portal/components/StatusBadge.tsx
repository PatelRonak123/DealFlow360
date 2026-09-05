import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  RotateCcw,
  Truck,
  PackageCheck,
} from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normalized = (status || '').toUpperCase();

  const getStyle = () => {
    switch (normalized) {
      case 'APPROVED':
      case 'CONFIRMED':
      case 'PAID':
      case 'DELIVERED':
      case 'ACTIVE':
      case 'SUCCESS':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: CheckCircle2,
          label: normalized === 'PAID' ? 'Paid in Full' : normalized,
        };
      case 'NEGOTIATION':
      case 'PENDING_APPROVAL':
      case 'PENDING':
      case 'PROCESSING':
      case 'ISSUED':
      case 'PARTIALLY_PAID':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: Clock,
          label:
            normalized === 'PENDING_APPROVAL'
              ? 'Pending Approval'
              : normalized === 'PARTIALLY_PAID'
              ? 'Partially Paid'
              : normalized,
        };
      case 'PACKED':
      case 'SHIPPED':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: normalized === 'SHIPPED' ? Truck : PackageCheck,
          label: normalized,
        };
      case 'REJECTED':
      case 'CANCELLED':
      case 'FAILED':
      case 'OVERDUE':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: XCircle,
          label: normalized,
        };
      case 'EXPIRED':
      case 'RETURNED':
        return {
          bg: 'bg-slate-100 text-slate-600 border-slate-200',
          icon: RotateCcw,
          label: normalized,
        };
      case 'DRAFT':
      default:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-300',
          icon: AlertCircle,
          label: normalized || 'Draft',
        };
    }
  };

  const style = getStyle();
  const Icon = style.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-semibold',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-sm ${style.bg} ${sizeClasses[size]}`}
    >
      <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      <span>{style.label}</span>
    </span>
  );
};
