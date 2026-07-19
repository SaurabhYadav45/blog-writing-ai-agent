from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlmodel import Session
from app.core.db import get_session
from app.models.user import User
from app.models.payment import PaymentTransaction
from app.api.deps import get_current_user
from app.core.email import send_payment_receipt_email
from app.core.config import settings
import razorpay
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
from sqlmodel import select

router = APIRouter()

# Initialize razorpay client
client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

class PaymentVerification(BaseModel):
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str

@router.post("/create-order")
def create_order(current_user: User = Depends(get_current_user)):
    """
    Creates a new Razorpay order for purchasing the Pro plan (50 credits).
    The amount is in paise (49900 = 499 INR).
    """
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        raise HTTPException(status_code=500, detail="Razorpay credentials not configured.")
        
    try:
        amount = 49900 
        currency = "INR"
        
        data = {
            "amount": amount,
            "currency": currency,
            "receipt": f"receipt_user_{current_user.id}",
            "payment_capture": 1 # Auto capture payment
        }
        
        order = client.order.create(data=data)
        # order is a dictionary with id, amount, currency, status, etc.
        return order
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/verify-payment")
def verify_payment(
    payment_data: PaymentVerification, 
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Verifies the Razorpay payment signature using the secret key.
    If valid, upgrades the user's plan and adds 50 credits.
    """
    try:
        params_dict = {
            'razorpay_order_id': payment_data.razorpay_order_id,
            'razorpay_payment_id': payment_data.razorpay_payment_id,
            'razorpay_signature': payment_data.razorpay_signature
        }
        
        # Will throw SignatureVerificationError if invalid
        client.utility.verify_payment_signature(params_dict)
        
        # Payment is authentic, upgrade the user
        current_user.plan_name = "Pro"
        current_user.credits += 50
        
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        if current_user.plan_expires_at and current_user.plan_expires_at > now:
            current_user.plan_expires_at = current_user.plan_expires_at + timedelta(days=30)
        else:
            current_user.plan_expires_at = now + timedelta(days=30)
            
        payment_tx = PaymentTransaction(
            user_id=current_user.id,
            razorpay_order_id=payment_data.razorpay_order_id,
            razorpay_payment_id=payment_data.razorpay_payment_id,
            amount=49900,
            currency="INR",
            status="success"
        )
        
        session.add(payment_tx)
        session.add(current_user)
        session.commit()
        session.refresh(current_user)
        
        # Send Receipt Email in background
        background_tasks.add_task(
            send_payment_receipt_email,
            email_to=current_user.email,
            amount_inr=499,
            order_id=payment_data.razorpay_order_id,
            plan_name=current_user.plan_name
        )
        
        return {
            "status": "success", 
            "message": "Payment verified and plan upgraded.", 
            "plan_name": current_user.plan_name,
            "credits": current_user.credits,
            "plan_expires_at": current_user.plan_expires_at
        }
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Razorpay signature verification failed.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history")
def get_payment_history(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Returns a list of successful payments for the current user.
    """
    statement = select(PaymentTransaction).where(PaymentTransaction.user_id == current_user.id).order_by(PaymentTransaction.created_at.desc())
    payments = session.exec(statement).all()
    return payments
