from fastapi import HTTPException, Header, Depends
from jose import jwt, JWTError
from app.config import get_settings
from app.database import get_supabase
from supabase import Client

settings = get_settings()


async def get_current_user(
    authorization: str = Header(...),
    supabase: Client = Depends(get_supabase)
) -> dict:
    try:
        if not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid authorization header")
        
        token = authorization.split(" ")[1]
        
        user_response = supabase.auth.get_user(token)
        
        if user_response.user:
            return {
                "id": str(user_response.user.id),
                "email": user_response.user.email,
                "role": user_response.user.user_metadata.get("role", "account_user")
            }
        
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")


async def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") != "global_admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user
