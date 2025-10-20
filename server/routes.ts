import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { requireAuth } from "./auth.js";
import { BalanceAggregationService } from "./balance-aggregation.js";
import { ComplianceTracker } from "./compliance-tracker.js";
import { DepositAnalysisService } from "./deposit-analysis.js";
import { InvoicingService } from "./invoicing-service.js";
import { PenaltiesService } from "./penalties-service.js";
import { db } from "./db.js";
import { z } from "zod";

import { calculateCAMELS, runStressTest, validateReturn, calculatePremium } from "./business-logic.js";

const balanceAggregationService = new BalanceAggregationService(db);
const complianceTracker = new ComplianceTracker(db);
const depositAnalysisService = new DepositAnalysisService(db);
const invoicingService = new InvoicingService(db);
const penaltiesService = new PenaltiesService(db);

// Helper to handle async routes
const asyncHandler =
  (fn: (req: Request, res: Response) => Promise<any>) => (req: Request, res: Response) =>
    fn(req, res).catch((error) => {
      console.error("Route error:", error);
      res.status(500).json({ message: error.message || "Internal server error" });
    });

export async function registerRoutes(app: Express): Promise<Server> {
  // ============================================
  // DASHBOARD
  // ============================================
  app.get(
    "/api/dashboard/stats",
    requireAuth,
    asyncHandler(async (req, res) => {
      const institutions = await storage.getInstitutions();
      const returns = await storage.getReturns();
      const invoices = await storage.getInvoices();
      const deposits = await storage.getDeposits();

      const stats = {
        totalInstitutions: institutions.length,
        activeInstitutions: institutions.filter((i) => i.status === "active").length,
        lockedInstitutions: institutions.filter((i) => i.status === "locked").length,
        totalDeposits: deposits.reduce((sum, d) => sum + Number(d.totalDeposits || 0), 0),
        totalExposure: deposits.reduce((sum, d) => sum + Number(d.totalExposure || 0), 0),
        pendingReturns: returns.filter((r) => r.status === "pending").length,
        overduePayments: invoices.filter((i) => i.status === "overdue").length,
        criticalRiskInstitutions: 0, // Would calculate from risk scores
      };

      res.json(stats);
    })
  );

  // ============================================
  // INSTITUTIONS
  // ============================================
  app.get(
    "/api/institutions",
    requireAuth,
    asyncHandler(async (req, res) => {
      const institutions = await storage.getInstitutions();
      res.json(institutions);
    })
  );

  app.get(
    "/api/institutions/:id",
    requireAuth,
    asyncHandler(async (req, res) => {
      const id = parseInt(req.params.id);
      const institution = await storage.getInstitution(id);
      if (!institution) {
        return res.status(404).json({ message: "Institution not found" });
      }
      res.json(institution);
    })
  );

  app.post(
    "/api/institutions",
    requireAuth,
    asyncHandler(async (req, res) => {
      const data = insertInstitutionSchema.parse(req.body);
      const institution = await storage.createInstitution(data);
      
      await storage.createAuditLog({
        userId: req.user?.id,
        action: "create_institution",
        entityType: "institution",
        entityId: institution.id,
        changes: data,
      });

      res.json(institution);
    })
  );

  // ============================================
  // RETURNS MANAGEMENT
  // ============================================
  app.get(
    "/api/returns",
    requireAuth,
    asyncHandler(async (req, res) => {
      const returns = await storage.getReturns();
      res.json(returns);
    })
  );

  app.get(
    "/api/returns/institution/:institutionId",
    requireAuth,
    asyncHandler(async (req, res) => {
      const institutionId = parseInt(req.params.institutionId);
      const returns = await storage.getReturnsByInstitution(institutionId);
      res.json(returns);
    })
  );

  app.post(
    "/api/returns",
    requireAuth,
    asyncHandler(async (req, res) => {
      const data = insertReturnSchema.parse(req.body);
      
      // Validate return and calculate penalties
      const validation = validateReturn(data);
      
      const returnData = {
        ...data,
        submittedBy: req.user?.id,
        validationErrors: validation.valid ? null : validation.errors,
        status: validation.valid ? "validated" : "rejected",
      };
      
      const ret = await storage.createReturn(returnData);
      
      // Create penalty if late
      if (validation.penalty) {
        await storage.createPenalty({
          institutionId: data.institutionId,
          penaltyType: "late_return",
          referenceId: ret.id,
          amount: validation.penalty.toString(),
          reason: `Late submission - ${validation.errors.join(", ")}`,
          imposedBy: req.user?.id,
        });
      }
      
      await storage.createAuditLog({
        userId: req.user?.id,
        action: "create_return",
        entityType: "return",
        entityId: ret.id,
        changes: returnData,
      });

      res.json({ return: ret, validation });
    })
  );

  app.patch(
    "/api/returns/:id",
    requireAuth,
    asyncHandler(async (req, res) => {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const ret = await storage.updateReturn(id, updates);
      
      if (ret) {
        await storage.createAuditLog({
          userId: req.user?.id,
          action: "update_return",
          entityType: "return",
          entityId: ret.id,
          changes: updates,
        });
      }

      res.json(ret);
    })
  );

  // ============================================
  // DEPOSITS
  // ============================================
  app.get(
    "/api/deposits",
    requireAuth,
    asyncHandler(async (req, res) => {
      const deposits = await storage.getDeposits();
      res.json(deposits);
    })
  );

  app.get(
    "/api/deposits/institution/:institutionId",
    requireAuth,
    asyncHandler(async (req, res) => {
      const institutionId = parseInt(req.params.institutionId);
      const deposits = await storage.getDepositsByInstitution(institutionId);
      res.json(deposits);
    })
  );

  // ============================================
  // CAMELS RATINGS
  // ============================================
  app.get(
    "/api/camels",
    requireAuth,
    asyncHandler(async (req, res) => {
      const ratings = await storage.getCamelsRatings();
      res.json(ratings);
    })
  );

  app.get(
    "/api/camels/:institutionId",
    requireAuth,
    asyncHandler(async (req, res) => {
      const institutionId = parseInt(req.params.institutionId);
      const rating = await storage.getLatestCamelsRating(institutionId);
      res.json(rating || null);
    })
  );

  app.post(
    "/api/camels",
    requireAuth,
    asyncHandler(async (req, res) => {
      const data = insertCamelsRatingSchema.parse(req.body);
      const rating = await storage.createCamelsRating({
        ...data,
        calculatedBy: req.user?.id,
      });
      
      await storage.createAuditLog({
        userId: req.user?.id,
        action: "create_camels_rating",
        entityType: "camels_rating",
        entityId: rating.id,
        changes: data,
      });

      res.json(rating);
    })
  );

  // ============================================
  // STRESS TESTS
  // ============================================
  app.get(
    "/api/stress-tests",
    requireAuth,
    asyncHandler(async (req, res) => {
      const tests = await storage.getStressTests();
      res.json(tests);
    })
  );

  app.get(
    "/api/stress-tests/institution/:institutionId",
    requireAuth,
    asyncHandler(async (req, res) => {
      const institutionId = parseInt(req.params.institutionId);
      const tests = await storage.getStressTestsByInstitution(institutionId);
      res.json(tests);
    })
  );

  app.post(
    "/api/stress-tests",
    requireAuth,
    asyncHandler(async (req, res) => {
      const data = insertStressTestSchema.parse(req.body);
      
      // Get current financials from latest deposits
      const deposits = await storage.getDepositsByInstitution(data.institutionId);
      const latestDeposit = deposits[0];
      
      const currentFinancials = {
        deposits: Number(latestDeposit?.totalDeposits || 10000000),
        loans: Number(latestDeposit?.totalDeposits || 10000000) * 0.75,
        capital: Number(latestDeposit?.totalDeposits || 10000000) * 0.12,
        liquidity: Number(latestDeposit?.totalDeposits || 10000000) * 0.25,
      };
      
      // Run stress test
      const stressTestResult = runStressTest({
        scenarioType: data.scenarioType,
        severity: data.severity,
        currentFinancials,
      });
      
      const test = await storage.createStressTest({
        ...data,
        runBy: req.user?.id,
        scenarioParameters: {
          severity: data.severity,
          scenario: data.scenarioType,
        },
        currentFinancials,
        stressedFinancials: stressTestResult.stressedFinancials,
        impactAnalysis: stressTestResult.impactAnalysis,
        currentCamels: {},
        stressedCamels: {},
        camelsDeterioration: {},
        probabilityOfDefault: stressTestResult.probabilityOfDefault,
        capitalShortfall: stressTestResult.capitalShortfall.toString(),
        liquidityGap: stressTestResult.liquidityGap.toString(),
        recommendations: stressTestResult.recommendations,
      });
      
      await storage.createAuditLog({
        userId: req.user?.id,
        action: "run_stress_test",
        entityType: "stress_test",
        entityId: test.id,
        changes: data,
      });

      res.json(test);
    })
  );

  // ============================================
  // RISK SCORES
  // ============================================
  app.get(
    "/api/risk-scores",
    requireAuth,
    asyncHandler(async (req, res) => {
      const scores = await storage.getRiskScores();
      res.json(scores);
    })
  );

  app.get(
    "/api/risk-scores/institution/:institutionId",
    requireAuth,
    asyncHandler(async (req, res) => {
      const institutionId = parseInt(req.params.institutionId);
      const scores = await storage.getRiskScoresByInstitution(institutionId);
      res.json(scores);
    })
  );

  // ============================================
  // PREMIUMS & INVOICES
  // ============================================
  app.get(
    "/api/premiums",
    requireAuth,
    asyncHandler(async (req, res) => {
      const premiums = await storage.getPremiums();
      res.json(premiums);
    })
  );

  app.post(
    "/api/premiums/calculate",
    requireAuth,
    asyncHandler(async (req, res) => {
      const institutions = await storage.getInstitutions();
      const calculatedPremiums = [];

      for (const institution of institutions) {
        // Get deposits and CAMELS rating for risk-based premium
        const deposits = await storage.getDepositsByInstitution(institution.id);
        const totalDeposits = deposits.reduce((sum, d) => sum + Number(d.totalDeposits || 0), 0);
        
        const camelsRating = await storage.getLatestCamelsRating(institution.id);
        const riskRating = camelsRating ? Math.round(Number(camelsRating.compositeRating)) : undefined;
        
        // Calculate premium with risk adjustment
        const premiumCalc = calculatePremium(totalDeposits, riskRating);

        const premium = await storage.createPremium({
          institutionId: institution.id,
          period: new Date().toISOString().slice(0, 10),
          premiumType: riskRating ? "risk_based" : "flat_rate",
          eligibleDeposits: totalDeposits.toString(),
          premiumRate: premiumCalc.premiumRate.toString(),
          premiumAmount: premiumCalc.premiumAmount.toString(),
          riskAdjustment: premiumCalc.riskAdjustment.toString(),
          adjustedPremiumAmount: premiumCalc.premiumAmount.toString(),
          calculatedBy: req.user?.id,
          calculationDetails: {
            riskRating,
            baseRate: 0.001,
            riskAdjustment: premiumCalc.riskAdjustment,
          },
        });

        // Generate invoice
        const invoiceNumber = `INV-${Date.now()}-${institution.id}`;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);

        const invoice = await storage.createInvoice({
          invoiceNumber,
          institutionId: institution.id,
          premiumId: premium.id,
          period: new Date().toISOString().slice(0, 10),
          amount: premiumCalc.premiumAmount.toString(),
          dueDate: dueDate.toISOString().slice(0, 10),
          generatedBy: req.user?.id,
        });

        calculatedPremiums.push({ premium, invoice });
      }

      res.json({ message: "Premiums calculated", count: calculatedPremiums.length });
    })
  );

  app.get(
    "/api/invoices",
    requireAuth,
    asyncHandler(async (req, res) => {
      const invoices = await storage.getInvoices();
      res.json(invoices);
    })
  );

  app.get(
    "/api/invoices/institution/:institutionId",
    requireAuth,
    asyncHandler(async (req, res) => {
      const institutionId = parseInt(req.params.institutionId);
      const invoices = await storage.getInvoicesByInstitution(institutionId);
      res.json(invoices);
    })
  );

  // ============================================
  // PAYMENTS
  // ============================================
  app.get(
    "/api/payments",
    requireAuth,
    asyncHandler(async (req, res) => {
      const payments = await storage.getPayments();
      res.json(payments);
    })
  );

  app.post(
    "/api/payments",
    requireAuth,
    asyncHandler(async (req, res) => {
      const data = insertPaymentSchema.parse(req.body);
      const payment = await storage.createPayment({
        ...data,
        uploadedBy: req.user?.id,
      });
      
      await storage.createAuditLog({
        userId: req.user?.id,
        action: "create_payment",
        entityType: "payment",
        entityId: payment.id,
        changes: data,
      });

      res.json(payment);
    })
  );

  // ============================================
  // CUSTOMERS (Single Customer View)
  // ============================================
  app.get(
    "/api/customers",
    requireAuth,
    asyncHandler(async (req, res) => {
      const customers = await storage.getCustomers();
      res.json(customers);
    })
  );

  app.get(
    "/api/customers/institution/:institutionId",
    requireAuth,
    asyncHandler(async (req, res) => {
      const institutionId = parseInt(req.params.institutionId);
      const customers = await storage.getCustomersByInstitution(institutionId);
      res.json(customers);
    })
  );

  app.post(
    "/api/customers",
    requireAuth,
    asyncHandler(async (req, res) => {
      const data = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(data);
      res.json(customer);
    })
  );

  // ============================================
  // SINGLE CUSTOMER VIEW (SCV) AGGREGATION
  // ============================================
  app.post(
    "/api/scv/aggregate-balances",
    requireAuth,
    asyncHandler(async (req, res) => {
      const { institutionId, periodId } = req.body;
      if (!institutionId || !periodId) {
        return res.status(400).json({ message: "institutionId and periodId are required" });
      }
      const result = await balanceAggregationService.aggregateCustomerBalances(
        parseInt(institutionId),
        periodId
      );
      res.json(result);
    })
  );

  // ============================================
  // PENALTIES
  // ============================================
  app.get(
    "/api/penalties",
    requireAuth,
    asyncHandler(async (req, res) => {
      const penalties = await storage.getPenalties();
      res.json(penalties);
    })
  );

  // ============================================
  // COMPLIANCE TRACKING
  // ============================================
  app.post(
    "/api/compliance/track",
    requireAuth,
    asyncHandler(async (req, res) => {
      const { institutionId, period } = req.body;
      if (!institutionId || !period) {
        return res.status(400).json({ message: "institutionId and period are required" });
      }
      const result = await complianceTracker.trackCompliance(
        parseInt(institutionId),
        period
      );
      res.json(result);
    })
  );

  app.post(
    "/api/compliance/findings",
    requireAuth,
    asyncHandler(async (req, res) => {
      const { institutionId, finding } = req.body;
      if (!institutionId || !finding) {
        return res.status(400).json({ message: "institutionId and finding are required" });
      }
      const parsedFinding = insertAuditFindingSchema.parse(finding);
      const result = await complianceTracker.recordAuditFinding(
        parseInt(institutionId),
        {
          ...parsedFinding,
          target_resolution_date: new Date(parsedFinding.target_resolution_date),
          severity: parsedFinding.severity as AuditFindingSeverity,
        }
      );
      res.json(result);
    })
  );

  app.get(
    "/api/compliance/report",
    requireAuth,
    asyncHandler(async (req, res) => {
      const { institutionId, startDate, endDate } = req.query;
      if (!institutionId || !startDate || !endDate) {
        return res.status(400).json({ message: "institutionId, startDate, and endDate are required" });
      }
      const result = await complianceTracker.generateComplianceReport(
        parseInt(institutionId as string),
        new Date(startDate as string),
        new Date(endDate as string)
      );
      res.json(result);
    })
  );

  // ============================================
  // DEPOSIT SURVEILLANCE
  // ============================================
  app.post(
    "/api/surveillance/deposit-analysis",
    requireAuth,
    asyncHandler(async (req, res) => {
      const { institutionId, periodType, periodStart, periodEnd } = req.body;
      if (!institutionId || !periodType || !periodStart || !periodEnd) {
        return res.status(400).json({ message: "institutionId, periodType, periodStart, and periodEnd are required" });
      }
      const result = await depositAnalysisService.analyzeDeposits(
        parseInt(institutionId),
        periodType,
        new Date(periodStart),
        new Date(periodEnd)
      );
      res.json(result);
    })
  );

  // ============================================
  // INVOICING
  // ============================================
  app.post(
    "/api/invoicing/generate-invoice",
    requireAuth,
    asyncHandler(async (req, res) => {
      const { premiumCalculationId, dueDate } = req.body;
      if (!premiumCalculationId || !dueDate) {
        return res.status(400).json({ message: "premiumCalculationId and dueDate are required" });
      }
      const result = await invoicingService.generateInvoice(
        premiumCalculationId,
        new Date(dueDate)
      );
      res.json(result);
    })
  );

  app.post(
    "/api/invoicing/send-to-accounting",
    requireAuth,
    asyncHandler(async (req, res) => {
      const { invoiceId } = req.body;
      if (!invoiceId) {
        return res.status(400).json({ message: "invoiceId is required" });
      }
      const result = await invoicingService.sendToAccountingSystem(invoiceId);
      res.json(result);
    })
  );

  app.get(
    "/api/invoicing/status/:invoiceId",
    requireAuth,
    asyncHandler(async (req, res) => {
      const { invoiceId } = req.params;
      const result = await invoicingService.getInvoiceStatus(invoiceId);
      res.json(result);
    })
  );

  // ============================================
  // PENALTIES MANAGEMENT
  // ============================================
  app.post(
    "/api/penalties/check-and-apply",
    requireAuth,
    asyncHandler(async (req, res) => {
      const { institutionId } = req.body;
      if (!institutionId) {
        return res.status(400).json({ message: "institutionId is required" });
      }
      const result = await penaltiesService.checkAndApplyPenalties(
        parseInt(institutionId)
      );
      res.json(result);
    })
  );

  app.get(
    "/api/penalties/institution/:institutionId",
    requireAuth,
    asyncHandler(async (req, res) => {
      const { institutionId } = req.params;
      const result = await penaltiesService.getPenaltiesForInstitution(
        parseInt(institutionId)
      );
      res.json(result);
    })
  );

  app.post(
    "/api/penalties/pay",
    requireAuth,
    asyncHandler(async (req, res) => {
      const { penaltyId, paymentDetails } = req.body;
      if (!penaltyId || !paymentDetails) {
        return res.status(400).json({ message: "penaltyId and paymentDetails are required" });
      }
      const result = await penaltiesService.payPenalty(penaltyId, paymentDetails);
      res.json(result);
    })
  );

  app.post(
    "/api/penalties/waive",
    requireAuth,
    asyncHandler(async (req, res) => {
      const { penaltyId, reason } = req.body;
      if (!penaltyId || !reason) {
        return res.status(400).json({ message: "penaltyId and reason are required" });
      }
      const result = await penaltiesService.waivePenalty(penaltyId, reason);
      res.json(result);
    })
  );

  const httpServer = createServer(app);
  return httpServer;
}
