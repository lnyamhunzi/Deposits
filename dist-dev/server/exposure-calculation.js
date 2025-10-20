// shared/schema.ts
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
var insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true, updatedAt: true });
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

// server/exposure-calculation.ts
import { v4 as uuidv42 } from "uuid";

// server/deposit-analysis.ts
import { eq, and, gte, lte } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
var DepositAnalysisService = class {
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
        eq(returns.institutionId, institutionId),
        eq(returns.returnPeriod, periodStart.toISOString().slice(0, 10)),
        // Assuming returnPeriod is YYYY-MM-DD
        eq(returns.status, "SUBMITTED")
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
      where: and(
        eq(surveillancePeriods.institutionId, institutionId),
        lte(surveillancePeriods.periodEnd, periodEnd),
        gte(
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
        where: eq(depositAnalyses.periodId, period.id)
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
      id: uuidv4(),
      institutionId,
      periodType,
      periodStart: periodStart.toISOString().slice(0, 10),
      periodEnd: periodEnd.toISOString().slice(0, 10)
    };
    const [insertedPeriod] = await this.db.insert(surveillancePeriods).values(newPeriod);
    return insertedPeriod;
  }
};

// server/exposure-calculation.ts
var ExposureCalculationService = class {
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
      id: uuidv42(),
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
    await this.db.insert(exposureCalculations).values(exposureCalculation);
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
      ["SMALL" /* SMALL */]: 0,
      ["MEDIUM" /* MEDIUM */]: 0,
      ["LARGE" /* LARGE */]: 0
    };
    const sizeBalances = {
      ["SMALL" /* SMALL */]: 0,
      ["MEDIUM" /* MEDIUM */]: 0,
      ["LARGE" /* LARGE */]: 0
    };
    depositData.forEach((d) => {
      const balance = d.balance;
      if (balance < 1e4) {
        sizeCounts["SMALL" /* SMALL */]++;
        sizeBalances["SMALL" /* SMALL */] += balance;
      } else if (balance < 1e5) {
        sizeCounts["MEDIUM" /* MEDIUM */]++;
        sizeBalances["MEDIUM" /* MEDIUM */] += balance;
      } else {
        sizeCounts["LARGE" /* LARGE */]++;
        sizeBalances["LARGE" /* LARGE */] += balance;
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
};
export {
  ExposureCalculationService
};
