from sqlalchemy.orm import Session
from app.models.user_model import User
from app.schemas.user_schema import UserCreate

class UserRepository:

    @staticmethod
    def create(db: Session, data: UserCreate):
        user = User(name=data.name, email=data.email)
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def get_all(db: Session):
        return db.query(User).all()

    @staticmethod
    def get_by_id(db: Session, userId: int):
        return db.query(User).filter(User.id == userId).first()

    @staticmethod
    def delete(db: Session, userId: int):
        user = UserRepository.get_by_id(db, userId)
        if user:
            db.delete(user)
            db.commit()
            return True
        return False