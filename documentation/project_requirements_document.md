# Project Requirements Document (PRD)

## 1. Project Overview

You are building an intelligent middleware SaaS that connects WhatsApp (via ManyChat) with Google’s AI (Gemini Pro). The core purpose is to let companies upload their PDF documents, have those documents automatically ingested into a vector database, and then answer end‐user questions on WhatsApp by retrieving relevant passages and generating contextual replies. In short, the system provides the “brain” and memory for a smart WhatsApp chatbot, while ManyChat handles the chat interface and Supabase manages auth, storage, database and vector search.

This project is being built to offer businesses a turnkey solution for customer support or information bots on WhatsApp. Key objectives include:

*   **Ultra‐fast acknowledgment:** Respond to incoming WhatsApp messages in under 1 second so ManyChat won’t timeout.
*   **Accurate, contextual answers:** Use Retrieval Augmented Generation (RAG) with Supabase’s pgvector and Google Gemini Pro 1.5 to deliver precise replies.
*   **Data isolation and security:** Guarantee strict multi‐tenant separation and GDPR compliance.
*   **Simple onboarding:** Provide a one‐click template install, drag‐and‐drop PDF upload, and straightforward dashboard for setup and analytics.

Success is measured by reliable sub‐second acknowledgments, average AI response times under 8 seconds, zero cross‐tenant data leaks, and a self‐service, intuitive dashboard experience.

## 2. In-Scope vs. Out-of-Scope

### In-Scope (Version 1)

*   User registration, subscription management, and login via Supabase Auth.
*   One‐click ManyChat WhatsApp bot template deployment and webhook configuration.
*   PDF upload interface with drag-and-drop; validation (≤20 MB, ≤200 pages, text‐based PDF/A).
*   Background ingestion pipeline: text extraction, vectorization (pgvector), and index in Supabase.
*   Real-time webhook endpoint for incoming WhatsApp messages; instant “OK, bien reçu” ack (<1 s).
*   Asynchronous RAG workflow: vector search -> Gemini Pro call -> push reply to ManyChat.
*   Dashboard: billing & invoices, request count, average response time, satisfaction survey, conversation history.
*   User roles: global admin, account user, support user, with role-based permissions.
*   GDPR compliance: data encryption (rest/in transit), data export & deletion, 30-day post-cancellation purge.
*   Regular backups and secure data storage in Supabase.

### Out-of-Scope (Planned Later)

*   Multi-language or regional variations support.
*   Custom branding or theming per client (beyond neutral default palette).
*   Advanced monitoring/alerting via Slack or email.
*   On-premise or private cloud deployment.
*   Real-time voice transcription or audio file ingestion.
*   Support for scanned/PDF-image-only documents (OCR pipeline).
*   Usage of third-party vector databases like Pinecone.
*   Mobile or desktop native app.

## 3. User Flow

When a new company wants to use the service, they land on the web dashboard’s signup page, fill in their name, email, and payment details, and pick an appropriate subscription tier. After validating their account, they’re guided to a simple configuration screen. Here they paste their ManyChat API key, click a “Deploy Template” button to install a pre‐configured WhatsApp bot in ManyChat, and copy-paste a unique webhook URL back into their ManyChat flow settings.

Next, the client uploads their PDF documents in the “Documents” section. The system immediately stores the files in Supabase Storage, tags them with the client’s owner_id, and asynchronously extracts text and computes vectors. From that point on, end users can ask questions via WhatsApp. ManyChat forwards each question to our API, which instant‐acknowledges it in under 1 second. Behind the scenes, our server performs a vector search in Supabase, calls Gemini to formulate an answer, and pushes the reply back into the customer’s WhatsApp chat. Meanwhile, the client can monitor request volumes, average latencies, conversation logs, billing, and survey‐based satisfaction scores in the dashboard.

## 4. Core Features

*   **Authentication & Authorization**\
    • Supabase Auth for signup, login, password reset\
    • Role-based access: global admin, account user, support user
*   **Subscription & Billing**\
    • Tiered monthly plans with included request/storage quotas\
    • Overage charges per extra request/document\
    • Invoice generation and payment history
