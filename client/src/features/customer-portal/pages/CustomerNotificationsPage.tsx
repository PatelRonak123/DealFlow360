import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../hooks';
import { CustomerLoadingState, CustomerEmptyState, CustomerErrorState } from '../components';
import {
  Bell,
  CheckCheck,
  Tag,
  Boxes,
  Receipt,
  CreditCard,
  FileText,
  Clock,
  ExternalLink,
} from 'lucide-react';

export const CustomerNotificationsPage: React.FC = () => {
  const { data: notifications, isLoading, isError, refetch, markAsRead, markAllAsRead } =
    useNotifications();
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  if (isLoading) {
    return <CustomerLoadingState message="Loading your notifications..." />;
  }

  if (isError) {
    return <CustomerErrorState onRetry={() => refetch()} />;
  }

  const unreadCount = notifications ? notifications.filter((n) => !n.isRead).length : 0;
  const filteredList =
    notifications?.filter((n) => (filter === 'UNREAD' ? !n.isRead : true)) || [];

  const getIcon = (type: string) => {
    switch (type) {
      case 'QUOTATION':
        return { icon: FileText, bg: 'bg-blue-50 text-[#3568ed]' };
      case 'NEGOTIATION':
        return { icon: Tag, bg: 'bg-amber-50 text-amber-600' };
      case 'ORDER':
        return { icon: Boxes, bg: 'bg-emerald-50 text-emerald-600' };
      case 'INVOICE':
        return { icon: Receipt, bg: 'bg-purple-50 text-purple-600' };
      case 'PAYMENT':
        return { icon: CreditCard, bg: 'bg-emerald-50 text-emerald-600' };
      default:
        return { icon: Bell, bg: 'bg-slate-100 text-slate-600' };
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#17213a]">Notifications</h1>
            {unreadCount > 0 && (
              <span className="rounded-full bg-[#3568ed] px-2.5 py-0.5 text-xs font-bold text-white">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-[#647592]">
            Live commercial alerts, discount approvals, shipping dispatches, and invoice notices.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllAsRead()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-[#59657d] shadow-sm hover:bg-slate-50 transition"
          >
            <CheckCheck className="h-4 w-4" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setFilter('ALL')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
            filter === 'ALL'
              ? 'bg-[#3568ed] text-white shadow-md shadow-[#3568ed]/20'
              : 'bg-white text-[#647592] border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Notifications ({notifications?.length || 0})
        </button>
        <button
          type="button"
          onClick={() => setFilter('UNREAD')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
            filter === 'UNREAD'
              ? 'bg-[#3568ed] text-white shadow-md shadow-[#3568ed]/20'
              : 'bg-white text-[#647592] border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Unread Only ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      {filteredList.length === 0 ? (
        <CustomerEmptyState
          title="All Caught Up"
          description={
            filter === 'UNREAD'
              ? 'You have read all your notifications.'
              : 'There are no active notifications at this time.'
          }
          icon={Bell}
        />
      ) : (
        <div className="space-y-3">
          {filteredList.map((notif) => {
            const style = getIcon(notif.type);
            const Icon = style.icon;

            return (
              <div
                key={notif.id}
                className={`flex items-start justify-between gap-4 rounded-2xl border p-5 shadow-sm transition ${
                  notif.isRead
                    ? 'border-[#e7ebf7] bg-white opacity-85'
                    : 'border-[#3568ed]/30 bg-[#f8faff] shadow-[0_4px_16px_rgba(53,104,237,0.05)]'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-inner ${style.bg}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-[#17213a]">{notif.title}</h4>
                      {!notif.isRead && (
                        <span className="h-2 w-2 rounded-full bg-[#3568ed]" />
                      )}
                    </div>
                    <p className="mt-1 text-xs text-[#647592] leading-relaxed">{notif.message}</p>
                    <div className="mt-2 flex items-center gap-3 text-[11px] text-[#8491aa]">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(notif.createdAt).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                      {notif.linkUrl && (
                        <Link
                          to={notif.linkUrl}
                          className="font-bold text-[#3568ed] hover:underline inline-flex items-center gap-1"
                        >
                          <span>View Details</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {!notif.isRead && (
                  <button
                    type="button"
                    onClick={() => markAsRead(notif.id)}
                    title="Mark as read"
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-[#17213a] transition"
                  >
                    <CheckCheck className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
