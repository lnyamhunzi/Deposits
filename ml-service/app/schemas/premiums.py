from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal

from app.models.premiums import CalculationMethod, PremiumStatus, PaymentStatus

class PremiumCalculationRequest(BaseModel):
    institution_id: str
    period_id: str
    calculation_method: CalculationMethod
    base_premium_rate: float

class PremiumCalculationResponse(BaseModel):
    id: str
    institution_id: str
    period_id: str
    calculation_method: CalculationMethod
    total_eligible_deposits: float
    average_eligible_deposits: float
    base_premium_rate: float
    risk_adjustment_factor: float
    risk_premium_rate: float
    calculated_premium: float
    final_premium: float
    status: PremiumStatus
    calculated_at: datetime

    class Config:
        orm_mode = True

class ReconciliationResponse(BaseModel):
    institution_id: str
    reconciliation_period: Dict[str, str]
    summary: Dict[str, Any]
    detailed_reconciliation: List[Dict[str, Any]]
    reconciliation_status: str
    total_discrepancies: int
    reconciled_at: str

    class Config:
        orm_mode = True