import * as schema from "@shared/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import {
  DepositType,
  AccountSize
} from "@shared/types";
class DepositAnalysisService {
  db;
  constructor(db) {
    this.db = db;
  }
  async analyzeDeposits(institutionId, periodType, periodStart, periodEnd) {
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
    const analyses = [];
    for (const depositTypeKey in DepositType) {
      const depositType = DepositType[depositTypeKey];
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
        end: periodEnd.toISOString()
      },
      analyses,
      trends,
      insights,
      summary_metrics: await this._calculateSummaryMetrics(analyses),
      analysis_date: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  async _extractDepositData(institutionId, periodStart, periodEnd) {
    const returnRecord = await this.db.query.returns.findFirst({
      where: and(
        eq(schema.returns.institutionId, institutionId),
        eq(schema.returns.returnPeriod, periodStart.toISOString().slice(0, 10)),
        // Assuming returnPeriod is YYYY-MM-DD
        eq(schema.returns.status, "SUBMITTED")
      )
    });
    if (!returnRecord || !returnRecord.fileName) {
      return null;
    }
    return [
      { account_type: "SAVINGS", balance: 1e3, currency: "USD" },
      { account_type: "CHECKING", balance: 2500, currency: "USD" },
      { account_type: "CORPORATE", balance: 15e3, currency: "USD" },
      { account_type: "INDIVIDUAL", balance: 500, currency: "ZWL" },
      { account_type: "SAVINGS", balance: 3e3, currency: "USD" },
      { account_type: "CORPORATE", balance: 2e4, currency: "ZWL" }
    ];
  }
  async _analyzeDepositType(depositData, depositType, periodId) {
    let typeData = [];
    if (depositType === DepositType.INDIVIDUAL) {
      typeData = depositData.filter(
        (d) => ["SAVINGS", "CHECKING", "INDIVIDUAL"].includes(d.account_type)
      );
    } else if (depositType === DepositType.CORPORATE) {
      typeData = depositData.filter(
        (d) => ["CORPORATE", "BUSINESS"].includes(d.account_type)
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
    const averageBalance = totalAccounts > 0 ? totalDeposits / totalAccounts : 0;
    const currencyBreakdown = this._calculateCurrencyBreakdown(typeData);
    const accountSizeBreakdown = this._calculateAccountSizeBreakdown(typeData);
    const productBreakdown = this._calculateProductBreakdown(typeData);
    const growthRate = await this._calculateGrowthRate(
      depositType,
      totalDeposits,
      periodId
    );
    const analysis = {
      id: uuidv4(),
      periodId,
      depositType,
      totalDeposits: totalDeposits.toFixed(2),
      // Convert to string for decimal type
      totalAccounts,
      averageBalance: averageBalance.toFixed(2),
      // Convert to string for decimal type
      growthRate: growthRate ? growthRate.toFixed(2) : null,
      // Convert to string for decimal type
      currencyBreakdown,
      accountSizeBreakdown,
      productBreakdown
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
      )
    };
  }
  _calculateCurrencyBreakdown(data) {
    const currencyTotals = {};
    data.forEach((d) => {
      currencyTotals[d.currency] = (currencyTotals[d.currency] || 0) + d.balance;
    });
    return currencyTotals;
  }
  _calculateAccountSizeBreakdown(data) {
    const sizeCounts = {
      [AccountSize.SMALL]: 0,
      [AccountSize.MEDIUM]: 0,
      [AccountSize.LARGE]: 0
    };
    data.forEach((d) => {
      const balance = d.balance;
      if (balance < 1e4) {
        sizeCounts[AccountSize.SMALL]++;
      } else if (balance < 1e5) {
        sizeCounts[AccountSize.MEDIUM]++;
      } else {
        sizeCounts[AccountSize.LARGE]++;
      }
    });
    return sizeCounts;
  }
  _calculateProductBreakdown(data) {
    const productTotals = {};
    data.forEach((d) => {
      productTotals[d.account_type] = (productTotals[d.account_type] || 0) + d.balance;
    });
    return productTotals;
  }
  async _calculateGrowthRate(depositType, currentTotal, periodId) {
    return Math.random() * 0.2 - 0.05;
  }
  async _calculateMarketShare(depositType, institutionDeposits) {
    const industryTotals = {
      [DepositType.INDIVIDUAL]: 5e9,
      [DepositType.CORPORATE]: 3e9,
      [DepositType.GOVERNMENT]: 1e9,
      [DepositType.JOINT]: 5e8,
      [DepositType.TRUST]: 3e8
    };
    const industryTotal = industryTotals[depositType] || 1e9;
    return institutionDeposits / industryTotal * 100;
  }
  async _calculateDepositTrends(institutionId, periodStart, periodEnd) {
    const historicalPeriods = await this.db.query.surveillancePeriods.findMany({
      where: and(
        eq(schema.surveillancePeriods.institutionId, institutionId),
        lte(schema.surveillancePeriods.periodEnd, periodEnd),
        gte(
          schema.surveillancePeriods.periodEnd,
          new Date(periodEnd.getTime() - 365 * 24 * 60 * 60 * 1e3)
          // Last 12 months
        )
      ),
      orderBy: schema.surveillancePeriods.periodEnd
    });
    const trends = {
      total_deposits: [],
      account_growth: [],
      composition_changes: [],
      volatility_metrics: {}
    };
    for (const period of historicalPeriods) {
      const analyses = await this.db.query.depositAnalyses.findMany({
        where: eq(schema.depositAnalyses.periodId, period.id)
      });
      const totalDeposits = analyses.reduce(
        (sum, analysis) => sum + parseFloat(analysis.totalDeposits),
        0
      );
      const totalAccounts = analyses.reduce(
        (sum, analysis) => sum + analysis.totalAccounts,
        0
      );
      trends.total_deposits.push({
        period: period.periodEnd.toISOString(),
        value: totalDeposits
      });
      trends.account_growth.push({
        period: period.periodEnd.toISOString(),
        value: totalAccounts
      });
    }
    if (trends.total_deposits.length > 1) {
      const depositsSeries = trends.total_deposits.map((item) => item.value);
      const mean = depositsSeries.reduce((a, b) => a + b, 0) / depositsSeries.length;
      const stdDev = Math.sqrt(
        depositsSeries.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / depositsSeries.length
      );
      trends.volatility_metrics = {
        std_deviation: stdDev,
        coefficient_of_variation: mean !== 0 ? stdDev / mean : 0,
        max_drawdown: this._calculateMaxDrawdown(depositsSeries)
      };
    }
    return trends;
  }
  _calculateMaxDrawdown(series) {
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
  async _generateDepositInsights(analyses, trends) {
    const insights = [];
    const totalDeposits = analyses.reduce(
      (sum, analysis) => sum + analysis.total_deposits,
      0
    );
    const corporateDeposits = analyses.find(
      (a) => a.deposit_type === DepositType.CORPORATE
    );
    if (corporateDeposits && corporateDeposits.growth_rate && corporateDeposits.growth_rate > 0.1) {
      insights.push({
        type: "POSITIVE",
        category: "GROWTH",
        title: "Strong Corporate Deposit Growth",
        description: `Corporate deposits growing at ${(corporateDeposits.growth_rate * 100).toFixed(1)}%`,
        impact: "MEDIUM",
        recommendation: "Monitor concentration risks"
      });
    }
    const largestType = analyses.reduce(
      (prev, current) => prev.total_deposits > current.total_deposits ? prev : current
    );
    if (largestType.total_deposits / totalDeposits > 0.6) {
      insights.push({
        type: "WARNING",
        category: "CONCENTRATION",
        title: "High Deposit Concentration",
        description: `${largestType.deposit_type} deposits represent ${(largestType.total_deposits / totalDeposits * 100).toFixed(1)}% of total`,
        impact: "HIGH",
        recommendation: "Diversify deposit base"
      });
    }
    if (trends.volatility_metrics && trends.volatility_metrics.coefficient_of_variation > 0.15) {
      insights.push({
        type: "WARNING",
        category: "VOLATILITY",
        title: "High Deposit Volatility",
        description: "Deposit base shows significant fluctuations",
        impact: "MEDIUM",
        recommendation: "Review funding stability"
      });
    }
    return insights;
  }
  async _calculateSummaryMetrics(analyses) {
    const totalDeposits = analyses.reduce(
      (sum, analysis) => sum + analysis.total_deposits,
      0
    );
    const totalAccounts = analyses.reduce(
      (sum, analysis) => sum + analysis.total_accounts,
      0
    );
    const depositComposition = {};
    const growthComposition = {};
    for (const analysis of analyses) {
      depositComposition[analysis.deposit_type] = analysis.total_deposits / totalDeposits;
      growthComposition[analysis.deposit_type] = analysis.growth_rate || 0;
    }
    return {
      total_deposits: totalDeposits,
      total_accounts: totalAccounts,
      average_balance: totalAccounts > 0 ? totalDeposits / totalAccounts : 0,
      deposit_composition: depositComposition,
      growth_composition: growthComposition
    };
  }
  async _createSurveillancePeriod(institutionId, periodType, periodStart, periodEnd) {
    const newPeriod = {
      id: uuidv4(),
      institutionId,
      periodType,
      periodStart: periodStart.toISOString().slice(0, 10),
      periodEnd: periodEnd.toISOString().slice(0, 10)
    };
    const [insertedPeriod] = await this.db.insert(schema.surveillancePeriods).values(newPeriod);
    return insertedPeriod;
  }
}
export {
  DepositAnalysisService
};
