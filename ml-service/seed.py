from sqlalchemy.orm import Session
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

from database import SessionLocal, engine, Base
from app.models.returns import Institution, ReturnPeriod, ReturnPeriodStatus
from app.models.premiums import *
from app.models.scv import *
from datetime import datetime, timedelta
import uuid

def seed_institutions(db: Session):
    if db.query(Institution).count() == 0:
        print("Seeding institutions...")
        institutions_data = [
            {"id": str(uuid.uuid4()), "name": "CBZ Bank", "code": "CBZ"},
            {"id": str(uuid.uuid4()), "name": "FBC Bank", "code": "FBC"},
            {"id": str(uuid.uuid4()), "name": "Stanbic Bank", "code": "STAN"},
        ]
        for data in institutions_data:
            db.add(Institution(**data))
        db.commit()
        print("Institutions seeded.")

def seed_return_periods(db: Session):
    if db.query(ReturnPeriod).count() == 0:
        print("Seeding return periods...")
        institutions = db.query(Institution).all()
        if not institutions:
            print("No institutions found to create return periods for.")
            return

        for institution in institutions:
            # Monthly periods for the last 3 months
            for i in range(3):
                end_date = datetime.utcnow().replace(day=28) - timedelta(days=30 * i)
                start_date = (end_date - timedelta(days=30)).replace(day=1)
                period = ReturnPeriod(
                    id=str(uuid.uuid4()),
                    institution_id=institution.id,
                    period_type="MONTHLY",
                    period_start=start_date,
                    period_end=end_date,
                    due_date=end_date + timedelta(days=15),
                    status=ReturnPeriodStatus.OPEN
                )
                db.add(period)
            
            # Quarterly period for last quarter
            end_date_q = datetime.utcnow().replace(day=28)
            start_date_q = (end_date_q - timedelta(days=90)).replace(day=1)
            period_q = ReturnPeriod(
                id=str(uuid.uuid4()),
                institution_id=institution.id,
                period_type="QUARTERLY",
                period_start=start_date_q,
                period_end=end_date_q,
                due_date=end_date_q + timedelta(days=30),
                status=ReturnPeriodStatus.OPEN
            )
            db.add(period_q)
        db.commit()
        print("Return periods seeded.")

def seed_all(db: Session):
    seed_institutions(db)
    seed_return_periods(db)

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_all(db)
    db.close()
