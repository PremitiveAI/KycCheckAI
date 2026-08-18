# pdf_reader.py - UPDATED VERSION (add JSON saving)
import fitz
import hashlib
import os
import json
from app.services.gemini_service import extract_json_from_gemini
from app.services.vector_db import store_document
from datetime import datetime

# Create directory for storing PDFs
PDF_STORAGE_DIR = "./uploaded_pdfs"
os.makedirs(PDF_STORAGE_DIR, exist_ok=True)

async def extract_text_from_file(upload_file, username=None):
    filename = upload_file.filename.lower()

    if filename.endswith(".pdf"):
        # Read file content
        content = await upload_file.read()
        file_size = len(content)  # Get file size
        
        # Create hash for file
        file_hash = hashlib.md5(content).hexdigest()
        
        # Save PDF to storage
        pdf_path = os.path.join(PDF_STORAGE_DIR, f"{file_hash}.pdf")
        if not os.path.exists(pdf_path):
            with open(pdf_path, "wb") as f:
                f.write(content)
        
        # Extract text and JSON
        text = await extract_text_from_pdf_bytes(content)
        json_data, raw_text = await extract_json_from_gemini(text)
        
        # ✅ NEW: Save JSON to file so query endpoint can find it
        json_path = os.path.join(PDF_STORAGE_DIR, f"{file_hash}.json")
        with open(json_path, 'w') as f:
            json.dump(json_data, f, indent=2)
        print(f"✅ Saved JSON to: {json_path}")
        
        # Store in vector DB
        store_document(raw_text, file_hash=file_hash, metadata={
            "filename": upload_file.filename,
            "uploaded_by": username,
            "policy_name": json_data.get('policy_name', 'Unknown'),
            "upload_time": datetime.now().isoformat()
        })

        # Store in history WITH FILE SIZE
        if username:
            create_history_entry(
                username=username,
                file_hash=file_hash,
                filename=upload_file.filename,
                name=json_data.get('policy_name', 'Unknown Policy'),
                policy_id=json_data.get('policy_number', 'N/A'),
                description=f"Insurance policy: {json_data.get('policy_name', 'Unknown')}",
                raw_text=raw_text[:500],
                json_data=json_data,
                file_size=file_size  # ADD THIS
            )

        # Add PDF reference WITH SIZE to response
        json_data["pdf_reference"] = {
            "filename": upload_file.filename,
            "file_hash": file_hash,
            "size": file_size,  # Include size
            "download_url": f"/download/{file_hash}"
        }
        
        return json_data

async def extract_text_from_pdf_bytes(pdf_bytes: bytes):
    pdf = fitz.open(stream=pdf_bytes, filetype="pdf")
    text = ""
    for page in pdf: text += page.get_text()
    return text