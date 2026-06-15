from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    credentials=pwd_context.verify(plain_password, hashed_password)
    return credentials
def get_password_hash(password: str) -> str:
    credentials=pwd_context.hash(password)
    return credentials







