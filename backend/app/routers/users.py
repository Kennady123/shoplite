from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from database import get_db, User
from jose import jwt
import bcrypt
from hash_script import verify_password,get_password_hash
from .admin import create_access_token,verify_admin_token


router = APIRouter()

class RegisterRequest(BaseModel):
    name:     str
    email:    EmailStr
    phone:    str
    password: str
class LoginRequest(BaseModel):
    email:    EmailStr
    password: str




@router.post("/register")
def register(data: RegisterRequest, db: Session = Depends(get_db)):

    if not data.name.strip():
        raise HTTPException(status_code=400, detail="Name cannot be empty")
    if len(data.phone) < 10:
        raise HTTPException(status_code=400, detail="Enter a valid phone number")
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    existing_phone = db.query(User).filter(User.phone == data.phone).first()
    if existing_phone:
        raise HTTPException(status_code=400,detail="A user with this phone number already exists.")

    hashed = get_password_hash(data.password)
    user = User(
        name     = data.name.strip(),
        email    = data.email,
        phone    = data.phone,
        password = hashed
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "message": "Registration successful",
        "user": {
            "id":    user.id,
            "name":  user.name,
            "email": user.email,
            "phone": user.phone,
        }
    }
@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    match = verify_password(data.password, user.password)
    if not match:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    token_payload = {"sub": user.email}
    token = create_access_token(token_payload)
    return {
        "message": "Login successful",
        "access_token": token,
        "user": {
            "id":    user.id,
            "name":  user.name,
            "email": user.email,
            "phone": user.phone,
        }
    }

