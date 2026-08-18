import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.otp_model import OTPTable

class OTPRepository:

    @staticmethod
    def generate_otp(length=6):
        return "".join([str(random.randint(0, 9)) for _ in range(6)])

    @staticmethod
    def save_otp(db, user_id, otp,mobilenumber):
        expires = datetime.now() + timedelta(minutes=10)
        record = OTPTable(user_id=user_id, otp=otp, expires_at=expires,mobilenumber=mobilenumber)
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def validate_otp(db, userId, otp):
        record = (
            db.query(OTPTable)
            .filter(OTPTable.userId == userId, OTPTable.otp == otp)
            .order_by(OTPTable.id.desc())
            .first()
        )

        if not record:
            return "INVALID"

        if record.expires_at < datetime.now():
            return "EXPIRED"

        return "VALID"
