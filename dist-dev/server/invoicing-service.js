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

// server/invoicing-service.ts
import { eq, and, sql as sql2, gte, lt } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
var InvoicingService = class {
  db;
  constructor(db) {
    this.db = db;
  }
  async generateInvoice(premiumCalculationId, dueDate) {
    const premiumCalc = await this.db.query.premiumCalculations.findFirst({
      where: eq(premiumCalculations.id, premiumCalculationId)
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
      id: uuidv4(),
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
    await this.db.update(premiumCalculations).set({ status: "INVOICED" /* INVOICED */ }).where(eq(premiumCalculations.id, premiumCalculationId));
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
      where: eq(institutions.id, institutionId)
    });
    if (!institution) {
      throw new Error("Institution not found");
    }
    const year = (/* @__PURE__ */ new Date()).getFullYear();
    const month = (/* @__PURE__ */ new Date()).getMonth() + 1;
    const invoiceCount = await this.db.select({ count: sql2`count(*)` }).from(invoices).where(
      and(
        gte(invoices.invoiceDate, /* @__PURE__ */ new Date(`${year}-${month}-01`)),
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
      where: eq(premiumCalculations.id, invoice.premiumCalculationId)
    });
    const institution = await this.db.query.institutions.findFirst({
      where: eq(institutions.id, invoice.institutionId)
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
      where: eq(invoices.id, invoiceId)
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
      }).where(eq(invoices.id, invoiceId));
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
      where: eq(institutions.id, invoice.institutionId)
    });
    const premiumCalc = await this.db.query.premiumCalculations.findFirst({
      where: eq(premiumCalculations.id, invoice.premiumCalculationId)
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
      where: eq(invoices.id, invoiceId)
    });
    if (!invoice) {
      return { error: "Invoice not found" };
    }
    const payments2 = await this.db.query.payments.findMany({
      where: eq(payments.invoiceId, invoiceId)
    });
    const penalties2 = await this.db.query.premiumPenalties.findMany({
      where: eq(premiumPenalties.invoiceId, invoiceId)
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
export {
  InvoicingService
};
