# app/models/document.py
from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime, func
from sqlalchemy.orm import relationship
from app.database.connection import Base

class DocumentVectors(Base):
    __tablename__ = "tbl_document_vectors"

    id = Column(Integer, primary_key=True, index=True)
    documentId = Column(Integer, ForeignKey("tbl_documents.id"))
    chunk_index = Column(Integer,nullable=True)
    vector = Column(Text, nullable=True)  # store JSON string or use BLOB

    # AUDIT FIELDS
    createdBy = Column(Integer, nullable=True, default=0)
    createdAt = Column(DateTime, server_default=func.now()) # Auto insert

    updatedBy = Column(Integer, nullable=True, default=0)
    updatedAt = Column(DateTime, server_default=func.now(), onupdate=func.now()) # Auto update

    deletedBy = Column(Integer, nullable=False, default=0)
    deletedAt = Column(DateTime, nullable=True) # NULL until deleted

    documents = relationship("Documents", back_populates="document_vectors")