from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import products, payments,admin,users,seller
from database import engine, Base
import os
app = FastAPI(title="ShopLite API", version="1.0.0")

_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000")
origins = [o.strip() for o in _origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
Base.metadata.create_all(engine)
app.include_router(products.router, prefix="/api")
app.include_router(payments.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(seller.router, prefix="/api")
@app.get("/")
def root():
    return {"message": "ShopLite API is running"}