*   **ManyChat & WhatsApp Integration**\
    • One-click ManyChat template deploy\
    • Webhook endpoint for incoming messages\
    • Outgoing message push via ManyChat API
*   **PDF Management**\
    • Drag-and-drop upload interface\
    • File validation (≤20 MB, ≤200 pages, text PDF/A)\
    • Supabase Storage for file persistence
*   **Ingestion & Vector Search**\
    • Background text extraction and vectorization\
    • pgvector index in Supabase Database\
    • Owner_id filtering for multi-tenant isolation
*   **RAG Workflow**\
    • Instant ack response (<1 s) to ManyChat\
    • Asynchronous retrieval from Supabase and call to Gemini Pro\
    • Push final answer (3-8 s end-to-end)
*   **Dashboard Analytics & Reporting**\
    • Number of requests per client\
    • Average response time\
    • Customer satisfaction survey results\
    • Conversation history export
*   **Data Compliance & Security**\
    • GDPR: consent, data export, deletion in 30 days post-cancellation\
    • Encryption at rest/in transit\
    • Regular backups and audit logs

## 5. Tech Stack & Tools

*   **Frontend**: Next.js, React, TypeScript
*   **Backend**: Python, FastAPI
*   **Database & Storage**: Supabase (Auth, PostgreSQL, Storage), pgvector
*   **Chat Interface**: ManyChat API, WhatsApp Business API
*   **AI & Vector Search**: Google Gemini Pro 1.5 for generation, pgvector for retrieval
*   **Hosting & Deployment**: Vercel (frontend), Docker on AWS/GCP for backend
*   **CI/CD & IDE**: GitHub Actions, Docker Compose; VS Code with Python/TS extensions
*   **Monitoring (future)**: assumed basic logs; no advanced alerts in v1

## 6. Non-Functional Requirements

*   **Performance**\
    • Ack response < 1 second for webhook\
    • End-to-end answer 3–8 seconds under normal load
*   **Security**\
    • TLS for all in-transit data\
    • AES-256 encryption at rest (Supabase)\
    • Role-based access control
*   **Scalability**\
    • Horizontally scalable FastAPI containers\
    • Supabase auto-scaling DB
*   **Reliability**\
    • 99.9% uptime SLA for core API\
    • Daily backups with 7-day retention
*   **Usability**\
    • Simple, clean UI with neutral color palette (white, gray, blue) and Inter/Roboto fonts\
    • Clear error messages and validation feedback

## 7. Constraints & Assumptions

*   ManyChat imposes a 10-second timeout per message; system must ack in <1 s.
*   Google Gemini Pro 1.5 availability and API quotas are assumed adequate for expected volume.
*   Supabase is assumed to support required storage, compute, and vector search workloads.
*   No existing branding guidelines—default to a neutral, professional design.
*   Only text-based PDFs; no OCR for scanned images.
*   GDPR applies—clients are primarily EU-based.

## 8. Known Issues & Potential Pitfalls

*   **API Rate Limits**\
    • Gemini Pro or ManyChat quotas may throttle high volumes.\
    Mitigation: implement exponential backoff and queue requests.
*   **Large Document Processing**\
    • Uploads near 20 MB/200 pages may cause longer ingestion times.\
    Mitigation: run ingestion jobs in background workers; limit concurrent jobs per user.
*   **Vector Search Accuracy**\
    • Poorly vectorizable content may yield irrelevant passages.\
    Mitigation: tune embedding parameters; allow feedback loop for manual passage ranking later.
*   **Data Isolation Risks**\
    • Misconfigured owner_id filters could expose tenant data.\
    Mitigation: enforce SQL row-level security policies in Supabase; include automated tests.
*   **GDPR Deletion Window**\
    • Clients expect instant deletion; background jobs may lag.\
    Mitigation: prioritize deletion requests in ingestion pipeline; provide status updates.

This document fully specifies the first‐version scope, user experience, core modules, technology choices, and known challenges. It can serve as the definitive reference for all subsequent technical design, front-end guidelines, and backend architecture documents.
