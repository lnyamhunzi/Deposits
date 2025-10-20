import { MySql2Database } from "drizzle-orm/mysql2";
import * as schema from "@shared/schema";
import { eq, and, sql, gte, lte } from "drizzle-orm";
import { v4 as uuidv4 } from 'uuid';
import {
  DepositType,
  AccountSize,
} from "@shared/types";

// Interface for the raw deposit data, similar to a pandas DataFrame row
interface RawDepositData {
  account_type: string;
  balance: number;
  currency: string;
  // Add other relevant fields from your CSV/Excel here
}

export class DepositAnalysisService {
  private db: MySql2Database<typeof schema>;

  constructor(db: MySql2Database<typeof schema>) {
    this.db = db;
  }

  async analyzeDeposits(
    institutionId: number,
    periodType: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<Record<string, any>> {
    const period = await this._createSurveillancePeriod(
      institutionId,
      periodType,
      periodStart,
      periodEnd
    );

    const depositData = await this._extractDepositData(
      institutionId,
      periodStart,
      periodEnd
    );

    if (!depositData || depositData.length === 0) {
      return { error: "No deposit data available for analysis" };
    }

    const analyses: any[] = [];

    for (const depositTypeKey in DepositType) {
      const depositType = DepositType[depositTypeKey as keyof typeof DepositType];
      const typeAnalysis = await this._analyzeDepositType(
        depositData,
        depositType,
        period.id
      );
      if (typeAnalysis) {
        analyses.push(typeAnalysis);
      }
    }

    const trends = await this._calculateDepositTrends(
      institutionId,
      periodStart,
      periodEnd
    );

    const insights = await this._generateDepositInsights(analyses, trends);

    return {
      period: {
        id: period.id,
        type: periodType,
        start: periodStart.toISOString(),
        end: periodEnd.toISOString(),
      },
      analyses: analyses,
      trends: trends,
      insights: insights,
      summary_metrics: await this._calculateSummaryMetrics(analyses),
      analysis_date: new Date().toISOString(),
    };
  }

  private async _extractDepositData(
    institutionId: number,
    periodStart: Date,
    periodEnd: Date
  ): Promise<RawDepositData[] | null> {
    // Placeholder: In a real application, this would involve fetching
    // deposit data from a database or a file storage based on the institutionId and period.
    // For now, returning mock data.

    // Example: Fetching from a 'returns' table that contains file paths
    const returnRecord = await this.db.query.returns.findFirst({
      where: and(
        eq(schema.returns.institutionId, institutionId),
        eq(schema.returns.returnPeriod, periodStart.toISOString().slice(0, 10)), // Assuming returnPeriod is YYYY-MM-DD
        eq(schema.returns.status, "SUBMITTED")
      ),
    });

    if (!returnRecord || !returnRecord.fileName) {
      return null;
    }

    // In a real scenario, you would read the file from returnRecord.fileName
    // and parse it into RawDepositData[].
    // For this conversion, we'll return some dummy data.
    return [
      { account_type: "SAVINGS", balance: 1000, currency: "USD" },
      { account_type: "CHECKING", balance: 2500, currency: "USD" },
      { account_type: "CORPORATE", balance: 15000, currency: "USD" },
      { account_type: "INDIVIDUAL", balance: 500, currency: "ZWL" },
      { account_type: "SAVINGS", balance: 3000, currency: "USD" },
      { account_type: "CORPORATE", balance: 20000, currency: "ZWL" },
    ];
  }

  private async _analyzeDepositType(
    depositData: RawDepositData[],
    depositType: DepositType,
    periodId: string
  ): Promise<Record<string, any> | null> {
    let typeData: RawDepositData[] = [];

    if (depositType === DepositType.INDIVIDUAL) {
      typeData = depositData.filter((d) =>
        ["SAVINGS", "CHECKING", "INDIVIDUAL"].includes(d.account_type)
      );
    } else if (depositType === DepositType.CORPORATE) {
      typeData = depositData.filter((d) =>
        ["CORPORATE", "BUSINESS"].includes(d.account_type)
      );
    } else if (depositType === DepositType.GOVERNMENT) {
      typeData = depositData.filter((d) => d.account_type === "GOVERNMENT");
    } else {
      typeData = depositData.filter((d) => d.account_type === depositType);
    }

    if (typeData.length === 0) {
      return null;
    }

    const totalDeposits = typeData.reduce((sum, d) => sum + d.balance, 0);
    const totalAccounts = typeData.length;
    const averageBalance =
      totalAccounts > 0 ? totalDeposits / totalAccounts : 0;

    const currencyBreakdown = this._calculateCurrencyBreakdown(typeData);
    const accountSizeBreakdown = this._calculateAccountSizeBreakdown(typeData);
    const productBreakdown = this._calculateProductBreakdown(typeData);

    const growthRate = await this._calculateGrowthRate(
      depositType,
      totalDeposits,
      periodId
    );

    const analysis: typeof schema.depositAnalyses.$inferInsert = {
      id: uuidv4(),
      periodId: periodId,
      depositType: depositType,
      totalDeposits: totalDeposits.toFixed(2), // Convert to string for decimal type
      totalAccounts: totalAccounts,
      averageBalance: averageBalance.toFixed(2), // Convert to string for decimal type
      growthRate: growthRate ? growthRate.toFixed(2) : null, // Convert to string for decimal type
      currencyBreakdown: currencyBreakdown,
      accountSizeBreakdown: accountSizeBreakdown,
      productBreakdown: productBreakdown,
    };

    await this.db.insert(schema.depositAnalyses).values(analysis);

    return {
      deposit_type: depositType,
      total_deposits: totalDeposits,
      total_accounts: totalAccounts,
      average_balance: averageBalance,
      growth_rate: growthRate,
      currency_breakdown: currencyBreakdown,
      account_size_breakdown: accountSizeBreakdown,
      product_breakdown: productBreakdown,
      market_share: await this._calculateMarketShare(
        depositType,
        totalDeposits
      ),
    };
  }

  private _calculateCurrencyBreakdown(
    data: RawDepositData[]
  ): Record<string, number> {
    const currencyTotals: Record<string, number> = {};
    data.forEach((d) => {
      currencyTotals[d.currency] = (currencyTotals[d.currency] || 0) + d.balance;
    });
    return currencyTotals;
  }

  private _calculateAccountSizeBreakdown(
    data: RawDepositData[]
  ): Record<string, number> {
    const sizeCounts: Record<string, number> = {
      [AccountSize.SMALL]: 0,
      [AccountSize.MEDIUM]: 0,
      [AccountSize.LARGE]: 0,
    };

    data.forEach((d) => {
      const balance = d.balance;
      if (balance < 10000) {
        sizeCounts[AccountSize.SMALL]++;
      } else if (balance < 100000) {
        sizeCounts[AccountSize.MEDIUM]++;
      } else {
        sizeCounts[AccountSize.LARGE]++;
      }
    });
    return sizeCounts;
  }

  private _calculateProductBreakdown(
    data: RawDepositData[]
  ): Record<string, number> {
    const productTotals: Record<string, number> = {};
    data.forEach((d) => {
      productTotals[d.account_type] =
        (productTotals[d.account_type] || 0) + d.balance;
    });
    return productTotals;
  }

  private async _calculateGrowthRate(
    depositType: DepositType,
    currentTotal: number,
    periodId: string
  ): Promise<number | null> {
    // Placeholder: This would query previous period's data from depositAnalyses table
    // For now, return a mock growth rate
    return Math.random() * 0.2 - 0.05; // -5% to +15%
  }

  private async _calculateMarketShare(
    depositType: DepositType,
    institutionDeposits: number
  ): Promise<number> {
    // Placeholder: This would query industry-wide totals
    const industryTotals: Record<DepositType, number> = {
      [DepositType.INDIVIDUAL]: 5000000000,
      [DepositType.CORPORATE]: 3000000000,
      [DepositType.GOVERNMENT]: 1000000000,
      [DepositType.JOINT]: 500000000,
      [DepositType.TRUST]: 300000000,
    };

    const industryTotal = industryTotals[depositType] || 1000000000;
    return (institutionDeposits / industryTotal) * 100;
  }

  private async _calculateDepositTrends(
    institutionId: number,
    periodStart: Date,
    periodEnd: Date
  ): Promise<Record<string, any>> {
    const historicalPeriods = await this.db.query.surveillancePeriods.findMany({
      where: and(
        eq(schema.surveillancePeriods.institutionId, institutionId),
        lte(schema.surveillancePeriods.periodEnd, periodEnd),
        gte(
          schema.surveillancePeriods.periodEnd,
          new Date(periodEnd.getTime() - 365 * 24 * 60 * 60 * 1000) // Last 12 months
        )
      ),
      orderBy: schema.surveillancePeriods.periodEnd,
    });

    const trends = {
      total_deposits: [] as { period: string; value: number }[],
      account_growth: [] as { period: string; value: number }[],
      composition_changes: [] as any[],
      volatility_metrics: {} as Record<string, any>,
    };

    for (const period of historicalPeriods) {
      const analyses = await this.db.query.depositAnalyses.findMany({
        where: eq(schema.depositAnalyses.periodId, period.id),
      });

      const totalDeposits = analyses.reduce(
        (sum, analysis) => sum + parseFloat(analysis.totalDeposits as string),
        0
      );
      const totalAccounts = analyses.reduce(
        (sum, analysis) => sum + analysis.totalAccounts,
        0
      );

      trends.total_deposits.push({
        period: period.periodEnd.toISOString(),
        value: totalDeposits,
      });

      trends.account_growth.push({
        period: period.periodEnd.toISOString(),
        value: totalAccounts,
      });
    }

    if (trends.total_deposits.length > 1) {
      const depositsSeries = trends.total_deposits.map((item) => item.value);
      const mean = depositsSeries.reduce((a, b) => a + b, 0) / depositsSeries.length;
      const stdDev = Math.sqrt(
        depositsSeries.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) /
          depositsSeries.length
      );

      trends.volatility_metrics = {
        std_deviation: stdDev,
        coefficient_of_variation: mean !== 0 ? stdDev / mean : 0,
        max_drawdown: this._calculateMaxDrawdown(depositsSeries),
      };
    }

    return trends;
  }

