from pydantic import BaseModel
from typing import Optional

class EmployeeListRequest(BaseModel):
    search: Optional[str] = ""
    filter: str | None = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    sort: Optional[str] = "createdAt"
    order: Optional[str] = "DESC"
    limit: Optional[int] = 10
    offset: Optional[int] = 0
