export interface LineRiskInput {
  appliedDiscount: number;
  effectiveAllowedDiscount: number;
  lineGrossAmount: number;
}

export interface LineRiskOutput {
  excessDiscount: number;
  isViolation: boolean;
  riskContribution: number;
}

export interface QuotationRiskResult {
  riskScore: number;
  weightedExcessRisk: number;
  totalViolations: number;
  lineRisks: LineRiskOutput[];
}

export class RiskCalculationService {
  /**
   * Deterministically calculates line-level risk contributions and aggregate
   * weighted blended risk score for a quotation.
   *
   * Formula:
   * Line Excess Discount = MAX(Applied Discount - Effective Allowed Discount, 0)
   * Line Risk Contribution = Line Excess Discount * Line Gross Amount
   * Weighted Excess Risk = SUM(Line Risk Contribution) / Total Gross Amount
   * Normalized Risk Score = MIN(100.00, ROUND(Weighted Excess Risk, 2))
   */
  public calculateRisk(
    lines: LineRiskInput[],
    totalGrossAmount: number
  ): QuotationRiskResult {
    let sumRiskContribution = 0;
    let totalViolations = 0;

    const lineRisks: LineRiskOutput[] = lines.map((line) => {
      const rawExcess = line.appliedDiscount - line.effectiveAllowedDiscount;
      const excessDiscount = Math.max(0, Math.round(rawExcess * 100) / 100);
      const isViolation = excessDiscount > 0;
      const riskContribution = Math.round(excessDiscount * line.lineGrossAmount * 100) / 100;

      if (isViolation) {
        totalViolations++;
        sumRiskContribution += riskContribution;
      }

      return {
        excessDiscount,
        isViolation,
        riskContribution,
      };
    });

    let weightedExcessRisk = 0;
    if (totalGrossAmount > 0) {
      weightedExcessRisk = sumRiskContribution / totalGrossAmount;
    }

    const riskScore = Math.min(100, Math.max(0, Math.round(weightedExcessRisk * 100) / 100));

    return {
      riskScore,
      weightedExcessRisk: Math.round(weightedExcessRisk * 100) / 100,
      totalViolations,
      lineRisks,
    };
  }
}
