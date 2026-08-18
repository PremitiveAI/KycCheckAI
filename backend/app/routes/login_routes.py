# app/routes/login_routes.py

from fastapi import APIRouter, Request, Response, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.controllers.auth_controller import AuthController
from app.database.connection import get_db
from app.docs.swagger_headers import SwaggerAPIHeaders, SwaggerSessionHeaders
from app.middlewares.auth_middleware import verify_session

from app.schemas.otp_schema import OTPGenerateRequest, OTPValidateRequest
from app.schemas.signup_schema import SignupRequest
from app.schemas.login_schema import LoginRequest
from app.schemas.login_with_email_schema import EmailLoginSchema
from app.schemas.updateUser_schema import UpdateUserRequest
from app.schemas.userList_schema import UserListRequest
from app.schemas.password_schema import PasswordUpdate



# --------------------------
# Public Routes (No Session Required)
# --------------------------
public_router = APIRouter(
    prefix="/user", tags=["User"],
    dependencies=[Depends(SwaggerAPIHeaders)]  # SHOW HEADERS IN SWAGGER
)

# --------------------------
# Protected Routes (Session Required)
# --------------------------
protected_router = APIRouter(
    prefix="/user", tags=["User"],
    dependencies=[Depends(SwaggerSessionHeaders), Depends(verify_session)]
)

@public_router.post("/signup")
async def signup(request: SignupRequest, response: Response, db: Session = Depends(get_db)):
    result = AuthController.signup(db, request)
    return result
   
@public_router.post("/login")
async def login(request: LoginRequest, response: Response, db: Session = Depends(get_db) ):
    result = AuthController.login(db, request)
    return result

@public_router.post("/login-email")
async def login_email(payload: EmailLoginSchema, db: Session = Depends(get_db)):
    email = payload.email
    return AuthController.login_with_email(db, email)

@public_router.post("/generate-otp")
async def generateOTP(request: OTPGenerateRequest, response: Response, db: Session = Depends(get_db)):
    result = AuthController.generateOTP(db, request)
    return result

@public_router.post("/validate-otp")
async def validateOTP(request: OTPValidateRequest, response: Response, db: Session = Depends(get_db)):
    result = AuthController.validateOTP(db, request)
    return result

@public_router.put("/update-password")
async def update_password(request: PasswordUpdate, response :Response ,db: Session = Depends(get_db)):
    result = AuthController.update_password(db, request)
    return result



@protected_router.post("/logout")
async def logout(request: Request,response: Response,db: Session = Depends(get_db)): # <-- automatically read session token from header
    result = AuthController.logout(db, request)
    return result

@protected_router.post("/list_users")
def list_users(payload: UserListRequest, db: Session = Depends(get_db)):
    return AuthController.list_users(db, payload.dict())

@protected_router.post("/updateUser")
async def update_user_details(request: Request,payload: UpdateUserRequest,db: Session = Depends(get_db)):
    # convert Pydantic model to dict and remove None fields
    payload_dict = payload.dict(exclude_none=True)
    result = AuthController.updateUserDetails(db, request, payload_dict)
    return result

@protected_router.get("/getUser")
async def get_user_details(request: Request, response: Response, db: Session = Depends(get_db) ):
    result = AuthController.getUserDetails(db, request)
    return result





