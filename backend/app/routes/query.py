# routes/query.py - FINAL WORKING VERSION
from fastapi import APIRouter, Query, HTTPException
from typing import List, Dict, Any
import json
import os
import glob
from datetime import datetime

router = APIRouter()

# ==================== API 1: LIST ALL POLICIES ====================
@router.get("/policies")
async def list_policies():
    """
    Returns ALL uploaded policies with: policy_name, filename, file_hash
    """
    policies_dir = "./uploaded_pdfs"
    
    if not os.path.exists(policies_dir):
        return []
    
    policies = []
    
    # Get ALL JSON files
    json_files = glob.glob(os.path.join(policies_dir, "*.json"))
    
    if not json_files:
        # If no JSON, check PDF files
        pdf_files = glob.glob(os.path.join(policies_dir, "*.pdf"))
        for pdf_file in pdf_files:
            file_hash = os.path.basename(pdf_file).replace('.pdf', '')
            upload_time = datetime.fromtimestamp(os.path.getmtime(pdf_file)).isoformat()
            
            policies.append({
                "id": file_hash,
                "policy_name": f"Document: {file_hash[:8]}...",
                "filename": os.path.basename(pdf_file),
                "file_hash": file_hash,
                "upload_time": upload_time,
                "file_size": os.path.getsize(pdf_file),
                "has_json": False,
                "has_pdf": True,
                "query_url": f"/query?file_hash={file_hash}",
                "view_url": f"/view/{file_hash}",
                "download_url": f"/download/{file_hash}"
            })
        
        return policies
    
    # Process each JSON file
    for json_file in json_files:
        try:
            with open(json_file, 'r') as f:
                data = json.load(f)
            
            # Extract file_hash from filename (e.g., "abc123.json" -> "abc123")
            file_hash = os.path.basename(json_file).replace('.json', '')
            
            # Get policy name (default if not found)
            policy_name = data.get("policy_name", f"Policy {file_hash[:8]}")
            
            # Get PDF filename
            pdf_filename = f"{file_hash}.pdf"
            if "pdf_reference" in data and "filename" in data["pdf_reference"]:
                pdf_filename = data["pdf_reference"]["filename"]
            
            # Check if PDF exists
            pdf_path = os.path.join(policies_dir, f"{file_hash}.pdf")
            pdf_exists = os.path.exists(pdf_path)
            
            # Get file sizes
            json_size = os.path.getsize(json_file)
            pdf_size = os.path.getsize(pdf_path) if pdf_exists else 0
            
            # Get upload time
            upload_time = datetime.fromtimestamp(os.path.getmtime(json_file)).isoformat()
            
            policy_info = {
                "id": file_hash,
                "policy_name": policy_name,
                "policy_type": data.get("policy_type", "Unknown"),
                "policy_number": data.get("policy_number"),
                "filename": pdf_filename,
                "file_hash": file_hash,
                "upload_time": upload_time,
                "file_size": pdf_size,
                "json_size": json_size,
                "has_json": True,
                "has_pdf": pdf_exists,
                "query_url": f"/query?file_hash={file_hash}",
                "view_url": f"/view/{file_hash}",
                "download_url": f"/download/{file_hash}"
            }
            
            policies.append(policy_info)
            
        except Exception as e:
            print(f"Error reading {json_file}: {e}")
            continue
    
    # Sort by upload time (newest first)
    policies.sort(key=lambda x: x["upload_time"], reverse=True)
    
    return policies

# ==================== API 2: QUERY ENDPOINT ====================
@router.get("/query")
async def query_doc(
    q: str = Query(None, description="Search query"),
    file_hash: str = Query(None, description="Specific file to query")
):
    """
    Query endpoint - works with or without file_hash
    """
    # If file_hash provided, get that specific file
    if file_hash:
        return await get_policy_by_hash(file_hash, q or "")
    
    # Otherwise get the latest policy
    return await get_latest_policy(q or "")

async def get_policy_by_hash(file_hash: str, query: str):
    """Get specific policy by file_hash"""
    json_path = f"./uploaded_pdfs/{file_hash}.json"
    pdf_path = f"./uploaded_pdfs/{file_hash}.pdf"
    
    # Try to load JSON first
    if os.path.exists(json_path):
        try:
            with open(json_path, 'r') as f:
                data = json.load(f)
            
            # Ensure pdf_reference exists
            if os.path.exists(pdf_path):
                if "pdf_reference" not in data:
                    data["pdf_reference"] = {}
                
                data["pdf_reference"].update({
                    "filename": f"{file_hash}.pdf",
                    "file_hash": file_hash,
                    "size": os.path.getsize(pdf_path),
                    "download_url": f"/download/{file_hash}"
                })
            
            # Add query metadata
            data["_query_metadata"] = {
                "query": query,
                "file_hash": file_hash,
                "retrieved_at": datetime.now().isoformat(),
                "source": "json_file"
            }
            
            return {
                "query": query or data.get("policy_name", ""),
                "answer": data
            }
            
        except Exception as e:
            return {
                "query": query,
                "answer": {
                    "error": f"Failed to load policy data: {str(e)}",
                    "file_hash": file_hash
                }
            }
    
    # If only PDF exists
    elif os.path.exists(pdf_path):
        return {
            "query": query,
            "answer": {
                "policy_name": f"Document {file_hash[:8]}...",
                "policy_type": "PDF Document",
                "note": "PDF file exists but no extracted data available",
                "pdf_reference": {
                    "filename": f"{file_hash}.pdf",
                    "file_hash": file_hash,
                    "size": os.path.getsize(pdf_path),
                    "download_url": f"/download/{file_hash}"
                },
                "_query_metadata": {
                    "query": query,
                    "file_hash": file_hash,
                    "retrieved_at": datetime.now().isoformat(),
                    "source": "pdf_only"
                }
            }
        }
    
    # File not found
    raise HTTPException(
        status_code=404,
        detail=f"Policy with ID '{file_hash}' not found"
    )

