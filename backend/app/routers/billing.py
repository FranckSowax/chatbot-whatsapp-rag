from fastapi import APIRouter, HTTPException, Depends
from app.database import get_supabase
from app.services.auth_service import get_current_user
from supabase import Client

router = APIRouter(prefix="/billing", tags=["Billing"])


@router.get("/usage")
async def get_usage(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    try:
        profile = supabase.table("profiles").select("plan_id").eq("id", current_user["id"]).single().execute()
        
        messages = supabase.table("messages").select("id", count="exact").eq("customer_id", current_user["id"]).execute()
        message_count = messages.count or 0
        
        documents = supabase.table("documents").select("id", count="exact").eq("owner_id", current_user["id"]).execute()
        document_count = documents.count or 0
        
        plan_limits = {
            "monthly_request_limit": 1000,
            "storage_limit_mb": 100
        }
        
        if profile.data and profile.data.get("plan_id"):
            plan = supabase.table("subscriptions").select("*").eq("id", profile.data["plan_id"]).single().execute()
            if plan.data:
                plan_limits = plan.data
        
        return {
            "current_usage": {
                "messages": message_count,
                "documents": document_count
            },
            "limits": plan_limits
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/invoices")
async def get_invoices(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    try:
        response = supabase.table("billing_records").select("*").eq("customer_id", current_user["id"]).order("period_start", desc=True).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
