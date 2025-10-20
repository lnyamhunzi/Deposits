import * as schema from "@shared/schema";
import { eq, and, inArray } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
class BalanceAggregationService {
  db;
  coverLevel;
  constructor(db, coverLevel = 1e3) {
    this.db = db;
    this.coverLevel = coverLevel;
  }
  async aggregateCustomerBalances(institutionId, periodId, coverLevel = 1e3) {
    const scvUploadsForPeriod = await this.db.select({ id: schema.scvUploads.id }).from(schema.scvUploads).where(
      and(
        eq(schema.scvUploads.periodId, periodId),
        eq(schema.scvUploads.institutionId, institutionId)
      )
    );
    const scvUploadIds = scvUploadsForPeriod.map((upload) => upload.id);
    const accounts = await this.db.select().from(schema.customerAccounts).where(
      and(
        eq(schema.customerAccounts.institutionId, institutionId),
        inArray(schema.customerAccounts.scvUploadId, scvUploadIds)
      )
    );
    const customerAggregates = await this._aggregateByCustomer(accounts);
    const exposureCalculations = [];
    for (const customerId in customerAggregates) {
      const aggregate2 = customerAggregates[customerId];
      const exposure = await this._calculateCustomerExposure(
        customerId,
        aggregate2,
        coverLevel,
        institutionId,
        periodId
      );
      exposureCalculations.push(exposure);
    }
    const overallExposure = await this._calculateOverallExposure(
      exposureCalculations
    );
    return {
      institution_id: institutionId,
      period_id: periodId,
      cover_level: coverLevel,
      total_customers: Object.keys(customerAggregates).length,
      total_exposure: overallExposure.total_deposits,
      // This needs to be refined based on what total_exposure should be
      customer_exposures: exposureCalculations.map((exp) => ({
        customer_id: exp.customerId,
        customer_name: aggregate.customer_name,
        // This needs to be fetched from aggregate or customerAccounts
        total_balance: exp.totalBalance,
        insured_amount: exp.insuredAmount,
        uninsured_amount: exp.uninsuredAmount,
        cover_level: exp.coverLevel,
        concentration_risk: exp.concentrationRisk
      })),
      aggregation_metrics: await this._calculateAggregationMetrics(
        customerAggregates
      )
    };
  }
  async _aggregateByCustomer(accounts) {
    const customerAggregates = {};
    for (const account of accounts) {
      if (!customerAggregates[account.customerId]) {
        customerAggregates[account.customerId] = {
          customer_name: account.customerName,
          customer_type: account.customerType,
          total_balance: 0,
          accounts: [],
          currency_breakdown: {},
          account_type_breakdown: {},
          max_account_balance: 0
        };
      }
      const aggregate2 = customerAggregates[account.customerId];
      aggregate2.total_balance += account.balance;
      aggregate2.accounts.push(account);
      const currency = account.currency;
      if (!aggregate2.currency_breakdown[currency]) {
        aggregate2.currency_breakdown[currency] = 0;
      }
      aggregate2.currency_breakdown[currency] += account.balance;
      const accountType = account.accountType;
      if (!aggregate2.account_type_breakdown[accountType]) {
        aggregate2.account_type_breakdown[accountType] = 0;
      }
      aggregate2.account_type_breakdown[accountType] += account.balance;
      if (account.balance > aggregate2.max_account_balance) {
        aggregate2.max_account_balance = account.balance;
      }
    }
    return customerAggregates;
  }
  async _calculateCustomerExposure(customerId, aggregate2, coverLevel, institutionId, periodId) {
    const totalBalance = aggregate2.total_balance;
    let insuredAmount;
    if (aggregate2.customer_type === "INDIVIDUAL") {
      insuredAmount = await this._calculateIndividualInsurance(
        aggregate2,
        coverLevel
      );
    } else if (aggregate2.customer_type === "JOINT") {
      insuredAmount = await this._calculateJointInsurance(
        aggregate2,
        coverLevel
      );
    } else if (aggregate2.customer_type === "TRUST") {
      insuredAmount = await this._calculateTrustInsurance(
        aggregate2,
        coverLevel
      );
    } else {
      insuredAmount = await this._calculateCorporateInsurance(
        aggregate2,
        coverLevel
      );
    }
    const uninsuredAmount = totalBalance - insuredAmount;
    const actualCoverLevel = totalBalance > 0 ? insuredAmount / totalBalance * 100 : 0;
    const concentrationRisk = await this._calculateConcentrationRisk(aggregate2);
    const representativeAccount = aggregate2.accounts[0] || null;
    const exposure = {
      id: uuidv4(),
      customerId,
      institutionId,
      periodId,
      customerAccountId: representativeAccount ? representativeAccount.id : null,
      totalBalance,
      insuredAmount,
      uninsuredAmount,
      coverLevel: actualCoverLevel,
      concentrationRisk,
      customerRiskCategory: await this._assessCustomerRisk(aggregate2)
    };
    await this.db.insert(schema.customerExposures).values(exposure);
    return exposure;
  }
  async _calculateIndividualInsurance(aggregate2, coverLevel) {
    return Math.min(aggregate2.total_balance, coverLevel);
  }
  async _calculateJointInsurance(aggregate2, coverLevel) {
    const uniqueHolders = /* @__PURE__ */ new Set();
    for (const account of aggregate2.accounts) {
      if (account.jointHolders) {
        for (const holder of account.jointHolders) {
          uniqueHolders.add(holder.name);
        }
      } else {
        uniqueHolders.add("holder_1");
        uniqueHolders.add("holder_2");
      }
    }
    const totalCoverage = coverLevel * uniqueHolders.size;
    return Math.min(aggregate2.total_balance, totalCoverage);
  }
  async _calculateTrustInsurance(aggregate2, coverLevel) {
    const uniqueBeneficiaries = /* @__PURE__ */ new Set();
    for (const account of aggregate2.accounts) {
      if (account.trustBeneficiaries) {
        for (const beneficiary of account.trustBeneficiaries) {
          uniqueBeneficiaries.add(beneficiary.name);
        }
      } else {
        uniqueBeneficiaries.add("beneficiary_1");
      }
    }
    const totalCoverage = coverLevel * uniqueBeneficiaries.size;
    return Math.min(aggregate2.total_balance, totalCoverage);
  }
  async _calculateCorporateInsurance(aggregate2, coverLevel) {
    const coveragePercentage = 0.8;
    return aggregate2.total_balance * coveragePercentage;
  }
  async _calculateConcentrationRisk(aggregate2) {
    const totalBalance = aggregate2.total_balance;
    if (totalBalance === 0) {
      return 0;
    }
    const maxAccountRatio = aggregate2.max_account_balance / totalBalance;
    const maxCurrencyShare = Object.keys(aggregate2.currency_breakdown).length > 0 ? Math.max(...Object.values(aggregate2.currency_breakdown)) / totalBalance : 1;
    const maxAccountTypeShare = Object.keys(aggregate2.account_type_breakdown).length > 0 ? Math.max(...Object.values(aggregate2.account_type_breakdown)) / totalBalance : 1;
    const concentrationRisk = maxAccountRatio * 0.4 + maxCurrencyShare * 0.3 + maxAccountTypeShare * 0.3;
    return concentrationRisk;
  }
  async _assessCustomerRisk(aggregate2) {
    const totalBalance = aggregate2.total_balance;
    const concentrationRisk = await this._calculateConcentrationRisk(aggregate2);
    if (totalBalance > 1e6 || concentrationRisk > 0.8) {
      return "HIGH_RISK";
    } else if (totalBalance > 1e5 || concentrationRisk > 0.5) {
      return "MEDIUM_RISK";
    } else {
      return "LOW_RISK";
    }
  }
  async _calculateOverallExposure(exposures) {
    const totalInsured = exposures.reduce(
      (sum, exp) => sum + exp.insuredAmount,
      0
    );
    const totalDeposits = exposures.reduce(
      (sum, exp) => sum + exp.totalBalance,
      0
    );
    const totalUninsured = totalDeposits - totalInsured;
    const customerConcentration = await this._calculateCustomerConcentration(
      exposures
    );
    return {
      total_deposits: totalDeposits,
      total_insured: totalInsured,
      total_uninsured: totalUninsured,
      coverage_ratio: totalDeposits > 0 ? totalInsured / totalDeposits * 100 : 0,
      customer_concentration: customerConcentration
    };
  }
  async _calculateCustomerConcentration(exposures) {
    if (!exposures.length) {
      return {};
    }
    const totalDeposits = exposures.reduce(
      (sum, exp) => sum + exp.totalBalance,
      0
    );
    const sortedExposures = [...exposures].sort(
      (a, b) => b.totalBalance - a.totalBalance
    );
    const top10Deposits = sortedExposures.slice(0, 10).reduce((sum, exp) => sum + exp.totalBalance, 0);
    const top10Concentration = totalDeposits > 0 ? top10Deposits / totalDeposits * 100 : 0;
    const hhi = totalDeposits > 0 ? exposures.reduce(
      (sum, exp) => sum + (exp.totalBalance / totalDeposits) ** 2,
      0
    ) : 0;
    return {
      top_10_concentration: top10Concentration,
      hhi_index: hhi,
      largest_customer_share: totalDeposits > 0 ? sortedExposures[0].totalBalance / totalDeposits * 100 : 0,
      customer_count_by_size: await this._categorizeCustomersBySize(exposures)
    };
  }
  async _categorizeCustomersBySize(exposures) {
    const categories = {
      small: 0,
      // < $10,000
      medium: 0,
      // $10,000 - $100,000
      large: 0,
      // $100,000 - $1,000,000
      very_large: 0
      // > $1,000,000
    };
    for (const exp of exposures) {
      const balance = exp.totalBalance;
      if (balance < 1e4) {
        categories.small += 1;
      } else if (balance < 1e5) {
        categories.medium += 1;
      } else if (balance < 1e6) {
        categories.large += 1;
      } else {
        categories.very_large += 1;
      }
    }
    return categories;
  }
  async _calculateAggregationMetrics(customerAggregates) {
    const totalCustomers = Object.keys(customerAggregates).length;
    const totalAccounts = Object.values(customerAggregates).reduce(
      (sum, agg) => sum + agg.accounts.length,
      0
    );
    const avgAccountsPerCustomer = totalCustomers > 0 ? totalAccounts / totalCustomers : 0;
    const balances = Object.values(customerAggregates).map(
      (agg) => agg.total_balance
    );
    const sortedBalances = [...balances].sort((a, b) => a - b);
    const medianBalance = sortedBalances.length > 0 ? sortedBalances[Math.floor(sortedBalances.length / 2)] : 0;
    return {
      total_customers: totalCustomers,
      total_accounts: totalAccounts,
      accounts_per_customer: avgAccountsPerCustomer,
      average_balance: balances.length > 0 ? balances.reduce((a, b) => a + b, 0) / balances.length : 0,
      median_balance: medianBalance,
      max_balance: balances.length > 0 ? Math.max(...balances) : 0,
      min_balance: balances.length > 0 ? Math.min(...balances) : 0
    };
  }
}
export {
  BalanceAggregationService
};
