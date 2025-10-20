import { MySql2Database } from "drizzle-orm/mysql2";
import * as schema from "@shared/schema";
import { eq, and, sql, gte, lte } from "drizzle-orm";
import { v4 as uuidv4 } from 'uuid';
import {
  DepositType,
  AccountSize,
} from "@shared/types";
import { DepositAnalysisService } from "./deposit-analysis.js";

// Interface for the raw deposit data, similar to a pandas DataFrame row
interface RawDepositData {
  account_type: string;
  balance: number;
  currency: string;
  // Add other relevant fields from your CSV/Excel here
}

export class ExposureCalculationService {
  private db: MySql2Database<typeof schema>;
  private depositService: DepositAnalysisService;

  constructor(db: MySql2Database<typeof schema>) {
    this.db = db;
    this.depositService = new DepositAnalysisService(db);
  }

  async calculateExposure(
    institutionId: number,
    periodType: string,
    periodStart: Date,
    periodEnd: Date,
    coverLevel: number = 1000.0
  ): Promise<Record<string, any>> {
    const period = await this.depositService["_createSurveillancePeriod"](
      institutionId,
      periodType,
      periodStart,
      periodEnd
    );

    const depositData = await this.depositService["_extractDepositData"](
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
      const typeAnalysis = await this.depositService["_analyzeDepositType"](
        depositData,
        depositType,
        period.id
      );
      if (typeAnalysis) {
        analyses.push(typeAnalysis);
      }
    }

    const totalDeposits = analyses.reduce(
      (sum, analysis) => sum + analysis.total_deposits,
      0
    );

    const totalInsured = analyses.reduce(
      (sum, analysis) => sum + (analysis.total_deposits > coverLevel ? coverLevel : analysis.total_deposits),
      0
    ); // Simplified for now

    const totalUninsured = totalDeposits - totalInsured;
    const coverageRatio = totalDeposits > 0 ? (totalInsured / totalDeposits) * 100 : 0;

    const customerConcentration = this._calculateCustomerConcentration(depositData);
    const depositTypeConcentration = this._calculateDepositTypeConcentration(analyses, totalDeposits);
    const accountSizeConcentration = this._calculateAccountSizeConcentration(depositData);
    const currencyConcentration = this._calculateCurrencyConcentration(depositData);

    const riskScore = this._calculateRiskScore(
      coverageRatio,
      customerConcentration,
      depositTypeConcentration,
      accountSizeConcentration,
      currencyConcentration
    );

    const exposureCalculation: typeof schema.exposureCalculations.$inferInsert = {
      id: uuidv4(),
      institutionId: institutionId,
      periodId: period.id,
      totalDeposits: totalDeposits.toFixed(2),
      totalInsured: totalInsured.toFixed(2),
      totalUninsured: totalUninsured.toFixed(2),
      coverageRatio: coverageRatio.toFixed(2),
      customerConcentration: customerConcentration,
      depositTypeConcentration: depositTypeConcentration,
      accountSizeConcentration: accountSizeConcentration,
      currencyConcentration: currencyConcentration,
      riskScore: riskScore.toFixed(2),
    };

    await this.db.insert(schema.exposureCalculations).values(exposureCalculation);

    return {
      period: {
        id: period.id,
        type: periodType,
        start: periodStart.toISOString(),
        end: periodEnd.toISOString(),
      },
      total_deposits: totalDeposits,
      total_insured: totalInsured,
      total_uninsured: totalUninsured,
      coverage_ratio: coverageRatio,
      customer_concentration: customerConcentration,
      deposit_type_concentration: depositTypeConcentration,
      account_size_concentration: accountSizeConcentration,
      currency_concentration: currencyConcentration,
      risk_score: riskScore,
      calculation_date: new Date().toISOString(),
    };
  }

