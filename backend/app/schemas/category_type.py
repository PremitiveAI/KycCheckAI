from pydantic import BaseModel
from typing import Optional

class CategoryType(BaseModel):
    id: Optional[int] = None
    name: str
    description: Optional[str] = None
    imageId: Optional[str] = None
    imagePath: Optional[str] = None
    createdBy: Optional[int] = None
    updatedBy: Optional[int] = None
