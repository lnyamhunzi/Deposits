import { db } from "./db";
import {
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
  auditLogs
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";
class DbStorage {
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
    return await db.select().from(invoices).orderBy(desc(invoices.generatedAt));
  }
  async getInvoicesByInstitution(institutionId) {
    return await db.select().from(invoices).where(eq(invoices.institutionId, institutionId)).orderBy(desc(invoices.generatedAt));
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
    return await db.select().from(payments).orderBy(desc(payments.uploadedAt));
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
  async createAuditLog(log) {
    const result = await db.insert(auditLogs).values(log).returning();
    return result[0];
  }
}
const storage = new DbStorage();
export {
  DbStorage,
  storage
};
