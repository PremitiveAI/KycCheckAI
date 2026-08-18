# from pydantic import BaseModel
from pydantic import BaseModel, Field
from typing import Optional

class PasswordUpdate(BaseModel):
    mobile_number: Optional[str] = None
    new_password: Optional[str] = None
    confirm_password: Optional[str] = None 
    