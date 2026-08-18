from fastapi import FastAPI, Request 
from fastapi.responses import JSONResponse 
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError

from app.database.connection import create_all_tables
from app.middlewares import ( exception_handler, request_logger, jwt_error_handler, auth_middleware )

# from app.routes.upload import router as upload_router
# from app.routes.query import router as query_router
# from app.routes.library import router as library_router

from app.routes.login_routes import public_router, protected_router
from app.routes.master_routes import master_router,masterprotected_router
from app.routes.admin_routes import admin_router
from app.routes.kyc_routes import public_router as kyc_public_router,  protected_router as kyc_protected_router


app = FastAPI() 

# Middleware 
app.add_middleware(request_logger.RequestLoggingMiddleware) 
app.add_middleware(auth_middleware.UserApiVerifyMiddleware)

# Exception handlers 
exception_handler.register_exception_handlers(app) 
jwt_error_handler.register_jwt_error_handler(app)

# app.include_router(query_router)
# app.include_router(upload_router)

app.include_router(public_router)
app.include_router(protected_router)
app.include_router(master_router)
app.include_router(masterprotected_router)
app.include_router(admin_router)
app.include_router(kyc_public_router)
app.include_router(kyc_protected_router)



@app.on_event("startup")
def startup_event():
    create_all_tables()

@app.get("/")
def root():
    return {"message": "FastAPI MVC Running"}

app.mount("/storage", StaticFiles(directory="storage"), name="storage")

@app.exception_handler(RequestValidationError)
async def validation_error(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=400,
        content={
            "Success": None,
            "Code": 1,
            "Error": {"message": exc.errors()[0]["msg"]}
        }
    )