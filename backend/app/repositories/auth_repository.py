# app/repositories/auth_repository.py

from sqlalchemy.orm import Session
from app.models.users_session_model import Sessions
from app.models.users_model import Users
from datetime import datetime
import uuid,secrets


class AuthRepository:

    @staticmethod
    def find_user(db: Session, username: str = None, mobilenumber: str = None):
        return db.query(Users).filter(
            (Users.username == username) | (Users.mobilenumber == mobilenumber)
        ).first()

    @staticmethod
    def create_user(db: Session, username: str, mobilenumber: str, hashed_pwd: str):
        user = Users(username=username, mobilenumber=mobilenumber, password=hashed_pwd)
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    
    # @staticmethod
    # def get_user_by_email(db: Session, email: str):
    #     return db.query(Users).filter(Users.email == email).first()

    # @staticmethod
    # def create_user_with_email(db, email: str):
    #     new_user = Users(
    #         userId=f"U-{uuid.uuid4().hex[:12].upper()}",
    #         fullname=None,
    #         username=None,
    #         password=None,
    #         mobile=None,
    #         dialingCode=None,
    #         email=email,
    #         status=1,
    #         createdBy=0,
    #         updatedBy=0,
    #         deletedBy=0,
    #         deletedAt=None
    #     )
    #     db.add(new_user)
    #     db.commit()
    #     db.refresh(new_user)
    #     return new_user

    # @staticmethod
    # def create_session(db, user_id: str):
    #     token = secrets.token_hex(32)

    #     session = Sessions(
    #         session_token=token,
    #         userId=user_id,
    #         status=1,              # <-- CORRECT FIELD
    #         sessionType='WEB',     # <-- required (NOT NULL)
    #         createdBy=0
    #     )

    #     db.add(session)
    #     db.commit()
    #     db.refresh(session)
    #     return session