async def get_latest_policy(query: str):
    """Get the most recent policy"""
    policies_dir = "./uploaded_pdfs"
    
    if not os.path.exists(policies_dir):
        return {
            "query": query,
            "answer": {
                "error": "No uploads found",
                "solution": "Upload a PDF first at /upload"
            }
        }
    
    # Get all JSON files
    json_files = [f for f in os.listdir(policies_dir) if f.endswith('.json')]
    
    if not json_files:
        # Try PDF files if no JSON
        pdf_files = [f for f in os.listdir(policies_dir) if f.endswith('.pdf')]
        if pdf_files:
            # Get most recent PDF
            pdf_files.sort(key=lambda x: os.path.getmtime(os.path.join(policies_dir, x)), reverse=True)
            latest_pdf = pdf_files[0]
            file_hash = latest_pdf.replace('.pdf', '')
            return await get_policy_by_hash(file_hash, query)
        
        return {
            "query": query,
            "answer": {
                "error": "No data available",
                "solution": "Upload a PDF first"
            }
        }
    
    # Get most recent JSON
    json_files.sort(key=lambda x: os.path.getmtime(os.path.join(policies_dir, x)), reverse=True)
    latest_json = json_files[0]
    file_hash = latest_json.replace('.json', '')
    
    return await get_policy_by_hash(file_hash, query)

# ==================== API 3: GET POLICY DETAILS ====================
# @router.get("/policies/{file_hash}")
# async def get_policy_details(file_hash: str):
#     """
#     Get full details for a specific policy
#     """
#     return await get_policy_by_hash(file_hash, "")

# ==================== DEBUG ENDPOINT ====================
# @router.get("/debug-all-files")
# async def debug_all_files():
#     """Show ALL files with full details"""
#     policies_dir = "./uploaded_pdfs"
    
#     if not os.path.exists(policies_dir):
#         return {"error": "Directory not found"}
    
#     all_files = os.listdir(policies_dir)
#     pdf_files = [f for f in all_files if f.endswith('.pdf')]
#     json_files = [f for f in all_files if f.endswith('.json')]
    
#     # Get full details for each file
#     pdf_details = []
#     for pdf in pdf_files:
#         pdf_path = os.path.join(policies_dir, pdf)
#         file_hash = pdf.replace('.pdf', '')
        
#         pdf_details.append({
#             "file": pdf,
#             "file_hash": file_hash,
#             "size_kb": round(os.path.getsize(pdf_path) / 1024, 2),
#             "modified": datetime.fromtimestamp(os.path.getmtime(pdf_path)).isoformat(),
#             "has_json": f"{file_hash}.json" in json_files
#         })
    
#     json_details = []
#     for json_file in json_files:
#         json_path = os.path.join(policies_dir, json_file)
#         file_hash = json_file.replace('.json', '')
        
#         # Try to read policy name
#         policy_name = "Unknown"
#         try:
#             with open(json_path, 'r') as f:
#                 data = json.load(f)
#                 policy_name = data.get("policy_name", "Unknown")
#         except:
#             pass
        
#         json_details.append({
#             "file": json_file,
#             "file_hash": file_hash,
#             "policy_name": policy_name,
#             "size_kb": round(os.path.getsize(json_path) / 1024, 2),
#             "modified": datetime.fromtimestamp(os.path.getmtime(json_path)).isoformat(),
#             "has_pdf": f"{file_hash}.pdf" in pdf_files
#         })
    
#     return {
#         "directory": os.path.abspath(policies_dir),
#         "total_files": len(all_files),
#         "pdf_count": len(pdf_files),
#         "json_count": len(json_files),
#         "pdf_files": pdf_details,
#         "json_files": json_details,
#         "matched_pairs": len([f for f in pdf_files if f.replace('.pdf', '.json') in json_files])
#     }

# ==================== HEALTH CHECK ====================
@router.get("/health")
async def health_check():
    """Simple health check"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "apis": {
            "list_policies": "GET /policies",
            "query": "GET /query?file_hash=HASH",
            "policy_details": "GET /policies/{file_hash}",
            "upload": "POST /upload",
            "download": "GET /download/{file_hash}",
            "view": "GET /view/{file_hash}"
        }
    }