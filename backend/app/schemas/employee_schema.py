from pydantic import BaseModel
from typing import Optional

class EmployeeCreate(BaseModel):
    id: Optional[str] = None   # ✅ ADD THIS
    emp_name: str
    emp_id: Optional[str] = None
