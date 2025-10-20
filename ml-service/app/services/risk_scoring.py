from typing import Dict, Any
from sqlalchemy.orm import Session
from risk_analysis_engine import RiskAnalysisEngine

class RiskScoringModel:
    def __init__(self, db: Session):
        self.db = db
        self.risk_engine = RiskAnalysisEngine() # Initialize the risk analysis engine

    def calculate_comprehensive_risk_score(self, institution_id: str, period_id: str) -> Dict[str, Any]:
    
        # For now, let's use dummy data to make the premium calculation service runnable.
        financial_data = {
            'capital_adequacy_ratio': 15.0,
            'npl_ratio': 3.0,
            'roa': 1.2,
            'roe': 15.0,
            'liquidity_ratio': 25.0,
            'loan_to_deposit_ratio': 70.0,
            'cost_to_income': 50.0,
            'deposit_growth': 5.0,
            'loan_growth': 7.0,
            'equity_to_assets': 10.0,
            'interest_rate_risk': 8.0,
            'fx_risk': 3.0,
            'fraud_incidents': 0,
            'management_score': 2.0, # CAMELS component
            'recovery_rate': 0.45,
            'collateral_quality_score': 0.7,
            'total_assets': 1000000000,
            'total_deposits': 800000000,
            'net_interest_margin': 3.0,
            'net_income': 12000000,
            'total_equity': 100000000
        }
        camels_data = {
            'capital_adequacy': 2,
            'asset_quality': 2,
            'management_quality': 2,
            'earnings': 2,
            'liquidity': 2,
            'sensitivity': 2,
            'management_score': 2.0 # Example CAMELS management score
        }
        
        # Calculate individual risk scores
        risk_scores = self.risk_engine.calculate_risk_scores(financial_data, camels_data)
        
        # Calculate PD, LGD, EAD
        pd_lgd_ead = self.risk_engine.calculate_pd_lgd_ead(financial_data, camels_data['management_quality'])
        
        # Predict bank failure
        failure_prediction = self.risk_engine.predict_bank_failure(financial_data)
        
        # Detect anomalies
        anomaly_detection = self.risk_engine.detect_anomalies(financial_data)

        # Determine overall risk category and alert level
        overall_risk_score = risk_scores['overall_risk_score']
        risk_category = self.risk_engine.determine_risk_category(overall_risk_score)
        alert_level = self.risk_engine.determine_alert_level(
            risk_category, 
            failure_prediction['ml_failure_probability'], 
            anomaly_detection['is_anomaly']
        )

        return {
            "risk_metrics": {
                "composite_risk_score": overall_risk_score, # This will be used by premium calculation
                "credit_risk_score": risk_scores['credit_risk_score'],
                "market_risk_score": risk_scores['market_risk_score'],
                "operational_risk_score": risk_scores['operational_risk_score'],
                "liquidity_risk_score": risk_scores['liquidity_risk_score'],
                "probability_of_default": pd_lgd_ead['probability_of_default'],
                "loss_given_default": pd_lgd_ead['loss_given_default'],
                "exposure_at_default": pd_lgd_ead['exposure_at_default'],
                "expected_loss": pd_lgd_ead['expected_loss'],
                "ml_failure_probability": failure_prediction['ml_failure_probability'],
                "anomaly_detected": anomaly_detection['is_anomaly'],
            },
            "risk_category": risk_category,
            "alert_level": alert_level,
            "details": {
                "financial_data_used": financial_data,
                "camels_data_used": camels_data,
                "failure_prediction_details": failure_prediction,
                "anomaly_detection_details": anomaly_detection
            }
        }
