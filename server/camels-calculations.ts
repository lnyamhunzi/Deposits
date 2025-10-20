import { sql } from "drizzle-orm";
import { MySql2Database } from "drizzle-orm/mysql2";
import * as schema from "@shared/schema";

type FinancialData = Record<string, number>;

export class CAMELSCalculations {
  private db: MySql2Database<typeof schema>;

  constructor(db: MySql2Database<typeof schema>) {
    this.db = db;
  }

  async calculateCamelsRatings(
    institutionId: string,
    periodId: string,
    financialData: FinancialData
  ): Promise<Record<string, any>> {
    // Calculate individual components
    const capitalAdequacy = this._calculateCapitalAdequacy(financialData);
    const assetQuality = this._calculateAssetQuality(financialData);
    const managementQuality = this._calculateManagementQuality(financialData);
    const earnings = this._calculateEarnings(financialData);
    const liquidity = this._calculateLiquidity(financialData);
    const sensitivity = this._calculateSensitivity(financialData);

    // Calculate composite rating
    const compositeRating = this._calculateCompositeRating(
      capitalAdequacy,
      assetQuality,
      managementQuality,
      earnings,
      liquidity,
      sensitivity
    );

    return {
      capital_adequacy: {
        score: capitalAdequacy.score,
        rating: capitalAdequacy.rating,
        components: capitalAdequacy.components,
      },
      asset_quality: {
        score: assetQuality.score,
        rating: assetQuality.rating,
        components: assetQuality.components,
      },
      management_quality: {
        score: managementQuality.score,
        rating: managementQuality.rating,
        components: managementQuality.components,
      },
      earnings: {
        score: earnings.score,
        rating: earnings.rating,
        components: earnings.components,
      },
      liquidity: {
        score: liquidity.score,
        rating: liquidity.rating,
        components: liquidity.components,
      },
      sensitivity: {
        score: sensitivity.score,
        rating: sensitivity.rating,
        components: sensitivity.components,
      },
      composite_rating: compositeRating,
      risk_grade: this._getRiskGrade(compositeRating),
      calculated_at: new Date(),
    };
  }

  private _calculateCapitalAdequacy(data: FinancialData): {
    score: number;
    rating: string;
    components: Record<string, number>;
  } {
    const tier1Capital = data.tier1_capital || 0;
    const tier2Capital = data.tier2_capital || 0;
    const riskWeightedAssets = data.risk_weighted_assets || 1;

    const car =
      ((tier1Capital + tier2Capital) / riskWeightedAssets) * 100;
    const tier1Ratio = (tier1Capital / riskWeightedAssets) * 100;
    const tier2Ratio = (tier2Capital / riskWeightedAssets) * 100;

    const totalAssets = data.total_assets || 1;
    const capitalToAssets =
      ((tier1Capital + tier2Capital) / totalAssets) * 100;

    const totalEquity = data.total_equity || 0;
    const equityToAssets = (totalEquity / totalAssets) * 100;

    const carScore = this._rateCapitalRatio(car, 10, 15);
    const tier1Score = this._rateCapitalRatio(tier1Ratio, 6, 8.5);
    const capitalAssetsScore = this._rateCapitalRatio(capitalToAssets, 8, 12);

    const componentScore = (carScore + tier1Score + capitalAssetsScore) / 3;

    return {
      score: componentScore,
      rating: this._getComponentRating(componentScore),
      components: {
        capital_adequacy_ratio: car,
        tier1_ratio: tier1Ratio,
        tier2_ratio: tier2Ratio,
        capital_to_assets: capitalToAssets,
        equity_to_assets: equityToAssets,
      },
    };
  }

