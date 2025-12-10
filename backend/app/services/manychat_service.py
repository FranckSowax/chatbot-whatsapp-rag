import httpx
from typing import Optional, Dict, Any


async def send_to_manychat(user_id: str, text: str, token: str, buttons: Optional[list] = None) -> Dict[str, Any]:
    url = "https://api.manychat.com/fb/subscriber/sendContent"
    headers = {"Authorization": f"Bearer {token}"}
    
    content = {
        "type": "text",
        "text": text
    }
    
    if buttons:
        content["buttons"] = buttons
    
    body = {
        "subscriber_id": user_id,
        "data": {
            "version": "v2",
            "content": content
        },
        "message_tag": "ACCOUNT_UPDATE"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=body, headers=headers, timeout=10.0)
        return response.json()


async def validate_manychat_api_key(api_key: str) -> bool:
    url = "https://api.manychat.com/fb/page/getInfo"
    headers = {"Authorization": f"Bearer {api_key}"}
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers, timeout=10.0)
            return response.status_code == 200
    except Exception:
        return False
