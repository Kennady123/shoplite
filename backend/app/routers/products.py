from fastapi import APIRouter, Depends,HTTPException,status
from database import get_db,Product
from typing import List
from sqlalchemy.orm import Session
from pydantic import BaseModel
router = APIRouter()

class ProductOut(BaseModel):
    id: int
    name: str
    description: str
    price: float
    category: str
    quantity: int
    image_url: str | None = None
    image_emoji: str | None = None

    class Config:
        from_attributes = True

@router.get("/products",response_model=List[ProductOut])
def get_products(database: Session = Depends(get_db)):
    PRODUCTS=database.query(Product).all()
    if not(PRODUCTS):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,)
    return PRODUCTS

@router.get("/products/{id}", response_model=ProductOut)
def get_product(id: int, database: Session = Depends(get_db)):
    product = database.query(Product).filter(Product.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product