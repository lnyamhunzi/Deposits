import * as schema from "@shared/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import {
  PremiumStatus
} from "@shared/types";
class PenaltyLevyingService {
  db;
  constructor(db) {
    this.db = db;
  }
  async checkAndApplyPenalties() {
    const overdueInvoices = await this.db.query.invoices.findMany({
      where: and(
        lte(schema.invoices.dueDate, /* @__PURE__ */ new Date()),
        eq(schema.invoices.status, PremiumStatus.PENDING)
        // Assuming PENDING means not paid/cancelled
      ),
      with: { payments: true }
      // Eager load payments to sum them up
    });
    const penaltiesApplied = [];
    for (const invoice of overdueInvoices) {
      const existingPenalty = await this.db.query.premiumPenalties.findFirst({
        where: and(
          eq(schema.premiumPenalties.invoiceId, invoice.id),
          gte(
            schema.premiumPenalties.createdAt,
            new Date((/* @__PURE__ */ new Date()).setHours(0, 0, 0, 0))
          )
        )
      });
      if (existingPenalty) {
        continue;
      }
      const daysOverdue = Math.floor(
        ((/* @__PURE__ */ new Date()).getTime() - invoice.dueDate.getTime()) / (1e3 * 60 * 60 * 24)
      );
      if (daysOverdue <= 0) {
        continue;
      }
      const outstandingAmount = parseFloat(invoice.totalAmount) - invoice.payments.reduce(
        (sum, p) => p.status === "VERIFIED" ? sum + parseFloat(p.amount) : sum,
        0
      );
      const dailyPenaltyRate = 1e-3;
      const penaltyAmount = outstandingAmount * dailyPenaltyRate * daysOverdue;
      const penalty = {
        id: uuidv4(),
        invoiceId: invoice.id,
        penaltyType: "LATE_PAYMENT",
        penaltyAmount: penaltyAmount.toFixed(2),
        totalAmount: (outstandingAmount + penaltyAmount).toFixed(2),
        daysOverdue,
        status: "PENDING",
        dueDate: new Date((/* @__PURE__ */ new Date()).setDate((/* @__PURE__ */ new Date()).getDate() + 7))
        // Penalty due in 7 days
      };
      await this.db.insert(schema.premiumPenalties).values(penalty);
      penaltiesApplied.push(penalty);
    }
    return {
      message: `Checked for overdue invoices. Applied ${penaltiesApplied.length} penalties.`,
      penalties: penaltiesApplied.map((p) => ({
        penalty_id: p.id,
        invoice_id: p.invoiceId,
        amount: parseFloat(p.penaltyAmount),
        days_overdue: p.daysOverdue
      }))
    };
  }
  async getPenaltiesForInvoice(invoiceId) {
    const penalties = await this.db.query.premiumPenalties.findMany({
      where: eq(schema.premiumPenalties.invoiceId, invoiceId)
    });
    return penalties;
  }
  async getInstitutionPenalties(institutionId) {
    const penalties = await this.db.query.premiumPenalties.findMany({
      where: eq(schema.premiumPenalties.invoiceId, "")
      // Placeholder: Need to join with invoices
    });
    return penalties;
  }
}
export {
  PenaltyLevyingService
};
