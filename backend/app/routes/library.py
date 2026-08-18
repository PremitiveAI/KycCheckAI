import os
from langchain_chroma import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_core.documents import Document 
from app.config.env import env
from fastapi import APIRouter, Header, HTTPException
from typing import Optional, List, Dict, Any
import json 
from app.services.user_db import get_username_for_token, get_user_history, get_history_by_hash_any

router = APIRouter()

@router.get("/library", response_model=List[Dict[str, Any]])
def list_pdfs(authorization: Optional[str] = Header(None)):
    username = None
    if authorization:
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            username = get_username_for_token(parts[1])

    if username:
        hist = get_user_history(username)
        uploads = hist["uploads"]
    else:
        from services.user_db import _get_conn
        conn = _get_conn()
        cur = conn.cursor()
        cur.execute(
            "SELECT file_hash, filename, name, policy_id, description, created_at "
            "FROM history ORDER BY created_at DESC"
        )
        rows = cur.fetchall()
        conn.close()
        uploads = [
            {
                "file_hash": r[0],
                "filename": r[1],
                "name": r[2] or r[1],
                "policy_id": r[3],
                "description": r[4],
                "created_at": r[5],
            }
            for r in rows
        ]
    return uploads

@router.get("/pdf/{file_hash}")
def pdf_detail(file_hash: str, authorization: Optional[str] = Header(None)):
    row = get_history_by_hash_any(file_hash)
    if not row:
        raise HTTPException(status_code=404, detail="PDF not found")
    try:
        data = json.loads(row["raw_text"])
    except Exception:
        raise HTTPException(status_code=500, detail="Corrupted stored JSON")
    return data