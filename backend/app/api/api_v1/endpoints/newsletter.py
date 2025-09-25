from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel, EmailStr, Field
from typing import Dict, Any
from datetime import datetime

from app.core.database import get_db
from app.models.newsletter import NewsletterSubscription

router = APIRouter()


class NewsletterSubscribeRequest(BaseModel):
    email: EmailStr = Field(..., description="Email address to subscribe")
    source: str = Field(default="landing_page", description="Source of subscription")


class NewsletterSubscribeResponse(BaseModel):
    message: str
    email: str
    subscribed_at: datetime
    is_new_subscription: bool


@router.post("/subscribe", response_model=NewsletterSubscribeResponse)
def subscribe_to_newsletter(
    request: NewsletterSubscribeRequest,
    db: Session = Depends(get_db)
) -> NewsletterSubscribeResponse:
    """
    Subscribe an email address to the newsletter
    """
    try:
        # Check if email already exists
        existing_subscription = db.query(NewsletterSubscription).filter(
            NewsletterSubscription.email == request.email.lower()
        ).first()

        if existing_subscription:
            if existing_subscription.is_active:
                # Already subscribed and active
                return NewsletterSubscribeResponse(
                    message="Email is already subscribed to our newsletter",
                    email=existing_subscription.email,
                    subscribed_at=existing_subscription.subscribed_at,
                    is_new_subscription=False
                )
            else:
                # Reactivate subscription
                existing_subscription.is_active = True
                existing_subscription.unsubscribed_at = None
                existing_subscription.subscribed_at = datetime.utcnow()
                db.commit()
                
                return NewsletterSubscribeResponse(
                    message="Successfully resubscribed to newsletter",
                    email=existing_subscription.email,
                    subscribed_at=existing_subscription.subscribed_at,
                    is_new_subscription=False
                )

        # Create new subscription
        new_subscription = NewsletterSubscription(
            email=request.email.lower(),
            source=request.source,
            is_active=True
        )

        db.add(new_subscription)
        db.commit()
        db.refresh(new_subscription)

        return NewsletterSubscribeResponse(
            message="Successfully subscribed to newsletter",
            email=new_subscription.email,
            subscribed_at=new_subscription.subscribed_at,
            is_new_subscription=True
        )

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Email address is already subscribed"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Internal server error while processing subscription"
        )


@router.post("/unsubscribe")
def unsubscribe_from_newsletter(
    request: NewsletterSubscribeRequest,
    db: Session = Depends(get_db)
) -> Dict[str, str]:
    """
    Unsubscribe an email address from the newsletter
    """
    try:
        subscription = db.query(NewsletterSubscription).filter(
            NewsletterSubscription.email == request.email.lower(),
            NewsletterSubscription.is_active == True
        ).first()

        if not subscription:
            raise HTTPException(
                status_code=404,
                detail="Email address is not subscribed or already unsubscribed"
            )

        subscription.is_active = False
        subscription.unsubscribed_at = datetime.utcnow()
        db.commit()

        return {"message": "Successfully unsubscribed from newsletter"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Internal server error while processing unsubscription"
        )

