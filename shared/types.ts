export interface Account {
  balance: number;
  customer_type?: string;
  account_type?: string;
  currency?: string;
}

export interface DepositClassificationResult {
  bank_id: number;
  period: string;
  total_deposits: number;
  individual_deposits: number;
  corporate_deposits: number;
  savings_deposits: number;
  current_deposits: number;
  fixed_deposits: number;
  usd_deposits: number;
  local_currency_deposits: number;
  other_currency_deposits: number;
  small_deposits: number;
  medium_deposits: number;
  large_deposits: number;
  total_accounts: number;
  individual_accounts: number;
  corporate_accounts: number;
  total_exposure: number;
  individual_exposure: number;
  corporate_exposure: number;
  cover_level: number;
}

export interface TrendAnalysisResult {
  deposit_growth: number;
  account_growth: number;
  exposure_growth: number;
  trends: Array<{ metric: string; trend: string; change: number }>;
}

export enum ComplianceStatus {
  COMPLIANT = "COMPLIANT",
  PARTIALLY_COMPLIANT = "PARTIALLY_COMPLIANT",
  NON_COMPLIANT = "NON_COMPLIANT",
  NOT_APPLICABLE = "NOT_APPLICABLE",
}

export enum AuditFindingSeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export interface ComplianceRequirement {
  id: string;
  category: string;
  description: string;
  regulatory_reference: string;
  due_date: Date;
  frequency: string; // DAILY, WEEKLY, MONTHLY, QUARTERLY, ANNUAL
  required_evidence: string[];
  auto_verification: boolean;
}

export interface AuditFinding {
  id: string;
  requirement_id: string;
  description: string;
  severity: AuditFindingSeverity;
  evidence: string[];
  root_cause: string;
  action_plan: string;
  target_resolution_date: Date;
  status: string; // OPEN, IN_PROGRESS, RESOLVED, CLOSED
}

export enum DepositType {
  INDIVIDUAL = "INDIVIDUAL",
  CORPORATE = "CORPORATE",
  GOVERNMENT = "GOVERNMENT",
  JOINT = "JOINT",
  TRUST = "TRUST",
}

export enum AccountSize {
  SMALL = "SMALL",
  MEDIUM = "MEDIUM",
  LARGE = "LARGE",
}

export enum PremiumStatus {
  CALCULATED = "CALCULATED",
  INVOICED = "INVOICED",
  PAID = "PAID",
  OVERDUE = "OVERDUE",
  CANCELLED = "CANCELLED",
}

export enum ReturnStatus {
  PENDING = "PENDING",
  VALIDATED = "VALIDATED",
  REJECTED = "REJECTED",
  APPROVED = "APPROVED",
  SUBMITTED = "SUBMITTED",
  OVERDUE = "OVERDUE",
  OPEN = "OPEN", // For ReturnPeriod status
  CLOSED = "CLOSED", // For ReturnPeriod status
}
