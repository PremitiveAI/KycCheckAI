from pydantic import BaseModel
from typing import Optional

class UpdateUserRequest(BaseModel):
    companyName: Optional[str]
    username: Optional[str]
    mobile: Optional[str]
    email: Optional[str]
    country: Optional[str]
    state: Optional[str]
    city: Optional[str]
    pincode: Optional[str]
    address: Optional[str]
    gst: Optional[str]
    pan: Optional[str]
    # password: Optional[str]