  private _calculateCustomerConcentration(depositData: RawDepositData[]): Record<string, any> {
    const customerBalances: Record<string, number> = {};
    depositData.forEach(d => {
      // Assuming 'customerId' exists in RawDepositData for customer-level aggregation
      // For now, using a placeholder for customerId based on account_type
      const customerId = d.account_type.includes("INDIVIDUAL") ? "individual" : "corporate";
      customerBalances[customerId] = (customerBalances[customerId] || 0) + d.balance;
    });

    const totalDeposits = depositData.reduce((sum, d) => sum + d.balance, 0);
    if (totalDeposits === 0) return {};

    const concentrations: Record<string, number> = {};
    for (const customerId in customerBalances) {
      concentrations[customerId] = (customerBalances[customerId] / totalDeposits) * 100;
    }

    // Simplified concentration metrics
    const sortedCustomers = Object.entries(customerBalances).sort(([, balanceA], [, balanceB]) => balanceB - balanceA);
    const top10Concentration = sortedCustomers.slice(0, 10).reduce((sum, [, balance]) => sum + balance, 0) / totalDeposits * 100;

    return {
      by_customer_type: concentrations,
      top_10_concentration: top10Concentration,
    };
  }

  private _calculateDepositTypeConcentration(analyses: any[], totalDeposits: number): Record<string, any> {
    const concentration: Record<string, number> = {};
    for (const analysis of analyses) {
      concentration[analysis.deposit_type] = (analysis.total_deposits / totalDeposits) * 100;
    }
    return concentration;
  }

  private _calculateAccountSizeConcentration(depositData: RawDepositData[]): Record<string, any> {
    const sizeCounts: Record<string, number> = {
      [AccountSize.SMALL]: 0,
      [AccountSize.MEDIUM]: 0,
      [AccountSize.LARGE]: 0,
    };
    const sizeBalances: Record<string, number> = {
      [AccountSize.SMALL]: 0,
      [AccountSize.MEDIUM]: 0,
      [AccountSize.LARGE]: 0,
    };

    depositData.forEach(d => {
      const balance = d.balance;
      if (balance < 10000) {
        sizeCounts[AccountSize.SMALL]++;
        sizeBalances[AccountSize.SMALL] += balance;
      } else if (balance < 100000) {
        sizeCounts[AccountSize.MEDIUM]++;
        sizeBalances[AccountSize.MEDIUM] += balance;
      } else {
        sizeCounts[AccountSize.LARGE]++;
        sizeBalances[AccountSize.LARGE] += balance;
      }
    });

    const totalDeposits = depositData.reduce((sum, d) => sum + d.balance, 0);
    const concentrations: Record<string, number> = {};
    for (const size in sizeBalances) {
      concentrations[size] = (sizeBalances[size] / totalDeposits) * 100;
    }

    return {
      by_size_category: concentrations,
      account_counts: sizeCounts,
    };
  }

  private _calculateCurrencyConcentration(depositData: RawDepositData[]): Record<string, any> {
    const currencyBalances: Record<string, number> = {};
    depositData.forEach(d => {
      currencyBalances[d.currency] = (currencyBalances[d.currency] || 0) + d.balance;
    });

    const totalDeposits = depositData.reduce((sum, d) => sum + d.balance, 0);
    if (totalDeposits === 0) return {};

    const concentrations: Record<string, number> = {};
    for (const currency in currencyBalances) {
      concentrations[currency] = (currencyBalances[currency] / totalDeposits) * 100;
    }

    return {
      by_currency: concentrations,
    };
  }

  private _calculateRiskScore(
    coverageRatio: number,
    customerConcentration: Record<string, any>,
    depositTypeConcentration: Record<string, any>,
    accountSizeConcentration: Record<string, any>,
    currencyConcentration: Record<string, any>
  ): number {
    let riskScore = 0;

    // Lower coverage ratio means higher risk
    riskScore += (100 - coverageRatio) * 0.2; // 20% weight

    // Customer concentration
    const top10Concentration = customerConcentration.top_10_concentration || 0;
    riskScore += top10Concentration * 0.3; // 30% weight

    // Deposit type concentration (e.g., high concentration in one type is risky)
    const maxDepositTypeConcentration = Math.max(...Object.values(depositTypeConcentration));
    riskScore += maxDepositTypeConcentration * 0.2; // 20% weight

    // Account size concentration (e.g., high concentration in large accounts is risky)
    const maxAccountSizeConcentration = Math.max(...Object.values(accountSizeConcentration.by_size_category));
    riskScore += maxAccountSizeConcentration * 0.15; // 15% weight

    // Currency concentration (e.g., high concentration in one currency is risky)
    const maxCurrencyConcentration = Math.max(...Object.values(currencyConcentration.by_currency));
    riskScore += maxCurrencyConcentration * 0.15; // 15% weight

    // Normalize risk score to a 0-100 scale (example, adjust as needed)
    return Math.min(100, riskScore);
  }
}
