from fastapi import APIRouter, HTTPException, Depends, Query
from app.models.schemas import MessageResponse
from app.database import get_supabase
from app.services.auth_service import get_current_user
from supabase import Client
from typing import List, Optional

router = APIRouter(prefix="/messages", tags=["Messages"])


@router.get("", response_model=List[MessageResponse])
async def list_messages(
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    user_phone: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    try:
        query = supabase.table("messages").select("*").eq("customer_id", current_user["id"])
        
        if user_phone:
            query = query.eq("user_phone", user_phone)
        
        response = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversations")
async def list_conversations(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    try:
        response = supabase.rpc(
            "get_conversations",
            {"filter_customer_id": current_user["id"]}
        ).execute()
        return response.data
    except Exception as e:
        response = supabase.table("messages").select(
            "user_phone, created_at"
        ).eq("customer_id", current_user["id"]).order("created_at", desc=True).execute()
        
        conversations = {}
        for msg in response.data:
            phone = msg["user_phone"]
            if phone not in conversations:
                conversations[phone] = {
                    "user_phone": phone,
                    "last_message_at": msg["created_at"],
                    "message_count": 0
                }
            conversations[phone]["message_count"] += 1
        
        return list(conversations.values())
