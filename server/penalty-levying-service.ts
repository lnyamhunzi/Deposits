import { MySql2Database } from "drizzle-orm/mysql2";
import * as schema from "@shared/schema";
import { eq, and, sql, gte, lte, isNull } from "drizzle-orm";
import { v4 as uuidv4 } from 'uuid';
import {
  PremiumStatus,
} from "@shared/types";

export class PenaltyLevyingService {
  private db: MySql2Database<typeof schema>;

  constructor(db: MySql2Database<typeof schema>) {
    this.db = db;
  }

  async checkAndApplyPenalties(): Promise<Record<string, any>> {
    const overdueInvoices = await this.db.query.invoices.findMany({
      where: and(
        lte(schema.invoices.dueDate, new Date()),
        eq(schema.invoices.status, PremiumStatus.PENDING) // Assuming PENDING means not paid/cancelled
      ),
      with: { payments: true }, // Eager load payments to sum them up
    });

    const penaltiesApplied: any[] = [];

    for (const invoice of overdueInvoices) {
      // Check if penalty already applied for today
      const existingPenalty = await this.db.query.premiumPenalties.findFirst({
        where: and(
          eq(schema.premiumPenalties.invoiceId, invoice.id),
          gte(
            schema.premiumPenalties.createdAt,
            new Date(new Date().setHours(0, 0, 0, 0))
          )
        ),
      });

      if (existingPenalty) {
        continue; // Penalty already applied for today
      }

      // Calculate days overdue
      const daysOverdue = Math.floor(
        (new Date().getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysOverdue <= 0) {
        continue;
      }

      // Calculate penalty amount (e.g., 0.1% per day on outstanding amount)
      const outstandingAmount = parseFloat(invoice.totalAmount as string) - invoice.payments.reduce(
        (sum, p) =>
          p.status === "VERIFIED" ? sum + parseFloat(p.amount as string) : sum,
        0
      );
      const dailyPenaltyRate = 0.001; // 0.1% daily
      const penaltyAmount = outstandingAmount * dailyPenaltyRate * daysOverdue;

      // Create penalty record
      const penalty: typeof schema.premiumPenalties.$inferInsert = {
        id: uuidv4(),
        invoiceId: invoice.id,
        penaltyType: "LATE_PAYMENT",
        penaltyAmount: penaltyAmount.toFixed(2),
        totalAmount: (outstandingAmount + penaltyAmount).toFixed(2),
        daysOverdue: daysOverdue,
        status: "PENDING",
        dueDate: new Date(new Date().setDate(new Date().getDate() + 7)), // Penalty due in 7 days
      };
      await this.db.insert(schema.premiumPenalties).values(penalty);
      penaltiesApplied.push(penalty);
    }

    return {
      message: `Checked for overdue invoices. Applied ${penaltiesApplied.length} penalties.`,
      penalties: penaltiesApplied.map((p) => ({
        penalty_id: p.id,
        invoice_id: p.invoiceId,
        amount: parseFloat(p.penaltyAmount as string),
        days_overdue: p.daysOverdue,
      })),
    };
  }

  async getPenaltiesForInvoice(invoiceId: string): Promise<any[]> {
    const penalties = await this.db.query.premiumPenalties.findMany({
      where: eq(schema.premiumPenalties.invoiceId, invoiceId),
    });
    return penalties;
  }

  async getInstitutionPenalties(institutionId: number): Promise<any[]> {
    // This requires joining with the invoices table to filter by institutionId
    const penalties = await this.db.query.premiumPenalties.findMany({
      where: eq(schema.premiumPenalties.invoiceId, ""), // Placeholder: Need to join with invoices
    });
    return penalties;
  }
}
