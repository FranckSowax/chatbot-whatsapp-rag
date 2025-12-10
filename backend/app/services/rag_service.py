import google.generativeai as genai
from app.config import get_settings
from app.database import get_supabase
from app.services.gemini_service import gemini_service
from typing import List, Dict, Any

settings = get_settings()

async def process_rag_query(query: str, owner_id: str, custom_prompt: str = None) -> str:
    supabase = get_supabase()
    
    # Get the user's Gemini File Store ID
    user_profile = supabase.table("profiles").select("gemini_file_store_id").eq("id", owner_id).single().execute()
    store_id = user_profile.data.get("gemini_file_store_id")
    
    if not store_id:
        return "Aucun document n'a encore été indexé pour ce chatbot. Veuillez uploader des documents d'abord."
    
    try:
        # Use Gemini File Search Tool
        response = gemini_service.generate_response(query, store_id, custom_prompt)
        return response
    except Exception as e:
        print(f"Error in RAG generation: {e}")
        return "Je suis désolé, je n'ai pas pu générer une réponse pour le moment."

