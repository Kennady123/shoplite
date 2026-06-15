from sqlalchemy import create_engine, Integer, Column, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import sessionmaker, declarative_base, relationship
from dotenv import load_dotenv
import os
from datetime import datetime, timezone

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
sessionLocal = sessionmaker(autoflush=False, autocommit=False, bind=engine)
Base = declarative_base()


class Product(Base):
    __tablename__ = "product"
    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)
    price = Column(Float, nullable=False)
    category = Column(String(200), nullable=False)
    description = Column(String(200), nullable=False)
    image_emoji = Column(String(200), nullable=True)
    image_url = Column(String(500), nullable=True)
    quantity = Column(Integer, default=0, nullable=False)

    seller_id = Column(Integer, ForeignKey("sellers.id"), nullable=True)
    seller = relationship("Seller", back_populates="products")


class User(Base):
    __tablename__ = "users"
    id         = Column(Integer, primary_key=True, autoincrement=True)
    name       = Column(String(200), nullable=False)
    email      = Column(String(200), unique=True, nullable=False)
    phone      = Column(String(20), nullable=False, unique=True)
    password   = Column(String(200), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Seller(Base):
    __tablename__ = "sellers"

    id = Column(Integer, primary_key=True, autoincrement=True)

    name  = Column(String(200), nullable=False)
    email = Column(String(200), unique=True, nullable=False)
    phone = Column(String(20), unique=True, nullable=False)

    password = Column(String(200), nullable=False)

    business_name     = Column(String(200), nullable=False)
    business_category = Column(String(200), nullable=False)
    business_address  = Column(Text, nullable=False)
    business_number   = Column(String(100), nullable=False)
    status            = Column(String(50), default="pending", nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    products = relationship("Product", back_populates="seller")


class Admin(Base):
    __tablename__ = "admin"
    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(200), unique=True, nullable=False)
    password = Column(String(200), nullable=False)


def get_db():
    db = sessionLocal()
    try:
        yield db
    finally:
        db.close()