  private _calculateMaxDrawdown(series: number[]): number {
    if (series.length === 0) return 0;

    let peak = series[0];
    let maxDrawdown = 0;

    for (let i = 1; i < series.length; i++) {
      const value = series[i];
      if (value > peak) {
        peak = value;
      } else {
        const drawdown = (peak - value) / peak;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
      }
    }

    return maxDrawdown;
  }

  private async _generateDepositInsights(
    analyses: any[],
    trends: Record<string, any>
  ): Promise<any[]> {
    const insights: any[] = [];

    const totalDeposits = analyses.reduce(
      (sum, analysis) => sum + analysis.total_deposits,
      0
    );
    const corporateDeposits = analyses.find(
      (a) => a.deposit_type === DepositType.CORPORATE
    );

    if (
      corporateDeposits &&
      corporateDeposits.growth_rate &&
      corporateDeposits.growth_rate > 0.1
    ) {
      insights.push({
        type: "POSITIVE",
        category: "GROWTH",
        title: "Strong Corporate Deposit Growth",
        description: `Corporate deposits growing at ${(corporateDeposits.growth_rate * 100).toFixed(1)}%`,
        impact: "MEDIUM",
        recommendation: "Monitor concentration risks",
      });
    }

    const largestType = analyses.reduce((prev, current) =>
      prev.total_deposits > current.total_deposits ? prev : current
    );
    if (largestType.total_deposits / totalDeposits > 0.6) {
      insights.push({
        type: "WARNING",
        category: "CONCENTRATION",
        title: "High Deposit Concentration",
        description: `${largestType.deposit_type} deposits represent ${(largestType.total_deposits / totalDeposits * 100).toFixed(1)}% of total`,
        impact: "HIGH",
        recommendation: "Diversify deposit base",
      });
    }

    if (
      trends.volatility_metrics &&
      trends.volatility_metrics.coefficient_of_variation > 0.15
    ) {
      insights.push({
        type: "WARNING",
        category: "VOLATILITY",
        title: "High Deposit Volatility",
        description: "Deposit base shows significant fluctuations",
        impact: "MEDIUM",
        recommendation: "Review funding stability",
      });
    }

    return insights;
  }

