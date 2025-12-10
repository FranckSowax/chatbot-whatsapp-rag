-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Users/Profiles table (linked to Supabase Auth)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  email TEXT NOT NULL,
  company_name TEXT,
  manychat_api_key TEXT,
  webhook_url TEXT,
  chatbot_prompt TEXT DEFAULT 'Tu es un assistant client utile. Utilise UNIQUEMENT le contexte ci-dessous pour répondre à la question. Si la réponse n''est pas dans le contexte, dis poliment que tu ne sais pas.',
  api_key_generee UUID DEFAULT gen_random_uuid(),
  role TEXT NOT NULL DEFAULT 'account_user' CHECK(role IN ('global_admin', 'account_user', 'support_user')),
  plan_id UUID,
  stripe_customer_id TEXT,
  stripe_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Subscription Plans
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  monthly_request_limit INT NOT NULL DEFAULT 1000,
  storage_limit_mb INT NOT NULL DEFAULT 100,
  price_cents INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add foreign key after subscriptions table exists
ALTER TABLE public.profiles ADD CONSTRAINT profiles_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.subscriptions(id);

-- Documents table
CREATE TABLE public.documents (
  id BIGSERIAL PRIMARY KEY,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'processed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Document sections/chunks with vector embeddings (768 dimensions for Gemini)
CREATE TABLE public.document_sections (
  id BIGSERIAL PRIMARY KEY,
  document_id BIGINT REFERENCES public.documents(id) ON DELETE CASCADE,
  chunk_index INT,
  content TEXT NOT NULL,
  embedding vector(768)
);

-- Messages (conversation history)
CREATE TABLE public.messages (
  id BIGSERIAL PRIMARY KEY,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_phone TEXT NOT NULL,
  direction TEXT NOT NULL CHECK(direction IN ('inbound', 'outbound')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Billing records
CREATE TABLE public.billing_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  amount_cents INT NOT NULL DEFAULT 0,
  overage_cents INT NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_documents_owner_id ON public.documents(owner_id);
CREATE INDEX idx_documents_status ON public.documents(status);
CREATE INDEX idx_document_sections_document_id ON public.document_sections(document_id);
CREATE INDEX idx_messages_customer_id ON public.messages(customer_id);
CREATE INDEX idx_messages_user_phone ON public.messages(user_phone);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);

-- Vector similarity search index
CREATE INDEX idx_document_sections_embedding ON public.document_sections 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Function for vector similarity search with multi-tenant isolation
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  filter_owner_id uuid
)
RETURNS TABLE (
  id bigint,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    document_sections.id,
    document_sections.content,
    1 - (document_sections.embedding <=> query_embedding) AS similarity
  FROM document_sections
  JOIN documents ON documents.id = document_sections.document_id
  WHERE 1 - (document_sections.embedding <=> query_embedding) > match_threshold
  AND documents.owner_id = filter_owner_id
  ORDER BY document_sections.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to get conversations grouped by user
CREATE OR REPLACE FUNCTION get_conversations(filter_customer_id uuid)
RETURNS TABLE (
  user_phone text,
  last_message_at timestamp with time zone,
  message_count bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.user_phone,
    MAX(m.created_at) AS last_message_at,
    COUNT(*) AS message_count
  FROM messages m
  WHERE m.customer_id = filter_customer_id
  GROUP BY m.user_phone
  ORDER BY last_message_at DESC;
END;
$$;

-- Row Level Security Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_records ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only see their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Documents: users can only access their own documents
CREATE POLICY "Users can view own documents" ON public.documents
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can insert own documents" ON public.documents
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can delete own documents" ON public.documents
  FOR DELETE USING (owner_id = auth.uid());

-- Document sections: access through document ownership
CREATE POLICY "Users can view own document sections" ON public.document_sections
  FOR SELECT USING (
    document_id IN (SELECT id FROM documents WHERE owner_id = auth.uid())
  );

-- Messages: users can only access their own messages
CREATE POLICY "Users can view own messages" ON public.messages
  FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "Users can insert own messages" ON public.messages
  FOR INSERT WITH CHECK (customer_id = auth.uid());

-- Billing: users can only view their own billing records
CREATE POLICY "Users can view own billing" ON public.billing_records
  FOR SELECT USING (customer_id = auth.uid());

-- Insert default subscription plans
INSERT INTO public.subscriptions (name, monthly_request_limit, storage_limit_mb, price_cents) VALUES
  ('Free', 100, 10, 0),
  ('Starter', 500, 50, 2900),
  ('Professional', 2000, 200, 7900),
  ('Enterprise', 10000, 1000, 19900);

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'account_user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