  private _calculateAssetQuality(data: FinancialData): {
    score: number;
    rating: string;
    components: Record<string, number>;
  } {
    const totalAssets = data.total_assets || 1;
    const grossNpa = data.gross_npa || 0;
    const netNpa = data.net_npa || 0;
    const totalLoans = data.total_loans || 1;
    const provisions = data.provisions || 0;
    const top10Exposures = data.top_10_exposures || 0;

    const grossNpaRatio = (grossNpa / totalLoans) * 100;
    const netNpaRatio = (netNpa / totalLoans) * 100;

    const provisionCoverage = grossNpa > 0 ? (provisions / grossNpa) * 100 : 100;

    const loanLossReserve = (provisions / totalLoans) * 100;

    const assetConcentration =
      totalLoans > 0 ? (top10Exposures / totalLoans) * 100 : 0;

    const previousAssets = data.previous_year_assets || totalAssets;
    const assetGrowth =
      ((totalAssets - previousAssets) / previousAssets) * 100;

    const npaScore = this._rateNpaRatio(netNpaRatio, 5, 2);
    const coverageScore = this._rateCoverageRatio(provisionCoverage, 70, 85);
    const growthScore = this._rateGrowthRatio(assetGrowth, [8, 15]);

    const componentScore =
      npaScore * 0.5 + coverageScore * 0.3 + growthScore * 0.2;

    return {
      score: componentScore,
      rating: this._getComponentRating(componentScore),
      components: {
        gross_npa_ratio: grossNpaRatio,
        net_npa_ratio: netNpaRatio,
        provision_coverage: provisionCoverage,
        loan_loss_reserve: loanLossReserve,
        asset_concentration: assetConcentration,
        asset_growth: assetGrowth,
      },
    };
  }

  private _calculateManagementQuality(data: FinancialData): {
    score: number;
    rating: string;
    components: Record<string, number>;
  } {
    const totalIncome = data.total_income || 1;
    const operatingExpenses = data.operating_expenses || 0;
    const totalAssets = data.total_assets || 1;
    const totalEquity = data.total_equity || 1;

    const costToIncome = (operatingExpenses / totalIncome) * 100;

    const assetUtilization = (totalIncome / totalAssets) * 100;

    const totalEmployees = data.total_employees || 1;
    const businessPerEmployee = totalAssets / totalEmployees;

    const netIncome = data.net_income || 0;
    const roe = (netIncome / totalEquity) * 100;

    const costScore = this._rateCostRatio(costToIncome, 60, 45);
    const assetUtilScore = this._rateUtilizationRatio(assetUtilization, 2, 3);
    const roeScore = this._rateRoeRatio(roe, 8, 12);

    const componentScore =
      costScore * 0.4 + assetUtilScore * 0.3 + roeScore * 0.3;

    return {
      score: componentScore,
      rating: this._getComponentRating(componentScore),
      components: {
        cost_to_income: costToIncome,
        asset_utilization: assetUtilization,
        business_per_employee: businessPerEmployee,
        return_on_equity: roe,
      },
    };
  }

  private _calculateEarnings(data: FinancialData): {
    score: number;
    rating: string;
    components: Record<string, number>;
  } {
    const netIncome = data.net_income || 0;
    const totalAssets = data.total_assets || 1;
    const totalEquity = data.total_equity || 1;
    const operatingIncome = data.operating_income || 1;
    const interestIncome = data.interest_income || 0;
    const interestExpense = data.interest_expense || 0;
    const earningsGrowth = data.earnings_growth || 0;

    const roa = (netIncome / totalAssets) * 100;
    const roe = (netIncome / totalEquity) * 100;

    const earningAssets = data.earning_assets || totalAssets;
    const nim = ((interestIncome - interestExpense) / earningAssets) * 100;

    const operatingMargin = (operatingIncome / totalAssets) * 100;

    const nonInterestIncome = data.non_interest_income || 0;
    const incomeDiversity =
      operatingIncome > 0 ? (nonInterestIncome / operatingIncome) * 100 : 0;

    const earningsTrend = earningsGrowth;

    const roaScore = this._rateRoaRatio(roa, 0.5, 1.2);
    const roeScore = this._rateRoeRatio(roe, 8, 15);
    const nimScore = this._rateNimRatio(nim, 2, 3.5);

    const componentScore = roaScore * 0.4 + roeScore * 0.3 + nimScore * 0.3;

    return {
      score: componentScore,
      rating: this._getComponentRating(componentScore),
      components: {
        return_on_assets: roa,
        return_on_equity: roe,
        net_interest_margin: nim,
        operating_margin: operatingMargin,
        income_diversity: incomeDiversity,
        earnings_trend: earningsTrend,
      },
    };
  }

