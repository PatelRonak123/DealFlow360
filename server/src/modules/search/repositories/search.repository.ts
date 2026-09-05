import { db } from '../../../database/db.js';
import {
  quotations,
  invoices,
  customers,
  customerTiers,
  products,
  users,
  subscriptionPlans,
} from '../../../database/schema/index.js';
import { ilike, or, eq, and, desc } from 'drizzle-orm';

export class SearchRepository {
  async searchQuotations(query: string, customerId?: string, limit = 5) {
    const qPattern = `%${query}%`;
    const conditions = [
      or(
        ilike(quotations.quotationNumber, qPattern),
        ilike(quotations.status, qPattern)
      ),
    ];

    if (customerId) {
      conditions.push(eq(quotations.customerId, customerId));
    }

    const items = await db
      .select({
        id: quotations.id,
        quotationNumber: quotations.quotationNumber,
        status: quotations.status,
        totalAmount: quotations.totalAmount,
        currency: quotations.currency,
        customerId: quotations.customerId,
        customerName: customers.companyName,
      })
      .from(quotations)
      .leftJoin(customers, eq(quotations.customerId, customers.id))
      .where(and(...conditions))
      .orderBy(desc(quotations.createdAt))
      .limit(limit);

    return items;
  }

  async searchInvoices(query: string, customerId?: string, limit = 5) {
    const qPattern = `%${query}%`;
    try {
      const conditions = [
        or(
          ilike(invoices.invoiceNumber, qPattern),
          ilike(invoices.status, qPattern)
        ),
      ];

      if (customerId) {
        conditions.push(eq(invoices.customerId, customerId));
      }

      const items = await db
        .select({
          id: invoices.id,
          invoiceNumber: invoices.invoiceNumber,
          status: invoices.status,
          totalAmount: invoices.totalAmount,
          balanceDue: invoices.balanceDue,
          currency: invoices.currency,
          customerId: invoices.customerId,
          customerName: customers.companyName,
        })
        .from(invoices)
        .leftJoin(customers, eq(invoices.customerId, customers.id))
        .where(and(...conditions))
        .orderBy(desc(invoices.createdAt))
        .limit(limit);

      return items;
    } catch {
      return [];
    }
  }

  async searchCustomers(query: string, limit = 5) {
    const qPattern = `%${query}%`;
    const items = await db
      .select({
        id: customers.id,
        companyName: customers.companyName,
        contactName: customers.contactName,
        email: customers.email,
        status: customers.status,
        tierName: customerTiers.name,
      })
      .from(customers)
      .leftJoin(customerTiers, eq(customers.customerTierId, customerTiers.id))
      .where(
        or(
          ilike(customers.companyName, qPattern),
          ilike(customers.contactName, qPattern),
          ilike(customers.email, qPattern)
        )
      )
      .orderBy(desc(customers.createdAt))
      .limit(limit);

    return items;
  }

  async searchProducts(query: string, limit = 5) {
    const qPattern = `%${query}%`;
    const items = await db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        productType: products.productType,
        basePrice: products.basePrice,
        currency: products.currency,
        stock: products.stock,
      })
      .from(products)
      .where(
        or(
          ilike(products.name, qPattern),
          ilike(products.sku, qPattern),
          ilike(products.productType, qPattern)
        )
      )
      .orderBy(desc(products.createdAt))
      .limit(limit);

    return items;
  }

  async searchUsers(query: string, limit = 5) {
    const qPattern = `%${query}%`;
    const items = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        isActive: users.isActive,
      })
      .from(users)
      .where(
        or(
          ilike(users.name, qPattern),
          ilike(users.email, qPattern)
        )
      )
      .limit(limit);

    return items;
  }

  async searchSubscriptions(query: string, limit = 5) {
    const qPattern = `%${query}%`;
    try {
      const items = await db
        .select({
          id: subscriptionPlans.id,
          name: subscriptionPlans.name,
          code: subscriptionPlans.code,
          price: subscriptionPlans.price,
          currency: subscriptionPlans.currency,
          billingInterval: subscriptionPlans.billingInterval,
          isActive: subscriptionPlans.isActive,
        })
        .from(subscriptionPlans)
        .where(
          or(
            ilike(subscriptionPlans.name, qPattern),
            ilike(subscriptionPlans.code, qPattern)
          )
        )
        .limit(limit);

      return items;
    } catch {
      return [];
    }
  }
}

export const searchRepository = new SearchRepository();
