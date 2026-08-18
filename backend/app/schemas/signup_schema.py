# app/schemas/signup_schema.py
from pydantic import BaseModel
from typing import Optional

class SignupRequest(BaseModel):    
    username: Optional[str] = None
    mobile: Optional[str] = None
    password: Optional[str] = None
    email: Optional[str] = None
