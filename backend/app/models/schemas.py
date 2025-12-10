from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    company_name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserProfile(BaseModel):
    id: UUID
    email: str
    company_name: Optional[str] = None
    manychat_api_key: Optional[str] = None
    webhook_url: Optional[str] = None
    chatbot_prompt: Optional[str] = None
    role: str = "account_user"
    created_at: Optional[datetime] = None


class ProfileUpdate(BaseModel):
    company_name: Optional[str] = None
    manychat_api_key: Optional[str] = None
    chatbot_prompt: Optional[str] = None


class ChatbotPromptUpdate(BaseModel):
    chatbot_prompt: str


class DocumentUpload(BaseModel):
    filename: str
    file_path: str


class DocumentResponse(BaseModel):
    id: int
    owner_id: UUID
    filename: str
    file_path: str
    status: str
    created_at: datetime


class ManyChatWebhook(BaseModel):
    user_id: str
    first_name: Optional[str] = None
    last_text_input: str
    client_api_key: str


class MessageResponse(BaseModel):
    id: int
    customer_id: UUID
    user_phone: str
    direction: str
    content: str
    created_at: datetime


class SubscriptionPlan(BaseModel):
    id: UUID
    name: str
    monthly_request_limit: int
    storage_limit_mb: int
    price_cents: int
