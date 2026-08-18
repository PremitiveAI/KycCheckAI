from pydantic import BaseModel

class EmailLoginSchema(BaseModel):
    email: str  # simple string

