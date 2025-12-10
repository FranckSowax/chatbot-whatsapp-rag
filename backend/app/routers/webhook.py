from fastapi import APIRouter, BackgroundTasks, HTTPException
from app.models.schemas import ManyChatWebhook
from app.database import get_supabase
from app.services.rag_service import process_rag_query
from app.services.manychat_service import send_to_manychat

router = APIRouter(prefix="/webhook", tags=["Webhook"])


@router.post("/incoming")
async def handle_manychat_webhook(
    payload: ManyChatWebhook,
    background_tasks: BackgroundTasks
):
    background_tasks.add_task(process_chat, payload)
    return {"status": "ok"}


async def process_chat(payload: ManyChatWebhook):
    supabase = get_supabase()
    
    try:
        response = supabase.table("profiles").select(
            "id, manychat_api_key, chatbot_prompt"
        ).eq("api_key_generee", payload.client_api_key).execute()
        
        if not response.data:
            response = supabase.table("profiles").select(
                "id, manychat_api_key, chatbot_prompt"
            ).eq("id", payload.client_api_key).execute()
        
        if not response.data:
            print(f"Client not found for api_key: {payload.client_api_key}")
            return
        
        client_data = response.data[0]
        owner_id = client_data["id"]
        manychat_token = client_data["manychat_api_key"]
        custom_prompt = client_data.get("chatbot_prompt")
        
        if not manychat_token:
            print(f"No ManyChat API key configured for client: {owner_id}")
            return
        
        supabase.table("messages").insert({
            "customer_id": owner_id,
            "user_phone": payload.user_id,
            "direction": "inbound",
            "content": payload.last_text_input
        }).execute()
        
        ai_response = await process_rag_query(
            payload.last_text_input,
            owner_id,
            custom_prompt
        )
        
        supabase.table("messages").insert({
            "customer_id": owner_id,
            "user_phone": payload.user_id,
            "direction": "outbound",
            "content": ai_response
        }).execute()
        
        await send_to_manychat(payload.user_id, ai_response, manychat_token)
        
    except Exception as e:
        print(f"Error processing chat: {str(e)}")
        raise
