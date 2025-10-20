import { db } from "./db";
import {
  type User,
  type UpsertUser,
  type Institution,
  type InsertInstitution,
  type Return,
  type InsertReturn,
  type Deposit,
  type InsertDeposit,
  type CamelsRating,
  type InsertCamelsRating,
  type StressTest,
  type InsertStressTest,
  type RiskScore,
  type InsertRiskScore,
  type Premium,
  type InsertPremium,
  type Invoice,
  type InsertInvoice,
  type Payment,
  type InsertPayment,
  type Penalty,
  type InsertPenalty,
  type Customer,
  type InsertCustomer,
  type AuditLog,
  users,
  institutions,
  returns,
  deposits,
  camelsRatings,
  stressTests,
  riskScores,
  premiums,
  invoices,
  payments,
  penalties,
  customers,
  auditLogs,
} from "@shared/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Institutions
  getInstitutions(): Promise<Institution[]>;
  getInstitution(id: number): Promise<Institution | undefined>;
  createInstitution(institution: InsertInstitution): Promise<Institution>;
  updateInstitution(id: number, institution: Partial<Institution>): Promise<Institution | undefined>;

  // Returns
  getReturns(): Promise<Return[]>;
  getReturnsByInstitution(institutionId: number): Promise<Return[]>;
  createReturn(ret: InsertReturn): Promise<Return>;
  updateReturn(id: number, ret: Partial<Return>): Promise<Return | undefined>;

  // Deposits
  getDeposits(): Promise<Deposit[]>;
  getDepositsByInstitution(institutionId: number): Promise<Deposit[]>;
  getDepositsByPeriod(period: string): Promise<Deposit[]>;
  createDeposit(deposit: InsertDeposit): Promise<Deposit>;

  // CAMELS Ratings
  getCamelsRatings(): Promise<CamelsRating[]>;
  getCamelsRatingsByInstitution(institutionId: number): Promise<CamelsRating[]>;
  getLatestCamelsRating(institutionId: number): Promise<CamelsRating | undefined>;
  createCamelsRating(rating: InsertCamelsRating): Promise<CamelsRating>;

  // Stress Tests
  getStressTests(): Promise<StressTest[]>;
  getStressTestsByInstitution(institutionId: number): Promise<StressTest[]>;
  createStressTest(test: InsertStressTest): Promise<StressTest>;

  // Risk Scores
  getRiskScores(): Promise<RiskScore[]>;
  getRiskScoresByInstitution(institutionId: number): Promise<RiskScore[]>;
  createRiskScore(score: InsertRiskScore): Promise<RiskScore>;

  // Premiums
  getPremiums(): Promise<Premium[]>;
  getPremiumsByInstitution(institutionId: number): Promise<Premium[]>;
  createPremium(premium: InsertPremium): Promise<Premium>;

  // Invoices
  getInvoices(): Promise<Invoice[]>;
  getInvoicesByInstitution(institutionId: number): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, invoice: Partial<Invoice>): Promise<Invoice | undefined>;

  // Payments
  getPayments(): Promise<Payment[]>;
  getPaymentsByInvoice(invoiceId: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;

  // Penalties
  getPenalties(): Promise<Penalty[]>;
  getPenaltiesByInstitution(institutionId: number): Promise<Penalty[]>;
  createPenalty(penalty: InsertPenalty): Promise<Penalty>;

  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomersByInstitution(institutionId: number): Promise<Customer[]>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;

  // Audit Logs
  createAuditLog(log: Partial<typeof auditLogs.$inferInsert>): Promise<AuditLog>;
}

