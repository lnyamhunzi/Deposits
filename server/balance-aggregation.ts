import { MySql2Database } from "drizzle-orm/mysql2";
import * as schema from "@shared/schema";
import { eq, and, inArray } from "drizzle-orm";
import { CustomerAccount, CustomerExposure, SCVUpload } from "@shared/schema";
import { v4 as uuidv4 } from 'uuid';

// Assuming CustomerExposureResponse is a type defined elsewhere or will be defined here
interface CustomerExposureResponse {
  customer_id: string;
  customer_name: string;
  total_balance: number;
  insured_amount: number;
  uninsured_amount: number;
  cover_level: number;
  concentration_risk: number;
}

export class BalanceAggregationService {
  private db: MySql2Database<typeof schema>;
  private coverLevel: number;

  constructor(db: MySql2Database<typeof schema>, coverLevel: number = 1000.0) {
    this.db = db;
    this.coverLevel = coverLevel;
  }

  async aggregateCustomerBalances(
    institutionId: number,
    periodId: string,
    coverLevel: number = 1000.0
  ): Promise<Record<string, any>> {
    // Get all customer accounts for the period
    const scvUploadsForPeriod = await this.db
      .select({ id: schema.scvUploads.id })
      .from(schema.scvUploads)
      .where(
        and(
          eq(schema.scvUploads.periodId, periodId),
          eq(schema.scvUploads.institutionId, institutionId)
        )
      );

    const scvUploadIds = scvUploadsForPeriod.map((upload) => upload.id);

    const accounts = await this.db
      .select()
      .from(schema.customerAccounts)
      .where(
        and(
          eq(schema.customerAccounts.institutionId, institutionId),
          inArray(schema.customerAccounts.scvUploadId, scvUploadIds)
        )
      );

    // Group by customer
    const customerAggregates = await this._aggregateByCustomer(accounts);

    // Calculate exposure for each customer
    const exposureCalculations: CustomerExposure[] = [];
    for (const customerId in customerAggregates) {
      const aggregate = customerAggregates[customerId];
      const exposure = await this._calculateCustomerExposure(
        customerId,
        aggregate,
        coverLevel,
        institutionId,
        periodId
      );
      exposureCalculations.push(exposure);
    }

    // Calculate overall metrics
    const overallExposure = await this._calculateOverallExposure(
      exposureCalculations
    );

    return {
      institution_id: institutionId,
      period_id: periodId,
      cover_level: coverLevel,
      total_customers: Object.keys(customerAggregates).length,
      total_exposure: overallExposure.total_deposits, // This needs to be refined based on what total_exposure should be
      customer_exposures: exposureCalculations.map((exp) => ({
        customer_id: exp.customerId,
        customer_name: aggregate.customer_name, // This needs to be fetched from aggregate or customerAccounts
        total_balance: exp.totalBalance,
        insured_amount: exp.insuredAmount,
        uninsured_amount: exp.uninsuredAmount,
        cover_level: exp.coverLevel,
        concentration_risk: exp.concentrationRisk,
      })),
      aggregation_metrics: await this._calculateAggregationMetrics(
        customerAggregates
      ),
    };
  }

  private async _aggregateByCustomer(
    accounts: typeof schema.customerAccounts.$inferSelect[]
  ): Promise<Record<string, Record<string, any>>> {
    const customerAggregates: Record<string, Record<string, any>> = {};

    for (const account of accounts) {
      if (!customerAggregates[account.customerId]) {
        customerAggregates[account.customerId] = {
          customer_name: account.customerName,
          customer_type: account.customerType,
          total_balance: 0,
          accounts: [],
          currency_breakdown: {},
          account_type_breakdown: {},
          max_account_balance: 0,
        };
      }

      const aggregate = customerAggregates[account.customerId];
      aggregate.total_balance += account.balance;
      aggregate.accounts.push(account);

      // Update currency breakdown
      const currency = account.currency;
      if (!aggregate.currency_breakdown[currency]) {
        aggregate.currency_breakdown[currency] = 0;
      }
      aggregate.currency_breakdown[currency] += account.balance;

      // Update account type breakdown
      const accountType = account.accountType;
      if (!aggregate.account_type_breakdown[accountType]) {
        aggregate.account_type_breakdown[accountType] = 0;
      }
      aggregate.account_type_breakdown[accountType] += account.balance;

      // Track maximum account balance
      if (account.balance > aggregate.max_account_balance) {
        aggregate.max_account_balance = account.balance;
      }
    }

    return customerAggregates;
  }

