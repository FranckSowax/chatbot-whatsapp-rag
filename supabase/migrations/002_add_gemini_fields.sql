-- Add Gemini File Search Store ID to profiles
ALTER TABLE public.profiles ADD COLUMN gemini_file_store_id TEXT;

-- Add Gemini File Name to documents to track uploaded files
ALTER TABLE public.documents ADD COLUMN gemini_file_name TEXT;

-- We don't need document_sections table anymore if we use Gemini File Search exclusively,
-- but we can keep it for now or make it optional.
-- If we want to fully switch, we might want to drop it or just stop populating it.
-- For now, let's just add the columns.
