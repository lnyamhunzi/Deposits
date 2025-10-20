from sqlalchemy import Column, String, DateTime, Numeric, Enum, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
import uuid

from database import Base

class ReturnPeriodStatus(enum.Enum):
    PENDING = "PENDING"
    OPEN = "OPEN"
    CLOSED = "CLOSED"
    ARCHIVED = "ARCHIVED"

class ReturnFileType(enum.Enum):
    EXCEL = "EXCEL"
    CSV = "CSV"
    PDF = "PDF"

class UploadStatus(enum.Enum):
    UPLOADED = "UPLOADED"
    VALIDATING = "VALIDATING"
    SUBMITTED = "SUBMITTED"
    ARCHIVED = "ARCHIVED"
    REJECTED = "REJECTED"

class ValidationStatus(enum.Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    WARNING = "WARNING"
    INFO = "INFO"

class ReturnPeriod(Base):
    __tablename__ = "return_periods"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    institution_id = Column(String, nullable=False)
    period_type = Column(String, nullable=False)
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    due_date = Column(DateTime, nullable=False)
    status = Column(Enum(ReturnPeriodStatus), default=ReturnPeriodStatus.PENDING)

    uploads = relationship("ReturnUpload", back_populates="period")

class Institution(Base):
    __tablename__ = "institutions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    code = Column(String, unique=True, nullable=False)
    # Add other relevant fields as needed

class ReturnUpload(Base):
    __tablename__ = "return_uploads"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    period_id = Column(String, ForeignKey('return_periods.id'), nullable=False)
    file_name = Column(String, nullable=False)
    file_type = Column(Enum(ReturnFileType), nullable=False)
    file_size = Column(Numeric, nullable=False)
    file_hash = Column(String, nullable=False)
    uploaded_by = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    submitted_at = Column(DateTime, nullable=True)
    upload_status = Column(Enum(UploadStatus), default=UploadStatus.UPLOADED)
    archive_path = Column(String, nullable=True)
    archived_at = Column(DateTime, nullable=True)
    file_path = Column(String, nullable=False) # Local path to the uploaded file

    period = relationship("ReturnPeriod", back_populates="uploads")
    validation_results = relationship("ValidationResult", back_populates="upload")

class ValidationResult(Base):
    __tablename__ = "validation_results"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    upload_id = Column(String, ForeignKey('return_uploads.id'), nullable=False)
    test_name = Column(String, nullable=False)
    status = Column(Enum(ValidationStatus), nullable=False)
    message = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    upload = relationship("ReturnUpload", back_populates="validation_results")