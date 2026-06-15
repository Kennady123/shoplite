from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta,timezone
from database import get_db,Admin,Seller
from hash_script import verify_password
from dotenv import load_dotenv
from jose import jwt,JWTError
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os

router = APIRouter()

security_scheme = HTTPBearer()
load_dotenv()

class Admindata(BaseModel):
    email :str
    password :str

SECRET_KEY = os.getenv('JWT_SECRET')

JWT_SECRET = SECRET_KEY
JWT_ALGORITHM = "HS256"
TOKEN_EXPIRATION_MINUTES = 50

def create_access_token(data:dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc)+timedelta(minutes=TOKEN_EXPIRATION_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_admin_token(credentials: HTTPAuthorizationCredentials = Depends(security_scheme)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=401,
                detail="Token payload is missing user identifiers."
            )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Session has expired or token is corrupt. Log in again."
        )


@router.post('/admin/login')
async def admin_login(user: Admindata, db: Session = Depends(get_db)):
    admin_user = db.query(Admin).filter(Admin.email == user.email).first()
    if not admin_user or not verify_password(user.password, admin_user.password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password"  # Security fix: Combined message
        )
    token_payload = {"sub": admin_user.email}
    token = create_access_token(token_payload)
    return {
        'message': 'Login successful',
        'access_token': token,
        'token_type': 'bearer'
    }


# 1. Verify token endpoint (call this on every frontend refresh)
@router.get('/admin/verify-token')
async def verify_token(payload: dict = Depends(verify_admin_token)):
    return {"valid": True, "email": payload.get("sub")}


# 2. Get sellers by status
@router.get('/admin/sellers')
async def get_sellers(status: str = "pending", db: Session = Depends(get_db), payload: dict = Depends(verify_admin_token)):
    sellers = db.query(Seller).filter(Seller.status == status).all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "email": s.email,
            "phone": s.phone,
            "business_name": s.business_name,
            "business_category": s.business_category,
            "business_address": s.business_address,
            "business_number": s.business_number,
            "status": s.status,
            "created_at": s.created_at
        }
        for s in sellers
    ]


# 3. Update seller status
class StatusUpdate(BaseModel):
    status: str  # "approved" or "rejected"

@router.put('/admin/sellers/{seller_id}')
async def update_seller_status(seller_id: int, body: StatusUpdate, db: Session = Depends(get_db), payload: dict = Depends(verify_admin_token)):
    seller = db.query(Seller).filter(Seller.id == seller_id).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")
    seller.status = body.status
    db.commit()
    return {"message": f"Seller status updated to {body.status}"}


from sqlalchemy import func

@router.get('/admin/sellers/counts')
async def get_seller_counts(db: Session = Depends(get_db), payload: dict = Depends(verify_admin_token)):
    rows = db.query(Seller.status, func.count(Seller.id)).group_by(Seller.status).all()
    counts = {"pending": 0, "approved": 0, "rejected": 0}
    for status, count in rows:
        if status in counts:
            counts[status] = count
    return counts