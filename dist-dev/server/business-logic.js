var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

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
  insertAuditFindingSchema: () => insertAuditFindingSchema,
  insertCamelsRatingSchema: () => insertCamelsRatingSchema,
  insertComplianceRecordSchema: () => insertComplianceRecordSchema,
  insertComplianceRequirementSchema: () => insertComplianceRequirementSchema,
  insertCustomerSchema: () => insertCustomerSchema,
  insertDepositSchema: () => insertDepositSchema,
  insertInstitutionSchema: () => insertInstitutionSchema,
  insertPenaltySchema: () => insertPenaltySchema,
  insertPremiumSchema: () => insertPremiumSchema,
  insertReturnSchema: () => insertReturnSchema,
  insertRiskScoreSchema: () => insertRiskScoreSchema,
  insertStressTestSchema: () => insertStressTestSchema,
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
var insertInstitutionSchema = createInsertSchema(institutions).omit({ id: true, createdAt: true, updatedAt: true });
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
var insertReturnSchema = createInsertSchema(returns).omit({ id: true, createdAt: true, updatedAt: true });
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
var insertCamelsRatingSchema = createInsertSchema(camelsRatings).omit({ id: true, createdAt: true });
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
var insertStressTestSchema = createInsertSchema(stressTests).omit({ id: true, createdAt: true });
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
var insertCustomerSchema = createInsertSchema(customers).omit({ id: true, createdAt: true, updatedAt: true });
var insertAuditFindingSchema = z.object({
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
async function calculateCAMELS(input) {
  return {};
}
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
export {
  calculateCAMELS,
  calculatePremium,
  runStressTest,
  validateReturn
};
//# sourceMappingURL=business-logic.js.map