  private async _calculateSummaryMetrics(analyses: any[]): Promise<Record<string, any>> {
    const totalDeposits = analyses.reduce(
      (sum, analysis) => sum + analysis.total_deposits,
      0
    );
    const totalAccounts = analyses.reduce(
      (sum, analysis) => sum + analysis.total_accounts,
      0
    );

    const depositComposition: Record<string, number> = {};
    const growthComposition: Record<string, number> = {};

    for (const analysis of analyses) {
      depositComposition[analysis.deposit_type] =
        analysis.total_deposits / totalDeposits;
      growthComposition[analysis.deposit_type] = analysis.growth_rate || 0;
    }

    return {
      total_deposits: totalDeposits,
      total_accounts: totalAccounts,
      average_balance: totalAccounts > 0 ? totalDeposits / totalAccounts : 0,
      deposit_composition: depositComposition,
      growth_composition: growthComposition,
    };
  }

  private async _createSurveillancePeriod(
    institutionId: number,
    periodType: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<typeof schema.surveillancePeriods.$inferSelect> {
    const newPeriod: typeof schema.surveillancePeriods.$inferInsert = {
      id: uuidv4(),
      institutionId: institutionId,
      periodType: periodType,
      periodStart: periodStart.toISOString().slice(0, 10),
      periodEnd: periodEnd.toISOString().slice(0, 10),
    };

    const [insertedPeriod] = await this.db
      .insert(schema.surveillancePeriods)
      .values(newPeriod);

    return insertedPeriod;
  }
}
