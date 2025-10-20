import * as schema from "@shared/schema";
import { eq, and, lte } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import {
  ReturnStatus
} from "@shared/types";
class PenaltiesService {
  db;
  constructor(db) {
    this.db = db;
  }
  async checkAndApplyPenalties(institutionId) {
    const institution = await this.db.query.institutions.findFirst({
      where: eq(schema.institutions.id, institutionId)
    });
    if (!institution) {
      return { error: "Institution not found" };
    }
    const overduePeriods = await this.db.query.returnPeriods.findMany({
      where: and(
        eq(schema.returnPeriods.institutionId, institutionId),
        lte(schema.returnPeriods.periodEnd, /* @__PURE__ */ new Date()),
        // Assuming due_date is period_end
        eq(schema.returnPeriods.status, ReturnStatus.OPEN)
        // Only consider OPEN periods as not submitted
      )
    });
    const appliedPenalties = [];
    for (const period of overduePeriods) {
      const uploadedReturn = await this.db.query.returns.findFirst({
        where: eq(schema.returns.returnPeriod, period.periodEnd.toISOString().slice(0, 10))
        // Assuming returnPeriod matches period.periodEnd
      });
      if (!uploadedReturn || uploadedReturn.status !== ReturnStatus.SUBMITTED) {
        const penaltyAmount = 100;
        const reason = "Late or non-submission of regulatory return";
        const penaltyType = "LATE_SUBMISSION";
        const existingPenalty = await this.db.query.premiumPenalties.findFirst({
          where: and(
            eq(schema.premiumPenalties.invoiceId, ""),
            // Placeholder: Need to link to an invoice if applicable
            eq(schema.premiumPenalties.penaltyType, penaltyType)
          )
        });
        if (!existingPenalty) {
          const newPenalty = {
            id: uuidv4(),
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
          await this.db.insert(schema.premiumPenalties).values(newPenalty);
          appliedPenalties.push(newPenalty);
        }
        await this.db.update(schema.returnPeriods).set({ status: ReturnStatus.OVERDUE }).where(eq(schema.returnPeriods.id, period.id));
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
      where: and(
        // eq(schema.premiumPenalties.institutionId, institution.id), // Need institutionId in premiumPenalties table
        eq(schema.premiumPenalties.status, "PENDING"),
        lte(schema.premiumPenalties.dueDate, /* @__PURE__ */ new Date())
      )
    });
    if (unpaidPenaltiesCount.length >= 3) {
      await this.db.update(schema.institutions).set({ status: "LOCKED" }).where(eq(schema.institutions.id, institution.id));
    }
  }
  async getPenaltiesForInstitution(institutionId) {
    const penalties = await this.db.query.premiumPenalties.findMany({
      where: eq(schema.premiumPenalties.invoiceId, "")
      // Placeholder: Need to filter by institutionId
    });
    return penalties.map((p) => ({
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
      where: eq(schema.premiumPenalties.id, penaltyId)
    });
    if (!penalty) {
      throw new Error("Penalty not found");
    }
    await this.db.update(schema.premiumPenalties).set({
      status: "PAID",
      paidAt: /* @__PURE__ */ new Date(),
      paymentReference: paymentDetails.payment_reference
    }).where(eq(schema.premiumPenalties.id, penaltyId));
    const updatedPenalty = await this.db.query.premiumPenalties.findFirst({
      where: eq(schema.premiumPenalties.id, penaltyId)
    });
    const institution = await this.db.query.institutions.findFirst({
      where: eq(schema.institutions.id, updatedPenalty?.invoiceId)
      // Placeholder: Need institutionId in premiumPenalties
    });
    if (institution && institution.status === "LOCKED") {
      const unpaidPenalties = await this.db.query.premiumPenalties.findMany({
        where: and(
          // eq(schema.premiumPenalties.institutionId, institution.id), // Need institutionId in premiumPenalties
          eq(schema.premiumPenalties.status, "PENDING")
        )
      });
      if (unpaidPenalties.length === 0) {
        await this.db.update(schema.institutions).set({ status: "ACTIVE" }).where(eq(schema.institutions.id, institution.id));
      }
    }
    return updatedPenalty;
  }
  async waivePenalty(penaltyId, reason) {
    const penalty = await this.db.query.premiumPenalties.findFirst({
      where: eq(schema.premiumPenalties.id, penaltyId)
    });
    if (!penalty) {
      throw new Error("Penalty not found");
    }
    await this.db.update(schema.premiumPenalties).set({
      status: "WAIVED",
      reason: `${penalty.reason}
Waived: ${reason}`
    }).where(eq(schema.premiumPenalties.id, penaltyId));
    const updatedPenalty = await this.db.query.premiumPenalties.findFirst({
      where: eq(schema.premiumPenalties.id, penaltyId)
    });
    return updatedPenalty;
  }
}
export {
  PenaltiesService
};
