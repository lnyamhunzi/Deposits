var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/db.ts
import { createPool } from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  auditLogs: () => auditLogs,
  camelsRatings: () => camelsRatings,
  complianceRecords: () => complianceRecords,
  customerAccounts: () => customerAccounts,
  customerAccountsRelations: () => customerAccountsRelations,
  customerExposures: () => customerExposures,
  customerExposuresRelations: () => customerExposuresRelations,
  customers: () => customers,
  depositAnalyses: () => depositAnalyses,
  depositAnalysesRelations: () => depositAnalysesRelations,
  deposits: () => deposits,
  depositsRelations: () => depositsRelations,
  exposureCalculations: () => exposureCalculations,
  exposureCalculationsRelations: () => exposureCalculationsRelations,
  insertAuditFindingSchema: () => insertAuditFindingSchema2,
  insertCamelsRatingSchema: () => insertCamelsRatingSchema2,
  insertComplianceRecordSchema: () => insertComplianceRecordSchema,
  insertComplianceRequirementSchema: () => insertComplianceRequirementSchema,
  insertCustomerSchema: () => insertCustomerSchema2,
  insertDepositSchema: () => insertDepositSchema,
  insertInstitutionSchema: () => insertInstitutionSchema2,
  insertInvoiceSchema: () => insertInvoiceSchema,
  insertPaymentSchema: () => insertPaymentSchema2,
  insertPenaltySchema: () => insertPenaltySchema,
  insertPremiumSchema: () => insertPremiumSchema,
  insertReturnSchema: () => insertReturnSchema2,
  insertRiskScoreSchema: () => insertRiskScoreSchema,
  insertStressTestSchema: () => insertStressTestSchema2,
  institutions: () => institutions,
  institutionsRelations: () => institutionsRelations,
  invoices: () => invoices,
  invoicesRelations: () => invoicesRelations,
  payments: () => payments,
  paymentsRelations: () => paymentsRelations,
  penalties: () => penalties,
  premiumCalculations: () => premiumCalculations,
  premiumCalculationsRelations: () => premiumCalculationsRelations,
  premiumPenalties: () => premiumPenalties,
  premiumPenaltiesRelations: () => premiumPenaltiesRelations,
  premiums: () => premiums,
  returnPeriods: () => returnPeriods,
  returnPeriodsRelations: () => returnPeriodsRelations,
  returns: () => returns,
  returnsRelations: () => returnsRelations,
  riskScores: () => riskScores,
  scvUploads: () => scvUploads,
  scvUploadsRelations: () => scvUploadsRelations,
  sessions: () => sessions,
  stressTests: () => stressTests,
  surveillancePeriods: () => surveillancePeriods,
  surveillancePeriodsRelations: () => surveillancePeriodsRelations,
  users: () => users
});
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import {
  index,
  json,
  mysqlTable,
  timestamp,
  varchar,
  text,
  int,
  decimal,
  date,
  boolean
} from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// shared/types.ts
var AuditFindingSeverity = /* @__PURE__ */ ((AuditFindingSeverity2) => {
  AuditFindingSeverity2["LOW"] = "LOW";
  AuditFindingSeverity2["MEDIUM"] = "MEDIUM";
  AuditFindingSeverity2["HIGH"] = "HIGH";
  AuditFindingSeverity2["CRITICAL"] = "CRITICAL";
  return AuditFindingSeverity2;
})(AuditFindingSeverity || {});
var DepositType = /* @__PURE__ */ ((DepositType2) => {
  DepositType2["INDIVIDUAL"] = "INDIVIDUAL";
  DepositType2["CORPORATE"] = "CORPORATE";
  DepositType2["GOVERNMENT"] = "GOVERNMENT";
  DepositType2["JOINT"] = "JOINT";
  DepositType2["TRUST"] = "TRUST";
  return DepositType2;
})(DepositType || {});

