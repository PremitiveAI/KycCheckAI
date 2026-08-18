from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.database.connection import Base
import uuid

class Employee(Base):
    __tablename__ = "tbl_employees"
    id = Column(Integer, primary_key=True, index=True)
    emp_id = Column(String(225), unique=True, index=True)

    emp_name = Column(String(255), nullable=False)
    
    # emp_role = Column(String(255), nullable=False)
    # document_status = Column(String(10), default="RED")  # RED / GREEN
    # document_type = Column(String(100), nullable=True)


    status = Column(Integer, default=1)  # 1=active, -1=deleted

    createdBy = Column(Integer, nullable=True, default=0)
    createdAt = Column(DateTime, default=datetime.utcnow)
    
    updatedBy = Column(Integer, nullable=True, default=0)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    deletedBy = Column(Integer, nullable=False, default=0)
    deletedAt = Column(DateTime, nullable=True)

    
    @staticmethod
    def generate_emp_id():
        return f"E-{uuid.uuid4().hex[:12].upper()}"
