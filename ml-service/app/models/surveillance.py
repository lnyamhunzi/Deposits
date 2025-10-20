from sqlalchemy import Column, String, Numeric, Enum
from sqlalchemy.ext.declarative import declarative_base
import enum

Base = declarative_base()

class DepositType(enum.Enum):
    INDIVIDUAL = "INDIVIDUAL"
    CORPORATE = "CORPORATE"
    JOINT = "JOINT"
    TRUST = "TRUST"
    GOVERNMENT = "GOVERNMENT"
    OTHER = "OTHER"

class DepositAnalysis(Base):
    __tablename__ = "deposit_analyses"

    id = Column(String, primary_key=True)
    institution_id = Column(String, nullable=False)
    period_id = Column(String, nullable=False)
    deposit_type = Column(Enum(DepositType), nullable=False)
    total_deposits = Column(Numeric, nullable=False)
    # Add other relevant fields as needed
