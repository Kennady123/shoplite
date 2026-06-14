import os
import hmac
import hashlib
import razorpay
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

KEY_ID = os.getenv("RAZORPAY_KEY_ID")
KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")

client = razorpay.Client(auth=(KEY_ID, KEY_SECRET))


# ── Request models ──────────────────────────────────────────
class CreateOrderRequest(BaseModel):
    amount: float        # in INR  e.g. 1500.00
    currency: str = "INR"


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


# ── POST /api/create-order ──────────────────────────────────
@router.post("/create-order")
def create_order(data: CreateOrderRequest):
    try:
        order = client.order.create({
            "amount": int(data.amount * 100),   # convert ₹ to paise
            "currency": data.currency,
            "payment_capture": 1,               # auto-capture payment
        })
        return {
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "key_id": KEY_ID,                   # frontend needs this to open popup
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Order creation failed: {str(e)}")


# ── POST /api/verify-payment ────────────────────────────────
@router.post("/verify-payment")
def verify_payment(data: VerifyPaymentRequest):

    try:
        # Build the message Razorpay signed
        message = f"{data.razorpay_order_id}|{data.razorpay_payment_id}"

        # Recompute HMAC-SHA256 using our secret key
        expected_signature = hmac.new(
            KEY_SECRET.encode("utf-8"),
            message.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()

        # Compare — use hmac.compare_digest to prevent timing attacks
        if not hmac.compare_digest(expected_signature, data.razorpay_signature):
            raise HTTPException(status_code=400, detail="Invalid payment signature")

        return {
            "success": True,
            "payment_id": data.razorpay_payment_id,
            "order_id": data.razorpay_order_id,
            "message": "Payment verified successfully",
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")
