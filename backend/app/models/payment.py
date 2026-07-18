from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime, timezone

class PaymentTransaction(SQLModel, table=True):
    """
    Database representation of a Payment Transaction.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    razorpay_order_id: str = Field(index=True)
    razorpay_payment_id: str = Field(index=True)
    amount: int
    currency: str = Field(default="INR")
    status: str = Field(default="success")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
