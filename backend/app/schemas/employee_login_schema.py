from pydantic import BaseModel

class EmployeeLoginRequest(BaseModel):
    employee_id: str
