from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime
from decimal import Decimal
import os
import shutil

from .database import SessionLocal, engine, Base, get_db

# Import models for table creation
from .app.models.premiums import *
from .app.models.returns import *
from .app.models.scv import *

# Import services
from .app.services.premium_calculation_service import PremiumCalculationService
from .app.services.reconciliation_service import ReconciliationService
from .app.services.returns_storage_service import ReturnsStorageService
from .app.services.returns_upload_service import ReturnsUploadService
from .app.services.scv_consolidation_service import SCVConsolidationService
from .app.services.scv_simulation_service import SCVSimulationService
from .app.services.scv_validation_service import SCVValidationService

# Import schemas
from .app.schemas.premiums import PremiumCalculationRequest, PremiumCalculationResponse, ReconciliationResponse
from .app.schemas.returns import ReturnUploadResponse, ValidationResultResponse
from .app.schemas.scv import CustomerAccountResponse, SimulationResponse, SCVUploadResponse

app = FastAPI()

# Create database tables
@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)

@app.get("/")
async def read_root():
    return {"message": "ML Service is running"}

# --- SCV Upload Endpoint ---
@app.post("/scv/upload", response_model=SCVUploadResponse)
async def upload_scv_file_endpoint(
    institution_id: str,
    period_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    service = ReturnsUploadService(db) # Reusing ReturnsUploadService for file handling
    
    file_extension = file.filename.split(".").pop()
    file_type = file_extension.upper() if file_extension else "UNKNOWN"

    uploaded_by = "system_scv_upload" # Or get from authenticated user

    # Create a dummy ReturnUpload object to pass to the SCVValidationService
    # This is a temporary workaround as ReturnsUploadService is not designed for SCVUploads directly.
    # Ideally, a dedicated SCVUploadService would handle this.
    scv_upload_record = SCVUpload(
        id=str(uuid.uuid4()),
        institution_id=institution_id,
        period_id=period_id,
        file_name=file.filename,
        file_path="temp_path", # This will be updated by the service
        file_type=file_type, # Assuming file_type is compatible
        file_size=0, # This will be updated by the service
        file_hash="", # This will be updated by the service
        uploaded_at=datetime.utcnow(),
        status="UPLOADED",
        total_records=0,
        processed_records=0
    )
    db.add(scv_upload_record)
    db.commit()
    db.refresh(scv_upload_record)

    # Now use the ReturnsUploadService to save the file and get file details
    # This is a bit of a hack, ideally SCVUploadService would handle file storage
    # and then call SCVValidationService and SCVConsolidationService
    file_location = os.path.join(service.upload_base_dir, file.filename)
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    scv_upload_record.file_path = file_location
    scv_upload_record.file_size = os.path.getsize(file_location)
    scv_upload_record.file_hash = service._calculate_file_hash(file_location)
    db.commit()
    db.refresh(scv_upload_record)

    # Validate the SCV file
    scv_validation_service = SCVValidationService(db)
    validation_results = await scv_validation_service.validate_scv_file(scv_upload_record)

    # Process and consolidate SCV data
    scv_consolidation_service = SCVConsolidationService(db)
    await scv_consolidation_service.process_scv_upload(scv_upload_record.id)

    return SCVUploadResponse(
        id=scv_upload_record.id,
        institution_id=scv_upload_record.institution_id,
        file_name=scv_upload_record.file_name,
        file_path=scv_upload_record.file_path,
        uploaded_at=scv_upload_record.uploaded_at,
        status=scv_upload_record.status,
        total_records=scv_upload_record.total_records,
        processed_records=scv_upload_record.processed_records,
        processed_at=scv_upload_record.processed_at
    )

# --- Institutions Endpoints ---
@app.get("/institutions", response_model=List[Dict[str, Any]])
async def get_all_institutions_endpoint(
    db: Session = Depends(get_db)
):
    institutions = db.query(Institution).all()
    return [{"id": inst.id, "name": inst.name, "code": inst.code} for inst in institutions]

# --- Premium Calculation Service Endpoints ---
@app.post("/premiums/calculate", response_model=Dict[str, Any])
async def calculate_premium_endpoint(
    request: PremiumCalculationRequest,
    db: Session = Depends(get_db)
):
    service = PremiumCalculationService(db)
    return await service.calculate_premium(request)

@app.post("/premiums/{calculation_id}/recalculate", response_model=Dict[str, Any])
async def recalculate_premium_endpoint(
    calculation_id: str,
    new_rate: Optional[float] = None,
    db: Session = Depends(get_db)
):
    service = PremiumCalculationService(db)
    return await service.recalculate_premium(calculation_id, new_rate)

@app.get("/premiums/calculations", response_model=List[PremiumCalculationResponse])
async def get_all_premium_calculations_endpoint(
    db: Session = Depends(get_db)
):
    calculations = db.query(PremiumCalculation).all()
    return [
        PremiumCalculationResponse(
            id=calc.id,
            institution_id=calc.institution_id,
            period_id=calc.period_id,
            calculation_method=calc.calculation_method,
            total_eligible_deposits=float(calc.total_eligible_deposits),
            average_eligible_deposits=float(calc.average_eligible_deposits),
            base_premium_rate=float(calc.base_premium_rate),
            risk_adjustment_factor=float(calc.risk_adjustment_factor),
            risk_premium_rate=float(calc.risk_premium_rate),
            calculated_premium=float(calc.calculated_premium),
            final_premium=float(calc.final_premium),
            status=calc.status,
            calculated_at=calc.calculated_at
        )
        for calc in calculations
    ]

@app.get("/premiums/payments", response_model=List[Payment])
async def get_all_payments_endpoint(
    db: Session = Depends(get_db)
):
    payments = db.query(Payment).all()
    return [
        Payment(
            id=pay.id,
            invoice_id=pay.invoice_id,
            amount=float(pay.amount),
            payment_date=pay.payment_date,
            payment_reference=pay.payment_reference,
            status=pay.status,
            proof_verified=pay.proof_verified
        )
        for pay in payments
    ]

# --- Reconciliation Service Endpoints ---
@app.get("/reconciliation/{institution_id}", response_model=Dict[str, Any])
async def reconcile_premiums_endpoint(
    institution_id: str,
    start_date: datetime,
    end_date: datetime,
    db: Session = Depends(get_db)
):
    service = ReconciliationService(db)
    return await service.reconcile_premiums(institution_id, start_date, end_date)

@app.get("/reconciliation/{institution_id}/report", response_model=Dict[str, Any])
async def generate_reconciliation_report_endpoint(
    institution_id: str,
    start_date: datetime,
    end_date: datetime,
    db: Session = Depends(get_db)
):
    service = ReconciliationService(db)
    return await service.generate_reconciliation_report(institution_id, start_date, end_date)

# --- Returns Storage Service Endpoints ---
@app.post("/returns/archive/{upload_id}", response_model=Dict[str, Any])
async def archive_submitted_returns_endpoint(
    upload_id: str,
    db: Session = Depends(get_db)
):
    service = ReturnsStorageService(db)
    return await service.archive_submitted_returns(upload_id)

@app.get("/returns/historical/{institution_id}/{period_id}/{file_type}", response_model=Dict[str, Any])
async def retrieve_historical_return_endpoint(
    institution_id: str,
    period_id: str,
    file_type: str,
    db: Session = Depends(get_db)
):
    service = ReturnsStorageService(db)
    return await service.retrieve_historical_return(institution_id, period_id, file_type)

@app.get("/returns/repository/{institution_id}", response_model=Dict[str, Any])
async def get_returns_repository_endpoint(
    institution_id: str,
    start_date: datetime,
    end_date: datetime,
    db: Session = Depends(get_db)
):
    service = ReturnsStorageService(db)
    return await service.get_returns_repository(institution_id, start_date, end_date)

@app.get("/returns/export/{institution_id}", response_model=Dict[str, Any])
async def export_returns_for_analysis_endpoint(
    institution_id: str,
    start_date: datetime,
    end_date: datetime,
    export_format: str = "ZIP",
    db: Session = Depends(get_db)
):
    service = ReturnsStorageService(db)
    return await service.export_returns_for_analysis(institution_id, start_date, end_date, export_format)

# --- Returns Upload Service Endpoints ---
@app.post("/returns/upload", response_model=ReturnUploadResponse)
async def upload_return_file_endpoint(
    period_id: str,
    file_type: str,
    uploaded_by: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    service = ReturnsUploadService(db)
    return await service.upload_return_file(period_id, file_type, file, uploaded_by)

@app.get("/returns/uploads", response_model=List[ReturnUploadResponse])
async def get_all_return_uploads_endpoint(
    db: Session = Depends(get_db)
):
    uploads = db.query(ReturnUpload).all()
    return [
        ReturnUploadResponse(
            id=upload.id,
            file_name=upload.file_name,
            file_type=upload.file_type,
            uploaded_at=upload.uploaded_at,
            submitted_at=upload.submitted_at,
            upload_status=upload.upload_status,
            file_size=float(upload.file_size),
            validation_status="NOT_VALIDATED" # Placeholder, will be calculated by service
        )
        for upload in uploads
    ]

@app.get("/returns/upload/{upload_id}", response_model=Optional[ReturnUploadResponse])
async def get_upload_details_endpoint(
    upload_id: str,
    db: Session = Depends(get_db)
):
    service = ReturnsUploadService(db)
    return service.get_upload_details(upload_id)

@app.post("/returns/submit/{upload_id}", response_model=ReturnUploadResponse)
async def submit_validated_return_endpoint(
    upload_id: str,
    force_submit: bool = False,
    db: Session = Depends(get_db)
):
    service = ReturnsUploadService(db)
    return service.submit_validated_return(upload_id, force_submit)

@app.get("/returns/periods/{institution_id}", response_model=List[Dict[str, Any]])
async def get_all_return_periods_endpoint(
    institution_id: str,
    db: Session = Depends(get_db)
):
    periods = db.query(ReturnPeriod).filter(ReturnPeriod.institution_id == institution_id).all()
    return [
        {
            "id": period.id,
            "period_type": period.period_type.value,
            "period_start": period.period_start.isoformat(),
            "period_end": period.period_end.isoformat(),
            "due_date": period.due_date.isoformat(),
            "status": period.status.value
        }
        for period in periods
    ]

@app.get("/returns/period/{period_id}", response_model=Optional[ReturnPeriod])
async def get_return_period_by_id_endpoint(
    period_id: str,
    db: Session = Depends(get_db)
):
    service = ReturnsUploadService(db)
    return service.get_return_period_by_id(period_id)

@app.post("/returns/period", response_model=ReturnPeriod)
async def create_return_period_endpoint(
    institution_id: str,
    period_type: str,
    period_start: datetime,
    period_end: datetime,
    due_date: datetime,
    db: Session = Depends(get_db)
):
    service = ReturnsUploadService(db)
    return service.create_return_period(institution_id, period_type, period_start, period_end, due_date)

@app.put("/returns/period/{period_id}/status", response_model=ReturnPeriod)
async def update_return_period_status_endpoint(
    period_id: str,
    new_status: str,
    db: Session = Depends(get_db)
):
    service = ReturnsUploadService(db)
    return service.update_return_period_status(period_id, new_status)

@app.get("/returns/period/{period_id}/uploads", response_model=List[ReturnUpload])
async def get_all_uploads_for_period_endpoint(
    period_id: str,
    db: Session = Depends(get_db)
):
    service = ReturnsUploadService(db)
    return service.get_all_uploads_for_period(period_id)

@app.get("/returns/institution/{institution_id}/uploads", response_model=List[ReturnUpload])
async def get_all_uploads_for_institution_endpoint(
    institution_id: str,
    db: Session = Depends(get_db)
):
    service = ReturnsUploadService(db)
    return service.get_all_uploads_for_institution(institution_id)

@app.get("/returns/upload/{upload_id}/validation_results", response_model=List[ValidationResultResponse])
async def get_validation_results_for_upload_endpoint(
    upload_id: str,
    db: Session = Depends(get_db)
):
    service = ReturnsUploadService(db)
    return service.get_validation_results_for_upload(upload_id)

# --- Returns Validation Service Endpoints ---
@app.post("/returns/validate/{upload_id}", response_model=Dict[str, Any])
async def validate_before_submission_endpoint(
    upload_id: str,
    db: Session = Depends(get_db)
):
    service = SCVValidationService(db)
    return await service.validate_before_submission(upload_id)

@app.get("/returns/validate/{upload_id}/report", response_model=Dict[str, Any])
async def get_validation_report_endpoint(
    upload_id: str,
    db: Session = Depends(get_db)
):
    service = SCVValidationService(db)
    return await service.get_validation_report(upload_id)

# --- SCV Consolidation Service Endpoints ---
@app.post("/scv/process/{upload_id}", response_model=Dict[str, Any])
async def process_scv_upload_endpoint(
    upload_id: str,
    db: Session = Depends(get_db)
):
    service = SCVConsolidationService(db)
    return await service.process_scv_upload(upload_id)

@app.get("/scv/customers/{institution_id}/{period_id}", response_model=Dict[str, Any])
async def identify_unique_customers_endpoint(
    institution_id: str,
    period_id: str,
    db: Session = Depends(get_db)
):
    service = SCVConsolidationService(db)
    return await service.identify_unique_customers(institution_id, period_id)

@app.get("/scv/customers/latest/{institution_id}", response_model=Dict[str, Any])
async def get_latest_unique_customers_endpoint(
    institution_id: str,
    db: Session = Depends(get_db)
):
    # Find the latest period with SCV data for the institution
    latest_upload = db.query(SCVUpload).filter(
        SCVUpload.institution_id == institution_id
    ).order_by(SCVUpload.uploaded_at.desc()).first()

    if not latest_upload:
        return {"error": "No SCV data found for this institution"}

    service = SCVConsolidationService(db)
    return await service.identify_unique_customers(institution_id, latest_upload.period_id)

# --- SCV Simulation Service Endpoints ---
@app.post("/scv/simulate/payout/{institution_id}", response_model=Dict[str, Any])
async def run_payout_simulation_endpoint(
    institution_id: str,
    cover_level: Decimal,
    parameters: Optional[Dict[str, Any]] = None,
    db: Session = Depends(get_db)
):
    service = SCVSimulationService(db)
    return await service.run_payout_simulation(institution_id, cover_level, parameters)

@app.post("/scv/simulate/snapshot/{institution_id}", response_model=Dict[str, Any])
async def run_daily_snapshot_simulation_endpoint(
    institution_id: str,
    db: Session = Depends(get_db)
):
    service = SCVSimulationService(db)
    return await service.run_daily_snapshot_simulation(institution_id)

# --- SCV Validation Service Endpoints ---
@app.post("/scv/validate/{upload_id}", response_model=List[ValidationResultResponse])
async def validate_scv_file_endpoint(
    upload_id: str,
    db: Session = Depends(get_db)
):
    service = SCVValidationService(db)
    upload = db.query(SCVUpload).filter(SCVUpload.id == upload_id).first()
    if not upload:
        raise HTTPException(status_code=404, detail="SCV Upload not found")
    return await service.validate_scv_file(upload)