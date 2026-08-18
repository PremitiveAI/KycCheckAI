# app/models/documents_model.py
from sqlalchemy import Column, Integer, String, ForeignKey, Text, Date, DateTime, func
from sqlalchemy.orm import relationship
from app.database.connection import Base

from datetime import datetime, date
from zoneinfo import ZoneInfo
IST = ZoneInfo("Asia/Kolkata")

class Documents(Base):
    __tablename__ = "tbl_documents"

    id = Column(Integer, primary_key=True, index=True)
    userId = Column(String(255), ForeignKey("tbl_users.userId"), nullable=True)
    document_type = Column(String(64), nullable=True)    # classification result
    filename = Column(String(512), nullable=False)       # original filename
    file_path = Column(String(1024), nullable=False)     # local path on disk

    extracted_name = Column(String(255), nullable=True)
    doc_number = Column(String(255), nullable=True) #aadhaar_number,pan_number
    
    dob = Column(Date, nullable=True)
    gender = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    extra_json = Column(Text, nullable=True)
    meta_json = Column(Text, nullable=True)

    # AUDIT FIELDS
    createdBy = Column(Integer, nullable=True, default=0)
    createdAt = Column(DateTime, server_default=func.now()) # Auto insert // "createdAt": obj.createdAt.astimezone(IST).strftime("%d-%b-%Y %H:%M:%S") if obj.createdAt else None,

    updatedBy = Column(Integer, nullable=True, default=0)
    updatedAt = Column(DateTime, server_default=func.now(), onupdate=func.now()) # Auto update

    deletedBy = Column(Integer, nullable=False, default=0)
    deletedAt = Column(DateTime, nullable=True) # NULL until deleted

    user = relationship("Users", back_populates="documents")    
    document_vectors = relationship("DocumentVectors", back_populates="documents", cascade="all, delete-orphan")


    
    # ✅ FORMATTED PROPERTIES (READ-ONLY)
    @property
    def createdAtFormatted(self):
        return (
            self.createdAt.astimezone(IST).strftime("%d-%b-%Y %H:%M:%S")
            if self.createdAt else None
        )

    @property
    def updatedAtFormatted(self):
        return (
            self.updatedAt.astimezone(IST).strftime("%d-%b-%Y %H:%M:%S")
            if self.updatedAt else None
        )

    @property
    def dobFormatted(self):
        return self.dob.strftime("%d-%b-%Y") if self.dob else None