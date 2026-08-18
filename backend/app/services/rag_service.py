# rag_service.py - CORRECTED VERSION
from app.services.vector_db import search_vectors
from app.services.gemini_service import ask_gemini_for_json_string
from app.services.user_db import create_query_entry, get_relevant_pdfs_for_query
from app.services.translator_service import (
    detect_language,
    translate_to_english,
    translate_to_language
)
import json

def get_relevant_pdf_for_query(query: str, username: str):
    """
    Find the most relevant PDF for a query.
    """
    from services.vector_db import search_vectors
    from services.user_db import get_history_by_hash
    
    results = search_vectors(query)
    
    if not results["documents"]:
        return None
    
    # Find file_hash from search results
    for doc in results["documents"]:
        file_hash = doc["metadata"].get("file_hash")
        if file_hash and username:
            pdf_info = get_relevant_pdf_for_query(query, username)
            if pdf_info and pdf_info.get("extracted_data"):
                # Return stored JSON instead of generating new
                stored_json = pdf_info["extracted_data"]
                stored_json["pdf_reference"] = {
                    "filename": pdf_info.get("filename"),
                    "file_hash": pdf_info.get("file_hash"),
                    "download_url": pdf_info.get("download_url", f"/download/{pdf_info.get('file_hash')}")
                    }
        return stored_json
    
    return None

async def answer_question(query: str, username: str = None, file_hash: str = None):
    """
    Answer questions about insurance policies with PDF reference support
    
    Args:
        query: The user's question
        username: Optional username for history tracking
        file_hash: Optional specific PDF file hash to query
    """
    
    # 1. Detect query language
    lang = detect_language(query)

    # 2. Translate query to English for vector search
    english_query = translate_to_english(query) if lang != "en" else query

    # 3. Perform vector search
    results = search_vectors(english_query)

    if not results["documents"]:
        answer = {"error": "No related information found."}
        
        # Save to history even for empty results
        if username:
            try:
                create_query_entry(username, query, answer, file_hash)
            except Exception as e:
                print(f"Error saving query entry: {e}")
        
        return answer

    # 4. Combine documents for context
    context = "\n".join(results["documents"][:3])  # Use top 3 documents for better context

    # 5. Force Gemini to return EXACT JSON schema
    json_prompt = f"""
You are an information extraction system.

Use ONLY the context below to fill the JSON template.
Do NOT invent facts.

CONTEXT:
{context}

USER QUESTION:
{english_query}

RESPONSE RULES:
- Return ONLY valid JSON.
- Use this EXACT JSON structure and keys.
- If any value is unknown, set it to null.
- Do NOT add extra fields.
- Do NOT add explanations.

JSON TEMPLATE:
{{
  "policy_name": null,
  "policy_type": null,
  "policy_number": null,
  "insured_name": null,
  "nominee": null,
  "premium_amount": null,
  "premium_payment_frequency": null,
  "policy_term": null,
  "sum_assured": null,
  "coverage_details": null,
  "exclusions": null,
  "claim_process": null,
  "renewal_terms": null,
  "cancellation_rules": null,
  "maturity_benefits": null,
  "surrender_value": null,
  "grace_period": null,
  "waiting_period": null,
  "issue_date": null,
  "expiry_date": null,
  "agent_name": null,
  "agent_code": null,
  "company_name": null,
  "contact_details": null,
  "legal_disclaimer": null,
  "additional_info": {{
      "address_change_notification": null,
      "co-pay_clause": null,
      "free-look_period": null,
      "portability_benefits": null,
      "fraudulent_claims": null
  }}
}}
"""

    # 6. Ask Gemini
    answer_en = await ask_gemini_for_json_string(context, english_query)
    answer_en = answer_en.strip()

    # 7. Ensure valid JSON
    try:
        json_data = json.loads(answer_en)
    except json.JSONDecodeError as e:
        print(f"JSON decode error: {e}")
        json_data = {"error": "Invalid JSON returned by model", "raw_response": answer_en[:200]}
    except Exception as e:
        print(f"Error parsing JSON: {e}")
        json_data = {"error": "Failed to parse response"}

    # 8. Translate VALUES ONLY (not the keys)
    if lang != "en":
        translated = await translate_values_only(json_data, lang)
    else:
        translated = json_data

    # 9. Find relevant PDFs based on the answer
    relevant_pdfs = []
    if username:
        relevant_pdfs = get_relevant_pdfs_for_query(username, query, translated)

    # 10. Add PDF references to the answer if found
    if relevant_pdfs:
        # If file_hash was provided, make sure it's included
        if file_hash and not any(pdf['file_hash'] == file_hash for pdf in relevant_pdfs):
            # Try to get the specific PDF
            from services.user_db import get_history_by_hash
            specific_pdf = get_history_by_hash(username, file_hash)
            if specific_pdf:
                relevant_pdfs.insert(0, specific_pdf)
        
        # Add PDF references to the answer
        translated["_pdf_references"] = [
            {
                "filename": pdf.get("filename"),
                "file_hash": pdf.get("file_hash"),
                "download_url": pdf.get("download_url", f"/download/{pdf.get('file_hash')}")
            }
            for pdf in relevant_pdfs
        ]

    # 11. Save to history
    if username:
        try:
            create_query_entry(username, query, translated, file_hash)
        except Exception as e:
            print(f"Error creating query entry: {e}")

    return translated


async def translate_values_only(data, target_lang):
    """
    Recursively translate ONLY string values inside a JSON-like structure.
    Works with dict, list, and str.
    """
    from services.translator_service import translate_to_language
    
    if isinstance(data, dict):
        translated_dict = {}
        for key, value in data.items():
            # Don't translate keys, only values
            if key == "_pdf_references":
                # Don't translate PDF references
                translated_dict[key] = value
            else:
                translated_dict[key] = await translate_values_only(value, target_lang)
        return translated_dict

    elif isinstance(data, list):
        return [await translate_values_only(v, target_lang) for v in data]

    elif isinstance(data, str):
        # Use your existing translator
        return translate_to_language(data, target_lang)

    else:
        return data


# Alternative simplified version if you don't need automatic PDF detection
async def answer_question_simple(query: str, username: str = None, file_hash: str = None):
    """Simplified version that accepts file_hash and returns basic PDF reference"""
    
    # ... (same as above until step 7) ...
    
    # 7. Ensure valid JSON (same as above)
    try:
        json_data = json.loads(answer_en)
    except:
        json_data = {"error": "Invalid JSON returned by model"}

    # 8. Translate (same as above)
    if lang != "en":
        translated = await translate_values_only(json_data, lang)
    else:
        translated = json_data

    # 9. Get PDF info if file_hash provided
    pdf_references = []
    if file_hash and username:
        from services.user_db import get_history_by_hash
        pdf_info = get_history_by_hash(username, file_hash)
        if pdf_info:
            pdf_references = [{
                "filename": pdf_info.get("filename"),
                "file_hash": pdf_info.get("file_hash"),
                "download_url": pdf_info.get("download_url", f"/download/{file_hash}")
            }]
    
    # Add PDF references
    if pdf_references:
        translated["pdf_references"] = pdf_references

    # 10. Save to history with file_hash
    if username:
        try:
            create_query_entry(username, query, translated, file_hash)
        except:
            pass

    return translated