  private _calculateLiquidity(data: FinancialData): {
    score: number;
    rating: string;
    components: Record<string, number>;
  } {
    const liquidAssets = data.liquid_assets || 0;
    const cashEquivalents = data.cash_equivalents || 0;
    const totalAssets = data.total_assets || 1;
    const shortTermLiabilities = data.short_term_liabilities || 1;
    const totalDeposits = data.total_deposits || 1;
    const totalLoans = data.total_loans || 0;

    const liquidityRatio = (liquidAssets / totalAssets) * 100;

    const cashToAssetsRatio = (cashEquivalents / totalAssets) * 100;

    const loanToDeposit = (totalLoans / totalDeposits) * 100;

    const quickRatio = (liquidAssets / shortTermLiabilities) * 100;

    const coreDeposits = data.core_deposits || totalDeposits * 0.7;
    const coreDepositsRatio = (coreDeposits / totalDeposits) * 100;

    const liquidityScore = this._rateLiquidityRatio(liquidityRatio, 20, 30);
    const ltdScore = this._rateLtdRatio(loanToDeposit, 80, 75);
    const quickScore = this._rateQuickRatio(quickRatio, 100, 120);

    const componentScore =
      liquidityScore * 0.4 + ltdScore * 0.4 + quickScore * 0.2;

    return {
      score: componentScore,
      rating: this._getComponentRating(componentScore),
      components: {
        liquidity_ratio: liquidityRatio,
        cash_to_assets_ratio: cashToAssetsRatio,
        loan_to_deposit: loanToDeposit,
        quick_ratio: quickRatio,
        core_deposits_ratio: coreDepositsRatio,
      },
    };
  }

  private _calculateSensitivity(data: FinancialData): {
    score: number;
    rating: string;
    components: Record<string, number>;
  } {
    const totalAssets = data.total_assets || 1;
    const foreignCurrencyAssets = data.foreign_currency_assets || 0;
    const foreignCurrencyLiabilities = data.foreign_currency_liabilities || 0;
    const interestSensitiveAssets = data.interest_sensitive_assets || 0;
    const interestSensitiveLiabilities = data.interest_sensitive_liabilities || 0;
    const fxExposure = data.fx_exposure || 0;

    const fxRisk =
      (Math.abs(foreignCurrencyAssets - foreignCurrencyLiabilities) /
        totalAssets) *
      100;

    const interestGap =
      ((interestSensitiveAssets - interestSensitiveLiabilities) / totalAssets) *
      100;

    const largestDepositor = data.largest_depositor || 0;
    const depositConcentration = (largestDepositor / totalAssets) * 100;

    const marketConcentration = fxExposure;

    const currentEarnings = data.net_income || 0;
    const previousEarnings = data.previous_net_income || currentEarnings;
    const earningsVolatility =
      previousEarnings > 0
        ? Math.abs((currentEarnings - previousEarnings) / previousEarnings) * 100
        : 0;

    const fxScore = this._rateFxExposure(Math.abs(fxRisk), 10, 5);
    const interestScore = this._rateInterestGap(Math.abs(interestGap), 15, 10);
    const concentrationScore = this._rateConcentrationRatio(
      depositConcentration,
      20,
      15
    );

    const componentScore =
      fxScore * 0.4 + interestScore * 0.3 + concentrationScore * 0.3;

    return {
      score: componentScore,
      rating: this._getComponentRating(componentScore),
      components: {
        fx_risk: fxRisk,
        interest_rate_gap: interestGap,
        deposit_concentration: depositConcentration,
        market_concentration: marketConcentration,
        earnings_volatility: earningsVolatility,
      },
    };
  }

