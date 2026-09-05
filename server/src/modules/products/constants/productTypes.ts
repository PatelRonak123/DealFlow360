export const ProductTypes = {
  ONE_TIME: 'ONE_TIME',
  RECURRING: 'RECURRING',
  SERVICE: 'SERVICE',
} as const;

export type ProductType = (typeof ProductTypes)[keyof typeof ProductTypes];