  private async _calculateCustomerExposure(
    customerId: string,
    aggregate: Record<string, any>,
    coverLevel: number,
    institutionId: number,
    periodId: string
  ): Promise<CustomerExposure> {
    const totalBalance = aggregate.total_balance;
    let insuredAmount: number;

    if (aggregate.customer_type === "INDIVIDUAL") {
      insuredAmount = await this._calculateIndividualInsurance(
        aggregate,
        coverLevel
      );
    } else if (aggregate.customer_type === "JOINT") {
      insuredAmount = await this._calculateJointInsurance(
        aggregate,
        coverLevel
      );
    } else if (aggregate.customer_type === "TRUST") {
      insuredAmount = await this._calculateTrustInsurance(
        aggregate,
        coverLevel
      );
    } else {
      // CORPORATE
      insuredAmount = await this._calculateCorporateInsurance(
        aggregate,
        coverLevel
      );
    }

    const uninsuredAmount = totalBalance - insuredAmount;
    const actualCoverLevel =
      totalBalance > 0 ? (insuredAmount / totalBalance) * 100 : 0;

    const concentrationRisk = await this._calculateConcentrationRisk(aggregate);

    const representativeAccount = aggregate.accounts[0] || null;

    const exposure: typeof schema.customerExposures.$inferInsert = {
      id: uuidv4(),
      customerId: customerId,
      institutionId: institutionId,
      periodId: periodId,
      customerAccountId: representativeAccount ? representativeAccount.id : null,
      totalBalance: totalBalance,
      insuredAmount: insuredAmount,
      uninsuredAmount: uninsuredAmount,
      coverLevel: actualCoverLevel,
      concentrationRisk: concentrationRisk,
      customerRiskCategory: await this._assessCustomerRisk(aggregate),
    };

    // Insert into database
    await this.db.insert(schema.customerExposures).values(exposure);

    return exposure as CustomerExposure;
  }

  private async _calculateIndividualInsurance(
    aggregate: Record<string, any>,
    coverLevel: number
  ): Promise<number> {
    return Math.min(aggregate.total_balance, coverLevel);
  }

  private async _calculateJointInsurance(
    aggregate: Record<string, any>,
    coverLevel: number
  ): Promise<number> {
    const uniqueHolders = new Set<string>();

    for (const account of aggregate.accounts) {
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
    return Math.min(aggregate.total_balance, totalCoverage);
  }

  private async _calculateTrustInsurance(
    aggregate: Record<string, any>,
    coverLevel: number
  ): Promise<number> {
    const uniqueBeneficiaries = new Set<string>();

    for (const account of aggregate.accounts) {
      if (account.trustBeneficiaries) {
        for (const beneficiary of account.trustBeneficiaries) {
          uniqueBeneficiaries.add(beneficiary.name);
        }
      } else {
        uniqueBeneficiaries.add("beneficiary_1");
      }
    }

    const totalCoverage = coverLevel * uniqueBeneficiaries.size;
    return Math.min(aggregate.total_balance, totalCoverage);
  }

  private async _calculateCorporateInsurance(
    aggregate: Record<string, any>,
    coverLevel: number
  ): Promise<number> {
    const coveragePercentage = 0.8;
    return aggregate.total_balance * coveragePercentage;
  }

  private async _calculateConcentrationRisk(
    aggregate: Record<string, any>
  ): Promise<number> {
    const totalBalance = aggregate.total_balance;
    if (totalBalance === 0) {
      return 0.0;
    }

    const maxAccountRatio = aggregate.max_account_balance / totalBalance;

    const maxCurrencyShare =
      Object.keys(aggregate.currency_breakdown).length > 0
        ? Math.max(...Object.values(aggregate.currency_breakdown)) /
          totalBalance
        : 1.0;

    const maxAccountTypeShare =
      Object.keys(aggregate.account_type_breakdown).length > 0
        ? Math.max(...Object.values(aggregate.account_type_breakdown)) /
          totalBalance
        : 1.0;

    const concentrationRisk =
      maxAccountRatio * 0.4 +
      maxCurrencyShare * 0.3 +
      maxAccountTypeShare * 0.3;

    return concentrationRisk;
  }

  private async _assessCustomerRisk(
    aggregate: Record<string, any>
  ): Promise<string> {
    const totalBalance = aggregate.total_balance;
    const concentrationRisk = await this._calculateConcentrationRisk(aggregate);

    if (totalBalance > 1000000 || concentrationRisk > 0.8) {
      return "HIGH_RISK";
    } else if (totalBalance > 100000 || concentrationRisk > 0.5) {
      return "MEDIUM_RISK";
    } else {
      return "LOW_RISK";
    }
  }

  private async _calculateOverallExposure(
    exposures: CustomerExposure[]
  ): Promise<Record<string, any>> {
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
      coverage_ratio:
        totalDeposits > 0 ? (totalInsured / totalDeposits) * 100 : 0,
      customer_concentration: customerConcentration,
    };
  }