  private _calculateCompositeRating(
    capital: { score: number },
    assets: { score: number },
    management: { score: number },
    earnings: { score: number },
    liquidity: { score: number },
    sensitivity: { score: number }
  ): number {
    const weights = {
      capital: 0.25,
      assets: 0.2,
      management: 0.25,
      earnings: 0.1,
      liquidity: 0.1,
      sensitivity: 0.1,
    };

    const composite =
      capital.score * weights.capital +
      assets.score * weights.assets +
      management.score * weights.management +
      earnings.score * weights.earnings +
      liquidity.score * weights.liquidity +
      sensitivity.score * weights.sensitivity;

    return composite;
  }

  private _rateCapitalRatio(
    ratio: number,
    minThreshold: number,
    strongThreshold: number
  ): number {
    if (ratio >= strongThreshold) {
      return 1.0;
    } else if (ratio >= minThreshold) {
      return 2.0;
    } else if (ratio >= minThreshold - 2) {
      return 3.0;
    } else if (ratio >= minThreshold - 4) {
      return 4.0;
    } else {
      return 5.0;
    }
  }

  private _rateNpaRatio(
    ratio: number,
    maxThreshold: number,
    goodThreshold: number
  ): number {
    if (ratio <= goodThreshold) {
      return 1.0;
    } else if (ratio <= maxThreshold) {
      return 2.0;
    } else if (ratio <= maxThreshold + 3) {
      return 3.0;
    } else if (ratio <= maxThreshold + 6) {
      return 4.0;
    } else {
      return 5.0;
    }
  }

  private _rateCoverageRatio(
    ratio: number,
    minThreshold: number,
    strongThreshold: number
  ): number {
    if (ratio >= strongThreshold) {
      return 1.0;
    } else if (ratio >= minThreshold) {
      return 2.0;
    } else if (ratio >= minThreshold - 15) {
      return 3.0;
    } else if (ratio >= minThreshold - 30) {
      return 4.0;
    } else {
      return 5.0;
    }
  }

  private _rateCostRatio(
    ratio: number,
    maxThreshold: number,
    goodThreshold: number
  ): number {
    if (ratio <= goodThreshold) {
      return 1.0;
    } else if (ratio <= maxThreshold) {
      return 2.0;
    } else if (ratio <= maxThreshold + 10) {
      return 3.0;
    } else if (ratio <= maxThreshold + 20) {
      return 4.0;
    } else {
      return 5.0;
    }
  }

  private _rateRoaRatio(
    ratio: number,
    minThreshold: number,
    strongThreshold: number
  ): number {
    if (ratio >= strongThreshold) {
      return 1.0;
    } else if (ratio >= minThreshold) {
      return 2.0;
    } else if (ratio >= 0) {
      return 3.0;
    } else if (ratio >= -minThreshold) {
      return 4.0;
    } else {
      return 5.0;
    }
  }

  private _rateLiquidityRatio(
    ratio: number,
    minThreshold: number,
    strongThreshold: number
  ): number {
    if (ratio >= strongThreshold) {
      return 1.0;
    } else if (ratio >= minThreshold) {
      return 2.0;
    } else if (ratio >= minThreshold - 5) {
      return 3.0;
    } else if (ratio >= minThreshold - 10) {
      return 4.0;
    } else {
      return 5.0;
    }
  }

  private _rateLtdRatio(
    ratio: number,
    maxThreshold: number,
    goodThreshold: number
  ): number {
    if (ratio <= goodThreshold) {
      return 1.0;
    } else if (ratio <= maxThreshold) {
      return 2.0;
    } else if (ratio <= maxThreshold + 10) {
      return 3.0;
    } else if (ratio <= maxThreshold + 20) {
      return 4.0;
    } else {
      return 5.0;
    }
  }

