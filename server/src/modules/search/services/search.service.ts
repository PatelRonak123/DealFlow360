import { searchRepository } from '../repositories/search.repository.js';
import { Roles } from '../../rbac/constants/roles.js';

export class SearchService {
  async performGlobalSearch(query: string, user: { id: string; roles: string[]; customer?: { id: string } }) {
    if (!query || query.trim().length === 0) {
      return {
        query: '',
        total: 0,
        results: {
          quotations: [],
          invoices: [],
          customers: [],
          products: [],
          users: [],
          subscriptions: [],
        },
      };
    }

    const cleanQuery = query.trim();
    const isCustomer = user.roles.includes(Roles.CUSTOMER);
    const isAdmin = user.roles.includes(Roles.ADMIN);
    const isFinance = user.roles.includes(Roles.FINANCE);
    const customerId = isCustomer ? user.customer?.id : undefined;

    // Run parallel searches
    const [
      quotationMatches,
      invoiceMatches,
      customerMatches,
      productMatches,
      userMatches,
      subscriptionMatches,
    ] = await Promise.all([
      searchRepository.searchQuotations(cleanQuery, customerId),
      searchRepository.searchInvoices(cleanQuery, customerId),
      !isCustomer ? searchRepository.searchCustomers(cleanQuery) : Promise.resolve([]),
      searchRepository.searchProducts(cleanQuery),
      isAdmin ? searchRepository.searchUsers(cleanQuery) : Promise.resolve([]),
      searchRepository.searchSubscriptions(cleanQuery),
    ]);

    // Format results with role-aware routes
    const formattedQuotations = quotationMatches.map((q) => ({
      id: q.id,
      title: q.quotationNumber,
      subtitle: `${q.customerName || 'Customer'} • ₹${parseFloat(q.totalAmount || '0').toLocaleString('en-IN')}`,
      status: q.status,
      type: 'quotation',
      link: isCustomer ? `/customer/quotations/${q.id}` : `/quotations/${q.id}`,
    }));

    const formattedInvoices = invoiceMatches.map((inv) => ({
      id: inv.id,
      title: inv.invoiceNumber,
      subtitle: `${inv.customerName || 'Customer'} • Due: ₹${parseFloat(inv.balanceDue || '0').toLocaleString('en-IN')}`,
      status: inv.status,
      type: 'invoice',
      link: isCustomer
        ? `/customer/invoices/${inv.id}`
        : isFinance
        ? `/finance/invoices/${inv.id}`
        : `/finance/invoices/${inv.id}`,
    }));

    const formattedCustomers = customerMatches.map((c) => ({
      id: c.id,
      title: c.companyName,
      subtitle: `${c.contactName || c.email} • ${c.tierName || 'Standard'} Tier`,
      status: c.status,
      type: 'customer',
      link: `/customers`,
    }));

    const formattedProducts = productMatches.map((p) => ({
      id: p.id,
      title: p.name,
      subtitle: `SKU: ${p.sku} • ₹${parseFloat(p.basePrice || '0').toLocaleString('en-IN')}`,
      status: p.stock > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
      type: 'product',
      link: isAdmin ? `/admin/products` : `/products`,
    }));

    const formattedUsers = userMatches.map((u) => ({
      id: u.id,
      title: u.name,
      subtitle: u.email,
      status: u.isActive ? 'ACTIVE' : 'INACTIVE',
      type: 'user',
      link: `/admin/users`,
    }));

    const formattedSubscriptions = subscriptionMatches.map((s) => ({
      id: s.id,
      title: s.name,
      subtitle: `Code: ${s.code} • ₹${parseFloat(s.price || '0').toLocaleString('en-IN')}/${s.billingInterval.toLowerCase()}`,
      status: s.isActive ? 'ACTIVE' : 'INACTIVE',
      type: 'subscription',
      link: isCustomer ? `/customer/subscriptions` : `/admin/subscription-plans`,
    }));

    const total =
      formattedQuotations.length +
      formattedInvoices.length +
      formattedCustomers.length +
      formattedProducts.length +
      formattedUsers.length +
      formattedSubscriptions.length;

    return {
      query: cleanQuery,
      total,
      results: {
        quotations: formattedQuotations,
        invoices: formattedInvoices,
        customers: formattedCustomers,
        products: formattedProducts,
        users: formattedUsers,
        subscriptions: formattedSubscriptions,
      },
    };
  }
}

export const searchService = new SearchService();
