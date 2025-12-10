from google import genai
from google.genai import types
from app.config import get_settings
import time
import os
import logging

settings = get_settings()
logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        # Initialize the new Gen AI Client
        self.client = genai.Client(api_key=settings.gemini_api_key)
        
    def create_file_store(self, user_id: str, company_name: str = None) -> str:
        """
        Creates a new File Search Store for a user.
        Returns the name (ID) of the store.
        """
        display_name = f"store-{user_id}"
        if company_name:
            # Sanitize company name to be safe for display name
            safe_name = "".join(c for c in company_name if c.isalnum() or c in "-_ ")
            display_name = f"{safe_name}-{user_id}"
            
        # Ensure display name is not too long
        display_name = display_name[:512]
            
        logger.info(f"Creating Gemini File Search Store: {display_name}")
        file_search_store = self.client.file_search_stores.create(
            config={'display_name': display_name}
        )
        return file_search_store.name

    def upload_document(self, file_path: str, file_name: str, store_name: str) -> None:
        """
        Uploads a file and imports it into the specified File Search Store.
        Waits for the operation to complete.
        """
        logger.info(f"Uploading file {file_name} to Gemini Store {store_name}")
        
        # 1. Upload file to Gemini Files API
        uploaded_file = self.client.files.upload(
            file=file_path,
            config={'name': file_name}
        )
        
        logger.info(f"File uploaded to Gemini: {uploaded_file.name}. Importing to store...")
        
        # 2. Import into File Search Store
        operation = self.client.file_search_stores.import_file(
            file_search_store_name=store_name,
            file_name=uploaded_file.name
        )
        
        # 3. Wait for completion
        while not operation.done:
            time.sleep(1)
            operation = self.client.operations.get(operation)
            
        # Check for errors in the operation result
        if operation.result and hasattr(operation.result, 'error') and operation.result.error:
            error_msg = f"File import failed: {operation.result.error}"
            logger.error(error_msg)
            raise Exception(error_msg)
            
        logger.info("File successfully imported to Gemini File Search Store")

    def generate_response(self, query: str, store_name: str, custom_prompt: str = None) -> str:
        """
        Generates a response using the File Search tool.
        """
        default_prompt = "Tu es un assistant client utile. Utilise UNIQUEMENT le contexte ci-dessous pour répondre à la question. Si la réponse n'est pas dans le contexte, dis poliment que tu ne sais pas."
        system_instruction = custom_prompt if custom_prompt else default_prompt
        
        logger.info(f"Generating response with Gemini RAG from store {store_name}")
        
        response = self.client.models.generate_content(
            model="gemini-1.5-pro", 
            contents=query,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                tools=[
                    types.Tool(
                        file_search=types.FileSearch(
                            file_search_store_names=[store_name]
                        )
                    )
                ]
            )
        )
        return response.text

    def delete_document(self, file_name: str):
        """
        Deletes a file from Gemini.
        """
        try:
            self.client.files.delete(name=file_name)
            logger.info(f"Deleted file {file_name} from Gemini")
        except Exception as e:
            logger.error(f"Error deleting file from Gemini: {e}")

# Singleton instance
gemini_service = GeminiService()
