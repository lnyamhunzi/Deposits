from sqlalchemy import Column, String, DateTime, Numeric, Enum, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
import uuid

from database import Base
from app.models.returns import ReturnPeriod # Import ReturnPeriod

class SCVUploadStatus(enum.Enum):
    UPLOADED = "UPLOADED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class AccountType(enum.Enum):
    SAVINGS = "SAVINGS"
    CHECKING = "CHECKING"
    FIXED_DEPOSIT = "FIXED_DEPOSIT"
    CURRENT = "CURRENT"
    CORPORATE = "CORPORATE"
    JOINT = "JOINT"
    TRUST = "TRUST"
    MINOR = "MINOR"

class AccountStatus(enum.Enum):
    ACTIVE = "ACTIVE"
    DORMANT = "DORMANT"
    CLOSED = "CLOSED"
    BLOCKED = "BLOCKED"

class SCVSimulationType(enum.Enum):
    PAYOUT = "PAYOUT"
    DAILY_SNAPSHOT = "DAILY_SNAPSHOT"

class SCVUpload(Base):
    __tablename__ = "scv_uploads"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    institution_id = Column(String, nullable=False)
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    status = Column(Enum(SCVUploadStatus), default=SCVUploadStatus.UPLOADED)
    total_records = Column(Numeric, nullable=True)
    processed_records = Column(Numeric, nullable=True)
    processed_at = Column(DateTime, nullable=True)
    validation_errors = Column(JSON, nullable=True) # Added for SCVValidationService
    period_id = Column(String, nullable=False) # Added for relationship to ReturnPeriod

    period = relationship("ReturnPeriod", primaryjoin="SCVUpload.period_id == ReturnPeriod.id", foreign_keys=[period_id], viewonly=True)

class CustomerAccount(Base):
    __tablename__ = "customer_accounts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    scv_upload_id = Column(String, nullable=False)
    institution_id = Column(String, nullable=False)
    customer_id = Column(String, nullable=False)
    customer_name = Column(String, nullable=False)
    customer_type = Column(String, nullable=False) # INDIVIDUAL, CORPORATE, JOINT, TRUST
    national_id = Column(String, nullable=True)
    tax_id = Column(String, nullable=True)
    account_number = Column(String, nullable=False)
    account_type = Column(Enum(AccountType), nullable=False)
    account_status = Column(Enum(AccountStatus), nullable=False)
    currency = Column(String, nullable=False)
    balance = Column(Numeric, nullable=False)
    balance_date = Column(DateTime, nullable=True)
    joint_holders = Column(JSON, nullable=True) # List of dicts
    trust_beneficiaries = Column(JSON, nullable=True) # List of dicts
    corporate_directors = Column(JSON, nullable=True) # List of dicts
    account_class = Column(String, nullable=False) # RETAIL, PREMIUM_RETAIL, CORPORATE, INSTITUTIONAL
    risk_category = Column(String, nullable=True) # LOW_RISK, STANDARD, HIGH_VALUE, BUSINESS

class CustomerExposure(Base):
    __tablename__ = "customer_exposures"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    institution_id = Column(String, nullable=False)
    period_id = Column(String, nullable=False)
    customer_id = Column(String, nullable=False)
    total_balance = Column(Numeric, nullable=False)
    insured_amount = Column(Numeric, nullable=False)
    uninsured_amount = Column(Numeric, nullable=False)
    calculated_at = Column(DateTime, default=datetime.utcnow)

    customer_account = relationship("CustomerAccount", primaryjoin="CustomerExposure.customer_id == CustomerAccount.customer_id", foreign_keys=[customer_id], viewonly=True)

class SCVSimulation(Base):
    __tablename__ = "scv_simulations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    institution_id = Column(String, nullable=False)
    simulation_date = Column(DateTime, default=datetime.utcnow)
    simulation_type = Column(Enum(SCVSimulationType), nullable=False)
    cover_level = Column(Numeric, nullable=False)
    parameters = Column(JSON, nullable=True)
    total_payout_amount = Column(Numeric, nullable=False)
    affected_customers = Column(Numeric, nullable=False)
    affected_accounts = Column(Numeric, nullable=False)
    payout_breakdown = Column(JSON, nullable=True)
    customer_payouts = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
