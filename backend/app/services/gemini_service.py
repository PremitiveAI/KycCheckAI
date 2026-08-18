# gemini_service.py
import os
import json
import re
from langchain_google_genai import ChatGoogleGenerativeAI
from app.config.env import env

GOOGLE_API_KEY = env("GOOGLE_API_KEY").strip().removeprefix('"').removesuffix('"')
if not GOOGLE_API_KEY:
    raise Exception("❌ GOOGLE_API_KEY not found")

model = ChatGoogleGenerativeAI(model="gemini-2.0-flash", google_api_key=GOOGLE_API_KEY)

# --------------------------------------------------
# 1.  UPLOAD  –  extraction prompt (braces escaped)
# --------------------------------------------------
INSURANCE_PROMPT = """
You are an expert Insurance Policy Analyzer AI.
Your task is to read the provided PDF text and extract all important policy information dynamically.
The PDF may contain different formats, names, or missing fields — you must intelligently detect everything meaningful.

### Extraction Rules:
1. Extract fields only if actually found in the text. Do NOT guess.
2. If a field is missing → return null.
3. If extra important information doesn't match any fixed field → store inside "additional_info" as key-value pairs.
4. Output ONLY clean JSON. No explanation. No extra text.

### Fields to Detect (Dynamic):
- policy_name
- policy_type
- policy_number
- insured_name
- nominee
- premium_amount
- premium_payment_frequency
- policy_term
- sum_assured
- coverage_details
- exclusions
- claim_process
- renewal_terms
- cancellation_rules
- maturity_benefits
- surrender_value
- grace_period
- waiting_period
- issue_date
- expiry_date
- agent_name
- agent_code
- company_name
- contact_details
- legal_disclaimer

### additional_info:
If the PDF contains important statements, warnings, conditions, or extra details that do not fit predefined fields, add them in:
"additional_info": {{}}

### Output Format (STRICT):
Return JSON in EXACT structure (values may be null):

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
  "additional_info": {{}}
}}

IMPORTANT:
- Return ONLY valid JSON.
- NO markdown.
- NO backticks.
- NO explanation.

PDF TEXT:
{text}
"""

# --------------------------------------------------
# 2.  SEARCH  –  JSON-copier prompt (braces escaped)
# --------------------------------------------------
RAG_PROMPT = """
You are a JSON copier.
Use ONLY the context below to fill the template.
Do NOT add, summarise, or re-word anything.
Copy exact values; if missing, use null.

CONTEXT:
{context}

USER QUESTION:
{question}

RESPONSE RULES:
- Return ONLY the JSON object below.
- No extra text, no markdown, no explanations.

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
  "additional_info": {{}}
}}
"""

# --------------------------------------------------
# low-level caller
# --------------------------------------------------
async def _call_gemini(prompt: str) -> str:
    resp = model.invoke(prompt)
    return re.sub(r"^```json\s*|```$", "", resp.content, flags=re.I).strip()

# --------------------------------------------------
# 1. UPLOAD  –  returns (dict, str)
# --------------------------------------------------
async def extract_json_from_gemini(pdf_text: str) -> tuple[dict, str]:
    cleaned = await _call_gemini(INSURANCE_PROMPT.format(text=pdf_text))
    try:
        parsed = json.loads(cleaned)
    except Exception as e:
        parsed = {"error": "Invalid JSON", "exception": str(e), "raw": cleaned}
    return parsed, cleaned

# --------------------------------------------------
# 2. SEARCH   –  returns str
# --------------------------------------------------
async def ask_gemini_for_json_string(context: str, question: str) -> str:
    prompt = RAG_PROMPT.format(context=context, question=question)
    return await _call_gemini(prompt)