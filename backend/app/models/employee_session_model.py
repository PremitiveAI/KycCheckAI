from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.database.connection import Base

class EmployeeSession(Base):
    __tablename__ = "tbl_emp_session"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String(50), index=True)
    session_token = Column(String(255), unique=True, index=True,nullable=False)
    status = Column(Integer, default=1)  # 1=active, -1=logout

    createdAt = Column(DateTime, default=datetime.utcnow)
