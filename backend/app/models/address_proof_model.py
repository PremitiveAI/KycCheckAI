from sqlalchemy import Column, Integer, String, Date, DateTime
from datetime import datetime
from app.database.connection import Base

class AddressProof(Base):
    __tablename__ = "tbl_address_proof"

    id = Column(Integer, primary_key=True, index=True)

    emp_id = Column(String(225), nullable=False, index=True)
    # document_id = Column(String(50), nullable=False, index=True)


    full_name = Column(String(255), nullable=False)
    address = Column(String(225), nullable=False)
    document_name = Column(String(255), nullable=True)
    issue_date = Column(Date, nullable=True)

    file_path = Column(String(1024), nullable=True)     # local path on disk
    status = Column(Integer, default=1)  # 1=active, -1=deleted

    createdBy = Column(Integer, nullable=True, default=0)
    createdAt = Column(DateTime, default=datetime.utcnow)

    updatedBy = Column(Integer, nullable=True, default=0)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    deletedBy = Column(Integer, nullable=True, default=0)
    deletedAt = Column(DateTime, nullable=True)

