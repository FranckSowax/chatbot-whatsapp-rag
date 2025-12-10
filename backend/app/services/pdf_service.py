from PyPDF2 import PdfReader
from typing import List, Tuple
import io
# from app.services.rag_service import create_embedding  <-- Removed to break circular dependency and because it's deprecated
from app.database import get_supabase


def extract_text_from_pdf(pdf_content: bytes) -> str:
    pdf_file = io.BytesIO(pdf_content)
    reader = PdfReader(pdf_file)
    
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    
    return text


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
    chunks = []
    start = 0
    
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        
        if end < len(text):
            last_period = chunk.rfind('.')
            last_newline = chunk.rfind('\n')
            break_point = max(last_period, last_newline)
            
            if break_point > chunk_size // 2:
                chunk = text[start:start + break_point + 1]
                end = start + break_point + 1
        
        chunks.append(chunk.strip())
        start = end - overlap
    
    return [c for c in chunks if c]


def validate_pdf(pdf_content: bytes, max_size_mb: int = 20, max_pages: int = 200) -> Tuple[bool, str]:
    size_mb = len(pdf_content) / (1024 * 1024)
    if size_mb > max_size_mb:
        return False, f"File size ({size_mb:.1f}MB) exceeds limit of {max_size_mb}MB"
    
    try:
        pdf_file = io.BytesIO(pdf_content)
        reader = PdfReader(pdf_file)
        num_pages = len(reader.pages)
        
        if num_pages > max_pages:
            return False, f"Page count ({num_pages}) exceeds limit of {max_pages} pages"
        
        text = ""
        for page in reader.pages[:3]:
            text += page.extract_text() or ""
        
        if len(text.strip()) < 100:
            return False, "PDF appears to be image-based or has no extractable text"
        
        return True, "Valid PDF"
    except Exception as e:
        return False, f"Invalid PDF file: {str(e)}"


# Deprecated: process_document is no longer used as we upload directly to Gemini
# async def process_document(document_id: int, owner_id: str, pdf_content: bytes):
#     supabase = get_supabase()
#     
#     try:
#         supabase.table("documents").update({"status": "processing"}).eq("id", document_id).execute()
#         
#         text = extract_text_from_pdf(pdf_content)
#         chunks = chunk_text(text)
#         
#         for idx, chunk in enumerate(chunks):
#             embedding = create_embedding(chunk)
#             
#             supabase.table("document_sections").insert({
#                 "document_id": document_id,
#                 "chunk_index": idx,
#                 "content": chunk,
#                 "embedding": embedding
#             }).execute()
#         
#         supabase.table("documents").update({"status": "processed"}).eq("id", document_id).execute()
#         
#     except Exception as e:
#         supabase.table("documents").update({
#             "status": "failed",
#             "error_message": str(e)
#         }).eq("id", document_id).execute()
#         raise

