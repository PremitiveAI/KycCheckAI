from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.connection import get_db
from schemas.user_schema import UserCreate, UserResponse
from controllers.user_controller import UserController

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/", response_model=UserResponse)
def create_user(data: UserCreate, db: Session = Depends(get_db)):
    return UserController.create_user(db, data)

@router.get("/", response_model=list[UserResponse])
def list_users(db: Session = Depends(get_db)):
    return UserController.get_all_users(db)

@router.get("/{userId}", response_model=UserResponse)
def get_user(userId: int, db: Session = Depends(get_db)):
    return UserController.get_user(db, userId)

@router.delete("/{userId}")
def delete_user(userId: int, db: Session = Depends(get_db)):
    return UserController.delete_user(db, userId)