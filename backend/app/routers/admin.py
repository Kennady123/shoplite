from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta,timezone
from database import get_db,Admin
from jose import jwt,JWTError
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
router = APIRouter()
security_scheme = HTTPBearer()

class Admindata(BaseModel):
    email :str
    password :str



JWT_SECRET = "YOUR_SUPER_SECRET_COMPLEX_KEY_HERE"
JWT_ALGORITHM = "HS256"
TOKEN_EXPIRATION_MINUTES = 10

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
async def admin_login(user:Admindata,db:Session = Depends(get_db)):
    data=db.query(Admin).filter(Admin.email==user.email).first()
    if not data:
        raise HTTPException(status_code=401,detail="Incorrect email")
    if data.password != user.password:
        raise HTTPException(status_code=401,detail="Incorrect password")
    token_payload = {"sub": data.email}
    token=create_access_token(token_payload)
    return {'message':'Login successful','access_token':token}