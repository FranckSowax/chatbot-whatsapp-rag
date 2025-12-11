import google.generativeai as genai
import requests
import time
import logging
from app.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

# Configure SDK for file upload helper
genai.configure(api_key=settings.gemini_api_key)

class GeminiService:
    def __init__(self):
        self.api_key = settings.gemini_api_key
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"

    def _get_headers(self):
        return {"Content-Type": "application/json"}

    def create_file_store(self, user_id: str, company_name: str = None) -> str:
        """Creates a new File Search Store via REST API."""
        display_name = f"store-{user_id}"
        if company_name:
            safe_name = "".join(c for c in company_name if c.isalnum() or c in "-_ ")
            display_name = f"{safe_name}-{user_id}"
        display_name = display_name[:512]

        url = f"{self.base_url}/fileSearchStores?key={self.api_key}"
        payload = {"displayName": display_name}
        
        logger.info(f"Creating Store: {display_name}")
        response = requests.post(url, headers=self._get_headers(), json=payload)
        if response.status_code != 200:
            logger.error(f"Create Store Failed: {response.text}")
            response.raise_for_status()
        
        return response.json()["name"]

    def upload_document(self, file_path: str, file_name: str, store_name: str) -> str:
        """Uploads file using SDK, then imports to Store using REST. Returns the Gemini File Resource Name."""
        logger.info(f"Uploading file {file_name} to Gemini via SDK...")
        
        try:
            # 1. Upload to Gemini Files API using SDK (handles mime types and protocol)
            g_file = genai.upload_file(path=file_path, display_name=file_name)
            logger.info(f"Uploaded to Gemini: {g_file.name}")
            
            # 2. Import into File Search Store via REST
            url = f"{self.base_url}/{store_name}:importFile?key={self.api_key}"
            payload = {"fileName": g_file.name} 
            
            logger.info(f"Importing {g_file.name} into {store_name}")
            response = requests.post(url, headers=self._get_headers(), json=payload)
            if response.status_code != 200:
                logger.error(f"Import Failed: {response.text}")
                response.raise_for_status()
            
            operation = response.json()
            op_name = operation["name"]
            
            # 3. Poll operation status
            while True:
                time.sleep(1)
                op_url = f"{self.base_url}/{op_name}?key={self.api_key}"
                op_resp = requests.get(op_url)
                op_resp.raise_for_status()
                op_data = op_resp.json()
                
                if op_data.get("done"):
                    if "error" in op_data:
                        raise Exception(f"Import failed: {op_data['error']}")
                    break
            
            logger.info("Import complete")
            return g_file.name
            
        except Exception as e:
            logger.error(f"Upload/Import failed: {e}")
            raise

    def generate_response(self, query: str, store_name: str, custom_prompt: str = None) -> str:
        # Using gemini-2.5-flash as it is supported and available
        url = f"{self.base_url}/models/gemini-2.5-flash:generateContent?key={self.api_key}"
        
        default_prompt = "Tu es un assistant client utile. Utilise UNIQUEMENT le contexte ci-dessous pour répondre à la question. Si la réponse n'est pas dans le contexte, dis poliment que tu ne sais pas."
        system_instruction = custom_prompt if custom_prompt else default_prompt
        
        # Payload for REST API (Snake case is required for v1beta tools)
        payload = {
            "contents": [{
                "parts": [{"text": query}]
            }],
            "system_instruction": {
                "parts": [{"text": system_instruction}]
            },
            "tools": [{
                "file_search": {
                    "file_search_store_names": [store_name]
                }
            }] 
        }
        
        response = requests.post(url, headers=self._get_headers(), json=payload)
        if response.status_code != 200:
             logger.error(f"Generation Failed: {response.text}")
             return "Désolé, une erreur technique est survenue lors de la génération."

        data = response.json()
        try:
            return data["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError):
            logger.error(f"Unexpected response format: {data}")
            return "Je n'ai pas trouvé de réponse pertinente dans les documents."

    def delete_document(self, file_name: str):
        # file_name should be 'files/xyz'
        try:
            genai.delete_file(file_name)
            logger.info(f"Deleted file {file_name}")
        except Exception as e:
            logger.error(f"Error deleting file: {e}")

gemini_service = GeminiService()
