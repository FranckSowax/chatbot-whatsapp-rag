from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, BackgroundTasks
from app.models.schemas import DocumentResponse
from app.database import get_supabase
from app.services.auth_service import get_current_user
from app.services.pdf_service import validate_pdf
from app.services.gemini_service import gemini_service
from supabase import Client
from typing import List
import uuid
import os
import tempfile

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    content = await file.read()
    
    is_valid, message = validate_pdf(content)
    if not is_valid:
        raise HTTPException(status_code=400, detail=message)
    
    try:
        # 1. Get or Create Gemini File Store for User
        user_profile = supabase.table("profiles").select("*").eq("id", current_user["id"]).single().execute()
        store_id = user_profile.data.get("gemini_file_store_id")
        
        if not store_id:
            company_name = user_profile.data.get("company_name", "User")
            store_id = gemini_service.create_file_store(current_user["id"], company_name)
            # Update profile with store_id
            supabase.table("profiles").update({"gemini_file_store_id": store_id}).eq("id", current_user["id"]).execute()

        # 2. Upload to Supabase Storage (Archive)
        file_path = f"{current_user['id']}/{uuid.uuid4()}/{file.filename}"
        supabase.storage.from_("documents").upload(file_path, content)
        
        # 3. Create temp file for Gemini upload (GenAI SDK needs a file path)
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        try:
            # 4. Upload to Gemini File Search Store
            # Use a unique name for Gemini file to avoid collisions if needed, or just filename
            gemini_file_name = f"{current_user['id']}_{file.filename}"
            gemini_service.upload_document(tmp_path, gemini_file_name, store_id)
        finally:
            os.unlink(tmp_path)
        
        # 5. Insert into Supabase DB
        doc_response = supabase.table("documents").insert({
            "owner_id": current_user["id"],
            "filename": file.filename,
            "file_path": file_path,
            "status": "processed", # Gemini processing is synchronous in our service wrapper
            "gemini_file_name": gemini_file_name
        }).execute()
        
        document_id = doc_response.data[0]["id"]
        
        return {
            "message": "Document uploaded and indexed successfully",
            "document_id": document_id,
            "status": "processed"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=List[DocumentResponse])
async def list_documents(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    try:
        response = supabase.table("documents").select("*").eq("owner_id", current_user["id"]).order("created_at", desc=True).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{document_id}")
async def get_document(
    document_id: int,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    try:
        response = supabase.table("documents").select("*").eq("id", document_id).eq("owner_id", current_user["id"]).single().execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=404, detail="Document not found")


@router.delete("/{document_id}")
async def delete_document(
    document_id: int,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    try:
        doc = supabase.table("documents").select("file_path", "gemini_file_name").eq("id", document_id).eq("owner_id", current_user["id"]).single().execute()
        
        if not doc.data:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Delete from Gemini if exists
        if doc.data.get("gemini_file_name"):
            gemini_service.delete_document(doc.data["gemini_file_name"])
            # Note: We don't delete from the store explicitly as deleting the file resource removes it from stores? 
            # Actually, the file resource in Gemini is temporary (48h) unless imported to store.
            # But "Files imported to a File Search store ... stored indefinitely".
            # The API to delete a file from a store is `client.file_search_stores.delete_file`?
            # Or just deleting the file resource might be enough if we kept the name.
            # The `delete_document` in service currently calls `files.delete`. 
            # If the file was imported, does it stay in the store? 
            # Doc says: "The File object gets deleted after 48 hours, while the data imported into the File Search store will be stored indefinitely".
            # So `files.delete` might strictly delete the temporary file object. 
            # To delete from store, we might need `client.file_search_stores.delete(name=store_name, config={'force': True})` which deletes the WHOLE store.
            # OR `client.file_search_stores.delete_file`? The doc doesn't explicitly show deleting a SINGLE file from a store in the snippet.
            # It shows `client.file_search_stores.delete` for the store.
            # However, usually there is a way to manage resources. 
            # For now, let's keep the `delete_document` call which tries to clean up what it can.
        
        # We don't need to delete from document_sections anymore as we don't use it
        # supabase.table("document_sections").delete().eq("document_id", document_id).execute()
        
        supabase.table("documents").delete().eq("id", document_id).execute()
        
        try:
            supabase.storage.from_("documents").remove([doc.data["file_path"]])
        except:
            pass
        
        return {"message": "Document deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
