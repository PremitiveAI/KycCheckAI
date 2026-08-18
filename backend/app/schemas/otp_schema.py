from pydantic import BaseModel
from typing import Optional

class OTPGenerateRequest(BaseModel):
    mobile: Optional[str] = None
    # email: Optional[str] = None

class OTPValidateRequest(BaseModel):
    mobile: Optional[str] = None
    # email: Optional[str] = None
    otp: int
