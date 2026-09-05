import { db, Database } from '../../../database/db.js';
import {
  users,
  customers,
  products,
  warehouses,
  subscriptionPlans,
  quotations,
  quotationApprovals,
  fulfillments,
  systemSettings,
  SystemSetting,
} from '../../../database/schema/index.js';
import { eq } from 'drizzle-orm';
import { UpdateSettingsInput } from '../validators/settings.validator.js';

export interface AdminDashboardMetrics {
  users: {
    total: number;
    active: number;
    inactive: number;
  };
  customers: {
    total: number;
    active: number;
  };
  products: {
    total: number;
    active: number;
  };
  warehouses: {
    total: number;
    active: number;
  };
  subscriptionPlans: {
    total: number;
    active: number;
  };
  quotations: {
    total: number;
    pendingApprovals: number;
    approved: number;
    sent: number;
  };
  orders: {
    total: number;
  };
  systemStatus: {
    status: string;
    version: string;
    uptimeSeconds: number;
    timestamp: string;
  };
}

export class AdminRepository {
  async getDashboardMetrics(client: Database = db): Promise<AdminDashboardMetrics> {
    const safeSelect = async <T>(fn: () => Promise<T[]>): Promise<T[]> => {
      try {
        return await fn();
      } catch {
        return [];
      }
    };

    const [
      allUsers,
      allCustomers,
      allProducts,
      allWarehouses,
      allPlans,
      allQuotes,
      allApprovals,
      allFulfillments,
    ] = await Promise.all([
      safeSelect(() => client.select({ isActive: users.isActive }).from(users)),
      safeSelect(() => client.select({ status: customers.status }).from(customers)),
      safeSelect(() => client.select({ isActive: products.isActive }).from(products)),
      safeSelect(() => client.select({ isActive: warehouses.isActive }).from(warehouses)),
      safeSelect(() => client.select({ isActive: subscriptionPlans.isActive }).from(subscriptionPlans)),
      safeSelect(() => client.select({ status: quotations.status }).from(quotations)),
      safeSelect(() => client.select({ status: quotationApprovals.status }).from(quotationApprovals)),
      safeSelect(() => client.select({ id: fulfillments.id }).from(fulfillments)),
    ]);

    const usersActive = allUsers.filter((u) => u.isActive).length;
    const customersActive = allCustomers.filter((c) => c.status === 'ACTIVE').length;
    const productsActive = allProducts.filter((p) => p.isActive).length;
    const warehousesActive = allWarehouses.filter((w) => w.isActive).length;
    const plansActive = allPlans.filter((p) => p.isActive).length;

    const pendingApprovals = allApprovals.filter((a) => a.status === 'PENDING').length;
    const approvedQuotes = allQuotes.filter((q) => q.status === 'APPROVED').length;
    const sentQuotes = allQuotes.filter((q) => q.status === 'SENT').length;

    return {
      users: {
        total: allUsers.length,
        active: usersActive,
        inactive: allUsers.length - usersActive,
      },
      customers: {
        total: allCustomers.length,
        active: customersActive,
      },
      products: {
        total: allProducts.length,
        active: productsActive,
      },
      warehouses: {
        total: allWarehouses.length,
        active: warehousesActive,
      },
      subscriptionPlans: {
        total: allPlans.length,
        active: plansActive,
      },
      quotations: {
        total: allQuotes.length,
        pendingApprovals,
        approved: approvedQuotes,
        sent: sentQuotes,
      },
      orders: {
        total: allFulfillments.length,
      },
      systemStatus: {
        status: 'OPERATIONAL',
        version: '1.0.0',
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      },
    };
  }

  async getSettings(client: Database = db): Promise<SystemSetting> {
    const rows = await client.select().from(systemSettings).limit(1);
    if (rows.length > 0) {
      return rows[0];
    }

    const [created] = await client
      .insert(systemSettings)
      .values({
        companyName: 'DealFlow360 Technologies Pvt Ltd',
        supportEmail: 'admin@dealflow360.com',
        supportPhone: '+91 98765 43210',
        defaultCurrency: 'INR',
        defaultTaxRate: '18.00',
        quoteExpirationDays: '30',
        approvalThresholdPercent: '10.00',
        companyAddress: 'Level 7, Cyber Tower, Hi-Tech City, Hyderabad, India',
      })
      .returning();

    return created;
  }

  async updateSettings(data: UpdateSettingsInput, client: Database = db): Promise<SystemSetting> {
    const existing = await this.getSettings(client);

    const [updated] = await client
      .update(systemSettings)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(systemSettings.id, existing.id))
      .returning();

    return updated;
  }
}

export const adminRepository = new AdminRepository();
