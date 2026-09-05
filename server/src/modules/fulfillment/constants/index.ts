export const FulfillmentStatus = {
  PENDING: 'PENDING',
  ALLOCATED: 'ALLOCATED',
  PARTIALLY_ALLOCATED: 'PARTIALLY_ALLOCATED',
  PARTIALLY_FULFILLED: 'PARTIALLY_FULFILLED',
  FULFILLED: 'FULFILLED',
  CANCELLED: 'CANCELLED',
} as const;

export type FulfillmentStatusType =
  (typeof FulfillmentStatus)[keyof typeof FulfillmentStatus];

export const AllocationStatus = {
  ALLOCATED: 'ALLOCATED',
  PARTIALLY_FULFILLED: 'PARTIALLY_FULFILLED',
  FULFILLED: 'FULFILLED',
  CANCELLED: 'CANCELLED',
} as const;

export type AllocationStatusType =
  (typeof AllocationStatus)[keyof typeof AllocationStatus];

export const BackorderStatus = {
  OPEN: 'OPEN',
  RESOLVED: 'RESOLVED',
  CANCELLED: 'CANCELLED',
} as const;

export type BackorderStatusType =
  (typeof BackorderStatus)[keyof typeof BackorderStatus];
