from fastapi import APIRouter, Request, Response, Depends, UploadFile, File
from sqlalchemy.orm import Session
from typing import List

from app.middlewares.auth_middleware import verify_session
from app.database.connection import get_db
from app.docs.swagger_headers import SwaggerAPIHeaders, SwaggerSessionHeaders, Header

from app.controllers.employee_controller import EmployeeController

from app.schemas.employee_schema import EmployeeCreate
from app.schemas.employee_list_schema import  EmployeeListRequest

# from app.controllers.kyc_controller import upload_files, search_query
from app.services.employee_service import EmployeeService
from app.services.kyc_document_service import handle_upload_documents, handle_search_documents, handle_delete_document

from app.utils.response import success_response, error_response

# --------------------------
# Public Routes (No Session Required)
# --------------------------
public_router = APIRouter(
    prefix="/KYC", tags=["Employee KYC"],
    dependencies=[Depends(SwaggerAPIHeaders)]  # SHOW HEADERS IN SWAGGER
)

# --------------------------
# Protected Routes (Session Required)
# --------------------------
protected_router = APIRouter(
    prefix="/KYC", tags=["Employee KYC"],
    dependencies=[Depends(SwaggerSessionHeaders), Depends(verify_session)]
)




@public_router.post("/create")
def create_employee(payload: EmployeeCreate, db: Session = Depends(get_db)):
    return EmployeeController.create(db, payload)

@public_router.get("/{employee_id}/details")
def get_employee_details(employee_id: str, request: Request = None, db: Session = Depends(get_db)):
    return EmployeeController.get_details(db, request, employee_id)

@public_router.post("/list")
def list_employees(payload: EmployeeListRequest,db: Session = Depends(get_db)):
    return EmployeeController.list(db, payload)





@public_router.post("/upload")
async def upload_doc(files: List[UploadFile] = File(...), employee_id: str="", request: Request = None, db: Session = Depends(get_db)):
    if not files:
        return error_response("No files uploaded", code = 4002)
    userId = "U-98WZ41BUTTOM" #request.state.userId
    return handle_upload_documents(db, request, userId, employee_id, files)

@public_router.get("/search")
async def search_docs(request: Request, query: str, db: Session = Depends(get_db)):

    request.state.userId = "U-98WZ41BUTTOM"
    if not query or not query.strip():
        return error_response("Search query cannot be empty", code = 4002)

    if query:
        return handle_search_documents(db, request, query)




@public_router.get("/list-basic")
def list_basic_employees(db: Session = Depends(get_db)):
    return EmployeeController.list_basic(db)

@public_router.delete("/delete")
def delete_employee(employee_id: str = Header(...),db: Session = Depends(get_db)):
    return EmployeeService.delete_employee(db, employee_id)