// shared/schema.ts
var sessions = mysqlTable(
  "sessions",
  {
    sid: varchar("sid", { length: 255 }).notNull(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => ({
    primaryKey: [table.sid],
    sessionExpireIdx: index("IDX_session_expire").on(table.expire)
  })
);
var users = mysqlTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(),
  email: varchar("email", { length: 255 }).unique(),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  profileImageUrl: varchar("profile_image_url", { length: 255 }),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
});
var institutions = mysqlTable("institutions", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  // commercial_bank, microfinance, etc
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
});
var insertInstitutionSchema2 = createInsertSchema(institutions).omit({ id: true, createdAt: true, updatedAt: true });
var returns = mysqlTable("returns", {
  id: int("id").autoincrement().primaryKey(),
  institutionId: int("institution_id").notNull().references(() => institutions.id),
  returnPeriod: date("return_period").notNull(),
  // YYYY-MM-DD
  returnType: varchar("return_type", { length: 50 }).notNull(),
  // monthly, quarterly
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileSize: int("file_size"),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  // pending, validated, rejected, approved
  validationErrors: json("validation_errors"),
  controlTotals: json("control_totals"),
  submittedAt: timestamp("submitted_at").default(sql`CURRENT_TIMESTAMP`),
  submittedBy: varchar("submitted_by", { length: 255 }).references(() => users.id),
  approvedAt: timestamp("approved_at"),
  approvedBy: varchar("approved_by", { length: 255 }).references(() => users.id),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
});
var insertReturnSchema2 = createInsertSchema(returns).omit({ id: true, createdAt: true, updatedAt: true });
var deposits = mysqlTable("deposits", {
  id: int("id").autoincrement().primaryKey(),
  returnId: int("return_id").notNull().references(() => returns.id),
  institutionId: int("institution_id").notNull().references(() => institutions.id),
  period: date("period").notNull(),
  // Deposit values
  individualDeposits: decimal("individual_deposits", { precision: 20, scale: 2 }).notNull().default("0"),
  corporateDeposits: decimal("corporate_deposits", { precision: 20, scale: 2 }).notNull().default("0"),
  totalDeposits: decimal("total_deposits", { precision: 20, scale: 2 }).notNull().default("0"),
  // Account counts
  individualAccounts: int("individual_accounts").default(0),
  corporateAccounts: int("corporate_accounts").default(0),
  totalAccounts: int("total_accounts").default(0),
  // Coverage calculations
  coverLevel: decimal("cover_level", { precision: 20, scale: 2 }).default("0"),
  individualExposure: decimal("individual_exposure", { precision: 20, scale: 2 }).default("0"),
  corporateExposure: decimal("corporate_exposure", { precision: 20, scale: 2 }).default("0"),
  totalExposure: decimal("total_exposure", { precision: 20, scale: 2 }).default("0"),
  // Classification
  depositByAccountType: json("deposit_by_account_type"),
  // {savings: 100, current: 200, ...}
  depositByCurrency: json("deposit_by_currency"),
  // {USD: 100, ZWL: 200, ...}
  depositBySize: json("deposit_by_size"),
  // {under_1000: 10, 1000_5000: 20, ...}
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
});
var insertDepositSchema = createInsertSchema(deposits).omit({ id: true, createdAt: true, updatedAt: true });
var camelsRatings = mysqlTable("camels_ratings", {
  id: int("id").autoincrement().primaryKey(),
  institutionId: int("institution_id").notNull().references(() => institutions.id),
  period: date("period").notNull(),
  ratingType: varchar("rating_type", { length: 50 }).notNull().default("normal"),
  // normal, stressed
  // Capital Adequacy
  capitalScore: decimal("capital_score", { precision: 5, scale: 2 }),
  capitalRating: int("capital_rating"),
  // 1-5
  capitalComponents: json("capital_components"),
  // Asset Quality
  assetScore: decimal("asset_score", { precision: 5, scale: 2 }),
  assetRating: int("asset_rating"),
  // 1-5
  assetComponents: json("asset_components"),
  // Management Quality
  managementScore: decimal("management_score", { precision: 5, scale: 2 }),
  managementRating: int("management_rating"),
  // 1-5
  managementComponents: json("management_components"),
  // Earnings
  earningsScore: decimal("earnings_score", { precision: 5, scale: 2 }),
  earningsRating: int("earnings_rating"),
  // 1-5
  earningsComponents: json("earnings_components"),
  // Liquidity
  liquidityScore: decimal("liquidity_score", { precision: 5, scale: 2 }),
  liquidityRating: int("liquidity_rating"),
  // 1-5
  liquidityComponents: json("liquidity_components"),
  // Sensitivity to Market Risk
  sensitivityScore: decimal("sensitivity_score", { precision: 5, scale: 2 }),
  sensitivityRating: int("sensitivity_rating"),
  // 1-5
  sensitivityComponents: json("sensitivity_components"),
  // Composite
  compositeRating: decimal("composite_rating", { precision: 5, scale: 2 }),
  riskGrade: varchar("risk_grade", { length: 50 }),
  // Strong, Satisfactory, Fair, Marginal, Unsatisfactory
  // Financial data used for calculation
  financialData: json("financial_data"),
  calculatedAt: timestamp("calculated_at").default(sql`CURRENT_TIMESTAMP`),
  calculatedBy: varchar("calculated_by", { length: 255 }).references(() => users.id),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`)
});
var insertCamelsRatingSchema2 = createInsertSchema(camelsRatings).omit({ id: true, createdAt: true });
var stressTests = mysqlTable("stress_tests", {
  id: int("id").autoincrement().primaryKey(),
  institutionId: int("institution_id").notNull().references(() => institutions.id),
  scenarioType: varchar("scenario_type", { length: 100 }).notNull(),
  // EXCHANGE_RATE_SHOCK, LIQUIDITY_SHOCK, etc
  severity: varchar("severity", { length: 20 }).notNull(),
  // MILD, MODERATE, SEVERE
  period: date("period").notNull(),
  // Scenario parameters
  scenarioParameters: json("scenario_parameters"),
  // Current vs stressed data
  currentFinancials: json("current_financials"),
  stressedFinancials: json("stressed_financials"),
  // Impact analysis
  impactAnalysis: json("impact_analysis"),
  // CAMELS comparison
  currentCamels: json("current_camels"),
  stressedCamels: json("stressed_camels"),
  camelsDeterioration: json("camels_deterioration"),
  // Risk metrics
  probabilityOfDefault: decimal("probability_of_default", { precision: 5, scale: 2 }),
  capitalShortfall: decimal("capital_shortfall", { precision: 20, scale: 2 }),
  liquidityGap: decimal("liquidity_gap", { precision: 20, scale: 2 }),
  // Recommendations
  recommendations: json("recommendations"),
  runAt: timestamp("run_at").default(sql`CURRENT_TIMESTAMP`),
  runBy: varchar("run_by", { length: 255 }).references(() => users.id),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`)
});
var insertStressTestSchema2 = createInsertSchema(stressTests).omit({ id: true, createdAt: true });
var riskScores = mysqlTable("risk_scores", {
  id: int("id").autoincrement().primaryKey(),
  institutionId: int("institution_id").notNull().references(() => institutions.id),
  period: date("period").notNull(),
  // Risk components
  probabilityOfDefault: decimal("probability_of_default", { precision: 5, scale: 4 }),
  lossGivenDefault: decimal("loss_given_default", { precision: 5, scale: 4 }),
  exposureAtDefault: decimal("exposure_at_default", { precision: 20, scale: 2 }),
  // Composite risk score
  riskScore: decimal("risk_score", { precision: 10, scale: 2 }),
  riskRating: varchar("risk_rating", { length: 50 }),
  // Low, Medium, High, Critical
  // Anomalies detected
  anomalies: json("anomalies"),
  calculatedAt: timestamp("calculated_at").default(sql`CURRENT_TIMESTAMP`),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`)
});
var insertRiskScoreSchema = createInsertSchema(riskScores).omit({ id: true, createdAt: true });
var complianceRecords = mysqlTable("compliance_records", {
  id: int("id").autoincrement().primaryKey(),
  institutionId: int("institution_id").notNull().references(() => institutions.id),
  recordDate: date("record_date").notNull(),
  complianceType: varchar("compliance_type", { length: 100 }).notNull(),
  complianceStatus: varchar("compliance_status", { length: 50 }).notNull(),
  // compliant, non_compliant, under_review
  complianceScore: decimal("compliance_score", { precision: 5, scale: 2 }),
  findings: json("findings"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`)
});
var insertComplianceRecordSchema = createInsertSchema(complianceRecords).omit({ id: true, createdAt: true });
var premiums = mysqlTable("premiums", {
  id: int("id").autoincrement().primaryKey(),
  institutionId: int("institution_id").notNull().references(() => institutions.id),
  period: date("period").notNull(),
  premiumType: varchar("premium_type", { length: 50 }).notNull(),
  // flat_rate, risk_based
  // Calculation basis
  eligibleDeposits: decimal("eligible_deposits", { precision: 20, scale: 2 }).notNull(),
  premiumRate: decimal("premium_rate", { precision: 5, scale: 4 }).notNull(),
  // Calculated amounts
  premiumAmount: decimal("premium_amount", { precision: 20, scale: 2 }).notNull(),
  // Risk-based adjustments (if applicable)
  riskAdjustment: decimal("risk_adjustment", { precision: 5, scale: 4 }),
  adjustedPremiumAmount: decimal("adjusted_premium_amount", { precision: 20, scale: 2 }),
  calculationDetails: json("calculation_details"),
  calculatedAt: timestamp("calculated_at").default(sql`CURRENT_TIMESTAMP`),
  calculatedBy: varchar("calculated_by", { length: 255 }).references(() => users.id),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`)
});
var insertPremiumSchema = createInsertSchema(premiums).omit({ id: true, createdAt: true });
var penalties = mysqlTable("penalties", {
  id: int("id").autoincrement().primaryKey(),
  institutionId: int("institution_id").notNull().references(() => institutions.id),
  penaltyType: varchar("penalty_type", { length: 100 }).notNull(),
  // late_return, late_payment, non_compliance
  referenceId: int("reference_id"),
  // ID of related return/invoice
  amount: decimal("amount", { precision: 20, scale: 2 }).notNull(),
  reason: text("reason").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  // pending, paid, waived
  imposedAt: timestamp("imposed_at").default(sql`CURRENT_TIMESTAMP`),
  imposedBy: varchar("imposed_by", { length: 255 }).references(() => users.id),
  paidAt: timestamp("paid_at"),
  waivedAt: timestamp("waived_at"),
  waivedBy: varchar("waived_by", { length: 255 }).references(() => users.id),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
});
var insertPenaltySchema = createInsertSchema(penalties).omit({ id: true, createdAt: true, updatedAt: true });
var customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  customerId: varchar("customer_id", { length: 100 }).notNull().unique(),
  institutionId: int("institution_id").notNull().references(() => institutions.id),
  // Customer details
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerType: varchar("customer_type", { length: 50 }).notNull(),
  // individual, corporate, trust, joint
  idNumber: varchar("id_number", { length: 100 }),
  // Account aggregation
  accounts: json("accounts"),
  // Array of account details
  totalBalance: decimal("total_balance", { precision: 20, scale: 2 }).default("0"),
  insuredAmount: decimal("insured_amount", { precision: 20, scale: 2 }).default("0"),
  uninsuredAmount: decimal("uninsured_amount", { precision: 20, scale: 2 }).default("0"),
  // Beneficiaries (for trust/joint accounts)
  beneficiaries: json("beneficiaries"),
  snapshotDate: date("snapshot_date").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
});
var insertCustomerSchema2 = createInsertSchema(customers).omit({ id: true, createdAt: true, updatedAt: true });
var insertAuditFindingSchema2 = z.object({
  id: z.string().uuid(),
  requirement_id: z.string(),
  description: z.string(),
  severity: z.nativeEnum(AuditFindingSeverity),
  evidence: z.array(z.string()),
  root_cause: z.string(),
  action_plan: z.string(),
  target_resolution_date: z.string().datetime(),
  status: z.string()
});
var insertComplianceRequirementSchema = z.object({
  id: z.string(),
  category: z.string(),
  description: z.string(),
  regulatory_reference: z.string(),
  due_date: z.string().datetime(),
  frequency: z.string(),
  required_evidence: z.array(z.string()),
  auto_verification: z.boolean()
});
var auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: varchar("user_id", { length: 255 }).references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 100 }),
  // institution, return, premium, etc
  entityId: int("entity_id"),
  changes: json("changes"),
  ipAddress: varchar("ip_address", { length: 50 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`)
});
var scvUploads = mysqlTable("scv_uploads", {
  id: int("id").autoincrement().primaryKey(),
  periodId: varchar("period_id", { length: 255 }).notNull(),
  institutionId: int("institution_id").notNull().references(() => institutions.id),
  uploadedAt: timestamp("uploaded_at").default(sql`CURRENT_TIMESTAMP`)
});
var customerAccounts = mysqlTable("customer_accounts", {
  id: varchar("id", { length: 255 }).primaryKey(),
  // Assuming UUID
  institutionId: int("institution_id").notNull().references(() => institutions.id),
  scvUploadId: int("scv_upload_id").notNull().references(() => scvUploads.id),
  customerId: varchar("customer_id", { length: 255 }).notNull(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerType: varchar("customer_type", { length: 50 }).notNull(),
  // INDIVIDUAL, JOINT, CORPORATE, TRUST
  balance: decimal("balance", { precision: 20, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).notNull(),
  accountType: varchar("account_type", { length: 50 }).notNull(),
  // Savings, Current, Fixed Deposit
  jointHolders: json("joint_holders"),
  // Array of objects { name: string } or similar
  trustBeneficiaries: json("trust_beneficiaries"),
  // Array of objects { name: string } or similar
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
});
var customerExposures = mysqlTable("customer_exposures", {
  id: varchar("id", { length: 255 }).primaryKey(),
  // Assuming UUID
  customerId: varchar("customer_id", { length: 255 }).notNull(),
  institutionId: int("institution_id").notNull().references(() => institutions.id),
  periodId: varchar("period_id", { length: 255 }).notNull(),
  customerAccountId: varchar("customer_account_id", { length: 255 }).references(() => customerAccounts.id),
  totalBalance: decimal("total_balance", { precision: 20, scale: 2 }).notNull(),
  insuredAmount: decimal("insured_amount", { precision: 20, scale: 2 }).notNull(),
  uninsuredAmount: decimal("uninsured_amount", { precision: 20, scale: 2 }).notNull(),
  coverLevel: decimal("cover_level", { precision: 20, scale: 2 }).notNull(),
  concentrationRisk: decimal("concentration_risk", { precision: 5, scale: 2 }).notNull(),
  customerRiskCategory: varchar("customer_risk_category", { length: 50 }).notNull(),
  // HIGH_RISK, MEDIUM_RISK, LOW_RISK
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`)
});
var surveillancePeriods = mysqlTable("surveillance_periods", {
  id: varchar("id", { length: 255 }).primaryKey(),
  // Assuming UUID
  institutionId: int("institution_id").notNull().references(() => institutions.id),
  periodType: varchar("period_type", { length: 50 }).notNull(),
  // MONTHLY, QUARTERLY, ANNUAL
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`)
});
var depositAnalyses = mysqlTable("deposit_analyses", {
  id: varchar("id", { length: 255 }).primaryKey(),
  // Assuming UUID
  periodId: varchar("period_id", { length: 255 }).notNull().references(() => surveillancePeriods.id),
  depositType: varchar("deposit_type", { length: 50 }).notNull(),
  // INDIVIDUAL, CORPORATE, etc.
  totalDeposits: decimal("total_deposits", { precision: 20, scale: 2 }).notNull(),
  totalAccounts: int("total_accounts").notNull(),
  averageBalance: decimal("average_balance", { precision: 20, scale: 2 }).notNull(),
  growthRate: decimal("growth_rate", { precision: 5, scale: 2 }),
  currencyBreakdown: json("currency_breakdown"),
  accountSizeBreakdown: json("account_size_breakdown"),
  productBreakdown: json("product_breakdown"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`)
});
var exposureCalculations = mysqlTable("exposure_calculations", {
  id: varchar("id", { length: 255 }).primaryKey(),
  // Assuming UUID
  institutionId: int("institution_id").notNull().references(() => institutions.id),
  periodId: varchar("period_id", { length: 255 }).notNull().references(() => surveillancePeriods.id),
  totalDeposits: decimal("total_deposits", { precision: 20, scale: 2 }).notNull(),
  totalInsured: decimal("total_insured", { precision: 20, scale: 2 }).notNull(),
  totalUninsured: decimal("total_uninsured", { precision: 20, scale: 2 }).notNull(),
  coverageRatio: decimal("coverage_ratio", { precision: 5, scale: 2 }).notNull(),
  customerConcentration: json("customer_concentration"),
  depositTypeConcentration: json("deposit_type_concentration"),
  accountSizeConcentration: json("account_size_concentration"),
  currencyConcentration: json("currency_concentration"),
  riskScore: decimal("risk_score", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`)
});
var premiumCalculations = mysqlTable("premium_calculations", {
  id: varchar("id", { length: 255 }).primaryKey(),
  // Assuming UUID
  institutionId: int("institution_id").notNull().references(() => institutions.id),
  periodId: varchar("period_id", { length: 255 }).notNull(),
  // Assuming this refers to a ReturnPeriod or similar
  calculationMethod: varchar("calculation_method", { length: 50 }).notNull(),
  // FLAT_RATE, RISK_BASED
  averageEligibleDeposits: decimal("average_eligible_deposits", { precision: 20, scale: 2 }).notNull(),
  riskPremiumRate: decimal("risk_premium_rate", { precision: 5, scale: 4 }).notNull(),
  riskAdjustmentFactor: decimal("risk_adjustment_factor", { precision: 5, scale: 4 }).notNull(),
  finalPremium: decimal("final_premium", { precision: 20, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("CALCULATED"),
  // CALCULATED, INVOICED, PAID
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
});
var invoices = mysqlTable("invoices", {
  id: varchar("id", { length: 255 }).primaryKey(),
  // Assuming UUID
  premiumCalculationId: varchar("premium_calculation_id", { length: 255 }).notNull().references(() => premiumCalculations.id),
  institutionId: int("institution_id").notNull().references(() => institutions.id),
  invoiceNumber: varchar("invoice_number", { length: 100 }).notNull().unique(),
  invoiceDate: timestamp("invoice_date").default(sql`CURRENT_TIMESTAMP`),
  dueDate: date("due_date").notNull(),
  amount: decimal("amount", { precision: 20, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 20, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 20, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("PENDING"),
  // PENDING, PAID, OVERDUE, CANCELLED
  paidAmount: decimal("paid_amount", { precision: 20, scale: 2 }).default("0"),
  paidAt: timestamp("paid_at"),
  paymentReference: varchar("payment_reference", { length: 255 }),
  sentToAccounting: boolean("sent_to_accounting").default(false),
  accountingReference: varchar("accounting_reference", { length: 255 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
});
var insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true, updatedAt: true });
var payments = mysqlTable("payments", {
  id: varchar("id", { length: 255 }).primaryKey(),
  // Assuming UUID
  invoiceId: varchar("invoice_id", { length: 255 }).notNull().references(() => invoices.id),
  amount: decimal("amount", { precision: 20, scale: 2 }).notNull(),
  paymentDate: date("payment_date").notNull(),
  paymentMethod: varchar("payment_method", { length: 100 }),
  paymentReference: varchar("payment_reference", { length: 255 }),
  status: varchar("status", { length: 50 }).notNull().default("PENDING"),
  // PENDING, RECEIVED, VERIFIED, REJECTED
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
});
var insertPaymentSchema2 = createInsertSchema(payments).omit({ id: true, createdAt: true, updatedAt: true });
var premiumPenalties = mysqlTable("premium_penalties", {
  id: varchar("id", { length: 255 }).primaryKey(),
  // Assuming UUID
  invoiceId: varchar("invoice_id", { length: 255 }).notNull().references(() => invoices.id),
  penaltyType: varchar("penalty_type", { length: 100 }).notNull(),
  // LATE_PAYMENT, LATE_SUBMISSION
  penaltyAmount: decimal("penalty_amount", { precision: 20, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 20, scale: 2 }).notNull(),
  daysOverdue: int("days_overdue").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("PENDING"),
  // PENDING, WAIVED, PAID
  dueDate: date("due_date").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
});
var returnPeriods = mysqlTable("return_periods", {
  id: varchar("id", { length: 255 }).primaryKey(),
  // Assuming UUID
  institutionId: int("institution_id").notNull().references(() => institutions.id),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("OPEN"),
  // OPEN, CLOSED
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
});
var institutionsRelations = relations(institutions, ({ many }) => ({
  returns: many(returns),
  deposits: many(deposits),
  camelsRatings: many(camelsRatings),
  stressTests: many(stressTests),
  riskScores: many(riskScores),
  premiums: many(premiums),
  penalties: many(penalties),
  customers: many(customers),
  scvUploads: many(scvUploads),
  customerAccounts: many(customerAccounts),
  customerExposures: many(customerExposures),
  surveillancePeriods: many(surveillancePeriods),
  exposureCalculations: many(exposureCalculations),
  premiumCalculations: many(premiumCalculations),
  returnPeriods: many(returnPeriods)
}));
var premiumCalculationsRelations = relations(premiumCalculations, ({ one, many }) => ({
  institution: one(institutions, {
    fields: [premiumCalculations.institutionId],
    references: [institutions.id]
  }),
  invoices: many(invoices)
}));
var invoicesRelations = relations(invoices, ({ one, many }) => ({
  premiumCalculation: one(premiumCalculations, {
    fields: [invoices.premiumCalculationId],
    references: [premiumCalculations.id]
  }),
  institution: one(institutions, {
    fields: [invoices.institutionId],
    references: [institutions.id]
  }),
  payments: many(payments),
  premiumPenalties: many(premiumPenalties)
}));
var paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id]
  })
}));
var premiumPenaltiesRelations = relations(premiumPenalties, ({ one }) => ({
  invoice: one(invoices, {
    fields: [premiumPenalties.invoiceId],
    references: [invoices.id]
  })
}));
var returnPeriodsRelations = relations(returnPeriods, ({ one, many }) => ({
  institution: one(institutions, {
    fields: [returnPeriods.institutionId],
    references: [institutions.id]
  }),
  returns: many(returns)
}));
var surveillancePeriodsRelations = relations(surveillancePeriods, ({ one, many }) => ({
  institution: one(institutions, {
    fields: [surveillancePeriods.institutionId],
    references: [institutions.id]
  }),
  depositAnalyses: many(depositAnalyses),
  exposureCalculations: many(exposureCalculations)
}));
var depositAnalysesRelations = relations(depositAnalyses, ({ one }) => ({
  surveillancePeriod: one(surveillancePeriods, {
    fields: [depositAnalyses.periodId],
    references: [surveillancePeriods.id]
  })
}));
var exposureCalculationsRelations = relations(exposureCalculations, ({ one }) => ({
  institution: one(institutions, {
    fields: [exposureCalculations.institutionId],
    references: [institutions.id]
  }),
  surveillancePeriod: one(surveillancePeriods, {
    fields: [exposureCalculations.periodId],
    references: [surveillancePeriods.id]
  })
}));
var scvUploadsRelations = relations(scvUploads, ({ one, many }) => ({
  institution: one(institutions, {
    fields: [scvUploads.institutionId],
    references: [institutions.id]
  }),
  customerAccounts: many(customerAccounts)
}));
var customerAccountsRelations = relations(customerAccounts, ({ one, many }) => ({
  institution: one(institutions, {
    fields: [customerAccounts.institutionId],
    references: [institutions.id]
  }),
  scvUpload: one(scvUploads, {
    fields: [customerAccounts.scvUploadId],
    references: [scvUploads.id]
  }),
  customerExposures: many(customerExposures)
}));
var customerExposuresRelations = relations(customerExposures, ({ one }) => ({
  institution: one(institutions, {
    fields: [customerExposures.institutionId],
    references: [institutions.id]
  }),
  customerAccount: one(customerAccounts, {
    fields: [customerExposures.customerAccountId],
    references: [customerAccounts.id]
  })
}));
var returnsRelations = relations(returns, ({ one, many }) => ({
  institution: one(institutions, {
    fields: [returns.institutionId],
    references: [institutions.id]
  }),
  deposits: many(deposits)
}));
var depositsRelations = relations(deposits, ({ one }) => ({
  return: one(returns, {
    fields: [deposits.returnId],
    references: [returns.id]
  }),
  institution: one(institutions, {
    fields: [deposits.institutionId],
    references: [institutions.id]
  })
}));

// server/db.ts
var pool = createPool({
  host: "localhost",
  user: "root",
  password: "Mugonat#99",
  database: "deposits",
  port: 3306
});
var db = drizzle(pool, { schema: schema_exports, mode: "default" });

