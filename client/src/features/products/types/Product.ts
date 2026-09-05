export type ProductCategory =
  | 'hardware'
  | 'software'
  | 'cloud_subscription'
  | 'professional_services';

export type ProductBillingType = 'one_time' | 'recurring';
export type BillingPeriod = 'monthly' | 'annual';

export interface WarehouseStock {
  warehouseId: string;
  warehouseName: string;
  city: string;
  availableStock: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: ProductCategory;
  billingType: ProductBillingType;
  billingPeriod?: BillingPeriod; // If recurring
  basePrice: number; // Selling list price (INR)
  costPrice: number; // Internal COGS (INR)
  discountCeilingPercent: number; // Maximum allowed discount for this category before escalation
  warehouses: WarehouseStock[];
  recommendedUpsellIds?: string[];
}
