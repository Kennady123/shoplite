from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from database import get_db, Seller, Product
from hash_script import verify_password, get_password_hash
from .admin import create_access_token, verify_admin_token  # ✅ changed import

router = APIRouter()

# ── Schemas ───────────────────────────────────────────────────

class SellerRegisterRequest(BaseModel):
    name:              str
    email:             EmailStr
    phone:             str
    password:          str
    business_name:     str
    business_category: str
    business_address:  str
    business_number:   str

class SellerLoginRequest(BaseModel):
    email:    EmailStr
    password: str

class ProductCreate(BaseModel):
    name:        str
    price:       float
    category:    str
    description: str
    image_emoji: str | None = None
    image_url:   str | None = None
    quantity:    int = 0

class ProductUpdate(BaseModel):
    name:        str
    price:       float
    category:    str
    description: str
    image_emoji: str | None = None
    image_url:   str | None = None
    quantity:    int = 0


# ── Auth ──────────────────────────────────────────────────────

@router.post("/seller/register")
def seller_register(data: SellerRegisterRequest, db: Session = Depends(get_db)):

    if not data.name.strip():
        raise HTTPException(status_code=400, detail="Name cannot be empty")

    if len(data.phone) < 10:
        raise HTTPException(status_code=400, detail="Enter valid phone number")

    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    if db.query(Seller).filter(Seller.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    if db.query(Seller).filter(Seller.phone == data.phone).first():
        raise HTTPException(status_code=400, detail="Phone already registered")

    seller = Seller(
        name=              data.name.strip(),
        email=             data.email,
        phone=             data.phone,
        password=          get_password_hash(data.password),
        business_name=     data.business_name,
        business_category= data.business_category,
        business_address=  data.business_address,
        business_number=   data.business_number,
    )
    db.add(seller)
    db.commit()
    db.refresh(seller)
    return {"message": "Seller registration successful"}


@router.post("/seller/login")
def seller_login(data: SellerLoginRequest, db: Session = Depends(get_db)):

    seller = db.query(Seller).filter(Seller.email == data.email).first()

    if not seller or not verify_password(data.password, seller.password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    token = create_access_token({"sub": seller.email, "role": "seller"})

    return {
        "message":      "Login successful",
        "access_token": token,
        "seller": {
            "id":            seller.id,
            "name":          seller.name,
            "email":         seller.email,
            "phone":         seller.phone,
            "business_name": seller.business_name,
            "status":        seller.status,
        }
    }

@router.get("/seller/me")
def get_seller_me(
    current_user: dict    = Depends(verify_admin_token),
    db:           Session = Depends(get_db)
):
    email  = current_user.get("sub")
    seller = db.query(Seller).filter(Seller.email == email).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")

    return {
        "id":            seller.id,
        "name":          seller.name,
        "email":         seller.email,
        "phone":         seller.phone,
        "business_name": seller.business_name,
        "status":        seller.status,
    }


@router.post("/seller/products")
def add_product(
    product_in:   ProductCreate,
    db:           Session = Depends(get_db),
    current_user: dict    = Depends(verify_admin_token)
):
    email  = current_user.get("sub")
    seller = db.query(Seller).filter(Seller.email == email).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")

    if seller.status != "approved":
        raise HTTPException(status_code=403, detail="Your account is not approved yet")

    new_product = Product(
        name=        product_in.name,
        price=       product_in.price,
        category=    product_in.category,
        description= product_in.description,
        image_emoji= product_in.image_emoji,
        image_url=   product_in.image_url,
        quantity=    product_in.quantity,
        seller_id=   seller.id
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return {"status": "success", "product_id": new_product.id}


@router.get("/seller/products")
def get_seller_products(
    current_user: dict    = Depends(verify_admin_token),
    db:           Session = Depends(get_db)
):
    email  = current_user.get("sub")
    seller = db.query(Seller).filter(Seller.email == email).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")

    products = db.query(Product).filter(Product.seller_id == seller.id).all()

    return [
        {
            "id":          p.id,
            "name":        p.name,
            "price":       p.price,
            "category":    p.category,
            "description": p.description,
            "image_emoji": p.image_emoji,
            "image_url":   p.image_url,
            "quantity":    p.quantity,
        }
        for p in products
    ]


@router.put("/seller/products/{product_id}")
def update_seller_product(
    product_id:   int,
    data:         ProductUpdate,
    current_user: dict    = Depends(verify_admin_token),
    db:           Session = Depends(get_db)
):
    email  = current_user.get("sub")
    seller = db.query(Seller).filter(Seller.email == email).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")

    product = db.query(Product).filter(
        Product.id        == product_id,
        Product.seller_id == seller.id
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.name        = data.name
    product.price       = data.price
    product.category    = data.category
    product.description = data.description
    product.image_emoji = data.image_emoji
    product.image_url   = data.image_url
    product.quantity    = data.quantity

    db.commit()
    db.refresh(product)
    return {"status": "success", "product_id": product.id}


@router.delete("/seller/products/{product_id}")
def delete_seller_product(
    product_id:   int,
    current_user: dict    = Depends(verify_admin_token),
    db:           Session = Depends(get_db)
):
    email  = current_user.get("sub")
    seller = db.query(Seller).filter(Seller.email == email).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")

    product = db.query(Product).filter(
        Product.id        == product_id,
        Product.seller_id == seller.id
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    db.delete(product)
    db.commit()
    return {"status": "success", "message": "Product deleted"}