// server/storage.ts
import { eq, desc } from "drizzle-orm";
var DbStorage = class {
  // Users
  async getUser(id) {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }
  async getUserByEmail(email) {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }
  async upsertUser(user) {
    const result = await db.insert(users).values(user).onConflictDoUpdate({
      target: users.id,
      set: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return result[0];
  }
  // Institutions
  async getInstitutions() {
    return await db.select().from(institutions).orderBy(institutions.name);
  }
  async getInstitution(id) {
    const result = await db.select().from(institutions).where(eq(institutions.id, id));
    return result[0];
  }
  async createInstitution(institution) {
    const result = await db.insert(institutions).values(institution).returning();
    return result[0];
  }
  async updateInstitution(id, institution) {
    const result = await db.update(institutions).set({ ...institution, updatedAt: /* @__PURE__ */ new Date() }).where(eq(institutions.id, id)).returning();
    return result[0];
  }
  // Returns
  async getReturns() {
    return await db.select().from(returns).orderBy(desc(returns.submittedAt));
  }
  async getReturnsByInstitution(institutionId) {
    return await db.select().from(returns).where(eq(returns.institutionId, institutionId)).orderBy(desc(returns.returnPeriod));
  }
  async createReturn(ret) {
    const result = await db.insert(returns).values(ret).returning();
    return result[0];
  }
  async updateReturn(id, ret) {
    const result = await db.update(returns).set({ ...ret, updatedAt: /* @__PURE__ */ new Date() }).where(eq(returns.id, id)).returning();
    return result[0];
  }
  // Deposits
  async getDeposits() {
    return await db.select().from(deposits).orderBy(desc(deposits.period));
  }
  async getDepositsByInstitution(institutionId) {
    return await db.select().from(deposits).where(eq(deposits.institutionId, institutionId)).orderBy(desc(deposits.period));
  }
  async getDepositsByPeriod(period) {
    return await db.select().from(deposits).where(eq(deposits.period, period));
  }
  async createDeposit(deposit) {
    const result = await db.insert(deposits).values(deposit).returning();
    return result[0];
  }
  // CAMELS Ratings
  async getCamelsRatings() {
    return await db.select().from(camelsRatings).orderBy(desc(camelsRatings.period));
  }
  async getCamelsRatingsByInstitution(institutionId) {
    return await db.select().from(camelsRatings).where(eq(camelsRatings.institutionId, institutionId)).orderBy(desc(camelsRatings.period));
  }
  async getLatestCamelsRating(institutionId) {
    const result = await db.select().from(camelsRatings).where(eq(camelsRatings.institutionId, institutionId)).orderBy(desc(camelsRatings.period)).limit(1);
    return result[0];
  }
  async createCamelsRating(rating) {
    const result = await db.insert(camelsRatings).values(rating).returning();
    return result[0];
  }
  // Stress Tests
  async getStressTests() {
    return await db.select().from(stressTests).orderBy(desc(stressTests.runAt));
  }
  async getStressTestsByInstitution(institutionId) {
    return await db.select().from(stressTests).where(eq(stressTests.institutionId, institutionId)).orderBy(desc(stressTests.runAt));
  }
  async createStressTest(test) {
    const result = await db.insert(stressTests).values(test).returning();
    return result[0];
  }
  // Risk Scores
  async getRiskScores() {
    return await db.select().from(riskScores).orderBy(desc(riskScores.period));
  }
  async getRiskScoresByInstitution(institutionId) {
    return await db.select().from(riskScores).where(eq(riskScores.institutionId, institutionId)).orderBy(desc(riskScores.period));
  }
  async createRiskScore(score) {
    const result = await db.insert(riskScores).values(score).returning();
    return result[0];
  }
  // Premiums
  async getPremiums() {
    return await db.select().from(premiums).orderBy(desc(premiums.period));
  }
  async getPremiumsByInstitution(institutionId) {
    return await db.select().from(premiums).where(eq(premiums.institutionId, institutionId)).orderBy(desc(premiums.period));
  }
  async createPremium(premium) {
    const result = await db.insert(premiums).values(premium).returning();
    return result[0];
  }
  // Invoices
  async getInvoices() {
    return await db.select().from(invoices).orderBy(desc(invoices.invoiceDate));
  }
  async getInvoicesByInstitution(institutionId) {
    return await db.select().from(invoices).where(eq(invoices.institutionId, institutionId)).orderBy(desc(invoices.invoiceDate));
  }
  async createInvoice(invoice) {
    const result = await db.insert(invoices).values(invoice).returning();
    return result[0];
  }
  async updateInvoice(id, invoice) {
    const result = await db.update(invoices).set({ ...invoice, updatedAt: /* @__PURE__ */ new Date() }).where(eq(invoices.id, id)).returning();
    return result[0];
  }
  // Payments
  async getPayments() {
    return await db.select().from(payments).orderBy(desc(payments.paymentDate));
  }
  async getPaymentsByInvoice(invoiceId) {
    return await db.select().from(payments).where(eq(payments.invoiceId, invoiceId));
  }
  async createPayment(payment) {
    const result = await db.insert(payments).values(payment).returning();
    return result[0];
  }
  // Penalties
  async getPenalties() {
    return await db.select().from(penalties).orderBy(desc(penalties.imposedAt));
  }
  async getPenaltiesByInstitution(institutionId) {
    return await db.select().from(penalties).where(eq(penalties.institutionId, institutionId)).orderBy(desc(penalties.imposedAt));
  }
  async createPenalty(penalty) {
    const result = await db.insert(penalties).values(penalty).returning();
    return result[0];
  }
  // Customers
  async getCustomers() {
    return await db.select().from(customers).orderBy(customers.customerName);
  }
  async getCustomersByInstitution(institutionId) {
    return await db.select().from(customers).where(eq(customers.institutionId, institutionId)).orderBy(customers.customerName);
  }
  async createCustomer(customer) {
    const result = await db.insert(customers).values(customer).returning();
    return result[0];
  }
  // Audit Logs
  async createAuditLog(log2) {
    const result = await db.insert(auditLogs).values(log2).returning();
    return result[0];
  }
};
var storage = new DbStorage();

// server/auth.ts
import session from "express-session";
import MySQLStore from "express-mysql-session";
var MySQLSessionStore = MySQLStore(session);
var sessionStore = new MySQLSessionStore(
  {
    clearExpired: true,
    checkExpirationInterval: 9e5,
    // How frequently expired sessions will be cleared; milliseconds.
    expiration: 864e5,
    // The maximum age of a valid session; milliseconds.
    createDatabaseTable: true,
    // Whether or not to create the sessions database table, if one does not already exist.
    schema: {
      tableName: "sessions",
      columnNames: {
        session_id: "session_id",
        expires: "expires",
        data: "data"
      }
    }
  },
  pool
);
function setupAuth(app2) {
  app2.use(
    session({
      secret: process.env.SESSION_SECRET || "development-secret-change-in-production",
      resave: false,
      saveUninitialized: false,
      store: sessionStore,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1e3,
        // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
      }
    })
  );
  app2.use(async (req, res, next) => {
    if (req.session.userId) {
      const user = await storage.getUser(req.session.userId);
      if (user) {
        req.user = user;
      }
    }
    next();
  });
  app2.get("/api/login", async (req, res) => {
    try {
      let user = await storage.getUserByEmail("admin@qsight.co.zw");
      if (!user) {
        user = await storage.upsertUser({
          id: "demo-admin-001",
          email: "admin@qsight.co.zw",
          firstName: "System",
          lastName: "Administrator",
          profileImageUrl: null,
          role: "admin"
        });
      }
      req.session.userId = user.id;
      res.redirect("/");
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });
  app2.get("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err);
      }
      res.redirect("/");
    });
  });
  app2.get("/api/auth/user", (req, res) => {
    if (req.user) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  });
}
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

