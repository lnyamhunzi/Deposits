import * as schema from "@shared/schema";
import { v4 as uuidv4 } from "uuid";
import {
  DepositType,
  AccountSize
} from "@shared/types";
import { DepositAnalysisService } from "./deposit-analysis";
class ExposureCalculationService {
  db;
  depositService;
  constructor(db) {
    this.db = db;
    this.depositService = new DepositAnalysisService(db);
  }
  async calculateExposure(institutionId, periodType, periodStart, periodEnd, coverLevel = 1e3) {
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
    const analyses = [];
    for (const depositTypeKey in DepositType) {
      const depositType = DepositType[depositTypeKey];
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
    );
    const totalUninsured = totalDeposits - totalInsured;
    const coverageRatio = totalDeposits > 0 ? totalInsured / totalDeposits * 100 : 0;
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
    const exposureCalculation = {
      id: uuidv4(),
      institutionId,
      periodId: period.id,
      totalDeposits: totalDeposits.toFixed(2),
      totalInsured: totalInsured.toFixed(2),
      totalUninsured: totalUninsured.toFixed(2),
      coverageRatio: coverageRatio.toFixed(2),
      customerConcentration,
      depositTypeConcentration,
      accountSizeConcentration,
      currencyConcentration,
      riskScore: riskScore.toFixed(2)
    };
    await this.db.insert(schema.exposureCalculations).values(exposureCalculation);
    return {
      period: {
        id: period.id,
        type: periodType,
        start: periodStart.toISOString(),
        end: periodEnd.toISOString()
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
      calculation_date: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  _calculateCustomerConcentration(depositData) {
    const customerBalances = {};
    depositData.forEach((d) => {
      const customerId = d.account_type.includes("INDIVIDUAL") ? "individual" : "corporate";
      customerBalances[customerId] = (customerBalances[customerId] || 0) + d.balance;
    });
    const totalDeposits = depositData.reduce((sum, d) => sum + d.balance, 0);
    if (totalDeposits === 0) return {};
    const concentrations = {};
    for (const customerId in customerBalances) {
      concentrations[customerId] = customerBalances[customerId] / totalDeposits * 100;
    }
    const sortedCustomers = Object.entries(customerBalances).sort(([, balanceA], [, balanceB]) => balanceB - balanceA);
    const top10Concentration = sortedCustomers.slice(0, 10).reduce((sum, [, balance]) => sum + balance, 0) / totalDeposits * 100;
    return {
      by_customer_type: concentrations,
      top_10_concentration: top10Concentration
    };
  }
  _calculateDepositTypeConcentration(analyses, totalDeposits) {
    const concentration = {};
    for (const analysis of analyses) {
      concentration[analysis.deposit_type] = analysis.total_deposits / totalDeposits * 100;
    }
    return concentration;
  }
  _calculateAccountSizeConcentration(depositData) {
    const sizeCounts = {
      [AccountSize.SMALL]: 0,
      [AccountSize.MEDIUM]: 0,
      [AccountSize.LARGE]: 0
    };
    const sizeBalances = {
      [AccountSize.SMALL]: 0,
      [AccountSize.MEDIUM]: 0,
      [AccountSize.LARGE]: 0
    };
    depositData.forEach((d) => {
      const balance = d.balance;
      if (balance < 1e4) {
        sizeCounts[AccountSize.SMALL]++;
        sizeBalances[AccountSize.SMALL] += balance;
      } else if (balance < 1e5) {
        sizeCounts[AccountSize.MEDIUM]++;
        sizeBalances[AccountSize.MEDIUM] += balance;
      } else {
        sizeCounts[AccountSize.LARGE]++;
        sizeBalances[AccountSize.LARGE] += balance;
      }
    });
    const totalDeposits = depositData.reduce((sum, d) => sum + d.balance, 0);
    const concentrations = {};
    for (const size in sizeBalances) {
      concentrations[size] = sizeBalances[size] / totalDeposits * 100;
    }
    return {
      by_size_category: concentrations,
      account_counts: sizeCounts
    };
  }
  _calculateCurrencyConcentration(depositData) {
    const currencyBalances = {};
    depositData.forEach((d) => {
      currencyBalances[d.currency] = (currencyBalances[d.currency] || 0) + d.balance;
    });
    const totalDeposits = depositData.reduce((sum, d) => sum + d.balance, 0);
    if (totalDeposits === 0) return {};
    const concentrations = {};
    for (const currency in currencyBalances) {
      concentrations[currency] = currencyBalances[currency] / totalDeposits * 100;
    }
    return {
      by_currency: concentrations
    };
  }
  _calculateRiskScore(coverageRatio, customerConcentration, depositTypeConcentration, accountSizeConcentration, currencyConcentration) {
    let riskScore = 0;
    riskScore += (100 - coverageRatio) * 0.2;
    const top10Concentration = customerConcentration.top_10_concentration || 0;
    riskScore += top10Concentration * 0.3;
    const maxDepositTypeConcentration = Math.max(...Object.values(depositTypeConcentration));
    riskScore += maxDepositTypeConcentration * 0.2;
    const maxAccountSizeConcentration = Math.max(...Object.values(accountSizeConcentration.by_size_category));
    riskScore += maxAccountSizeConcentration * 0.15;
    const maxCurrencyConcentration = Math.max(...Object.values(currencyConcentration.by_currency));
    riskScore += maxCurrencyConcentration * 0.15;
    return Math.min(100, riskScore);
  }
}
export {
  ExposureCalculationService
};
