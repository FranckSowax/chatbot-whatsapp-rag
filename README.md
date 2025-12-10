# WhatsApp RAG Chatbot SaaS

An intelligent middleware SaaS that connects WhatsApp (via ManyChat) with Google's Gemini Pro AI. Companies can upload PDF documents, have them automatically ingested into a vector database, and answer end-user questions on WhatsApp using Retrieval Augmented Generation (RAG).

## Features

- **Ultra-fast acknowledgment**: Respond to incoming WhatsApp messages in under 1 second
- **Accurate, contextual answers**: RAG with Supabase pgvector and Google Gemini Pro 1.5
- **Data isolation and security**: Strict multi-tenant separation and GDPR compliance
- **Simple onboarding**: One-click template install, drag-and-drop PDF upload
- **Customizable chatbot prompt**: Edit the AI system prompt from the dashboard
- **Analytics dashboard**: Monitor usage, response times, and satisfaction metrics

## Tech Stack

### Frontend
- **Next.js 14** with App Router
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Supabase Auth** for authentication
- **SWR** for data fetching

### Backend
- **Python 3.11+** with FastAPI
- **Supabase** (PostgreSQL + pgvector + Storage + Auth)
- **Google Gemini Pro 1.5** for AI generation
- **PyPDF2** for PDF text extraction

### Infrastructure
- **Vercel** for frontend hosting
- **Docker** for backend containerization
- **Supabase** for database and storage

## Project Structure

```
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   ├── app/             # App router pages
│   │   ├── components/      # React components
│   │   ├── contexts/        # React contexts (Auth)
│   │   └── lib/             # Utilities and API client
│   └── package.json
├── backend/                  # FastAPI backend application
│   ├── app/
│   │   ├── routers/         # API route handlers
│   │   ├── services/        # Business logic
│   │   └── models/          # Pydantic schemas
│   └── requirements.txt
├── supabase/
│   └── migrations/          # SQL migration files
└── documentation/           # Project documentation
```

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- Supabase account
- Google Cloud account (for Gemini API)
- ManyChat account

### 1. Supabase Setup

1. Create a new Supabase project
2. Run the migration in `supabase/migrations/001_initial_schema.sql`
3. Create a storage bucket named `documents`
4. Copy your project URL and keys

### 2. Frontend Setup

```bash
cd frontend
npm install

# Create .env.local with:
# NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
# NEXT_PUBLIC_API_URL=http://localhost:8000

npm run dev
```

### 3. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env with:
# SUPABASE_URL=your-supabase-url
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
# SUPABASE_ANON_KEY=your-anon-key
# GEMINI_API_KEY=your-gemini-api-key

uvicorn app.main:app --reload
```

### 4. ManyChat Configuration

1. Get your ManyChat API key from Settings → API
2. Enter it in the dashboard under Integrations
3. Copy your webhook URL
4. Create a flow with an External Request action pointing to your webhook

## API Endpoints

### Authentication
- `POST /api/v1/auth/signup` - Create account
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/logout` - Logout

### Customer Profile
- `GET /api/v1/customers/me` - Get profile
- `PATCH /api/v1/customers/me` - Update profile
- `GET /api/v1/customers/me/chatbot-prompt` - Get chatbot prompt
- `PUT /api/v1/customers/me/chatbot-prompt` - Update chatbot prompt

### Documents
- `POST /api/v1/documents/upload` - Upload PDF
- `GET /api/v1/documents` - List documents
- `DELETE /api/v1/documents/:id` - Delete document

### Webhook
- `POST /api/v1/webhook/incoming` - ManyChat webhook endpoint

### Messages
- `GET /api/v1/messages` - List messages
- `GET /api/v1/messages/conversations` - List conversations

### Billing
- `GET /api/v1/billing/usage` - Get usage stats
- `GET /api/v1/billing/invoices` - Get invoices

## Customizing the Chatbot Prompt

Navigate to **Dashboard → Chatbot Prompt** to customize how your AI responds:

1. Edit the system prompt to define the chatbot's personality and behavior
2. Preview how the prompt will be combined with document context
3. Save changes - they take effect immediately for new conversations

Default prompt:
```
Tu es un assistant client utile. Utilise UNIQUEMENT le contexte ci-dessous pour répondre à la question. Si la réponse n'est pas dans le contexte, dis poliment que tu ne sais pas.
```

## Security

- TLS encryption for all communications
- AES-256 encryption at rest (Supabase)
- Row-Level Security for multi-tenant isolation
- GDPR compliant with data export and deletion

## License

MIT License