export class DbStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    const result = await db
      .insert(users)
      .values(user)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result[0];
  }

  // Institutions
  async getInstitutions(): Promise<Institution[]> {
    return await db.select().from(institutions).orderBy(institutions.name);
  }

  async getInstitution(id: number): Promise<Institution | undefined> {
    const result = await db.select().from(institutions).where(eq(institutions.id, id));
    return result[0];
  }

  async createInstitution(institution: InsertInstitution): Promise<Institution> {
    const result = await db.insert(institutions).values(institution).returning();
    return result[0];
  }

  async updateInstitution(id: number, institution: Partial<Institution>): Promise<Institution | undefined> {
    const result = await db
      .update(institutions)
      .set({ ...institution, updatedAt: new Date() })
      .where(eq(institutions.id, id))
      .returning();
    return result[0];
  }

  // Returns
  async getReturns(): Promise<Return[]> {
    return await db.select().from(returns).orderBy(desc(returns.submittedAt));
  }

  async getReturnsByInstitution(institutionId: number): Promise<Return[]> {
    return await db
      .select()
      .from(returns)
      .where(eq(returns.institutionId, institutionId))
      .orderBy(desc(returns.returnPeriod));
  }

  async createReturn(ret: InsertReturn): Promise<Return> {
    const result = await db.insert(returns).values(ret).returning();
    return result[0];
  }

  async updateReturn(id: number, ret: Partial<Return>): Promise<Return | undefined> {
    const result = await db
      .update(returns)
      .set({ ...ret, updatedAt: new Date() })
      .where(eq(returns.id, id))
      .returning();
    return result[0];
  }

  // Deposits
  async getDeposits(): Promise<Deposit[]> {
    return await db.select().from(deposits).orderBy(desc(deposits.period));
  }

  async getDepositsByInstitution(institutionId: number): Promise<Deposit[]> {
    return await db
      .select()
      .from(deposits)
      .where(eq(deposits.institutionId, institutionId))
      .orderBy(desc(deposits.period));
  }

  async getDepositsByPeriod(period: string): Promise<Deposit[]> {
    return await db.select().from(deposits).where(eq(deposits.period, period));
  }

  async createDeposit(deposit: InsertDeposit): Promise<Deposit> {
    const result = await db.insert(deposits).values(deposit).returning();
    return result[0];
  }

  // CAMELS Ratings
  async getCamelsRatings(): Promise<CamelsRating[]> {
    return await db.select().from(camelsRatings).orderBy(desc(camelsRatings.period));
  }

  async getCamelsRatingsByInstitution(institutionId: number): Promise<CamelsRating[]> {
    return await db
      .select()
      .from(camelsRatings)
      .where(eq(camelsRatings.institutionId, institutionId))
      .orderBy(desc(camelsRatings.period));
  }

  async getLatestCamelsRating(institutionId: number): Promise<CamelsRating | undefined> {
    const result = await db
      .select()
      .from(camelsRatings)
      .where(eq(camelsRatings.institutionId, institutionId))
      .orderBy(desc(camelsRatings.period))
      .limit(1);
    return result[0];
  }

  async createCamelsRating(rating: InsertCamelsRating): Promise<CamelsRating> {
    const result = await db.insert(camelsRatings).values(rating).returning();
    return result[0];
  }

  // Stress Tests
  async getStressTests(): Promise<StressTest[]> {
    return await db.select().from(stressTests).orderBy(desc(stressTests.runAt));
  }

  async getStressTestsByInstitution(institutionId: number): Promise<StressTest[]> {
    return await db
      .select()
      .from(stressTests)
      .where(eq(stressTests.institutionId, institutionId))
      .orderBy(desc(stressTests.runAt));
  }

  async createStressTest(test: InsertStressTest): Promise<StressTest> {
    const result = await db.insert(stressTests).values(test).returning();
    return result[0];
  }

  // Risk Scores
  async getRiskScores(): Promise<RiskScore[]> {
    return await db.select().from(riskScores).orderBy(desc(riskScores.period));
  }

  async getRiskScoresByInstitution(institutionId: number): Promise<RiskScore[]> {
    return await db
      .select()
      .from(riskScores)
      .where(eq(riskScores.institutionId, institutionId))
      .orderBy(desc(riskScores.period));
  }

  async createRiskScore(score: InsertRiskScore): Promise<RiskScore> {
    const result = await db.insert(riskScores).values(score).returning();
    return result[0];
  }

  // Premiums
  async getPremiums(): Promise<Premium[]> {
    return await db.select().from(premiums).orderBy(desc(premiums.period));
  }

  async getPremiumsByInstitution(institutionId: number): Promise<Premium[]> {
    return await db
      .select()
      .from(premiums)
      .where(eq(premiums.institutionId, institutionId))
      .orderBy(desc(premiums.period));
  }

  async createPremium(premium: InsertPremium): Promise<Premium> {
    const result = await db.insert(premiums).values(premium).returning();
    return result[0];
  }

  // Invoices
  async getInvoices(): Promise<Invoice[]> {
    return await db.select().from(invoices).orderBy(desc(invoices.invoiceDate));
  }

  async getInvoicesByInstitution(institutionId: number): Promise<Invoice[]> {
    return await db
      .select()
      .from(invoices)
      .where(eq(invoices.institutionId, institutionId))
      .orderBy(desc(invoices.invoiceDate));
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const result = await db.insert(invoices).values(invoice).returning();
    return result[0];
  }

  async updateInvoice(id: number, invoice: Partial<Invoice>): Promise<Invoice | undefined> {
    const result = await db
      .update(invoices)
      .set({ ...invoice, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return result[0];
  }

  // Payments
  async getPayments(): Promise<Payment[]> {
    return await db.select().from(payments).orderBy(desc(payments.paymentDate));
  }

  async getPaymentsByInvoice(invoiceId: number): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.invoiceId, invoiceId));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const result = await db.insert(payments).values(payment).returning();
    return result[0];
  }

  // Penalties
  async getPenalties(): Promise<Penalty[]> {
    return await db.select().from(penalties).orderBy(desc(penalties.imposedAt));
  }

  async getPenaltiesByInstitution(institutionId: number): Promise<Penalty[]> {
    return await db
      .select()
      .from(penalties)
      .where(eq(penalties.institutionId, institutionId))
      .orderBy(desc(penalties.imposedAt));
  }

  async createPenalty(penalty: InsertPenalty): Promise<Penalty> {
    const result = await db.insert(penalties).values(penalty).returning();
    return result[0];
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(customers.customerName);
  }

  async getCustomersByInstitution(institutionId: number): Promise<Customer[]> {
    return await db
      .select()
      .from(customers)
      .where(eq(customers.institutionId, institutionId))
      .orderBy(customers.customerName);
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const result = await db.insert(customers).values(customer).returning();
    return result[0];
  }

  // Audit Logs
  async createAuditLog(log: Partial<typeof auditLogs.$inferInsert>): Promise<AuditLog> {
    const result = await db.insert(auditLogs).values(log).returning();
    return result[0];
  }
}

export const storage = new DbStorage();
