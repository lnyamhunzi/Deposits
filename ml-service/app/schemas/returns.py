from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.models.returns import ReturnFileType, UploadStatus, ValidationStatus

class ReturnUploadResponse(BaseModel):
    id: str
    file_name: str
    file_type: ReturnFileType
    uploaded_at: datetime
    submitted_at: Optional[datetime]
    upload_status: UploadStatus
    file_size: float
    validation_status: str # This is a derived field, so keeping it as str

    class Config:
        orm_mode = True

class ValidationResultResponse(BaseModel):
    test_name: str
    status: ValidationStatus
    message: Optional[str]
    created_at: datetime

    class Config:
        orm_mode = True
