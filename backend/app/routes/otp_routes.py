from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.schemas.otp_schema import OTPGenerateRequest, OTPValidateRequest
from app.models.users_model import Users 
from app.repositories.otp_repository import OTPRepository

router = APIRouter()

@router.post("/generate-otp")
def generate_otp(request: OTPGenerateRequest, db: Session = Depends(get_db)):

    # Find user by username OR email OR mobile
    user = (
        db.query(Users)
        .filter(
            (Users.username == request.number_email) |
            (Users.email == request.number_email) |
            (Users.mobilenumber == request.number_email)
        )
        .first()
    )

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Generate OTP (4–6 digits)
    otp = OTPRepository.generate_otp(length=request.length)

    # Save OTP
    OTPRepository.save_otp(db, user.id, otp)

    return {"message": "OTP generated successfully"}


@router.post("/validate-otp")
def validate_otp(request: OTPValidateRequest, db: Session = Depends(get_db)):
    
    # Find user
    user = (
        db.query(Users)
        .filter(
            (Users.username == request.number_email) |
            (Users.email == request.number_email) |
            (Users.mobilenumber == request.number_email)
        )
        .first()
    )

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Validate OTP
    status = OTPRepository.validate_otp(db, user.id, request.otp)

    if status == "INVALID":
        raise HTTPException(status_code=400, detail="Invalid OTP")

    if status == "EXPIRED":
        raise HTTPException(status_code=400, detail="OTP expired")

    return {"message": "OTP verified successfully"}
