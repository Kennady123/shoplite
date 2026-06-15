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

# FIX: If keys are missing, crash loud at startup instead of silently failing
if not KEY_ID or not KEY_SECRET:
    raise RuntimeError("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in .env file!")

client = razorpay.Client(auth=(KEY_ID, KEY_SECRET))


class CreateOrderRequest(BaseModel):
    amount: float
    currency: str = "INR"


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


@router.post("/create-order")
def create_order(data: CreateOrderRequest):
    # FIX: Validate amount is positive
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")
    try:
        order = client.order.create({
            "amount": int(data.amount * 100),  # convert ₹ to paise
            "currency": data.currency,
            "payment_capture": 1,              # auto-capture payment
        })
        return {
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "key_id": KEY_ID,                  # frontend needs this to open popup
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Order creation failed: {str(e)}")


@router.post("/verify-payment")
def verify_payment(data: VerifyPaymentRequest):
    try:
        message = f"{data.razorpay_order_id}|{data.razorpay_payment_id}"

        expected_signature = hmac.new(
            KEY_SECRET.encode("utf-8"),
            message.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()

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