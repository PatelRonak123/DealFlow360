export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  type: 'quotation' | 'invoice' | 'customer' | 'product' | 'user' | 'subscription';
  link: string;
}

export interface GlobalSearchResponse {
  query: string;
  total: number;
  results: {
    quotations: SearchResultItem[];
    invoices: SearchResultItem[];
    customers: SearchResultItem[];
    products: SearchResultItem[];
    users: SearchResultItem[];
    subscriptions: SearchResultItem[];
  };
}
