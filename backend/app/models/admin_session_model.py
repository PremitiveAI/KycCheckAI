# app/models/users_session_model.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database.connection import Base

class AdminSessions(Base):
    __tablename__ = "tbl_admin_sessions"

    id = Column(Integer, primary_key=True, index=True)
    # userId = Column(Integer, ForeignKey("users.id"), nullable=False)

    userId = Column(String(255), ForeignKey("tbl_admin.userId"))
    # userId = Column(String(255), nullable=False)
    session_token = Column(String(255), nullable=False)
    deviceId = Column(String(255), nullable=True)

    sessionType = Column(String(255), nullable=False, default='WEB')
    status = Column(Integer, nullable=False, default=1)

    # AUDIT FIELDS
    createdBy = Column(Integer, nullable=False, default=0)
    
    # createdAt = Column(DateTime, default=datetime.utcnow)
    createdAt = Column(DateTime, server_default=func.now()) # Auto insert

    updatedBy = Column(Integer, nullable=False, default=0)
    updatedAt = Column(DateTime, server_default=func.now(), onupdate=func.now()) # Auto update

    deletedBy = Column(Integer, nullable=False, default=0)
    deletedAt = Column(DateTime, nullable=True) # NULL until deleted

    # Relationship to Sessions
    adminuser = relationship("AdminUsers", back_populates="sessions")