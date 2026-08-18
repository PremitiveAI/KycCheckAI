import uuid
import hashlib
import secrets
import string
from sqlalchemy.orm import relationship
from datetime import timedelta, timezone
from sqlalchemy import Column, Integer, String, DateTime, func
from app.database.connection import Base

def generate_encrypted_userId():
    # Generate a random UUID
    raw_id = str(uuid.uuid4())
    # Encrypt/hash it (example using SHA256)
    encrypted_id = hashlib.sha256(raw_id.encode()).hexdigest()
    return encrypted_id

def generate_userId():
    # Generate 12 random alphanumeric characters
    chars = string.ascii_uppercase + string.digits
    random_part = ''.join(secrets.choice(chars) for _ in range(12))
    # Prefix with U-{} to make total length 16
    return f"U-{random_part}"

IST = timezone(timedelta())
class AdminUsers(Base):
    __tablename__ = "tbl_admin"

    id = Column(Integer, primary_key=True, index=True)
    userId = Column(String(100), unique=True, nullable=False, default=generate_userId)
    admin_name = Column(String(100), nullable=True, unique=False)
    mobile = Column(String(10), nullable=True, unique=True, index=True)
    password = Column(String(255), nullable=True)
    email = Column(String(150), nullable=False)
    role= Column(String(150), nullable=True)
    status = Column(Integer, nullable=False, default=1)

    # Relationship back to Users
    sessions = relationship("AdminSessions", back_populates="adminuser", cascade="all, delete-orphan")

  