  private async _calculateCustomerConcentration(
    exposures: CustomerExposure[]
  ): Promise<Record<string, any>> {
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

    const top10Deposits = sortedExposures
      .slice(0, 10)
      .reduce((sum, exp) => sum + exp.totalBalance, 0);
    const top10Concentration =
      totalDeposits > 0 ? (top10Deposits / totalDeposits) * 100 : 0;

    const hhi = 
      totalDeposits > 0
        ? exposures.reduce(
            (sum, exp) => sum + (exp.totalBalance / totalDeposits) ** 2,
            0
          )
        : 0;

    return {
      top_10_concentration: top10Concentration,
      hhi_index: hhi,
      largest_customer_share:
        totalDeposits > 0
          ? (sortedExposures[0].totalBalance / totalDeposits) * 100
          : 0,
      customer_count_by_size: await this._categorizeCustomersBySize(exposures),
    };
  }

  private async _categorizeCustomersBySize(
    exposures: CustomerExposure[]
  ): Promise<Record<string, number>> {
    const categories = {
      small: 0, // < $10,000
      medium: 0, // $10,000 - $100,000
      large: 0, // $100,000 - $1,000,000
      very_large: 0, // > $1,000,000
    };

    for (const exp of exposures) {
      const balance = exp.totalBalance;
      if (balance < 10000) {
        categories.small += 1;
      } else if (balance < 100000) {
        categories.medium += 1;
      } else if (balance < 1000000) {
        categories.large += 1;
      } else {
        categories.very_large += 1;
      }
    }

    return categories;
  }

  private async _calculateAggregationMetrics(
    customerAggregates: Record<string, Record<string, any>>
  ): Promise<Record<string, any>> {
    const totalCustomers = Object.keys(customerAggregates).length;
    const totalAccounts = Object.values(customerAggregates).reduce(
      (sum, agg) => sum + agg.accounts.length,
      0
    );

    const avgAccountsPerCustomer =
      totalCustomers > 0 ? totalAccounts / totalCustomers : 0;

    const balances = Object.values(customerAggregates).map(
      (agg) => agg.total_balance
    );

    const sortedBalances = [...balances].sort((a, b) => a - b);
    const medianBalance =
      sortedBalances.length > 0
        ? sortedBalances[Math.floor(sortedBalances.length / 2)]
        : 0;

    return {
      total_customers: totalCustomers,
      total_accounts: totalAccounts,
      accounts_per_customer: avgAccountsPerCustomer,
      average_balance:
        balances.length > 0 ? balances.reduce((a, b) => a + b, 0) / balances.length : 0,
      median_balance: medianBalance,
      max_balance: balances.length > 0 ? Math.max(...balances) : 0,
      min_balance: balances.length > 0 ? Math.min(...balances) : 0,
    };
  }
}
