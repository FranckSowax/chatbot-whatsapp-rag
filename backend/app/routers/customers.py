from fastapi import APIRouter, HTTPException, Depends, Header
from app.models.schemas import UserProfile, ProfileUpdate, ChatbotPromptUpdate
from app.database import get_supabase
from app.services.auth_service import get_current_user
from supabase import Client
from uuid import UUID

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.get("/me", response_model=UserProfile)
async def get_profile(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    try:
        response = supabase.table("profiles").select("*").eq("id", current_user["id"]).single().execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=404, detail="Profile not found")


@router.patch("/me")
async def update_profile(
    profile_update: ProfileUpdate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    try:
        update_data = profile_update.model_dump(exclude_unset=True)
        response = supabase.table("profiles").update(update_data).eq("id", current_user["id"]).execute()
        return {"message": "Profile updated successfully", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/me/webhook-url")
async def get_webhook_url(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    try:
        response = supabase.table("profiles").select("id, api_key_generee").eq("id", current_user["id"]).single().execute()
        api_key = response.data.get("api_key_generee") or current_user["id"]
        webhook_url = f"https://api.votre-saas.com/webhook/incoming?client_api_key={api_key}"
        return {"webhook_url": webhook_url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/me/chatbot-prompt")
async def get_chatbot_prompt(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    try:
        response = supabase.table("profiles").select("chatbot_prompt").eq("id", current_user["id"]).single().execute()
        return {
            "chatbot_prompt": response.data.get("chatbot_prompt") or "Tu es un assistant client utile. Utilise UNIQUEMENT le contexte ci-dessous pour répondre à la question. Si la réponse n'est pas dans le contexte, dis poliment que tu ne sais pas."
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/me/chatbot-prompt")
async def update_chatbot_prompt(
    prompt_update: ChatbotPromptUpdate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    try:
        response = supabase.table("profiles").update({
            "chatbot_prompt": prompt_update.chatbot_prompt
        }).eq("id", current_user["id"]).execute()
        return {
            "message": "Chatbot prompt updated successfully",
            "chatbot_prompt": prompt_update.chatbot_prompt
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
