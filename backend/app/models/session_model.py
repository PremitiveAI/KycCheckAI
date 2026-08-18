# # app/models/session_model.py
# from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
# from app.database.connection import Base
# from datetime import datetime


# class Sessions(Base):
#     __tablename__ = "sessions"

#     id = Column(Integer, primary_key=True, index=True)
#     userid = Column(Integer, ForeignKey("users.id"), nullable=False)
#     session_token = Column(String(255), nullable=False)
#     device_id = Column(String(255), nullable=True)
#     createdBy = Column(String(255), nullable=True)
#         # New columns
#     session_status = Column(Integer, default=1, nullable=False)  # 1=active, -1=expired
#     expire_date = Column(DateTime, nullable=True)                 # session expiry datetime

