from fastapi import APIRouter, Depends,Request
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.schemas.feature_type import FeatureType
from app.schemas.category_type import CategoryType
from app.schemas.userList_schema import UserListRequest   # adjust path if needed
from app.controllers.master_controller import MasterController
from app.docs.swagger_headers import SwaggerAPIHeaders, SwaggerSessionHeaders
from app.middlewares.auth_middleware import verify_admin_session
from sqlalchemy.orm import Session

master_router = APIRouter(
    prefix="/master", tags=["Masters"],
    dependencies=[Depends(SwaggerAPIHeaders)]  # SHOW HEADERS IN SWAGGER
)
 # --------------------------
 # Protected Routes (Session Required)
 # --------------------------
masterprotected_router = APIRouter(
    prefix="/master", tags=["Master"],
    dependencies=[Depends(SwaggerSessionHeaders), Depends(verify_admin_session)]
)

# ADD / UPDATE
@masterprotected_router.post("/feature/save")
def save_feature(payload: FeatureType, request: Request, db: Session = Depends(get_db)):
    return MasterController.save_feature_type(db, payload, request)

# LIST
@master_router.post("/feature/list")
def feature_list(payload: UserListRequest,db: Session = Depends(get_db)):
    return MasterController.list_feature_types_post(db,payload)

# GET BY ID
@master_router.get("/feature/details/{id}")
def feature_details(id: int, db: Session = Depends(get_db)):
    return MasterController.get_feature_type(db, id)

# DELETE
@masterprotected_router.delete("/feature/delete/{id}")
def feature_delete(id: int, request: Request, db: Session = Depends(get_db)):
    return MasterController.delete_feature_type(db, id, request)

# ---------------- CATEGORY MASTER ----------------

# ADD / UPDATE
@masterprotected_router.post("/category/save")
def save_category(payload: CategoryType,request: Request,db: Session = Depends(get_db)):
    return MasterController.save_category_type(db, payload, request)

# LIST
@master_router.post("/category/list")
def category_list(payload: UserListRequest,db: Session = Depends(get_db)):
    return MasterController.list_category_types_post(db,payload)

# GET BY ID
@master_router.get("/category/details/{id}")
def category_details(id: int, db: Session = Depends(get_db)):
    return MasterController.get_category_type(db, id)

# DELETE
@masterprotected_router.delete("/category/delete/{id}")
def category_delete(id: int,request: Request,db: Session = Depends(get_db)):
    return MasterController.delete_category_type(db, id, request)

