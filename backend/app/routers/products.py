from fastapi import APIRouter, Depends
from database import get_db,Product
from sqlalchemy.orm import Session
router = APIRouter()

@router.get("/products")
def get_products(database: Session = Depends(get_db)):
    PRODUCTS=database.query(Product).all()
    return PRODUCTS
