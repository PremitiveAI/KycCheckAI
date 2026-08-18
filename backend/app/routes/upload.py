from fastapi import APIRouter, UploadFile, File, Header, HTTPException
from fastapi.responses import FileResponse
import os
from typing import Optional
from app.services.pdf_reader import extract_text_from_file
from app.services.user_db import get_username_for_token

router = APIRouter()
PDF_STORAGE_DIR = "./uploaded_pdfs"

@router.post("/upload")
async def upload_file(file: UploadFile = File(...), authorization: Optional[str] = Header(None)):
    """Upload file. If `Authorization: Bearer <token>` provided, the upload will be tied to that user."""
    username = None
    if authorization:
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1]
            username = get_username_for_token(token)

    extracted = await extract_text_from_file(file, username=username)
    print("extracted : ", extracted)
    return extracted


@router.get("/download/{file_hash}")
async def download_pdf(file_hash: str):
    """Download the original PDF file"""
    pdf_path = os.path.join(PDF_STORAGE_DIR, f"{file_hash}.pdf")
    
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="PDF not found")
    
    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=f"document_{file_hash}.pdf"
    )

@router.get("/view/{file_hash}")
async def view_pdf(file_hash: str):
    """
    Open PDF in browser (inline viewing)
    """
    pdf_path = os.path.join(PDF_STORAGE_DIR, f"{file_hash}.pdf")
    
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="PDF not found")
    
    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=f"document_{file_hash}.pdf",
        # ✅ Key change: Remove Content-Disposition header for inline viewing
        # OR set it to 'inline' explicitly
        headers={"Content-Disposition": f"inline; filename=document_{file_hash}.pdf"}
    )


# @router.get("/pdf-info/{file_hash}")
# async def get_pdf_info(file_hash: str):
#     """Get information about the uploaded PDF"""
#     pdf_path = os.path.join(PDF_STORAGE_DIR, f"{file_hash}.pdf")
    
#     if not os.path.exists(pdf_path):
#         raise HTTPException(status_code=404, detail="PDF not found")
    
#     return {
#         "file_hash": file_hash,
#         "file_size": os.path.getsize(pdf_path),
#         "exists": True
#     }