# app/schemas/login_schema.py
from pydantic import BaseModel
from typing import Optional

class LoginRequest(BaseModel):
    mobile: Optional[str] = None
    password: Optional[str] = None