  private _rateNimRatio(
    ratio: number,
    minThreshold: number,
    strongThreshold: number
  ): number {
    if (ratio >= strongThreshold) {
      return 1.0;
    } else if (ratio >= minThreshold) {
      return 2.0;
    } else if (ratio >= minThreshold - 0.5) {
      return 3.0;
    } else if (ratio >= minThreshold - 1) {
      return 4.0;
    } else {
      return 5.0;
    }
  }

  private _rateUtilizationRatio(
    ratio: number,
    minThreshold: number,
    strongThreshold: number
  ): number {
    if (ratio >= strongThreshold) {
      return 1.0;
    } else if (ratio >= minThreshold) {
      return 2.0;
    } else if (ratio >= minThreshold - 0.5) {
      return 3.0;
    } else if (ratio >= minThreshold - 1) {
      return 4.0;
    } else {
      return 5.0;
    }
  }

  private _rateRoeRatio(
    ratio: number,
    minThreshold: number,
    strongThreshold: number
  ): number {
    if (ratio >= strongThreshold) {
      return 1.0;
    } else if (ratio >= minThreshold) {
      return 2.0;
    } else if (ratio >= minThreshold - 2) {
      return 3.0;
    } else if (ratio >= minThreshold - 4) {
      return 4.0;
    } else {
      return 5.0;
    }
  }

  private _rateFxExposure(
    ratio: number,
    maxThreshold: number,
    goodThreshold: number
  ): number {
    if (ratio <= goodThreshold) {
      return 1.0;
    } else if (ratio <= maxThreshold) {
      return 2.0;
    } else if (ratio <= maxThreshold + 5) {
      return 3.0;
    } else if (ratio <= maxThreshold + 10) {
      return 4.0;
    } else {
      return 5.0;
    }
  }

  private _rateInterestGap(
    ratio: number,
    maxThreshold: number,
    goodThreshold: number
  ): number {
    if (ratio <= goodThreshold) {
      return 1.0;
    } else if (ratio <= maxThreshold) {
      return 2.0;
    } else if (ratio <= maxThreshold + 5) {
      return 3.0;
    } else if (ratio <= maxThreshold + 10) {
      return 4.0;
    } else {
      return 5.0;
    }
  }

  private _rateConcentrationRatio(
    ratio: number,
    maxThreshold: number,
    goodThreshold: number
  ): number {
    if (ratio <= goodThreshold) {
      return 1.0;
    } else if (ratio <= maxThreshold) {
      return 2.0;
    } else if (ratio <= maxThreshold + 5) {
      return 3.0;
    } else if (ratio <= maxThreshold + 10) {
      return 4.0;
    } else {
      return 5.0;
    }
  }

  private _rateGrowthRatio(
    ratio: number,
    optimalRange: [number, number]
  ): number {
    const [minOptimal, maxOptimal] = optimalRange;
    if (ratio >= minOptimal && ratio <= maxOptimal) {
      return 1.0;
    } else if (ratio > maxOptimal + 5 || ratio < minOptimal - 5) {
      return 3.0;
    } else if (ratio > maxOptimal + 10 || ratio < minOptimal - 10) {
      return 4.0;
    } else if (ratio > maxOptimal + 15 || ratio < minOptimal - 15) {
      return 5.0;
    } else {
      return 2.0;
    }
  }

  private _getComponentRating(score: number): string {
    if (score <= 1.5) {
      return "STRONG";
    } else if (score <= 2.5) {
      return "SATISFACTORY";
    } else if (score <= 3.5) {
      return "FAIR";
    } else if (score <= 4.5) {
      return "MARGINAL";
    } else {
      return "UNSATISFACTORY";
    }
  }

  private _getRiskGrade(compositeScore: number): string {
    if (compositeScore <= 1.8) {
      return "A"; // Excellent
    } else if (compositeScore <= 2.5) {
      return "B"; // Good
    } else if (compositeScore <= 3.2) {
      return "C"; // Fair
    } else if (compositeScore <= 4.0) {
      return "D"; // Marginal
    } else {
      return "E"; // Unsatisfactory
    }
  }
}
