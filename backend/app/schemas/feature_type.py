from pydantic import BaseModel
from typing import Optional

# Schema for insert and update both FeatureType records
class FeatureType(BaseModel):
    id: Optional[int] = None   # if id present → update, else add
    name: str
    description: Optional[str] = None
    imageId: Optional[str] = None
    imagePath: Optional[str] = None
    createdBy: Optional[int] = None
    updatedBy: Optional[int] = None
  



