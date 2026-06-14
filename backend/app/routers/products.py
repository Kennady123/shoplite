from fastapi import APIRouter, Depends
from typing import List
# from app.models.product import Product
from database import get_db,Product
from sqlalchemy.orm import Session
from .admin import verify_admin_token
from pydantic import BaseModel
router = APIRouter()


class ProductCreate(BaseModel):

    name: str
    price: float
    category: str
    description: str
    image_emoji: str


@router.post('/admin/products')
async def add_product(
        product_in: ProductCreate,
        db: Session = Depends(get_db),
        current_user: dict = Depends(verify_admin_token)
):

    new_product = Product(
        name=product_in.name,
        price=product_in.price,
        category=product_in.category,
        description=product_in.description,
        image_emoji=product_in.image_emoji
    )

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return {"status": "success", "product_id": new_product.id}




@router.get("/products")
def get_products(database: Session = Depends(get_db)):
    PRODUCTS=database.query(Product).all()
    return PRODUCTS
