import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
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
  boolean,
  serial,
} from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================
// AUTH TABLES (Replit Auth Integration)
// ============================================

// Session storage table - mandatory for Replit Auth
export const sessions = mysqlTable(
  "sessions",
  {
    sid: varchar("sid", { length: 255 }).notNull(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => ({
    primaryKey: [table.sid],
    sessionExpireIdx: index("IDX_session_expire").on(table.expire),
  }),
);

// User storage table - mandatory for Replit Auth
export const users = mysqlTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(),
  email: varchar("email", { length: 255 }).unique(),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  profileImageUrl: varchar("profile_image_url", { length: 255 }),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// ============================================
// CORE INSTITUTION DATA
// ============================================

export const institutions = mysqlTable("institutions", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // commercial_bank, microfinance, etc
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const insertInstitutionSchema = createInsertSchema(institutions).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertInstitution = z.infer<typeof insertInstitutionSchema>;
export type Institution = typeof institutions.$inferSelect;

// ============================================
// RETURNS MANAGEMENT
// ============================================

export const returns = mysqlTable("returns", {
  id: int("id").autoincrement().primaryKey(),
  institutionId: int("institution_id").notNull().references(() => institutions.id),
  returnPeriod: date("return_period").notNull(), // YYYY-MM-DD
  returnType: varchar("return_type", { length: 50 }).notNull(), // monthly, quarterly
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileSize: int("file_size"),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, validated, rejected, approved
  validationErrors: json("validation_errors"),
  controlTotals: json("control_totals"),
  submittedAt: timestamp("submitted_at").default(sql`CURRENT_TIMESTAMP`),
  submittedBy: varchar("submitted_by", { length: 255 }).references(() => users.id),
  approvedAt: timestamp("approved_at"),
  approvedBy: varchar("approved_by", { length: 255 }).references(() => users.id),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const insertReturnSchema = createInsertSchema(returns).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertReturn = z.infer<typeof insertReturnSchema>;
export type Return = typeof returns.$inferSelect;

// ============================================
// DEPOSIT DATA
// ============================================

export const deposits = mysqlTable("deposits", {
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
  depositByAccountType: json("deposit_by_account_type"), // {savings: 100, current: 200, ...}
  depositByCurrency: json("deposit_by_currency"), // {USD: 100, ZWL: 200, ...}
  depositBySize: json("deposit_by_size"), // {under_1000: 10, 1000_5000: 20, ...}
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const insertDepositSchema = createInsertSchema(deposits).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDeposit = z.infer<typeof insertDepositSchema>;
export type Deposit = typeof deposits.$inferSelect;

// ============================================
// CAMELS RATINGS
// ============================================

export const camelsRatings = mysqlTable("camels_ratings", {
  id: int("id").autoincrement().primaryKey(),
  institutionId: int("institution_id").notNull().references(() => institutions.id),
  period: date("period").notNull(),
  ratingType: varchar("rating_type", { length: 50 }).notNull().default("normal"), // normal, stressed
  
  // Capital Adequacy
  capitalScore: decimal("capital_score", { precision: 5, scale: 2 }),
  capitalRating: int("capital_rating"), // 1-5
  capitalComponents: json("capital_components"),
  
  // Asset Quality
  assetScore: decimal("asset_score", { precision: 5, scale: 2 }),
  assetRating: int("asset_rating"), // 1-5
  assetComponents: json("asset_components"),
  
  // Management Quality
  managementScore: decimal("management_score", { precision: 5, scale: 2 }),
  managementRating: int("management_rating"), // 1-5
  managementComponents: json("management_components"),
  
  // Earnings
  earningsScore: decimal("earnings_score", { precision: 5, scale: 2 }),
  earningsRating: int("earnings_rating"), // 1-5
  earningsComponents: json("earnings_components"),
  
  // Liquidity
  liquidityScore: decimal("liquidity_score", { precision: 5, scale: 2 }),
  liquidityRating: int("liquidity_rating"), // 1-5
  liquidityComponents: json("liquidity_components"),
  
  // Sensitivity to Market Risk
  sensitivityScore: decimal("sensitivity_score", { precision: 5, scale: 2 }),
  sensitivityRating: int("sensitivity_rating"), // 1-5
  sensitivityComponents: json("sensitivity_components"),
  
  // Composite
  compositeRating: decimal("composite_rating", { precision: 5, scale: 2 }),
  riskGrade: varchar("risk_grade", { length: 50 }), // Strong, Satisfactory, Fair, Marginal, Unsatisfactory
  
  // Financial data used for calculation
  financialData: json("financial_data"),
  
  calculatedAt: timestamp("calculated_at").default(sql`CURRENT_TIMESTAMP`),
  calculatedBy: varchar("calculated_by", { length: 255 }).references(() => users.id),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertCamelsRatingSchema = createInsertSchema(camelsRatings).omit({ id: true, createdAt: true });
export type InsertCamelsRating = z.infer<typeof insertCamelsRatingSchema>;
export type CamelsRating = typeof camelsRatings.$inferSelect;

// ============================================
// STRESS TESTING
// ============================================

export const stressTests = mysqlTable("stress_tests", {
  id: int("id").autoincrement().primaryKey(),
  institutionId: int("institution_id").notNull().references(() => institutions.id),
  scenarioType: varchar("scenario_type", { length: 100 }).notNull(), // EXCHANGE_RATE_SHOCK, LIQUIDITY_SHOCK, etc
  severity: varchar("severity", { length: 20 }).notNull(), // MILD, MODERATE, SEVERE
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
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertStressTestSchema = createInsertSchema(stressTests).omit({ id: true, createdAt: true });
export type InsertStressTest = z.infer<typeof insertStressTestSchema>;
export type StressTest = typeof stressTests.$inferSelect;

// ============================================
// RISK ANALYSIS
// ============================================

export const riskScores = mysqlTable("risk_scores", {
  id: int("id").autoincrement().primaryKey(),
  institutionId: int("institution_id").notNull().references(() => institutions.id),
  period: date("period").notNull(),
  
  // Risk components
  probabilityOfDefault: decimal("probability_of_default", { precision: 5, scale: 4 }),
  lossGivenDefault: decimal("loss_given_default", { precision: 5, scale: 4 }),
  exposureAtDefault: decimal("exposure_at_default", { precision: 20, scale: 2 }),
  
  // Composite risk score
  riskScore: decimal("risk_score", { precision: 10, scale: 2 }),
  riskRating: varchar("risk_rating", { length: 50 }), // Low, Medium, High, Critical
  
  // Anomalies detected
  anomalies: json("anomalies"),
  
  calculatedAt: timestamp("calculated_at").default(sql`CURRENT_TIMESTAMP`),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertRiskScoreSchema = createInsertSchema(riskScores).omit({ id: true, createdAt: true });
export type InsertRiskScore = z.infer<typeof insertRiskScoreSchema>;
export type RiskScore = typeof riskScores.$inferSelect;

export const complianceRecords = mysqlTable("compliance_records", {
  id: int("id").autoincrement().primaryKey(),
  institutionId: int("institution_id").notNull().references(() => institutions.id),
  recordDate: date("record_date").notNull(),
  complianceType: varchar("compliance_type", { length: 100 }).notNull(),
  complianceStatus: varchar("compliance_status", { length: 50 }).notNull(), // compliant, non_compliant, under_review
  complianceScore: decimal("compliance_score", { precision: 5, scale: 2 }),
  findings: json("findings"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertComplianceRecordSchema = createInsertSchema(complianceRecords).omit({ id: true, createdAt: true });
export type InsertComplianceRecord = z.infer<typeof insertComplianceRecordSchema>;
export type ComplianceRecord = typeof complianceRecords.$inferSelect;

// ============================================
// PREMIUMS MANAGEMENT
// ============================================

export const premiums = mysqlTable("premiums", {
  id: int("id").autoincrement().primaryKey(),
  institutionId: int("institution_id").notNull().references(() => institutions.id),
  period: date("period").notNull(),
  premiumType: varchar("premium_type", { length: 50 }).notNull(), // flat_rate, risk_based
  
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
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertPremiumSchema = createInsertSchema(premiums).omit({ id: true, createdAt: true });
export type InsertPremium = z.infer<typeof insertPremiumSchema>;
export type Premium = typeof premiums.$inferSelect;



export const penalties = mysqlTable("penalties", {
  id: int("id").autoincrement().primaryKey(),
  institutionId: int("institution_id").notNull().references(() => institutions.id),
  penaltyType: varchar("penalty_type", { length: 100 }).notNull(), // late_return, late_payment, non_compliance
  referenceId: int("reference_id"), // ID of related return/invoice
  
  amount: decimal("amount", { precision: 20, scale: 2 }).notNull(),
  reason: text("reason").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, paid, waived
  
  imposedAt: timestamp("imposed_at").default(sql`CURRENT_TIMESTAMP`),
  imposedBy: varchar("imposed_by", { length: 255 }).references(() => users.id),
  paidAt: timestamp("paid_at"),
  waivedAt: timestamp("waived_at"),
  waivedBy: varchar("waived_by", { length: 255 }).references(() => users.id),
  
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const insertPenaltySchema = createInsertSchema(penalties).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPenalty = z.infer<typeof insertPenaltySchema>;
export type Penalty = typeof penalties.$inferSelect;

// ============================================
// SINGLE CUSTOMER VIEW
// ============================================

export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  customerId: varchar("customer_id", { length: 100 }).notNull().unique(),
  institutionId: int("institution_id").notNull().references(() => institutions.id),
  
  // Customer details
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerType: varchar("customer_type", { length: 50 }).notNull(), // individual, corporate, trust, joint
  idNumber: varchar("id_number", { length: 100 }),
  
  // Account aggregation
  accounts: json("accounts"), // Array of account details
  totalBalance: decimal("total_balance", { precision: 20, scale: 2 }).default("0"),
  insuredAmount: decimal("insured_amount", { precision: 20, scale: 2 }).default("0"),
  uninsuredAmount: decimal("uninsured_amount", { precision: 20, scale: 2 }).default("0"),
  
  // Beneficiaries (for trust/joint accounts)
  beneficiaries: json("beneficiaries"),
  
  snapshotDate: date("snapshot_date").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

import { AuditFindingSeverity } from "./types";

export const insertAuditFindingSchema = z.object({
  id: z.string().uuid(),
  requirement_id: z.string(),
  description: z.string(),
  severity: z.nativeEnum(AuditFindingSeverity),
  evidence: z.array(z.string()),
  root_cause: z.string(),
  action_plan: z.string(),
  target_resolution_date: z.string().datetime(),
  status: z.string(),
});
export type InsertAuditFinding = z.infer<typeof insertAuditFindingSchema>;

export const insertComplianceRequirementSchema = z.object({
  id: z.string(),
  category: z.string(),
  description: z.string(),
  regulatory_reference: z.string(),
  due_date: z.string().datetime(),
  frequency: z.string(),
  required_evidence: z.array(z.string()),
  auto_verification: z.boolean(),
});
export type InsertComplianceRequirement = z.infer<typeof insertComplianceRequirementSchema>;

// ============================================
// AUDIT TRAIL
// ============================================

export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: varchar("user_id", { length: 255 }).references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 100 }), // institution, return, premium, etc
  entityId: int("entity_id"),
  changes: json("changes"),
  ipAddress: varchar("ip_address", { length: 50 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export type AuditLog = typeof auditLogs.$inferSelect;

// ============================================
// SINGLE CUSTOMER VIEW (SCV) TABLES
// ============================================

export const scvUploads = mysqlTable("scv_uploads", {
  id: int("id").autoincrement().primaryKey(),
  periodId: varchar("period_id", { length: 255 }).notNull(),
  institutionId: int("institution_id").notNull().references(() => institutions.id),
  uploadedAt: timestamp("uploaded_at").default(sql`CURRENT_TIMESTAMP`),
});
export type SCVUpload = typeof scvUploads.$inferSelect;

export const customerAccounts = mysqlTable("customer_accounts", {
  id: varchar("id", { length: 255 }).primaryKey(), // Assuming UUID
  institutionId: int("institution_id").notNull().references(() => institutions.id),
  scvUploadId: int("scv_upload_id").notNull().references(() => scvUploads.id),
  customerId: varchar("customer_id", { length: 255 }).notNull(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerType: varchar("customer_type", { length: 50 }).notNull(), // INDIVIDUAL, JOINT, CORPORATE, TRUST
  balance: decimal("balance", { precision: 20, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).notNull(),
  accountType: varchar("account_type", { length: 50 }).notNull(), // Savings, Current, Fixed Deposit
  jointHolders: json("joint_holders"), // Array of objects { name: string } or similar
  trustBeneficiaries: json("trust_beneficiaries"), // Array of objects { name: string } or similar
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
export type CustomerAccount = typeof customerAccounts.$inferSelect;

export const customerExposures = mysqlTable("customer_exposures", {
  id: varchar("id", { length: 255 }).primaryKey(), // Assuming UUID
  customerId: varchar("customer_id", { length: 255 }).notNull(),
  institutionId: int("institution_id").notNull().references(() => institutions.id),
  periodId: varchar("period_id", { length: 255 }).notNull(),
  customerAccountId: varchar("customer_account_id", { length: 255 }).references(() => customerAccounts.id),
  totalBalance: decimal("total_balance", { precision: 20, scale: 2 }).notNull(),
  insuredAmount: decimal("insured_amount", { precision: 20, scale: 2 }).notNull(),
  uninsuredAmount: decimal("uninsured_amount", { precision: 20, scale: 2 }).notNull(),
  coverLevel: decimal("cover_level", { precision: 20, scale: 2 }).notNull(),
  concentrationRisk: decimal("concentration_risk", { precision: 5, scale: 2 }).notNull(),
  customerRiskCategory: varchar("customer_risk_category", { length: 50 }).notNull(), // HIGH_RISK, MEDIUM_RISK, LOW_RISK
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});
export type CustomerExposure = typeof customerExposures.$inferSelect;

// ============================================
// DEPOSIT SURVEILLANCE TABLES
// ============================================

export const surveillancePeriods = mysqlTable("surveillance_periods", {
  id: varchar("id", { length: 255 }).primaryKey(), // Assuming UUID
  institutionId: int("institution_id").notNull().references(() => institutions.id),
  periodType: varchar("period_type", { length: 50 }).notNull(), // MONTHLY, QUARTERLY, ANNUAL
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});
export type SurveillancePeriod = typeof surveillancePeriods.$inferSelect;

export const depositAnalyses = mysqlTable("deposit_analyses", {
  id: varchar("id", { length: 255 }).primaryKey(), // Assuming UUID
  periodId: varchar("period_id", { length: 255 }).notNull().references(() => surveillancePeriods.id),
  depositType: varchar("deposit_type", { length: 50 }).notNull(), // INDIVIDUAL, CORPORATE, etc.
  totalDeposits: decimal("total_deposits", { precision: 20, scale: 2 }).notNull(),
  totalAccounts: int("total_accounts").notNull(),
  averageBalance: decimal("average_balance", { precision: 20, scale: 2 }).notNull(),
  growthRate: decimal("growth_rate", { precision: 5, scale: 2 }),
  currencyBreakdown: json("currency_breakdown"),
  accountSizeBreakdown: json("account_size_breakdown"),
  productBreakdown: json("product_breakdown"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});
export type DepositAnalysis = typeof depositAnalyses.$inferSelect;

export const exposureCalculations = mysqlTable("exposure_calculations", {
  id: varchar("id", { length: 255 }).primaryKey(), // Assuming UUID
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
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});
export type ExposureCalculation = typeof exposureCalculations.$inferSelect;

// ============================================
// PREMIUMS & INVOICING TABLES
// ============================================

export const premiumCalculations = mysqlTable("premium_calculations", {
  id: varchar("id", { length: 255 }).primaryKey(), // Assuming UUID
  institutionId: int("institution_id").notNull().references(() => institutions.id),
  periodId: varchar("period_id", { length: 255 }).notNull(), // Assuming this refers to a ReturnPeriod or similar
  calculationMethod: varchar("calculation_method", { length: 50 }).notNull(), // FLAT_RATE, RISK_BASED
  averageEligibleDeposits: decimal("average_eligible_deposits", { precision: 20, scale: 2 }).notNull(),
  riskPremiumRate: decimal("risk_premium_rate", { precision: 5, scale: 4 }).notNull(),
  riskAdjustmentFactor: decimal("risk_adjustment_factor", { precision: 5, scale: 4 }).notNull(),
  finalPremium: decimal("final_premium", { precision: 20, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("CALCULATED"), // CALCULATED, INVOICED, PAID
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
export type PremiumCalculation = typeof premiumCalculations.$inferSelect;

export const invoices = mysqlTable("invoices", {
  id: varchar("id", { length: 255 }).primaryKey(), // Assuming UUID
  premiumCalculationId: varchar("premium_calculation_id", { length: 255 }).notNull().references(() => premiumCalculations.id),
  institutionId: int("institution_id").notNull().references(() => institutions.id),
  invoiceNumber: varchar("invoice_number", { length: 100 }).notNull().unique(),
  invoiceDate: timestamp("invoice_date").default(sql`CURRENT_TIMESTAMP`),
  dueDate: date("due_date").notNull(),
  amount: decimal("amount", { precision: 20, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 20, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 20, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("PENDING"), // PENDING, PAID, OVERDUE, CANCELLED
  paidAmount: decimal("paid_amount", { precision: 20, scale: 2 }).default("0"),
  paidAt: timestamp("paid_at"),
  paymentReference: varchar("payment_reference", { length: 255 }),
  sentToAccounting: boolean("sent_to_accounting").default(false),
  accountingReference: varchar("accounting_reference", { length: 255 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
export type Invoice = typeof invoices.$inferSelect;
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export const payments = mysqlTable("payments", {
  id: varchar("id", { length: 255 }).primaryKey(), // Assuming UUID
  invoiceId: varchar("invoice_id", { length: 255 }).notNull().references(() => invoices.id),
  amount: decimal("amount", { precision: 20, scale: 2 }).notNull(),
  paymentDate: date("payment_date").notNull(),
  paymentMethod: varchar("payment_method", { length: 100 }),
  paymentReference: varchar("payment_reference", { length: 255 }),
  status: varchar("status", { length: 50 }).notNull().default("PENDING"), // PENDING, RECEIVED, VERIFIED, REJECTED
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
export type Payment = typeof payments.$inferSelect;
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export const premiumPenalties = mysqlTable("premium_penalties", {
  id: varchar("id", { length: 255 }).primaryKey(), // Assuming UUID
  invoiceId: varchar("invoice_id", { length: 255 }).notNull().references(() => invoices.id),
  penaltyType: varchar("penalty_type", { length: 100 }).notNull(), // LATE_PAYMENT, LATE_SUBMISSION
  penaltyAmount: decimal("penalty_amount", { precision: 20, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 20, scale: 2 }).notNull(),
  daysOverdue: int("days_overdue").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("PENDING"), // PENDING, WAIVED, PAID
  dueDate: date("due_date").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
export type PremiumPenalty = typeof premiumPenalties.$inferSelect;

export const returnPeriods = mysqlTable("return_periods", {
  id: varchar("id", { length: 255 }).primaryKey(), // Assuming UUID
  institutionId: int("institution_id").notNull().references(() => institutions.id),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("OPEN"), // OPEN, CLOSED
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
export type ReturnPeriod = typeof returnPeriods.$inferSelect;

// ============================================
// RELATIONS
// ============================================

export const institutionsRelations = relations(institutions, ({ many }) => ({
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
  returnPeriods: many(returnPeriods),
}));

export const premiumCalculationsRelations = relations(premiumCalculations, ({ one, many }) => ({
  institution: one(institutions, {
    fields: [premiumCalculations.institutionId],
    references: [institutions.id],
  }),
  invoices: many(invoices),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  premiumCalculation: one(premiumCalculations, {
    fields: [invoices.premiumCalculationId],
    references: [premiumCalculations.id],
  }),
  institution: one(institutions, {
    fields: [invoices.institutionId],
    references: [institutions.id],
  }),
  payments: many(payments),
  premiumPenalties: many(premiumPenalties),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
}));

export const premiumPenaltiesRelations = relations(premiumPenalties, ({ one }) => ({
  invoice: one(invoices, {
    fields: [premiumPenalties.invoiceId],
    references: [invoices.id],
  }),
}));

export const returnPeriodsRelations = relations(returnPeriods, ({ one, many }) => ({
  institution: one(institutions, {
    fields: [returnPeriods.institutionId],
    references: [institutions.id],
  }),
  returns: many(returns),
}));

export const surveillancePeriodsRelations = relations(surveillancePeriods, ({ one, many }) => ({
  institution: one(institutions, {
    fields: [surveillancePeriods.institutionId],
    references: [institutions.id],
  }),
  depositAnalyses: many(depositAnalyses),
  exposureCalculations: many(exposureCalculations),
}));

export const depositAnalysesRelations = relations(depositAnalyses, ({ one }) => ({
  surveillancePeriod: one(surveillancePeriods, {
    fields: [depositAnalyses.periodId],
    references: [surveillancePeriods.id],
  }),
}));

export const exposureCalculationsRelations = relations(exposureCalculations, ({ one }) => ({
  institution: one(institutions, {
    fields: [exposureCalculations.institutionId],
    references: [institutions.id],
  }),
  surveillancePeriod: one(surveillancePeriods, {
    fields: [exposureCalculations.periodId],
    references: [surveillancePeriods.id],
  }),
}));

export const scvUploadsRelations = relations(scvUploads, ({ one, many }) => ({
  institution: one(institutions, {
    fields: [scvUploads.institutionId],
    references: [institutions.id],
  }),
  customerAccounts: many(customerAccounts),
}));

export const customerAccountsRelations = relations(customerAccounts, ({ one, many }) => ({
  institution: one(institutions, {
    fields: [customerAccounts.institutionId],
    references: [institutions.id],
  }),
  scvUpload: one(scvUploads, {
    fields: [customerAccounts.scvUploadId],
    references: [scvUploads.id],
  }),
  customerExposures: many(customerExposures),
}));

export const customerExposuresRelations = relations(customerExposures, ({ one }) => ({
  institution: one(institutions, {
    fields: [customerExposures.institutionId],
    references: [institutions.id],
  }),
  customerAccount: one(customerAccounts, {
    fields: [customerExposures.customerAccountId],
    references: [customerAccounts.id],
  }),
}));

export const returnsRelations = relations(returns, ({ one, many }) => ({
  institution: one(institutions, {
    fields: [returns.institutionId],
    references: [institutions.id],
  }),
  deposits: many(deposits),
}));

export const depositsRelations = relations(deposits, ({ one }) => ({
  return: one(returns, {
    fields: [deposits.returnId],
    references: [returns.id],
  }),
  institution: one(institutions, {
    fields: [deposits.institutionId],
    references: [institutions.id],
  }),
}));
