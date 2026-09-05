import { INITIAL_PRODUCTS } from '@/features/products/data/catalogData';
import { Product } from '@/features/products/types/Product';
import { QuotationLineItem } from '@/features/quotations/types/Quotation';

export interface UpsellRecommendation {
  product: Product;
  rationale: string;
  expectedMarginBoost: number; // e.g. 3.2%
  confidenceScore: number; // e.g. 92%
}

export function getRecommendationsForQuote(
  lineItems: QuotationLineItem[]
): UpsellRecommendation[] {
  const currentProductIds = new Set(lineItems.map((item) => item.productId));
  const recommendations: UpsellRecommendation[] = [];

  // Check if Hardware Server Blade is present
  if (currentProductIds.has('PROD-001')) {
    // Recommend SLA (PROD-007) if not present
    if (!currentProductIds.has('PROD-007')) {
      const prod = INITIAL_PRODUCTS.find((p) => p.id === 'PROD-007');
      if (prod) {
        recommendations.push({
          product: prod,
          rationale: '92% of Enterprise Server buyers attach 24/7 Mission-Critical SLA to guarantee 4-hour hardware replacement.',
          expectedMarginBoost: 4.8,
          confidenceScore: 95,
        });
      }
    }
    // Recommend Deployment (PROD-006) if not present
    if (!currentProductIds.has('PROD-006')) {
      const prod = INITIAL_PRODUCTS.find((p) => p.id === 'PROD-006');
      if (prod) {
        recommendations.push({
          product: prod,
          rationale: 'Attach turnkey onsite engineering deployment to eliminate customer installation friction and guarantee signoff.',
          expectedMarginBoost: 2.5,
          confidenceScore: 88,
        });
      }
    }
  }

  // Check if Software License is present
  if (currentProductIds.has('PROD-004')) {
    // Recommend AI Anomaly Engine (PROD-005)
    if (!currentProductIds.has('PROD-005')) {
      const prod = INITIAL_PRODUCTS.find((p) => p.id === 'PROD-005');
      if (prod) {
        recommendations.push({
          product: prod,
          rationale: 'Complement CPQ platform with AI Anomaly Detection for real-time margin risk alerts and automated price guidance.',
          expectedMarginBoost: 5.2,
          confidenceScore: 91,
        });
      }
    }
  }

  // Generic fallback if no specific rule matched but items exist
  if (recommendations.length === 0 && lineItems.length > 0) {
    const candidate = INITIAL_PRODUCTS.find(
      (p) => !currentProductIds.has(p.id) && (p.category === 'cloud_subscription' || p.category === 'professional_services')
    );
    if (candidate) {
      recommendations.push({
        product: candidate,
        rationale: 'High-margin recurring service add-on frequently co-termed with enterprise deployments.',
        expectedMarginBoost: 3.0,
        confidenceScore: 78,
      });
    }
  }

  return recommendations;
}
