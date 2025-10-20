import * as schema from "@shared/schema";
import { eq, and, sql, gte } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import {
  PremiumStatus
} from "@shared/types";
class InvoicingService {
  db;
  constructor(db) {
    this.db = db;
  }
  async generateInvoice(premiumCalculationId, dueDate) {
    const premiumCalc = await this.db.query.premiumCalculations.findFirst({
      where: eq(schema.premiumCalculations.id, premiumCalculationId)
    });
    if (!premiumCalc) {
      return { error: "Premium calculation not found" };
    }
    if (premiumCalc.status !== PremiumStatus.CALCULATED) {
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
      status: PremiumStatus.INVOICED
    };
    await this.db.insert(schema.invoices).values(invoice);
    await this.db.update(schema.premiumCalculations).set({ status: PremiumStatus.INVOICED }).where(eq(schema.premiumCalculations.id, premiumCalculationId));
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
      where: eq(schema.institutions.id, institutionId)
    });
    if (!institution) {
      throw new Error("Institution not found");
    }
    const year = (/* @__PURE__ */ new Date()).getFullYear();
    const month = (/* @__PURE__ */ new Date()).getMonth() + 1;
    const invoiceCount = await this.db.select({ count: sql`count(*)` }).from(schema.invoices).where(
      and(
        gte(schema.invoices.invoiceDate, /* @__PURE__ */ new Date(`${year}-${month}-01`)),
        lt(
          schema.invoices.invoiceDate,
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
      where: eq(schema.premiumCalculations.id, invoice.premiumCalculationId)
    });
    const institution = await this.db.query.institutions.findFirst({
      where: eq(schema.institutions.id, invoice.institutionId)
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
      where: eq(schema.invoices.id, invoiceId)
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
      await this.db.update(schema.invoices).set({
        sentToAccounting: true,
        accountingReference
      }).where(eq(schema.invoices.id, invoiceId));
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
      where: eq(schema.institutions.id, invoice.institutionId)
    });
    const premiumCalc = await this.db.query.premiumCalculations.findFirst({
      where: eq(schema.premiumCalculations.id, invoice.premiumCalculationId)
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
      where: eq(schema.invoices.id, invoiceId)
    });
    if (!invoice) {
      return { error: "Invoice not found" };
    }
    const payments = await this.db.query.payments.findMany({
      where: eq(schema.payments.invoiceId, invoiceId)
    });
    const penalties = await this.db.query.premiumPenalties.findMany({
      where: eq(schema.premiumPenalties.invoiceId, invoiceId)
    });
    const totalPaid = payments.reduce(
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
        status: isOverdue ? PremiumStatus.OVERDUE : invoice.status,
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
      payments: payments.map((payment) => ({
        id: payment.id,
        amount: parseFloat(payment.amount),
        payment_date: payment.paymentDate.toISOString(),
        payment_method: payment.paymentMethod,
        payment_reference: payment.paymentReference,
        status: payment.status,
        verified_at: payment.verifiedAt?.toISOString()
      })),
      penalties: penalties.map((penalty) => ({
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
}
export {
  InvoicingService
};
