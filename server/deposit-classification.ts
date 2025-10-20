import { MySql2Database } from "drizzle-orm/mysql2";
import * as schema from "@shared/schema";
import { Account, DepositClassificationResult, TrendAnalysisResult } from "@shared/types";

export class DepositClassificationEngine {
  private coverLevel: number;
  private sizeCategories = {
    small: { min: 0, max: 1000 },
    medium: { min: 1000, max: 5000 },
    large: { min: 5000, max: Infinity },
  };

  constructor(coverLevel: number = 5000) {
    this.coverLevel = coverLevel;
  }

  classifyDeposits(
    accounts: Account[],
    period: string,
    bankId: number
  ): DepositClassificationResult {
    const accountsWithNumericBalance = accounts.map((account) => ({
      ...account,
      balance_numeric: account.balance || 0,
    }));

    const byCustomerType = this._classifyByCustomerType(
      accountsWithNumericBalance
    );
    const byAccountType = this._classifyByAccountType(
      accountsWithNumericBalance
    );
    const byCurrency = this._classifyByCurrency(accountsWithNumericBalance);
    const bySize = this._classifyBySize(accountsWithNumericBalance);
    const exposure = this._calculateExposure(accountsWithNumericBalance);
    const accountCounts = this._countAccounts(accountsWithNumericBalance);

    const totalDeposits = accountsWithNumericBalance.reduce(
      (sum, account) => sum + account.balance_numeric,
      0
    );

    return {
      bank_id: bankId,
      period: period,
      total_deposits: totalDeposits,
      individual_deposits: byCustomerType.individual,
      corporate_deposits: byCustomerType.corporate,
      savings_deposits: byAccountType.Savings || 0,
      current_deposits: byAccountType.Current || 0,
      fixed_deposits: byAccountType["Fixed Deposit"] || 0,
      usd_deposits: byCurrency.USD || 0,
      local_currency_deposits: byCurrency.ZWL || 0,
      other_currency_deposits: byCurrency.other || 0,
      small_deposits: bySize.small,
      medium_deposits: bySize.medium,
      large_deposits: bySize.large,
      total_accounts: accountCounts.total,
      individual_accounts: accountCounts.individual,
      corporate_accounts: accountCounts.corporate,
      total_exposure: exposure.total,
      individual_exposure: exposure.individual,
      corporate_exposure: exposure.corporate,
      cover_level: this.coverLevel,
    };
  }

  private _classifyByCustomerType(accounts: Account[]): Record<string, number> {
    let individualDeposits = 0;
    let corporateDeposits = 0;

    const individualAccounts = accounts.filter(
      (account) => account.customer_type === "Individual"
    );
    const corporateAccounts = accounts.filter(
      (account) => account.customer_type === "Corporate"
    );

    individualDeposits = individualAccounts.reduce(
      (sum, account) => sum + account.balance,
      0
    );
    corporateDeposits = corporateAccounts.reduce(
      (sum, account) => sum + account.balance,
      0
    );

    return {
      individual: individualDeposits,
      corporate: corporateDeposits,
    };
  }

  private _classifyByAccountType(accounts: Account[]): Record<string, number> {
    const accountTypeSums: Record<string, number> = {};
    accounts.forEach((account) => {
      if (account.account_type) {
        accountTypeSums[account.account_type] =
          (accountTypeSums[account.account_type] || 0) + account.balance;
      }
    });
    return accountTypeSums;
  }

  private _classifyByCurrency(accounts: Account[]): Record<string, number> {
    let usdDeposits = 0;
    let zwlDeposits = 0;
    let otherDeposits = 0;

    accounts.forEach((account) => {
      if (account.currency === "USD") {
        usdDeposits += account.balance;
      } else if (account.currency === "ZWL") {
        zwlDeposits += account.balance;
      } else {
        otherDeposits += account.balance;
      }
    });

    return {
      USD: usdDeposits,
      ZWL: zwlDeposits,
      other: otherDeposits,
    };
  }

