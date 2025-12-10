from fastapi import APIRouter, HTTPException, Depends
from app.models.schemas import UserCreate, UserLogin, UserProfile
from app.database import get_supabase
from supabase import Client

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup")
async def signup(user: UserCreate, supabase: Client = Depends(get_supabase)):
    try:
        auth_response = supabase.auth.sign_up({
            "email": user.email,
            "password": user.password
        })
        
        if auth_response.user:
            supabase.table("profiles").insert({
                "id": str(auth_response.user.id),
                "email": user.email,
                "company_name": user.company_name,
                "role": "account_user",
                "chatbot_prompt": "Tu es un assistant client utile. Utilise UNIQUEMENT le contexte ci-dessous pour répondre à la question. Si la réponse n'est pas dans le contexte, dis poliment que tu ne sais pas."
            }).execute()
            
            return {
                "message": "User created successfully",
                "user_id": str(auth_response.user.id)
            }
        
        raise HTTPException(status_code=400, detail="Failed to create user")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login")
async def login(user: UserLogin, supabase: Client = Depends(get_supabase)):
    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": user.email,
            "password": user.password
        })
        
        if auth_response.session:
            return {
                "access_token": auth_response.session.access_token,
                "refresh_token": auth_response.session.refresh_token,
                "user_id": str(auth_response.user.id)
            }
        
        raise HTTPException(status_code=401, detail="Invalid credentials")
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/logout")
async def logout(supabase: Client = Depends(get_supabase)):
    try:
        supabase.auth.sign_out()
        return {"message": "Logged out successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/password-reset")
async def password_reset(email: str, supabase: Client = Depends(get_supabase)):
    try:
        supabase.auth.reset_password_email(email)
        return {"message": "Password reset email sent"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
