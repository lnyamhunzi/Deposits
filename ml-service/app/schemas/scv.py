from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

from app.models.scv import AccountType, AccountStatus, SCVSimulationType
from app.schemas.returns import ValidationResultResponse # Import ValidationResultResponse

class CustomerAccountResponse(BaseModel):
    id: str
    scv_upload_id: str
    institution_id: str
    customer_id: str
    customer_name: str
    customer_type: str
    national_id: Optional[str]
    tax_id: Optional[str]
    account_number: str
    account_type: AccountType
    account_status: AccountStatus
    currency: str
    balance: float
    balance_date: Optional[datetime]
    joint_holders: Optional[List[Dict[str, Any]]]
    trust_beneficiaries: Optional[List[Dict[str, Any]]]
    corporate_directors: Optional[List[Dict[str, Any]]]
    account_class: str
    risk_category: Optional[str]

    class Config:
        orm_mode = True

class SimulationResponse(BaseModel):
    id: str
    simulation_type: SCVSimulationType
    total_payout_amount: float
    affected_customers: int
    affected_accounts: int
    payout_breakdown: Dict[str, Any]
    created_at: datetime

    class Config:
        orm_mode = True

# Alias ValidationResultResponse as ValidationResult for SCV context
ValidationResult = ValidationResultResponse
