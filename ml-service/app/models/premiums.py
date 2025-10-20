from sqlalchemy import Column, String, Numeric, DateTime, Enum, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
import uuid

from database import Base

class PremiumStatus(enum.Enum):
    CALCULATED = "CALCULATED"
    INVOICED = "INVOICED"
    PAID = "PAID"
    CANCELLED = "CANCELLED"

class CalculationMethod(enum.Enum):
    FLAT_RATE = "FLAT_RATE"
    RISK_BASED = "RISK_BASED"

class PaymentStatus(enum.Enum):
    PENDING = "PENDING"
    RECEIVED = "RECEIVED"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"

class PremiumCalculation(Base):
    __tablename__ = "premium_calculations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    institution_id = Column(String, nullable=False)
    period_id = Column(String, nullable=False)
    calculation_method = Column(Enum(CalculationMethod), nullable=False)
    total_eligible_deposits = Column(Numeric, nullable=False)
    average_eligible_deposits = Column(Numeric, nullable=False)
    base_premium_rate = Column(Numeric, nullable=False)
    risk_adjustment_factor = Column(Numeric, nullable=False)
    risk_premium_rate = Column(Numeric, nullable=False)
    calculated_premium = Column(Numeric, nullable=False)
    final_premium = Column(Numeric, nullable=False)
    status = Column(Enum(PremiumStatus), default=PremiumStatus.CALCULATED)
    calculated_by = Column(String, nullable=False)
    calculated_at = Column(DateTime, default=datetime.utcnow)

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    institution_id = Column(String, nullable=False)
    invoice_number = Column(String, unique=True, nullable=False)
    invoice_date = Column(DateTime, default=datetime.utcnow)
    due_date = Column(DateTime, nullable=False)
    total_amount = Column(Numeric, nullable=False)
    status = Column(Enum(PremiumStatus), default=PremiumStatus.INVOICED) # Using PremiumStatus for invoice status as well
    # Add other relevant fields as needed

class Payment(Base):
    __tablename__ = "payments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    invoice_id = Column(String, nullable=False)
    amount = Column(Numeric, nullable=False)
    payment_date = Column(DateTime, default=datetime.utcnow)
    payment_reference = Column(String, nullable=False)
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    proof_verified = Column(Boolean, default=False)
    # Add other relevant fields as needed

class PremiumPenalty(Base):
    __tablename__ = "premium_penalties"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    invoice_id = Column(String, nullable=False)
    penalty_amount = Column(Numeric, nullable=False)
    reason = Column(String, nullable=True)
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING) # Using PaymentStatus for penalty status as well
    created_at = Column(DateTime, default=datetime.utcnow)
    # Add other relevant fields as needed