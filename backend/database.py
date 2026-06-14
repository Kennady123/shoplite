from sqlalchemy import create_engine, Integer, Column, String, Float
from sqlalchemy.orm import sessionmaker,declarative_base
from dotenv import load_dotenv
import os

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
sessionLocal = sessionmaker(autoflush=False,autocommit=False,bind=engine)
Base=declarative_base()

class Product(Base):
    __tablename__ = "product"
    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)
    price = Column(Float, nullable=False)
    category = Column(String(200), nullable=False)
    description = Column(String(200), nullable=False)
    image_emoji = Column(String(200), nullable=False)

class Admin(Base):
    __tablename__ = "admin"
    id = Column(Integer, primary_key=True,autoincrement=True)
    email = Column(String(200),unique=True,nullable=False)
    password = Column(String(200),nullable=False)

def get_db():
    db=sessionLocal()
    try:
        yield db
    finally:
        db.close()