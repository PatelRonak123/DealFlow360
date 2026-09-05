export type NotificationType =
  | 'QUOTATION'
  | 'APPROVAL'
  | 'REJECTION'
  | 'NEGOTIATION'
  | 'ORDER'
  | 'INVOICE'
  | 'PAYMENT'
  | 'SYSTEM';

export type NotificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'INFO';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  status?: NotificationStatus;
  isRead: boolean;
  createdAt: string;
  linkUrl?: string;
  targetRoles?: string[];
  targetUserId?: string;
  targetCustomerId?: string;
  metadata?: Record<string, unknown>;
}
