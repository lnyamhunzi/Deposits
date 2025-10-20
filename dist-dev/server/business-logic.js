import { db } from "./db";
import { CAMELSCalculations } from "./camels-calculations";
import { DepositClassificationEngine } from "./deposit-classification";
const camelsCalculations = new CAMELSCalculations(db);
const depositClassificationEngine = new DepositClassificationEngine();
async function calculateCAMELS(input) {
  return {};
}
function runStressTest(params) {
  let shockFactors = {
    depositWithdrawal: 0,
    loanDefault: 0,
    capitalImpact: 0,
    liquidityImpact: 0
  };
  switch (params.scenarioType) {
    case "EXCHANGE_RATE_SHOCK":
      shockFactors = {
        depositWithdrawal: params.severity === "SEVERE" ? 0.2 : params.severity === "MODERATE" ? 0.1 : 0.05,
        loanDefault: params.severity === "SEVERE" ? 0.15 : params.severity === "MODERATE" ? 0.08 : 0.04,
        capitalImpact: params.severity === "SEVERE" ? 0.25 : params.severity === "MODERATE" ? 0.15 : 0.08,
        liquidityImpact: params.severity === "SEVERE" ? 0.3 : params.severity === "MODERATE" ? 0.18 : 0.1
      };
      break;
    case "LIQUIDITY_SHOCK":
      shockFactors = {
        depositWithdrawal: params.severity === "SEVERE" ? 0.35 : params.severity === "MODERATE" ? 0.2 : 0.1,
        loanDefault: 0.05,
        capitalImpact: params.severity === "SEVERE" ? 0.15 : params.severity === "MODERATE" ? 0.1 : 0.05,
        liquidityImpact: params.severity === "SEVERE" ? 0.4 : params.severity === "MODERATE" ? 0.25 : 0.15
      };
      break;
    case "INTEREST_RATE_SHOCK":
      shockFactors = {
        depositWithdrawal: 0.1,
        loanDefault: params.severity === "SEVERE" ? 0.2 : params.severity === "MODERATE" ? 0.12 : 0.06,
        capitalImpact: params.severity === "SEVERE" ? 0.18 : params.severity === "MODERATE" ? 0.12 : 0.06,
        liquidityImpact: 0.1
      };
      break;
    default:
      shockFactors = {
        depositWithdrawal: 0.15,
        loanDefault: 0.1,
        capitalImpact: 0.12,
        liquidityImpact: 0.15
      };
  }
  const stressedFinancials = {
    deposits: params.currentFinancials.deposits * (1 - shockFactors.depositWithdrawal),
    loans: params.currentFinancials.loans * (1 - shockFactors.loanDefault),
    capital: params.currentFinancials.capital * (1 - shockFactors.capitalImpact),
    liquidity: params.currentFinancials.liquidity * (1 - shockFactors.liquidityImpact)
  };
  const capitalShortfall = Math.max(0, params.currentFinancials.deposits * 0.1 - stressedFinancials.capital);
  const liquidityGap = Math.max(0, stressedFinancials.deposits * 0.2 - stressedFinancials.liquidity);
  const probabilityOfDefault = Math.min(100, capitalShortfall / params.currentFinancials.capital * 100 + liquidityGap / params.currentFinancials.liquidity * 100);
  return {
    stressedFinancials,
    impactAnalysis: {
      capitalImpact: `${(shockFactors.capitalImpact * 100).toFixed(1)}%`,
      liquidityImpact: `${(shockFactors.liquidityImpact * 100).toFixed(1)}%`,
      depositImpact: `${(shockFactors.depositWithdrawal * 100).toFixed(1)}%`
    },
    capitalShortfall,
    liquidityGap,
    probabilityOfDefault: (probabilityOfDefault / 10).toFixed(2),
    recommendations: generateRecommendations(capitalShortfall, liquidityGap, probabilityOfDefault)
  };
}
function generateRecommendations(capitalShortfall, liquidityGap, pd) {
  const recommendations = [];
  if (capitalShortfall > 0) {
    recommendations.push("Raise additional capital to meet regulatory minimums");
    recommendations.push("Reduce risk-weighted assets through portfolio optimization");
  }
  if (liquidityGap > 0) {
    recommendations.push("Increase liquid asset holdings");
    recommendations.push("Diversify funding sources to reduce liquidity risk");
  }
  if (pd > 50) {
    recommendations.push("Implement immediate risk mitigation measures");
    recommendations.push("Consider restructuring high-risk asset portfolio");
  }
  if (recommendations.length === 0) {
    recommendations.push("Maintain current risk management practices");
    recommendations.push("Continue monitoring key risk indicators");
  }
  return recommendations;
}
function validateReturn(data) {
  const errors = [];
  let penalty = 0;
  if (!data.institutionId) errors.push("Institution ID is required");
  if (!data.returnPeriod) errors.push("Return period is required");
  if (!data.returnType) errors.push("Return type is required");
  if (!data.fileName) errors.push("File name is required");
  if (data.returnPeriod) {
    const periodEnd = new Date(data.returnPeriod);
    const dueDate = new Date(periodEnd);
    dueDate.setDate(dueDate.getDate() + 15);
    const today = /* @__PURE__ */ new Date();
    if (today > dueDate) {
      const daysLate = Math.floor((today.getTime() - dueDate.getTime()) / (1e3 * 60 * 60 * 24));
      penalty = daysLate * 1e3;
      errors.push(`Return is ${daysLate} days late. Penalty: ${penalty.toLocaleString()}`);
    }
  }
  return { valid: errors.length === 0, errors, penalty: penalty > 0 ? penalty : void 0 };
}
function calculatePremium(eligibleDeposits, riskRating) {
  let baseRate = 1e-3;
  let riskAdjustment = 0;
  if (riskRating) {
    riskAdjustment = (riskRating - 1) * 2e-4;
  }
  const premiumRate = baseRate + riskAdjustment;
  const premiumAmount = eligibleDeposits * premiumRate;
  return {
    premiumRate,
    premiumAmount,
    riskAdjustment
  };
}
export {
  calculateCAMELS,
  calculatePremium,
  runStressTest,
  validateReturn
};
