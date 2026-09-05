/**
 * Currency, number, and date formatters for DealFlow360
 */

export function formatINR(value: number): string {
  if (isNaN(value)) return '₹0';
  
  // Format for Lakhs and Crores if large, or standard Indian number formatting
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);

  return formatted;
}

export function formatCompactINR(value: number): string {
  if (isNaN(value)) return '₹0';
  if (value >= 10000000) {
    return `₹ ${(value / 10000000).toFixed(2)} Cr`;
  }
  if (value >= 100000) {
    return `₹ ${(value / 100000).toFixed(2)} L`;
  }
  if (value >= 1000) {
    return `₹ ${(value / 1000).toFixed(1)} K`;
  }
  return formatINR(value);
}

export function formatPercent(value: number, decimals: number = 1): string {
  if (isNaN(value)) return '0%';
  return `${value.toFixed(decimals)}%`;
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}
