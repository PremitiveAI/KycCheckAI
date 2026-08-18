from sqlalchemy import Column, Integer, String, DateTime, Text,ForeignKey
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import relationship
from app.models.admin_model import AdminUsers
from app.database.connection import Base


IST = timezone(timedelta(hours=5, minutes=30))
def utc_now():
    return datetime.now(timezone.utc)
class FeatureTypeMaster(Base):
    __tablename__ = "tbl_feature_type_master"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, default=None)
    status = Column(Integer, default=1)

    imageId = Column(String(50), default=None)
    imagePath = Column(String(255), default=None)

    createdAt = Column(DateTime(timezone=True), default=utc_now)
    createdBy = Column(Integer, ForeignKey("tbl_admin.id"), nullable=True)
    updatedBy = Column(Integer, ForeignKey("tbl_admin.id"), nullable=True)

    created_by_user = relationship(
        "AdminUsers",
        foreign_keys=[createdBy],
        lazy="selectin"   # IMPORTANT
    )
    updated_by_user = relationship(
        "AdminUsers",
        foreign_keys=[updatedBy],
        lazy="selectin"   # IMPORTANT
    )
    updatedAt = Column(DateTime(timezone=True),default=utc_now, onupdate=utc_now)
    deletedAt = Column(DateTime, default=None)
  
  
  # FORMATTED PROPERTIES (READ-ONLY)
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