  private _classifyBySize(accounts: Account[]): Record<string, number> {
    let smallDeposits = 0;
    let mediumDeposits = 0;
    let largeDeposits = 0;

    accounts.forEach((account) => {
      if (account.balance < this.sizeCategories.small.max) {
        smallDeposits += account.balance;
      } else if (
        account.balance >= this.sizeCategories.medium.min &&
        account.balance < this.sizeCategories.medium.max
      ) {
        mediumDeposits += account.balance;
      } else if (account.balance >= this.sizeCategories.large.min) {
        largeDeposits += account.balance;
      }
    });

    return {
      small: smallDeposits,
      medium: mediumDeposits,
      large: largeDeposits,
    };
  }

  private _calculateExposure(accounts: Account[]): Record<string, number> {
    const accountsWithInsuredAmount = accounts.map((account) => ({
      ...account,
      insured_amount: Math.min(account.balance, this.coverLevel),
    }));

    const totalExposure = accountsWithInsuredAmount.reduce(
      (sum, account) => sum + account.insured_amount,
      0
    );

    let individualExposure = 0;
    let corporateExposure = 0;

    const individualAccounts = accountsWithInsuredAmount.filter(
      (account) => account.customer_type === "Individual"
    );
    const corporateAccounts = accountsWithInsuredAmount.filter(
      (account) => account.customer_type === "Corporate"
    );

    individualExposure = individualAccounts.reduce(
      (sum, account) => sum + account.insured_amount,
      0
    );
    corporateExposure = corporateAccounts.reduce(
      (sum, account) => sum + account.insured_amount,
      0
    );

    return {
      total: totalExposure,
      individual: individualExposure,
      corporate: corporateExposure,
    };
  }

  private _countAccounts(accounts: Account[]): Record<string, number> {
    const totalAccounts = accounts.length;

    const individualAccounts = accounts.filter(
      (account) => account.customer_type === "Individual"
    ).length;
    const corporateAccounts = accounts.filter(
      (account) => account.customer_type === "Corporate"
    ).length;

    return {
      total: totalAccounts,
      individual: individualAccounts,
      corporate: corporateAccounts,
    };
  }

  analyzeTrends(
    currentPeriodData: DepositClassificationResult,
    previousPeriodData: DepositClassificationResult | null = null
  ): TrendAnalysisResult {
    if (previousPeriodData === null) {
      return {
        deposit_growth: 0.0,
        account_growth: 0.0,
        exposure_growth: 0.0,
        trends: [],
      };
    }

    const currentDeposits = currentPeriodData.total_deposits || 0;
    const previousDeposits = previousPeriodData.total_deposits || 1;

    const depositGrowth =
      previousDeposits > 0
        ? ((currentDeposits - previousDeposits) / previousDeposits) * 100
        : 0;

    const currentAccounts = currentPeriodData.total_accounts || 0;
    const previousAccounts = previousPeriodData.total_accounts || 1;

    const accountGrowth =
      previousAccounts > 0
        ? ((currentAccounts - previousAccounts) / previousAccounts) * 100
        : 0;

    const currentExposure = currentPeriodData.total_exposure || 0;
    const previousExposure = previousPeriodData.total_exposure || 1;

    const exposureGrowth =
      previousExposure > 0
        ? ((currentExposure - previousExposure) / previousExposure) * 100
        : 0;

    const trends: Array<{ metric: string; trend: string; change: number }> = [];

    if (depositGrowth > 10) {
      trends.push({
        metric: "Deposits",
        trend: "Strong Growth",
        change: depositGrowth,
      });
    } else if (depositGrowth > 5) {
      trends.push({
        metric: "Deposits",
        trend: "Moderate Growth",
        change: depositGrowth,
      });
    } else if (depositGrowth < -5) {
      trends.push({
        metric: "Deposits",
        trend: "Declining",
        change: depositGrowth,
      });
    } else {
      trends.push({
        metric: "Deposits",
        trend: "Stable",
        change: depositGrowth,
      });
    }

    if (accountGrowth > 10) {
      trends.push({
        metric: "Accounts",
        trend: "Strong Growth",
        change: accountGrowth,
      });
    } else if (accountGrowth < -5) {
      trends.push({
        metric: "Accounts",
        trend: "Declining",
        change: accountGrowth,
      });
    }

    return {
      deposit_growth: parseFloat(depositGrowth.toFixed(2)),
      account_growth: parseFloat(accountGrowth.toFixed(2)),
      exposure_growth: parseFloat(exposureGrowth.toFixed(2)),
      trends: trends,
    };
  }
}