// server/balance-aggregation.ts
import { eq as eq2, and as and2, inArray } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
var BalanceAggregationService = class {
  db;
  coverLevel;
  constructor(db2, coverLevel = 1e3) {
    this.db = db2;
    this.coverLevel = coverLevel;
  }
  async aggregateCustomerBalances(institutionId, periodId, coverLevel = 1e3) {
    const scvUploadsForPeriod = await this.db.select({ id: scvUploads.id }).from(scvUploads).where(
      and2(
        eq2(scvUploads.periodId, periodId),
        eq2(scvUploads.institutionId, institutionId)
      )
    );
    const scvUploadIds = scvUploadsForPeriod.map((upload) => upload.id);
    const accounts = await this.db.select().from(customerAccounts).where(
      and2(
        eq2(customerAccounts.institutionId, institutionId),
        inArray(customerAccounts.scvUploadId, scvUploadIds)
      )
    );
    const customerAggregates = await this._aggregateByCustomer(accounts);
    const exposureCalculations2 = [];
    for (const customerId in customerAggregates) {
      const aggregate2 = customerAggregates[customerId];
      const exposure = await this._calculateCustomerExposure(
        customerId,
        aggregate2,
        coverLevel,
        institutionId,
        periodId
      );
      exposureCalculations2.push(exposure);
    }
    const overallExposure = await this._calculateOverallExposure(
      exposureCalculations2
    );
    return {
      institution_id: institutionId,
      period_id: periodId,
      cover_level: coverLevel,
      total_customers: Object.keys(customerAggregates).length,
      total_exposure: overallExposure.total_deposits,
      // This needs to be refined based on what total_exposure should be
      customer_exposures: exposureCalculations2.map((exp) => ({
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
    await this.db.insert(customerExposures).values(exposure);
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
};

// server/compliance-tracker.ts
var ComplianceTracker = class {
  db;
  requirements;
  constructor(db2) {
    this.db = db2;
    this.requirements = this._loadComplianceRequirements();
  }
  async trackCompliance(institutionId, period) {
    const evidence = await this._gatherComplianceEvidence(institutionId, period);
    const complianceResults = [];
    let overallScore = 0;
    let totalWeight = 0;
    for (const requirement of this.requirements) {
      if (this._isRequirementApplicable(requirement, institutionId)) {
        const result = this._assessRequirementCompliance(requirement, evidence);
        complianceResults.push(result);
        const weight = this._getRequirementWeight(requirement);
        overallScore += result.score * weight;
        totalWeight += weight;
      }
    }
    if (totalWeight > 0) {
      overallScore /= totalWeight;
    } else {
      overallScore = 100;
    }
    const complianceScore = this._calculateComplianceScore(complianceResults);
    const gaps = this._identifyComplianceGaps(complianceResults);
    const recommendations = this._generateComplianceRecommendations(gaps);
    return {
      institution_id: institutionId,
      assessment_period: period,
      overall_compliance_score: complianceScore,
      compliance_status: this._getOverallStatus(complianceScore),
      requirement_assessments: complianceResults,
      compliance_gaps: gaps,
      recommendations,
      evidence_summary: this._summarizeEvidence(evidence),
      next_assessment_due: this._calculateNextAssessment(period),
      regulatory_reporting_requirements: this._getReportingRequirements(
        complianceResults
      ),
      assessment_date: /* @__PURE__ */ new Date()
    };
  }
  async recordAuditFinding(institutionId, finding) {
    const findingRecord = {
      id: finding.id,
      institution_id: institutionId,
      requirement_id: finding.requirement_id,
      description: finding.description,
      severity: finding.severity.valueOf(),
      evidence: finding.evidence,
      root_cause: finding.root_cause,
      action_plan: finding.action_plan,
      target_resolution_date: finding.target_resolution_date,
      status: finding.status,
      reported_date: /* @__PURE__ */ new Date(),
      assigned_to: this._assignResponsibility(finding)
    };
    const impactScore = this._calculateFindingImpact(finding);
    const timeline = this._generateRemediationTimeline(finding);
    return {
      finding_record: findingRecord,
      compliance_impact: impactScore,
      remediation_timeline: timeline,
      escalation_required: this._requiresEscalation(finding),
      monitoring_requirements: this._getMonitoringRequirements(finding)
    };
  }
  async generateComplianceReport(institutionId, startDate, endDate) {
    const complianceHistory = await this._getComplianceHistory(
      institutionId,
      startDate,
      endDate
    );
    const trends = this._analyzeComplianceTrends(complianceHistory);
    const openFindings = await this._getOpenFindings(institutionId);
    const regulatoryImpact = await this._assessRegulatoryChangesImpact(
      institutionId
    );
    return {
      executive_summary: this._generateExecutiveSummary(
        complianceHistory,
        openFindings
      ),
      compliance_trends: trends,
      current_status: complianceHistory.length ? complianceHistory[complianceHistory.length - 1] : {},
      open_findings_summary: this._summarizeFindings(openFindings),
      regulatory_landscape: regulatoryImpact,
      risk_assessment: this._assessComplianceRisk(
        complianceHistory,
        openFindings
      ),
      action_items: this._generateActionItems(openFindings, trends),
      report_period: {
        start_date: startDate,
        end_date: endDate
      },
      prepared_date: /* @__PURE__ */ new Date()
    };
  }
  _loadComplianceRequirements() {
    const requirements = [
      {
        id: "CAR-001",
        category: "CAPITAL_ADEQUACY",
        description: "Maintain minimum Capital Adequacy Ratio of 10%",
        regulatory_reference: "BASEL III - Pillar 1",
        due_date: new Date((/* @__PURE__ */ new Date()).setDate((/* @__PURE__ */ new Date()).getDate() + 30)),
        frequency: "QUARTERLY",
        required_evidence: ["Capital Adequacy Return", "Board Certification"],
        auto_verification: true
      },
      {
        id: "LIQ-001",
        category: "LIQUIDITY",
        description: "Maintain minimum Liquidity Coverage Ratio of 100%",
        regulatory_reference: "BASEL III - LCR",
        due_date: new Date((/* @__PURE__ */ new Date()).setDate((/* @__PURE__ */ new Date()).getDate() + 30)),
        frequency: "MONTHLY",
        required_evidence: ["LCR Report", "Liquidity Risk Management Report"],
        auto_verification: true
      },
      {
        id: "RET-001",
        category: "RETURNS_SUBMISSION",
        description: "Submit regulatory returns by due date",
        regulatory_reference: "Banking Act Section 45",
        due_date: new Date((/* @__PURE__ */ new Date()).setDate((/* @__PURE__ */ new Date()).getDate() + 15)),
        frequency: "MONTHLY",
        required_evidence: ["Return Submission Receipt", "Validation Report"],
        auto_verification: true
      },
      {
        id: "GOV-001",
        category: "GOVERNANCE",
        description: "Maintain effective board oversight and risk management",
        regulatory_reference: "Corporate Governance Code",
        due_date: new Date((/* @__PURE__ */ new Date()).setDate((/* @__PURE__ */ new Date()).getDate() + 90)),
        frequency: "ANNUAL",
        required_evidence: [
          "Board Minutes",
          "Risk Committee Reports",
          "Internal Audit Reports"
        ],
        auto_verification: false
      }
    ];
    return requirements;
  }
  async _gatherComplianceEvidence(institutionId, period) {
    const evidence = {};
    const returnsEvidence = await this._getReturnsSubmissionEvidence(
      institutionId,
      period
    );
    Object.assign(evidence, returnsEvidence);
    const financialEvidence = await this._getFinancialRatiosEvidence(
      institutionId,
      period
    );
    Object.assign(evidence, financialEvidence);
    const governanceEvidence = await this._getGovernanceEvidence(
      institutionId,
      period
    );
    Object.assign(evidence, governanceEvidence);
    const auditEvidence = await this._getAuditEvidence(institutionId, period);
    Object.assign(evidence, auditEvidence);
    return evidence;
  }
  _isRequirementApplicable(requirement, institutionId) {
    return true;
  }
  _assessRequirementCompliance(requirement, evidence) {
    const evidenceFound = requirement.required_evidence.every(
      (reqEvidence) => reqEvidence in evidence
    );
    let isCompliant = false;
    if (requirement.auto_verification && evidenceFound) {
      isCompliant = this._autoVerifyRequirement(requirement, evidence);
    } else {
      isCompliant = evidenceFound;
    }
    let score;
    let status;
    if (isCompliant) {
      score = 100;
      status = "COMPLIANT" /* COMPLIANT */;
    } else if (evidenceFound) {
      score = 50;
      status = "PARTIALLY_COMPLIANT" /* PARTIALLY_COMPLIANT */;
    } else {
      score = 0;
      status = "NON_COMPLIANT" /* NON_COMPLIANT */;
    }
    return {
      requirement_id: requirement.id,
      category: requirement.category,
      description: requirement.description,
      status: status.valueOf(),
      score,
      evidence_available: evidenceFound,
      missing_evidence: requirement.required_evidence.filter(
        (ev) => !(ev in evidence)
      ),
      due_date: requirement.due_date,
      is_overdue: /* @__PURE__ */ new Date() > requirement.due_date,
      regulatory_reference: requirement.regulatory_reference
    };
  }
  _autoVerifyRequirement(requirement, evidence) {
    if (requirement.category === "CAPITAL_ADEQUACY") {
      const car = evidence.capital_adequacy_ratio || 0;
      return car >= 10;
    } else if (requirement.category === "LIQUIDITY") {
      const lcr = evidence.liquidity_coverage_ratio || 0;
      return lcr >= 100;
    } else if (requirement.category === "RETURNS_SUBMISSION") {
      return evidence.returns_submitted_on_time || false;
    }
    return true;
  }
  _calculateComplianceScore(complianceResults) {
    if (!complianceResults.length) {
      return 0;
    }
    const totalScore = complianceResults.reduce(
      (sum, result) => sum + result.score,
      0
    );
    return totalScore / complianceResults.length;
  }
  _getOverallStatus(complianceScore) {
    if (complianceScore >= 90) {
      return "EXCELLENT";
    } else if (complianceScore >= 80) {
      return "GOOD";
    } else if (complianceScore >= 70) {
      return "SATISFACTORY";
    } else if (complianceScore >= 60) {
      return "MARGINAL";
    } else {
      return "UNSATISFACTORY";
    }
  }
  _identifyComplianceGaps(complianceResults) {
    const gaps = [];
    for (const result of complianceResults) {
      if (result.status !== "COMPLIANT" /* COMPLIANT */.valueOf()) {
        gaps.push({
          requirement_id: result.requirement_id,
          category: result.category,
          gap_description: `Non-compliance with ${result.description}`,
          severity: this._assessGapSeverity(result),
          missing_evidence: result.missing_evidence,
          remediation_priority: this._getRemediationPriority(result),
          estimated_resolution_time: this._estimateResolutionTime(result)
        });
      }
    }
    return gaps.sort((a, b) => b.remediation_priority - a.remediation_priority);
  }
  _generateComplianceRecommendations(gaps) {
    const recommendations = [];
    for (const gap of gaps) {
      if (gap.severity === "HIGH") {
        recommendations.push(
          `IMMEDIATE: Address ${gap.category} compliance gap - ${gap.gap_description}`
        );
      } else if (gap.severity === "MEDIUM") {
        recommendations.push(
          `PRIORITY: Resolve ${gap.category} compliance issue`
        );
      } else {
        recommendations.push(`MONITOR: Review ${gap.category} requirement`);
      }
    }
    if (gaps.some((gap) => gap.severity === "HIGH")) {
      recommendations.push("Enhance compliance monitoring and reporting");
      recommendations.push("Conduct compliance training for relevant staff");
    }
    recommendations.push("Update compliance procedures and documentation");
    recommendations.push("Schedule internal compliance audit");
    return recommendations;
  }
  _assignResponsibility(finding) {
    return "Compliance Officer";
  }
  _calculateFindingImpact(finding) {
    switch (finding.severity) {
      case "CRITICAL" /* CRITICAL */:
        return 100;
      case "HIGH" /* HIGH */:
        return 75;
      case "MEDIUM" /* MEDIUM */:
        return 50;
      case "LOW" /* LOW */:
        return 25;
      default:
        return 0;
    }
  }
  _generateRemediationTimeline(finding) {
    const diffTime = Math.abs(
      finding.target_resolution_date.getTime() - (/* @__PURE__ */ new Date()).getTime()
    );
    const diffDays = Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
    return `${diffDays} days`;
  }
  _requiresEscalation(finding) {
    return finding.severity === "CRITICAL" /* CRITICAL */ || finding.severity === "HIGH" /* HIGH */;
  }
  _getMonitoringRequirements(finding) {
    if (finding.severity === "CRITICAL" /* CRITICAL */) {
      return ["Daily monitoring", "Weekly report to board"];
    } else if (finding.severity === "HIGH" /* HIGH */) {
      return ["Weekly monitoring", "Bi-weekly report to management"];
    } else {
      return ["Monthly monitoring"];
    }
  }
  _getComplianceHistory(institutionId, startDate, endDate) {
    return [];
  }
  _analyzeComplianceTrends(complianceHistory) {
    return {};
  }
  _getOpenFindings(institutionId) {
    return [];
  }
  _assessRegulatoryChangesImpact(institutionId) {
    return {};
  }
  _generateExecutiveSummary(complianceHistory, openFindings) {
    return "Executive summary placeholder.";
  }
  _assessComplianceRisk(complianceHistory, openFindings) {
    return {};
  }
  _generateActionItems(openFindings, trends) {
    return [];
  }
  _getRequirementWeight(requirement) {
    switch (requirement.category) {
      case "CAPITAL_ADEQUACY":
        return 3;
      case "LIQUIDITY":
        return 3;
      case "RETURNS_SUBMISSION":
        return 2;
      case "GOVERNANCE":
        return 2;
      default:
        return 1;
    }
  }
  _calculateNextAssessment(period) {
    return new Date((/* @__PURE__ */ new Date()).setMonth((/* @__PURE__ */ new Date()).getMonth() + 3));
  }
  _getReportingRequirements(complianceResults) {
    return ["Monthly Compliance Report", "Quarterly Board Report"];
  }
  _assessGapSeverity(complianceResult) {
    const category = complianceResult.category;
    const score = complianceResult.score;
    if (category === "CAPITAL_ADEQUACY" || category === "LIQUIDITY") {
      if (score < 50) {
        return "HIGH";
      }
    }
    if (score < 30) {
      return "HIGH";
    } else if (score < 60) {
      return "MEDIUM";
    } else {
      return "LOW";
    }
  }
  _getRemediationPriority(complianceResult) {
    const severityWeights = { "HIGH": 3, "MEDIUM": 2, "LOW": 1 };
    const categoryWeights = {
      "CAPITAL_ADEQUACY": 3,
      "LIQUIDITY": 3,
      "RETURNS_SUBMISSION": 2,
      "GOVERNANCE": 2,
      "OTHER": 1
    };
    const severity = this._assessGapSeverity(complianceResult);
    const category = complianceResult.category;
    return (severityWeights[severity] || 1) * (categoryWeights[category] || 1);
  }
  _estimateResolutionTime(complianceResult) {
    const severity = this._assessGapSeverity(complianceResult);
    if (severity === "HIGH") {
      return "IMMEDIATE (1-7 days)";
    } else if (severity === "MEDIUM") {
      return "SHORT_TERM (1-4 weeks)";
    } else {
      return "MEDIUM_TERM (1-3 months)";
    }
  }
  // Helper methods for evidence gathering
  async _getReturnsSubmissionEvidence(institutionId, period) {
    return {
      returns_submitted_on_time: true,
      validation_passed: true,
      submission_timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  async _getFinancialRatiosEvidence(institutionId, period) {
    return {
      capital_adequacy_ratio: 12.5,
      liquidity_coverage_ratio: 115.2,
      npa_ratio: 3.2
    };
  }
  async _getGovernanceEvidence(institutionId, period) {
    return {
      board_meetings_held: 4,
      risk_committee_active: true,
      internal_audit_completed: true
    };
  }
  async _getAuditEvidence(institutionId, period) {
    return {
      external_audit_clean_opinion: true,
      internal_audit_coverage: 85,
      regulatory_examination_completed: true
    };
  }
  _summarizeEvidence(evidence) {
    const totalEvidenceItems = Object.keys(evidence).length;
    const evidenceCategories = Array.from(
      new Set(Object.keys(evidence).map((key) => key.split("_")[0]))
    );
    const autoVerifiableEvidence = Object.keys(evidence).filter(
      (key) => ["ratio", "submission", "completion"].some((term) => key.includes(term))
    ).length;
    return {
      total_evidence_items: totalEvidenceItems,
      evidence_categories: evidenceCategories,
      auto_verifiable_evidence: autoVerifiableEvidence,
      last_updated: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
};

// server/deposit-analysis.ts
import { eq as eq3, and as and3, gte as gte2, lte as lte2 } from "drizzle-orm";
import { v4 as uuidv42 } from "uuid";
var DepositAnalysisService = class {
  db;
  constructor(db2) {
    this.db = db2;
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
      where: and3(
        eq3(returns.institutionId, institutionId),
        eq3(returns.returnPeriod, periodStart.toISOString().slice(0, 10)),
        // Assuming returnPeriod is YYYY-MM-DD
        eq3(returns.status, "SUBMITTED")
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
    if (depositType === "INDIVIDUAL" /* INDIVIDUAL */) {
      typeData = depositData.filter(
        (d) => ["SAVINGS", "CHECKING", "INDIVIDUAL"].includes(d.account_type)
      );
    } else if (depositType === "CORPORATE" /* CORPORATE */) {
      typeData = depositData.filter(
        (d) => ["CORPORATE", "BUSINESS"].includes(d.account_type)
      );
    } else if (depositType === "GOVERNMENT" /* GOVERNMENT */) {
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
      id: uuidv42(),
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
    await this.db.insert(depositAnalyses).values(analysis);
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
      ["SMALL" /* SMALL */]: 0,
      ["MEDIUM" /* MEDIUM */]: 0,
      ["LARGE" /* LARGE */]: 0
    };
    data.forEach((d) => {
      const balance = d.balance;
      if (balance < 1e4) {
        sizeCounts["SMALL" /* SMALL */]++;
      } else if (balance < 1e5) {
        sizeCounts["MEDIUM" /* MEDIUM */]++;
      } else {
        sizeCounts["LARGE" /* LARGE */]++;
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
      ["INDIVIDUAL" /* INDIVIDUAL */]: 5e9,
      ["CORPORATE" /* CORPORATE */]: 3e9,
      ["GOVERNMENT" /* GOVERNMENT */]: 1e9,
      ["JOINT" /* JOINT */]: 5e8,
      ["TRUST" /* TRUST */]: 3e8
    };
    const industryTotal = industryTotals[depositType] || 1e9;
    return institutionDeposits / industryTotal * 100;
  }
  async _calculateDepositTrends(institutionId, periodStart, periodEnd) {
    const historicalPeriods = await this.db.query.surveillancePeriods.findMany({
      where: and3(
        eq3(surveillancePeriods.institutionId, institutionId),
        lte2(surveillancePeriods.periodEnd, periodEnd),
        gte2(
          surveillancePeriods.periodEnd,
          new Date(periodEnd.getTime() - 365 * 24 * 60 * 60 * 1e3)
          // Last 12 months
        )
      ),
      orderBy: surveillancePeriods.periodEnd
    });
    const trends = {
      total_deposits: [],
      account_growth: [],
      composition_changes: [],
      volatility_metrics: {}
    };
    for (const period of historicalPeriods) {
      const analyses = await this.db.query.depositAnalyses.findMany({
        where: eq3(depositAnalyses.periodId, period.id)
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
      (a) => a.deposit_type === "CORPORATE" /* CORPORATE */
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
      id: uuidv42(),
      institutionId,
      periodType,
      periodStart: periodStart.toISOString().slice(0, 10),
      periodEnd: periodEnd.toISOString().slice(0, 10)
    };
    const [insertedPeriod] = await this.db.insert(surveillancePeriods).values(newPeriod);
    return insertedPeriod;
  }
};

// server/invoicing-service.ts
import { eq as eq4, and as and4, sql as sql3, gte as gte3, lt } from "drizzle-orm";
import { v4 as uuidv43 } from "uuid";
var InvoicingService = class {
  db;
  constructor(db2) {
    this.db = db2;
  }
  async generateInvoice(premiumCalculationId, dueDate) {
    const premiumCalc = await this.db.query.premiumCalculations.findFirst({
      where: eq4(premiumCalculations.id, premiumCalculationId)
    });
    if (!premiumCalc) {
      return { error: "Premium calculation not found" };
    }
    if (premiumCalc.status !== "CALCULATED" /* CALCULATED */) {
      return { error: "Premium calculation is not in calculatable state" };
    }
    const invoiceNumber = await this._generateInvoiceNumber(
      premiumCalc.institutionId
    );
    const taxAmount = this._calculateTax(parseFloat(premiumCalc.finalPremium));
    const totalAmount = parseFloat(premiumCalc.finalPremium) + taxAmount;
    const invoice = {
      id: uuidv43(),
      premiumCalculationId,
      institutionId: premiumCalc.institutionId,
      invoiceNumber,
      invoiceDate: /* @__PURE__ */ new Date(),
      dueDate,
      amount: premiumCalc.finalPremium,
      taxAmount: taxAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      status: "INVOICED" /* INVOICED */
    };
    await this.db.insert(invoices).values(invoice);
    await this.db.update(premiumCalculations).set({ status: "INVOICED" /* INVOICED */ }).where(eq4(premiumCalculations.id, premiumCalculationId));
    const invoiceDocument = await this._generateInvoiceDocument(invoice);
    return {
      invoice: {
        id: invoice.id,
        invoice_number: invoice.invoiceNumber,
        invoice_date: invoice.invoiceDate?.toISOString(),
        due_date: invoice.dueDate.toISOString(),
        amount: parseFloat(invoice.amount),
        tax_amount: parseFloat(invoice.taxAmount),
        total_amount: parseFloat(invoice.totalAmount),
        status: invoice.status,
        paid_amount: parseFloat(invoice.paidAmount),
        paid_at: invoice.paidAt?.toISOString(),
        payment_reference: invoice.paymentReference
      },
      invoice_document: invoiceDocument
    };
  }
  async _generateInvoiceNumber(institutionId) {
    const institution = await this.db.query.institutions.findFirst({
      where: eq4(institutions.id, institutionId)
    });
    if (!institution) {
      throw new Error("Institution not found");
    }
    const year = (/* @__PURE__ */ new Date()).getFullYear();
    const month = (/* @__PURE__ */ new Date()).getMonth() + 1;
    const invoiceCount = await this.db.select({ count: sql3`count(*)` }).from(invoices).where(
      and4(
        gte3(invoices.invoiceDate, /* @__PURE__ */ new Date(`${year}-${month}-01`)),
        lt(
          invoices.invoiceDate,
          /* @__PURE__ */ new Date(
            `${month === 12 ? year + 1 : year}-${month === 12 ? 1 : month + 1}-01`
          )
        )
      )
    );
    const count = invoiceCount[0].count || 0;
    return `INV-${institution.code}-${year}${month.toString().padStart(2, "0")}-${(count + 1).toString().padStart(4, "0")}`;
  }
  _calculateTax(premiumAmount) {
    const taxRate = 0.15;
    return premiumAmount * taxRate;
  }
  async _generateInvoiceDocument(invoice) {
    const premiumCalc = await this.db.query.premiumCalculations.findFirst({
      where: eq4(premiumCalculations.id, invoice.premiumCalculationId)
    });
    const institution = await this.db.query.institutions.findFirst({
      where: eq4(institutions.id, invoice.institutionId)
    });
    if (!premiumCalc || !institution) {
      throw new Error("Premium calculation or institution not found");
    }
    const period = { period_type: "", period_start: /* @__PURE__ */ new Date(), period_end: /* @__PURE__ */ new Date() };
    const invoiceData = {
      invoice_number: invoice.invoiceNumber,
      invoice_date: invoice.invoiceDate?.toISOString(),
      due_date: invoice.dueDate.toISOString(),
      institution: {
        name: institution.name,
        code: institution.code,
        address: "123 Main Street, Harare, Zimbabwe",
        contact_email: ""
        // Placeholder
      },
      premium_period: {
        type: period.period_type,
        start: period.period_start.toISOString(),
        end: period.period_end.toISOString()
      },
      premium_calculation: {
        method: premiumCalc.calculationMethod,
        average_eligible_deposits: parseFloat(premiumCalc.averageEligibleDeposits),
        premium_rate: parseFloat(premiumCalc.riskPremiumRate),
        risk_adjustment: parseFloat(premiumCalc.riskAdjustmentFactor)
      },
      line_items: [
        {
          description: `Deposit Insurance Premium - ${period.period_type} ${period.period_start.toLocaleString("en-US", { month: "short", year: "numeric" })}`,
          amount: parseFloat(invoice.amount),
          quantity: 1,
          unit_price: parseFloat(invoice.amount)
        }
      ],
      tax_amount: parseFloat(invoice.taxAmount),
      total_amount: parseFloat(invoice.totalAmount),
      payment_instructions: {
        bank_name: "Reserve Bank of Zimbabwe",
        account_number: "123456789",
        account_name: "Deposit Protection Corporation",
        reference: invoice.invoiceNumber
      },
      terms_and_conditions: [
        "Payment due within 30 days of invoice date",
        "Late payments subject to penalty charges",
        "Please quote invoice number as payment reference"
      ]
    };
    return invoiceData;
  }
  async sendToAccountingSystem(invoiceId) {
    const invoice = await this.db.query.invoices.findFirst({
      where: eq4(invoices.id, invoiceId)
    });
    if (!invoice) {
      return { error: "Invoice not found" };
    }
    if (invoice.sentToAccounting) {
      return { error: "Invoice already sent to accounting system" };
    }
    const accountingPayload = await this._prepareAccountingPayload(invoice);
    try {
      const accountingReference = `ACC-${invoice.invoiceNumber}-${(/* @__PURE__ */ new Date()).toISOString().replace(/[^0-9]/g, "")}`;
      await this.db.update(invoices).set({
        sentToAccounting: true,
        accountingReference
      }).where(eq4(invoices.id, invoiceId));
      return {
        success: true,
        accounting_reference: accountingReference,
        sent_at: (/* @__PURE__ */ new Date()).toISOString(),
        payload_preview: accountingPayload
      };
    } catch (e) {
      return { error: `Failed to send to accounting system: ${e.message}` };
    }
  }
  async _prepareAccountingPayload(invoice) {
    const institution = await this.db.query.institutions.findFirst({
      where: eq4(institutions.id, invoice.institutionId)
    });
    const premiumCalc = await this.db.query.premiumCalculations.findFirst({
      where: eq4(premiumCalculations.id, invoice.premiumCalculationId)
    });
    if (!institution || !premiumCalc) {
      throw new Error("Institution or premium calculation not found");
    }
    return {
      transaction_type: "PREMIUM_INVOICE",
      invoice_number: invoice.invoiceNumber,
      invoice_date: invoice.invoiceDate?.toISOString(),
      due_date: invoice.dueDate.toISOString(),
      customer: {
        id: institution.id,
        name: institution.name,
        code: institution.code
      },
      line_items: [
        {
          account_code: "410001",
          // Premium Income
          description: "Deposit Insurance Premium",
          amount: parseFloat(invoice.amount),
          tax_code: "VAT15",
          tax_amount: parseFloat(invoice.taxAmount)
        }
      ],
      total_amount: parseFloat(invoice.totalAmount),
      payment_terms: "NET30",
      metadata: {
        premium_calculation_id: premiumCalc.id,
        period_id: premiumCalc.periodId,
        calculation_method: premiumCalc.calculationMethod
      }
    };
  }
  async getInvoiceStatus(invoiceId) {
    const invoice = await this.db.query.invoices.findFirst({
      where: eq4(invoices.id, invoiceId)
    });
    if (!invoice) {
      return { error: "Invoice not found" };
    }
    const payments2 = await this.db.query.payments.findMany({
      where: eq4(payments.invoiceId, invoiceId)
    });
    const penalties2 = await this.db.query.premiumPenalties.findMany({
      where: eq4(premiumPenalties.invoiceId, invoiceId)
    });
    const totalPaid = payments2.reduce(
      (sum, payment) => payment.status === "RECEIVED" || payment.status === "VERIFIED" ? sum + parseFloat(payment.amount) : sum,
      0
    );
    const outstandingAmount = parseFloat(invoice.totalAmount) - totalPaid;
    const isOverdue = /* @__PURE__ */ new Date() > invoice.dueDate && outstandingAmount > 0;
    return {
      invoice: {
        id: invoice.id,
        invoice_number: invoice.invoiceNumber,
        invoice_date: invoice.invoiceDate?.toISOString(),
        due_date: invoice.dueDate.toISOString(),
        amount: parseFloat(invoice.amount),
        tax_amount: parseFloat(invoice.taxAmount),
        total_amount: parseFloat(invoice.totalAmount),
        status: isOverdue ? "OVERDUE" /* OVERDUE */ : invoice.status,
        paid_amount: totalPaid,
        paid_at: invoice.paidAt?.toISOString(),
        payment_reference: invoice.paymentReference
      },
      payment_summary: {
        total_invoiced: parseFloat(invoice.totalAmount),
        total_paid: totalPaid,
        outstanding_amount: outstandingAmount,
        is_overdue: isOverdue,
        days_overdue: isOverdue ? Math.floor(
          ((/* @__PURE__ */ new Date()).getTime() - invoice.dueDate.getTime()) / (1e3 * 60 * 60 * 24)
        ) : 0
      },
      payments: payments2.map((payment) => ({
        id: payment.id,
        amount: parseFloat(payment.amount),
        payment_date: payment.paymentDate.toISOString(),
        payment_method: payment.paymentMethod,
        payment_reference: payment.paymentReference,
        status: payment.status,
        verified_at: payment.verifiedAt?.toISOString()
      })),
      penalties: penalties2.map((penalty) => ({
        id: penalty.id,
        penalty_type: penalty.penaltyType,
        penalty_amount: parseFloat(penalty.penaltyAmount),
        total_amount: parseFloat(penalty.totalAmount),
        days_overdue: penalty.daysOverdue,
        status: penalty.status,
        due_date: penalty.dueDate.toISOString()
      }))
    };
  }
};

// server/penalties-service.ts
import { eq as eq5, and as and5, lte as lte4 } from "drizzle-orm";
import { v4 as uuidv44 } from "uuid";
var PenaltiesService = class {
  db;
  constructor(db2) {
    this.db = db2;
  }
  async checkAndApplyPenalties(institutionId) {
    const institution = await this.db.query.institutions.findFirst({
      where: eq5(institutions.id, institutionId)
    });
    if (!institution) {
      return { error: "Institution not found" };
    }
    const overduePeriods = await this.db.query.returnPeriods.findMany({
      where: and5(
        eq5(returnPeriods.institutionId, institutionId),
        lte4(returnPeriods.periodEnd, /* @__PURE__ */ new Date()),
        // Assuming due_date is period_end
        eq5(returnPeriods.status, "OPEN" /* OPEN */)
        // Only consider OPEN periods as not submitted
      )
    });
    const appliedPenalties = [];
    for (const period of overduePeriods) {
      const uploadedReturn = await this.db.query.returns.findFirst({
        where: eq5(returns.returnPeriod, period.periodEnd.toISOString().slice(0, 10))
        // Assuming returnPeriod matches period.periodEnd
      });
      if (!uploadedReturn || uploadedReturn.status !== "SUBMITTED" /* SUBMITTED */) {
        const penaltyAmount = 100;
        const reason = "Late or non-submission of regulatory return";
        const penaltyType = "LATE_SUBMISSION";
        const existingPenalty = await this.db.query.premiumPenalties.findFirst({
          where: and5(
            eq5(premiumPenalties.invoiceId, ""),
            // Placeholder: Need to link to an invoice if applicable
            eq5(premiumPenalties.penaltyType, penaltyType)
          )
        });
        if (!existingPenalty) {
          const newPenalty = {
            id: uuidv44(),
            invoiceId: "",
            // Placeholder: Need to link to an invoice if applicable
            penaltyType,
            penaltyAmount: penaltyAmount.toFixed(2),
            totalAmount: penaltyAmount.toFixed(2),
            daysOverdue: 0,
            // Placeholder
            status: "PENDING",
            dueDate: new Date((/* @__PURE__ */ new Date()).setDate((/* @__PURE__ */ new Date()).getDate() + 30))
            // 30 days to pay penalty
          };
          await this.db.insert(premiumPenalties).values(newPenalty);
          appliedPenalties.push(newPenalty);
        }
        await this.db.update(returnPeriods).set({ status: "OVERDUE" /* OVERDUE */ }).where(eq5(returnPeriods.id, period.id));
      }
    }
    await this._checkAndLockInstitution(institution);
    return {
      institution_id: institutionId,
      overdue_periods_count: overduePeriods.length,
      applied_penalties: appliedPenalties,
      institution_status: institution.status
    };
  }
  async _checkAndLockInstitution(institution) {
    const unpaidPenaltiesCount = await this.db.query.premiumPenalties.findMany({
      where: and5(
        // eq(schema.premiumPenalties.institutionId, institution.id), // Need institutionId in premiumPenalties table
        eq5(premiumPenalties.status, "PENDING"),
        lte4(premiumPenalties.dueDate, /* @__PURE__ */ new Date())
      )
    });
    if (unpaidPenaltiesCount.length >= 3) {
      await this.db.update(institutions).set({ status: "LOCKED" }).where(eq5(institutions.id, institution.id));
    }
  }
  async getPenaltiesForInstitution(institutionId) {
    const penalties2 = await this.db.query.premiumPenalties.findMany({
      where: eq5(premiumPenalties.invoiceId, "")
      // Placeholder: Need to filter by institutionId
    });
    return penalties2.map((p) => ({
      id: p.id,
      penalty_type: p.penaltyType,
      penalty_amount: parseFloat(p.penaltyAmount),
      total_amount: parseFloat(p.totalAmount),
      days_overdue: p.daysOverdue,
      status: p.status,
      due_date: p.dueDate.toISOString()
    }));
  }
  async payPenalty(penaltyId, paymentDetails) {
    const penalty = await this.db.query.premiumPenalties.findFirst({
      where: eq5(premiumPenalties.id, penaltyId)
    });
    if (!penalty) {
      throw new Error("Penalty not found");
    }
    await this.db.update(premiumPenalties).set({
      status: "PAID",
      paidAt: /* @__PURE__ */ new Date(),
      paymentReference: paymentDetails.payment_reference
    }).where(eq5(premiumPenalties.id, penaltyId));
    const updatedPenalty = await this.db.query.premiumPenalties.findFirst({
      where: eq5(premiumPenalties.id, penaltyId)
    });
    const institution = await this.db.query.institutions.findFirst({
      where: eq5(institutions.id, updatedPenalty?.invoiceId)
      // Placeholder: Need institutionId in premiumPenalties
    });
    if (institution && institution.status === "LOCKED") {
      const unpaidPenalties = await this.db.query.premiumPenalties.findMany({
        where: and5(
          // eq(schema.premiumPenalties.institutionId, institution.id), // Need institutionId in premiumPenalties
          eq5(premiumPenalties.status, "PENDING")
        )
      });
      if (unpaidPenalties.length === 0) {
        await this.db.update(institutions).set({ status: "ACTIVE" }).where(eq5(institutions.id, institution.id));
      }
    }
    return updatedPenalty;
  }
  async waivePenalty(penaltyId, reason) {
    const penalty = await this.db.query.premiumPenalties.findFirst({
      where: eq5(premiumPenalties.id, penaltyId)
    });
    if (!penalty) {
      throw new Error("Penalty not found");
    }
    await this.db.update(premiumPenalties).set({
      status: "WAIVED",
      reason: `${penalty.reason}
Waived: ${reason}`
    }).where(eq5(premiumPenalties.id, penaltyId));
    const updatedPenalty = await this.db.query.premiumPenalties.findFirst({
      where: eq5(premiumPenalties.id, penaltyId)
    });
    return updatedPenalty;
  }
};

// server/camels-calculations.ts
var CAMELSCalculations = class {
  db;
  constructor(db2) {
    this.db = db2;
  }
  async calculateCamelsRatings(institutionId, periodId, financialData) {
    const capitalAdequacy = this._calculateCapitalAdequacy(financialData);
    const assetQuality = this._calculateAssetQuality(financialData);
    const managementQuality = this._calculateManagementQuality(financialData);
    const earnings = this._calculateEarnings(financialData);
    const liquidity = this._calculateLiquidity(financialData);
    const sensitivity = this._calculateSensitivity(financialData);
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
        components: capitalAdequacy.components
      },
      asset_quality: {
        score: assetQuality.score,
        rating: assetQuality.rating,
        components: assetQuality.components
      },
      management_quality: {
        score: managementQuality.score,
        rating: managementQuality.rating,
        components: managementQuality.components
      },
      earnings: {
        score: earnings.score,
        rating: earnings.rating,
        components: earnings.components
      },
      liquidity: {
        score: liquidity.score,
        rating: liquidity.rating,
        components: liquidity.components
      },
      sensitivity: {
        score: sensitivity.score,
        rating: sensitivity.rating,
        components: sensitivity.components
      },
      composite_rating: compositeRating,
      risk_grade: this._getRiskGrade(compositeRating),
      calculated_at: /* @__PURE__ */ new Date()
    };
  }
  _calculateCapitalAdequacy(data) {
    const tier1Capital = data.tier1_capital || 0;
    const tier2Capital = data.tier2_capital || 0;
    const riskWeightedAssets = data.risk_weighted_assets || 1;
    const car = (tier1Capital + tier2Capital) / riskWeightedAssets * 100;
    const tier1Ratio = tier1Capital / riskWeightedAssets * 100;
    const tier2Ratio = tier2Capital / riskWeightedAssets * 100;
    const totalAssets = data.total_assets || 1;
    const capitalToAssets = (tier1Capital + tier2Capital) / totalAssets * 100;
    const totalEquity = data.total_equity || 0;
    const equityToAssets = totalEquity / totalAssets * 100;
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
        equity_to_assets: equityToAssets
      }
    };
  }
  _calculateAssetQuality(data) {
    const totalAssets = data.total_assets || 1;
    const grossNpa = data.gross_npa || 0;
    const netNpa = data.net_npa || 0;
    const totalLoans = data.total_loans || 1;
    const provisions = data.provisions || 0;
    const top10Exposures = data.top_10_exposures || 0;
    const grossNpaRatio = grossNpa / totalLoans * 100;
    const netNpaRatio = netNpa / totalLoans * 100;
    const provisionCoverage = grossNpa > 0 ? provisions / grossNpa * 100 : 100;
    const loanLossReserve = provisions / totalLoans * 100;
    const assetConcentration = totalLoans > 0 ? top10Exposures / totalLoans * 100 : 0;
    const previousAssets = data.previous_year_assets || totalAssets;
    const assetGrowth = (totalAssets - previousAssets) / previousAssets * 100;
    const npaScore = this._rateNpaRatio(netNpaRatio, 5, 2);
    const coverageScore = this._rateCoverageRatio(provisionCoverage, 70, 85);
    const growthScore = this._rateGrowthRatio(assetGrowth, [8, 15]);
    const componentScore = npaScore * 0.5 + coverageScore * 0.3 + growthScore * 0.2;
    return {
      score: componentScore,
      rating: this._getComponentRating(componentScore),
      components: {
        gross_npa_ratio: grossNpaRatio,
        net_npa_ratio: netNpaRatio,
        provision_coverage: provisionCoverage,
        loan_loss_reserve: loanLossReserve,
        asset_concentration: assetConcentration,
        asset_growth: assetGrowth
      }
    };
  }
  _calculateManagementQuality(data) {
    const totalIncome = data.total_income || 1;
    const operatingExpenses = data.operating_expenses || 0;
    const totalAssets = data.total_assets || 1;
    const totalEquity = data.total_equity || 1;
    const costToIncome = operatingExpenses / totalIncome * 100;
    const assetUtilization = totalIncome / totalAssets * 100;
    const totalEmployees = data.total_employees || 1;
    const businessPerEmployee = totalAssets / totalEmployees;
    const netIncome = data.net_income || 0;
    const roe = netIncome / totalEquity * 100;
    const costScore = this._rateCostRatio(costToIncome, 60, 45);
    const assetUtilScore = this._rateUtilizationRatio(assetUtilization, 2, 3);
    const roeScore = this._rateRoeRatio(roe, 8, 12);
    const componentScore = costScore * 0.4 + assetUtilScore * 0.3 + roeScore * 0.3;
    return {
      score: componentScore,
      rating: this._getComponentRating(componentScore),
      components: {
        cost_to_income: costToIncome,
        asset_utilization: assetUtilization,
        business_per_employee: businessPerEmployee,
        return_on_equity: roe
      }
    };
  }
  _calculateEarnings(data) {
    const netIncome = data.net_income || 0;
    const totalAssets = data.total_assets || 1;
    const totalEquity = data.total_equity || 1;
    const operatingIncome = data.operating_income || 1;
    const interestIncome = data.interest_income || 0;
    const interestExpense = data.interest_expense || 0;
    const earningsGrowth = data.earnings_growth || 0;
    const roa = netIncome / totalAssets * 100;
    const roe = netIncome / totalEquity * 100;
    const earningAssets = data.earning_assets || totalAssets;
    const nim = (interestIncome - interestExpense) / earningAssets * 100;
    const operatingMargin = operatingIncome / totalAssets * 100;
    const nonInterestIncome = data.non_interest_income || 0;
    const incomeDiversity = operatingIncome > 0 ? nonInterestIncome / operatingIncome * 100 : 0;
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
        earnings_trend: earningsTrend
      }
    };
  }
  _calculateLiquidity(data) {
    const liquidAssets = data.liquid_assets || 0;
    const cashEquivalents = data.cash_equivalents || 0;
    const totalAssets = data.total_assets || 1;
    const shortTermLiabilities = data.short_term_liabilities || 1;
    const totalDeposits = data.total_deposits || 1;
    const totalLoans = data.total_loans || 0;
    const liquidityRatio = liquidAssets / totalAssets * 100;
    const cashToAssetsRatio = cashEquivalents / totalAssets * 100;
    const loanToDeposit = totalLoans / totalDeposits * 100;
    const quickRatio = liquidAssets / shortTermLiabilities * 100;
    const coreDeposits = data.core_deposits || totalDeposits * 0.7;
    const coreDepositsRatio = coreDeposits / totalDeposits * 100;
    const liquidityScore = this._rateLiquidityRatio(liquidityRatio, 20, 30);
    const ltdScore = this._rateLtdRatio(loanToDeposit, 80, 75);
    const quickScore = this._rateQuickRatio(quickRatio, 100, 120);
    const componentScore = liquidityScore * 0.4 + ltdScore * 0.4 + quickScore * 0.2;
    return {
      score: componentScore,
      rating: this._getComponentRating(componentScore),
      components: {
        liquidity_ratio: liquidityRatio,
        cash_to_assets_ratio: cashToAssetsRatio,
        loan_to_deposit: loanToDeposit,
        quick_ratio: quickRatio,
        core_deposits_ratio: coreDepositsRatio
      }
    };
  }
  _calculateSensitivity(data) {
    const totalAssets = data.total_assets || 1;
    const foreignCurrencyAssets = data.foreign_currency_assets || 0;
    const foreignCurrencyLiabilities = data.foreign_currency_liabilities || 0;
    const interestSensitiveAssets = data.interest_sensitive_assets || 0;
    const interestSensitiveLiabilities = data.interest_sensitive_liabilities || 0;
    const fxExposure = data.fx_exposure || 0;
    const fxRisk = Math.abs(foreignCurrencyAssets - foreignCurrencyLiabilities) / totalAssets * 100;
    const interestGap = (interestSensitiveAssets - interestSensitiveLiabilities) / totalAssets * 100;
    const largestDepositor = data.largest_depositor || 0;
    const depositConcentration = largestDepositor / totalAssets * 100;
    const marketConcentration = fxExposure;
    const currentEarnings = data.net_income || 0;
    const previousEarnings = data.previous_net_income || currentEarnings;
    const earningsVolatility = previousEarnings > 0 ? Math.abs((currentEarnings - previousEarnings) / previousEarnings) * 100 : 0;
    const fxScore = this._rateFxExposure(Math.abs(fxRisk), 10, 5);
    const interestScore = this._rateInterestGap(Math.abs(interestGap), 15, 10);
    const concentrationScore = this._rateConcentrationRatio(
      depositConcentration,
      20,
      15
    );
    const componentScore = fxScore * 0.4 + interestScore * 0.3 + concentrationScore * 0.3;
    return {
      score: componentScore,
      rating: this._getComponentRating(componentScore),
      components: {
        fx_risk: fxRisk,
        interest_rate_gap: interestGap,
        deposit_concentration: depositConcentration,
        market_concentration: marketConcentration,
        earnings_volatility: earningsVolatility
      }
    };
  }
  _calculateCompositeRating(capital, assets, management, earnings, liquidity, sensitivity) {
    const weights = {
      capital: 0.25,
      assets: 0.2,
      management: 0.25,
      earnings: 0.1,
      liquidity: 0.1,
      sensitivity: 0.1
    };
    const composite = capital.score * weights.capital + assets.score * weights.assets + management.score * weights.management + earnings.score * weights.earnings + liquidity.score * weights.liquidity + sensitivity.score * weights.sensitivity;
    return composite;
  }
  _rateCapitalRatio(ratio, minThreshold, strongThreshold) {
    if (ratio >= strongThreshold) {
      return 1;
    } else if (ratio >= minThreshold) {
      return 2;
    } else if (ratio >= minThreshold - 2) {
      return 3;
    } else if (ratio >= minThreshold - 4) {
      return 4;
    } else {
      return 5;
    }
  }
  _rateNpaRatio(ratio, maxThreshold, goodThreshold) {
    if (ratio <= goodThreshold) {
      return 1;
    } else if (ratio <= maxThreshold) {
      return 2;
    } else if (ratio <= maxThreshold + 3) {
      return 3;
    } else if (ratio <= maxThreshold + 6) {
      return 4;
    } else {
      return 5;
    }
  }
  _rateCoverageRatio(ratio, minThreshold, strongThreshold) {
    if (ratio >= strongThreshold) {
      return 1;
    } else if (ratio >= minThreshold) {
      return 2;
    } else if (ratio >= minThreshold - 15) {
      return 3;
    } else if (ratio >= minThreshold - 30) {
      return 4;
    } else {
      return 5;
    }
  }
  _rateCostRatio(ratio, maxThreshold, goodThreshold) {
    if (ratio <= goodThreshold) {
      return 1;
    } else if (ratio <= maxThreshold) {
      return 2;
    } else if (ratio <= maxThreshold + 10) {
      return 3;
    } else if (ratio <= maxThreshold + 20) {
      return 4;
    } else {
      return 5;
    }
  }
  _rateRoaRatio(ratio, minThreshold, strongThreshold) {
    if (ratio >= strongThreshold) {
      return 1;
    } else if (ratio >= minThreshold) {
      return 2;
    } else if (ratio >= 0) {
      return 3;
    } else if (ratio >= -minThreshold) {
      return 4;
    } else {
      return 5;
    }
  }
  _rateLiquidityRatio(ratio, minThreshold, strongThreshold) {
    if (ratio >= strongThreshold) {
      return 1;
    } else if (ratio >= minThreshold) {
      return 2;
    } else if (ratio >= minThreshold - 5) {
      return 3;
    } else if (ratio >= minThreshold - 10) {
      return 4;
    } else {
      return 5;
    }
  }
  _rateLtdRatio(ratio, maxThreshold, goodThreshold) {
    if (ratio <= goodThreshold) {
      return 1;
    } else if (ratio <= maxThreshold) {
      return 2;
    } else if (ratio <= maxThreshold + 10) {
      return 3;
    } else if (ratio <= maxThreshold + 20) {
      return 4;
    } else {
      return 5;
    }
  }
  _rateNimRatio(ratio, minThreshold, strongThreshold) {
    if (ratio >= strongThreshold) {
      return 1;
    } else if (ratio >= minThreshold) {
      return 2;
    } else if (ratio >= minThreshold - 0.5) {
      return 3;
    } else if (ratio >= minThreshold - 1) {
      return 4;
    } else {
      return 5;
    }
  }
  _rateUtilizationRatio(ratio, minThreshold, strongThreshold) {
    if (ratio >= strongThreshold) {
      return 1;
    } else if (ratio >= minThreshold) {
      return 2;
    } else if (ratio >= minThreshold - 0.5) {
      return 3;
    } else if (ratio >= minThreshold - 1) {
      return 4;
    } else {
      return 5;
    }
  }
  _rateRoeRatio(ratio, minThreshold, strongThreshold) {
    if (ratio >= strongThreshold) {
      return 1;
    } else if (ratio >= minThreshold) {
      return 2;
    } else if (ratio >= minThreshold - 2) {
      return 3;
    } else if (ratio >= minThreshold - 4) {
      return 4;
    } else {
      return 5;
    }
  }
  _rateFxExposure(ratio, maxThreshold, goodThreshold) {
    if (ratio <= goodThreshold) {
      return 1;
    } else if (ratio <= maxThreshold) {
      return 2;
    } else if (ratio <= maxThreshold + 5) {
      return 3;
    } else if (ratio <= maxThreshold + 10) {
      return 4;
    } else {
      return 5;
    }
  }
  _rateInterestGap(ratio, maxThreshold, goodThreshold) {
    if (ratio <= goodThreshold) {
      return 1;
    } else if (ratio <= maxThreshold) {
      return 2;
    } else if (ratio <= maxThreshold + 5) {
      return 3;
    } else if (ratio <= maxThreshold + 10) {
      return 4;
    } else {
      return 5;
    }
  }
  _rateConcentrationRatio(ratio, maxThreshold, goodThreshold) {
    if (ratio <= goodThreshold) {
      return 1;
    } else if (ratio <= maxThreshold) {
      return 2;
    } else if (ratio <= maxThreshold + 5) {
      return 3;
    } else if (ratio <= maxThreshold + 10) {
      return 4;
    } else {
      return 5;
    }
  }
  _rateGrowthRatio(ratio, optimalRange) {
    const [minOptimal, maxOptimal] = optimalRange;
    if (ratio >= minOptimal && ratio <= maxOptimal) {
      return 1;
    } else if (ratio > maxOptimal + 5 || ratio < minOptimal - 5) {
      return 3;
    } else if (ratio > maxOptimal + 10 || ratio < minOptimal - 10) {
      return 4;
    } else if (ratio > maxOptimal + 15 || ratio < minOptimal - 15) {
      return 5;
    } else {
      return 2;
    }
  }
  _getComponentRating(score) {
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
  _getRiskGrade(compositeScore) {
    if (compositeScore <= 1.8) {
      return "A";
    } else if (compositeScore <= 2.5) {
      return "B";
    } else if (compositeScore <= 3.2) {
      return "C";
    } else if (compositeScore <= 4) {
      return "D";
    } else {
      return "E";
    }
  }
};

// server/deposit-classification.ts
var DepositClassificationEngine = class {
  coverLevel;
  sizeCategories = {
    small: { min: 0, max: 1e3 },
    medium: { min: 1e3, max: 5e3 },
    large: { min: 5e3, max: Infinity }
  };
  constructor(coverLevel = 5e3) {
    this.coverLevel = coverLevel;
  }
  classifyDeposits(accounts, period, bankId) {
    const accountsWithNumericBalance = accounts.map((account) => ({
      ...account,
      balance_numeric: account.balance || 0
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
      period,
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
      cover_level: this.coverLevel
    };
  }
  _classifyByCustomerType(accounts) {
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
      corporate: corporateDeposits
    };
  }
  _classifyByAccountType(accounts) {
    const accountTypeSums = {};
    accounts.forEach((account) => {
      if (account.account_type) {
        accountTypeSums[account.account_type] = (accountTypeSums[account.account_type] || 0) + account.balance;
      }
    });
    return accountTypeSums;
  }
  _classifyByCurrency(accounts) {
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
      other: otherDeposits
    };
  }
  _classifyBySize(accounts) {
    let smallDeposits = 0;
    let mediumDeposits = 0;
    let largeDeposits = 0;
    accounts.forEach((account) => {
      if (account.balance < this.sizeCategories.small.max) {
        smallDeposits += account.balance;
      } else if (account.balance >= this.sizeCategories.medium.min && account.balance < this.sizeCategories.medium.max) {
        mediumDeposits += account.balance;
      } else if (account.balance >= this.sizeCategories.large.min) {
        largeDeposits += account.balance;
      }
    });
    return {
      small: smallDeposits,
      medium: mediumDeposits,
      large: largeDeposits
    };
  }
  _calculateExposure(accounts) {
    const accountsWithInsuredAmount = accounts.map((account) => ({
      ...account,
      insured_amount: Math.min(account.balance, this.coverLevel)
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
      corporate: corporateExposure
    };
  }
  _countAccounts(accounts) {
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
      corporate: corporateAccounts
    };
  }
  analyzeTrends(currentPeriodData, previousPeriodData = null) {
    if (previousPeriodData === null) {
      return {
        deposit_growth: 0,
        account_growth: 0,
        exposure_growth: 0,
        trends: []
      };
    }
    const currentDeposits = currentPeriodData.total_deposits || 0;
    const previousDeposits = previousPeriodData.total_deposits || 1;
    const depositGrowth = previousDeposits > 0 ? (currentDeposits - previousDeposits) / previousDeposits * 100 : 0;
    const currentAccounts = currentPeriodData.total_accounts || 0;
    const previousAccounts = previousPeriodData.total_accounts || 1;
    const accountGrowth = previousAccounts > 0 ? (currentAccounts - previousAccounts) / previousAccounts * 100 : 0;
    const currentExposure = currentPeriodData.total_exposure || 0;
    const previousExposure = previousPeriodData.total_exposure || 1;
    const exposureGrowth = previousExposure > 0 ? (currentExposure - previousExposure) / previousExposure * 100 : 0;
    const trends = [];
    if (depositGrowth > 10) {
      trends.push({
        metric: "Deposits",
        trend: "Strong Growth",
        change: depositGrowth
      });
    } else if (depositGrowth > 5) {
      trends.push({
        metric: "Deposits",
        trend: "Moderate Growth",
        change: depositGrowth
      });
    } else if (depositGrowth < -5) {
      trends.push({
        metric: "Deposits",
        trend: "Declining",
        change: depositGrowth
      });
    } else {
      trends.push({
        metric: "Deposits",
        trend: "Stable",
        change: depositGrowth
      });
    }
    if (accountGrowth > 10) {
      trends.push({
        metric: "Accounts",
        trend: "Strong Growth",
        change: accountGrowth
      });
    } else if (accountGrowth < -5) {
      trends.push({
        metric: "Accounts",
        trend: "Declining",
        change: accountGrowth
      });
    }
    return {
      deposit_growth: parseFloat(depositGrowth.toFixed(2)),
      account_growth: parseFloat(accountGrowth.toFixed(2)),
      exposure_growth: parseFloat(exposureGrowth.toFixed(2)),
      trends
    };
  }
};

// server/business-logic.ts
var camelsCalculations = new CAMELSCalculations(db);
var depositClassificationEngine = new DepositClassificationEngine();
function runStressTest(params) {
  let shockFactors = {
    depositWithdrawal: 0,
    loanDefault: 0,
    capitalImpact: 0,
    liquidityImpact: 0
  };
  switch (params.scenarioType) {
    case "EXCHANGE_RATE_SHOCK":
      shockFactors = {
        depositWithdrawal: params.severity === "SEVERE" ? 0.2 : params.severity === "MODERATE" ? 0.1 : 0.05,
        loanDefault: params.severity === "SEVERE" ? 0.15 : params.severity === "MODERATE" ? 0.08 : 0.04,
        capitalImpact: params.severity === "SEVERE" ? 0.25 : params.severity === "MODERATE" ? 0.15 : 0.08,
        liquidityImpact: params.severity === "SEVERE" ? 0.3 : params.severity === "MODERATE" ? 0.18 : 0.1
      };
      break;
    case "LIQUIDITY_SHOCK":
      shockFactors = {
        depositWithdrawal: params.severity === "SEVERE" ? 0.35 : params.severity === "MODERATE" ? 0.2 : 0.1,
        loanDefault: 0.05,
        capitalImpact: params.severity === "SEVERE" ? 0.15 : params.severity === "MODERATE" ? 0.1 : 0.05,
        liquidityImpact: params.severity === "SEVERE" ? 0.4 : params.severity === "MODERATE" ? 0.25 : 0.15
      };
      break;
    case "INTEREST_RATE_SHOCK":
      shockFactors = {
        depositWithdrawal: 0.1,
        loanDefault: params.severity === "SEVERE" ? 0.2 : params.severity === "MODERATE" ? 0.12 : 0.06,
        capitalImpact: params.severity === "SEVERE" ? 0.18 : params.severity === "MODERATE" ? 0.12 : 0.06,
        liquidityImpact: 0.1
      };
      break;
    default:
      shockFactors = {
        depositWithdrawal: 0.15,
        loanDefault: 0.1,
        capitalImpact: 0.12,
        liquidityImpact: 0.15
      };
  }
  const stressedFinancials = {
    deposits: params.currentFinancials.deposits * (1 - shockFactors.depositWithdrawal),
    loans: params.currentFinancials.loans * (1 - shockFactors.loanDefault),
    capital: params.currentFinancials.capital * (1 - shockFactors.capitalImpact),
    liquidity: params.currentFinancials.liquidity * (1 - shockFactors.liquidityImpact)
  };
  const capitalShortfall = Math.max(0, params.currentFinancials.deposits * 0.1 - stressedFinancials.capital);
  const liquidityGap = Math.max(0, stressedFinancials.deposits * 0.2 - stressedFinancials.liquidity);
  const probabilityOfDefault = Math.min(100, capitalShortfall / params.currentFinancials.capital * 100 + liquidityGap / params.currentFinancials.liquidity * 100);
  return {
    stressedFinancials,
    impactAnalysis: {
      capitalImpact: `${(shockFactors.capitalImpact * 100).toFixed(1)}%`,
      liquidityImpact: `${(shockFactors.liquidityImpact * 100).toFixed(1)}%`,
      depositImpact: `${(shockFactors.depositWithdrawal * 100).toFixed(1)}%`
    },
    capitalShortfall,
    liquidityGap,
    probabilityOfDefault: (probabilityOfDefault / 10).toFixed(2),
    recommendations: generateRecommendations(capitalShortfall, liquidityGap, probabilityOfDefault)
  };
}
function generateRecommendations(capitalShortfall, liquidityGap, pd) {
  const recommendations = [];
  if (capitalShortfall > 0) {
    recommendations.push("Raise additional capital to meet regulatory minimums");
    recommendations.push("Reduce risk-weighted assets through portfolio optimization");
  }
  if (liquidityGap > 0) {
    recommendations.push("Increase liquid asset holdings");
    recommendations.push("Diversify funding sources to reduce liquidity risk");
  }
  if (pd > 50) {
    recommendations.push("Implement immediate risk mitigation measures");
    recommendations.push("Consider restructuring high-risk asset portfolio");
  }
  if (recommendations.length === 0) {
    recommendations.push("Maintain current risk management practices");
    recommendations.push("Continue monitoring key risk indicators");
  }
  return recommendations;
}
function validateReturn(data) {
  const errors = [];
  let penalty = 0;
  if (!data.institutionId) errors.push("Institution ID is required");
  if (!data.returnPeriod) errors.push("Return period is required");
  if (!data.returnType) errors.push("Return type is required");
  if (!data.fileName) errors.push("File name is required");
  if (data.returnPeriod) {
    const periodEnd = new Date(data.returnPeriod);
    const dueDate = new Date(periodEnd);
    dueDate.setDate(dueDate.getDate() + 15);
    const today = /* @__PURE__ */ new Date();
    if (today > dueDate) {
      const daysLate = Math.floor((today.getTime() - dueDate.getTime()) / (1e3 * 60 * 60 * 24));
      penalty = daysLate * 1e3;
      errors.push(`Return is ${daysLate} days late. Penalty: ${penalty.toLocaleString()}`);
    }
  }
  return { valid: errors.length === 0, errors, penalty: penalty > 0 ? penalty : void 0 };
}
function calculatePremium(eligibleDeposits, riskRating) {
  let baseRate = 1e-3;
  let riskAdjustment = 0;
  if (riskRating) {
    riskAdjustment = (riskRating - 1) * 2e-4;
  }
  const premiumRate = baseRate + riskAdjustment;
  const premiumAmount = eligibleDeposits * premiumRate;
  return {
    premiumRate,
    premiumAmount,
    riskAdjustment
  };
}

// server/routes.ts
var balanceAggregationService = new BalanceAggregationService(db);
var complianceTracker = new ComplianceTracker(db);
var depositAnalysisService = new DepositAnalysisService(db);
var invoicingService = new InvoicingService(db);
var penaltiesService = new PenaltiesService(db);
var asyncHandler = (fn) => (req, res) => fn(req, res).catch((error) => {
  console.error("Route error:", error);
  res.status(500).json({ message: error.message || "Internal server error" });
});
async function registerRoutes(app2) {
  app2.get(
    "/api/dashboard/stats",
    requireAuth,
    asyncHandler(async (req, res) => {
      const institutions2 = await storage.getInstitutions();
      const returns2 = await storage.getReturns();
      const invoices2 = await storage.getInvoices();
      const deposits2 = await storage.getDeposits();
      const stats = {
        totalInstitutions: institutions2.length,
        activeInstitutions: institutions2.filter((i) => i.status === "active").length,
        lockedInstitutions: institutions2.filter((i) => i.status === "locked").length,
        totalDeposits: deposits2.reduce((sum, d) => sum + Number(d.totalDeposits || 0), 0),
        totalExposure: deposits2.reduce((sum, d) => sum + Number(d.totalExposure || 0), 0),
        pendingReturns: returns2.filter((r) => r.status === "pending").length,
        overduePayments: invoices2.filter((i) => i.status === "overdue").length,
        criticalRiskInstitutions: 0
        // Would calculate from risk scores
      };
      res.json(stats);
    })
  );
  app2.get(
    "/api/institutions",
    requireAuth,
    asyncHandler(async (req, res) => {
      const institutions2 = await storage.getInstitutions();
      res.json(institutions2);
    })
  );
  app2.get(
    "/api/institutions/:id",
    requireAuth,
    asyncHandler(async (req, res) => {
      const id = parseInt(req.params.id);
      const institution = await storage.getInstitution(id);
      if (!institution) {
        return res.status(404).json({ message: "Institution not found" });
      }
      res.json(institution);
    })
  );
  app2.post(
    "/api/institutions",
    requireAuth,
    asyncHandler(async (req, res) => {
      const data = insertInstitutionSchema.parse(req.body);
      const institution = await storage.createInstitution(data);
      await storage.createAuditLog({
        userId: req.user?.id,
        action: "create_institution",
        entityType: "institution",
        entityId: institution.id,
        changes: data
      });
      res.json(institution);
    })
  );
  app2.get(
    "/api/returns",
    requireAuth,
    asyncHandler(async (req, res) => {
      const returns2 = await storage.getReturns();
      res.json(returns2);
    })
  );
  app2.get(
    "/api/returns/institution/:institutionId",
    requireAuth,
    asyncHandler(async (req, res) => {
      const institutionId = parseInt(req.params.institutionId);
      const returns2 = await storage.getReturnsByInstitution(institutionId);
      res.json(returns2);
    })
  );
  app2.post(
    "/api/returns",
    requireAuth,
    asyncHandler(async (req, res) => {
      const data = insertReturnSchema.parse(req.body);
      const validation = validateReturn(data);
      const returnData = {
        ...data,
        submittedBy: req.user?.id,
        validationErrors: validation.valid ? null : validation.errors,
        status: validation.valid ? "validated" : "rejected"
      };
      const ret = await storage.createReturn(returnData);
      if (validation.penalty) {
        await storage.createPenalty({
          institutionId: data.institutionId,
          penaltyType: "late_return",
          referenceId: ret.id,
          amount: validation.penalty.toString(),
          reason: `Late submission - ${validation.errors.join(", ")}`,
          imposedBy: req.user?.id
        });
      }
      await storage.createAuditLog({
        userId: req.user?.id,
        action: "create_return",
        entityType: "return",
        entityId: ret.id,
        changes: returnData
      });
      res.json({ return: ret, validation });
    })
  );
  app2.patch(
    "/api/returns/:id",
    requireAuth,
    asyncHandler(async (req, res) => {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const ret = await storage.updateReturn(id, updates);
      if (ret) {
        await storage.createAuditLog({
          userId: req.user?.id,
          action: "update_return",
          entityType: "return",
          entityId: ret.id,
          changes: updates
        });
      }
      res.json(ret);
    })
  );
  app2.get(
    "/api/deposits",
    requireAuth,
    asyncHandler(async (req, res) => {
      const deposits2 = await storage.getDeposits();
      res.json(deposits2);
    })
  );
  app2.get(
    "/api/deposits/institution/:institutionId",
    requireAuth,
    asyncHandler(async (req, res) => {
      const institutionId = parseInt(req.params.institutionId);
      const deposits2 = await storage.getDepositsByInstitution(institutionId);
      res.json(deposits2);
    })
  );
  app2.get(
    "/api/camels",
    requireAuth,
    asyncHandler(async (req, res) => {
      const ratings = await storage.getCamelsRatings();
      res.json(ratings);
    })
  );
  app2.get(
    "/api/camels/:institutionId",
    requireAuth,
    asyncHandler(async (req, res) => {
      const institutionId = parseInt(req.params.institutionId);
      const rating = await storage.getLatestCamelsRating(institutionId);
      res.json(rating || null);
    })
  );
  app2.post(
    "/api/camels",
    requireAuth,
    asyncHandler(async (req, res) => {
      const data = insertCamelsRatingSchema.parse(req.body);
      const rating = await storage.createCamelsRating({
        ...data,
        calculatedBy: req.user?.id
      });
      await storage.createAuditLog({
        userId: req.user?.id,
        action: "create_camels_rating",
        entityType: "camels_rating",
        entityId: rating.id,
        changes: data
      });
      res.json(rating);
    })
  );
  app2.get(
    "/api/stress-tests",
    requireAuth,
    asyncHandler(async (req, res) => {
      const tests = await storage.getStressTests();
      res.json(tests);
    })
  );
  app2.get(
    "/api/stress-tests/institution/:institutionId",
    requireAuth,
    asyncHandler(async (req, res) => {
      const institutionId = parseInt(req.params.institutionId);
      const tests = await storage.getStressTestsByInstitution(institutionId);
      res.json(tests);
    })
  );
  app2.post(
    "/api/stress-tests",
    requireAuth,
    asyncHandler(async (req, res) => {
      const data = insertStressTestSchema.parse(req.body);
      const deposits2 = await storage.getDepositsByInstitution(data.institutionId);
      const latestDeposit = deposits2[0];
      const currentFinancials = {
        deposits: Number(latestDeposit?.totalDeposits || 1e7),
        loans: Number(latestDeposit?.totalDeposits || 1e7) * 0.75,
        capital: Number(latestDeposit?.totalDeposits || 1e7) * 0.12,
        liquidity: Number(latestDeposit?.totalDeposits || 1e7) * 0.25
      };
      const stressTestResult = runStressTest({
        scenarioType: data.scenarioType,
        severity: data.severity,
        currentFinancials
      });
      const test = await storage.createStressTest({
        ...data,
        runBy: req.user?.id,
        scenarioParameters: {
          severity: data.severity,
          scenario: data.scenarioType
        },
        currentFinancials,
        stressedFinancials: stressTestResult.stressedFinancials,
        impactAnalysis: stressTestResult.impactAnalysis,
        currentCamels: {},
        stressedCamels: {},
        camelsDeterioration: {},
        probabilityOfDefault: stressTestResult.probabilityOfDefault,
        capitalShortfall: stressTestResult.capitalShortfall.toString(),
        liquidityGap: stressTestResult.liquidityGap.toString(),
        recommendations: stressTestResult.recommendations
      });
      await storage.createAuditLog({
        userId: req.user?.id,
        action: "run_stress_test",
        entityType: "stress_test",
        entityId: test.id,
        changes: data
      });
      res.json(test);
    })
  );
  app2.get(
    "/api/risk-scores",
    requireAuth,
    asyncHandler(async (req, res) => {
      const scores = await storage.getRiskScores();
      res.json(scores);
    })
  );
  app2.get(
    "/api/risk-scores/institution/:institutionId",
    requireAuth,
    asyncHandler(async (req, res) => {
      const institutionId = parseInt(req.params.institutionId);
      const scores = await storage.getRiskScoresByInstitution(institutionId);
      res.json(scores);
    })
  );
  app2.get(
    "/api/premiums",
    requireAuth,
    asyncHandler(async (req, res) => {
      const premiums2 = await storage.getPremiums();
      res.json(premiums2);
    })
  );
  app2.post(
    "/api/premiums/calculate",
    requireAuth,
    asyncHandler(async (req, res) => {
      const institutions2 = await storage.getInstitutions();
      const calculatedPremiums = [];
      for (const institution of institutions2) {
        const deposits2 = await storage.getDepositsByInstitution(institution.id);
        const totalDeposits = deposits2.reduce((sum, d) => sum + Number(d.totalDeposits || 0), 0);
        const camelsRating = await storage.getLatestCamelsRating(institution.id);
        const riskRating = camelsRating ? Math.round(Number(camelsRating.compositeRating)) : void 0;
        const premiumCalc = calculatePremium(totalDeposits, riskRating);
        const premium = await storage.createPremium({
          institutionId: institution.id,
          period: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
          premiumType: riskRating ? "risk_based" : "flat_rate",
          eligibleDeposits: totalDeposits.toString(),
          premiumRate: premiumCalc.premiumRate.toString(),
          premiumAmount: premiumCalc.premiumAmount.toString(),
          riskAdjustment: premiumCalc.riskAdjustment.toString(),
          adjustedPremiumAmount: premiumCalc.premiumAmount.toString(),
          calculatedBy: req.user?.id,
          calculationDetails: {
            riskRating,
            baseRate: 1e-3,
            riskAdjustment: premiumCalc.riskAdjustment
          }
        });
        const invoiceNumber = `INV-${Date.now()}-${institution.id}`;
        const dueDate = /* @__PURE__ */ new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        const invoice = await storage.createInvoice({
          invoiceNumber,
          institutionId: institution.id,
          premiumId: premium.id,
          period: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
          amount: premiumCalc.premiumAmount.toString(),
          dueDate: dueDate.toISOString().slice(0, 10),
          generatedBy: req.user?.id
        });
        calculatedPremiums.push({ premium, invoice });
      }
      res.json({ message: "Premiums calculated", count: calculatedPremiums.length });
    })
  );
  app2.get(
    "/api/invoices",
    requireAuth,
    asyncHandler(async (req, res) => {
      const invoices2 = await storage.getInvoices();
      res.json(invoices2);
    })
  );
  app2.get(
    "/api/invoices/institution/:institutionId",
    requireAuth,
    asyncHandler(async (req, res) => {
      const institutionId = parseInt(req.params.institutionId);
      const invoices2 = await storage.getInvoicesByInstitution(institutionId);
      res.json(invoices2);
    })
  );
  app2.get(
    "/api/payments",
    requireAuth,
    asyncHandler(async (req, res) => {
      const payments2 = await storage.getPayments();
      res.json(payments2);
    })
  );
  app2.post(
    "/api/payments",
    requireAuth,
    asyncHandler(async (req, res) => {
      const data = insertPaymentSchema.parse(req.body);
      const payment = await storage.createPayment({
        ...data,
        uploadedBy: req.user?.id
      });
      await storage.createAuditLog({
        userId: req.user?.id,
        action: "create_payment",
        entityType: "payment",
        entityId: payment.id,
        changes: data
      });
      res.json(payment);
    })
  );
  app2.get(
    "/api/customers",
    requireAuth,
    asyncHandler(async (req, res) => {
      const customers2 = await storage.getCustomers();
      res.json(customers2);
    })
  );
  app2.get(
    "/api/customers/institution/:institutionId",
    requireAuth,
    asyncHandler(async (req, res) => {
      const institutionId = parseInt(req.params.institutionId);
      const customers2 = await storage.getCustomersByInstitution(institutionId);
      res.json(customers2);
    })
  );
  app2.post(
    "/api/customers",
    requireAuth,
    asyncHandler(async (req, res) => {
      const data = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(data);
      res.json(customer);
    })
  );
  app2.post(
    "/api/scv/aggregate-balances",
    requireAuth,
    asyncHandler(async (req, res) => {
      const { institutionId, periodId } = req.body;
      if (!institutionId || !periodId) {
        return res.status(400).json({ message: "institutionId and periodId are required" });
      }
      const result = await balanceAggregationService.aggregateCustomerBalances(
        parseInt(institutionId),
        periodId
      );
      res.json(result);
    })
  );
  app2.get(
    "/api/penalties",
    requireAuth,
    asyncHandler(async (req, res) => {
      const penalties2 = await storage.getPenalties();
      res.json(penalties2);
    })
  );
  app2.post(
    "/api/compliance/track",
    requireAuth,
    asyncHandler(async (req, res) => {
      const { institutionId, period } = req.body;
      if (!institutionId || !period) {
        return res.status(400).json({ message: "institutionId and period are required" });
      }
      const result = await complianceTracker.trackCompliance(
        parseInt(institutionId),
        period
      );
      res.json(result);
    })
  );
  app2.post(
    "/api/compliance/findings",
    requireAuth,
    asyncHandler(async (req, res) => {
      const { institutionId, finding } = req.body;
      if (!institutionId || !finding) {
        return res.status(400).json({ message: "institutionId and finding are required" });
      }
      const parsedFinding = insertAuditFindingSchema.parse(finding);
      const result = await complianceTracker.recordAuditFinding(
        parseInt(institutionId),
        {
          ...parsedFinding,
          target_resolution_date: new Date(parsedFinding.target_resolution_date),
          severity: parsedFinding.severity
        }
      );
      res.json(result);
    })
  );
  app2.get(
    "/api/compliance/report",
    requireAuth,
    asyncHandler(async (req, res) => {
      const { institutionId, startDate, endDate } = req.query;
      if (!institutionId || !startDate || !endDate) {
        return res.status(400).json({ message: "institutionId, startDate, and endDate are required" });
      }
      const result = await complianceTracker.generateComplianceReport(
        parseInt(institutionId),
        new Date(startDate),
        new Date(endDate)
      );
      res.json(result);
    })
  );
  app2.post(
    "/api/surveillance/deposit-analysis",
    requireAuth,
    asyncHandler(async (req, res) => {
      const { institutionId, periodType, periodStart, periodEnd } = req.body;
      if (!institutionId || !periodType || !periodStart || !periodEnd) {
        return res.status(400).json({ message: "institutionId, periodType, periodStart, and periodEnd are required" });
      }
      const result = await depositAnalysisService.analyzeDeposits(
        parseInt(institutionId),
        periodType,
        new Date(periodStart),
        new Date(periodEnd)
      );
      res.json(result);
    })
  );
  app2.post(
    "/api/invoicing/generate-invoice",
    requireAuth,
    asyncHandler(async (req, res) => {
      const { premiumCalculationId, dueDate } = req.body;
      if (!premiumCalculationId || !dueDate) {
        return res.status(400).json({ message: "premiumCalculationId and dueDate are required" });
      }
      const result = await invoicingService.generateInvoice(
        premiumCalculationId,
        new Date(dueDate)
      );
      res.json(result);
    })
  );
  app2.post(
    "/api/invoicing/send-to-accounting",
    requireAuth,
    asyncHandler(async (req, res) => {
      const { invoiceId } = req.body;
      if (!invoiceId) {
        return res.status(400).json({ message: "invoiceId is required" });
      }
      const result = await invoicingService.sendToAccountingSystem(invoiceId);
      res.json(result);
    })
  );
  app2.get(
    "/api/invoicing/status/:invoiceId",
    requireAuth,
    asyncHandler(async (req, res) => {
      const { invoiceId } = req.params;
      const result = await invoicingService.getInvoiceStatus(invoiceId);
      res.json(result);
    })
  );
  app2.post(
    "/api/penalties/check-and-apply",
    requireAuth,
    asyncHandler(async (req, res) => {
      const { institutionId } = req.body;
      if (!institutionId) {
        return res.status(400).json({ message: "institutionId is required" });
      }
      const result = await penaltiesService.checkAndApplyPenalties(
        parseInt(institutionId)
      );
      res.json(result);
    })
  );
  app2.get(
    "/api/penalties/institution/:institutionId",
    requireAuth,
    asyncHandler(async (req, res) => {
      const { institutionId } = req.params;
      const result = await penaltiesService.getPenaltiesForInstitution(
        parseInt(institutionId)
      );
      res.json(result);
    })
  );
  app2.post(
    "/api/penalties/pay",
    requireAuth,
    asyncHandler(async (req, res) => {
      const { penaltyId, paymentDetails } = req.body;
      if (!penaltyId || !paymentDetails) {
        return res.status(400).json({ message: "penaltyId and paymentDetails are required" });
      }
      const result = await penaltiesService.payPenalty(penaltyId, paymentDetails);
      res.json(result);
    })
  );
  app2.post(
    "/api/penalties/waive",
    requireAuth,
    asyncHandler(async (req, res) => {
      const { penaltyId, reason } = req.body;
      if (!penaltyId || !reason) {
        return res.status(400).json({ message: "penaltyId and reason are required" });
      }
      const result = await penaltiesService.waivePenalty(penaltyId, reason);
      res.json(result);
    })
  );
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      ),
      await import("@replit/vite-plugin-dev-banner").then(
        (m) => m.devBanner()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
setupAuth(app);
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "localhost"
  }, () => {
    log(`serving on port ${port}`);
  });
})();
