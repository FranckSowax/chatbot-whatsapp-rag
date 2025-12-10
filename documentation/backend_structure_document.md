# Backend Structure Document

This document outlines the backend setup of our SaaS middleware connecting WhatsApp (via ManyChat) to Google Gemini Pro 1.5. It uses simple terms so anyone can understand how data flows, where it’s hosted, and how we keep things fast, secure, and scalable.

## 1. Backend Architecture

### Overall Design
- **Language & Framework**: Python with FastAPI for building RESTful APIs. FastAPI provides built-in data validation, automatic docs, and high performance.
- **Modular Structure**:
  - Routers (endpoint definitions)
  - Services (business logic, e.g., PDF ingestion, RAG processing)
  - Repositories (database access layer)
  - Background tasks (immediate acknowledgment vs. heavy processing)
- **Asynchronous Processing**:
  - Receive a WhatsApp message, immediately respond “OK, bien reçu” in under 1s.
  - Offload vector conversion, database search, and AI calls to background tasks.
- **Containerization**:
  - Docker images for the API, ensuring consistent environments.
  - GitHub Actions build & push images on each commit.

### Scalability, Maintainability, Performance
- **Horizontal Scaling**: Run multiple API containers behind a load balancer. Add or remove containers based on load.
- **Clean Separation**: Clear layering means adding features or fixing bugs touches one module at a time.
- **Automatic Docs**: FastAPI’s OpenAPI docs help frontend and third-party integrators understand available endpoints.
- **Low Latency**: Immediate acknowledgment uses FastAPI’s `BackgroundTasks`, so the HTTP response isn’t blocked by heavy work.

## 2. Database Management

- **Primary Database**: Supabase (PostgreSQL) with the **pgvector** extension.
- **Authentication & Row-Level Security**: Supabase Auth handles user accounts; PostgreSQL RLS policies enforce `owner_id` filters so one tenant’s data can’t be seen by another.
- **Vector Storage & Search**:
  - Store document embeddings as vector arrays.
  - Query nearest neighbors for Retrieval Augmented Generation (RAG).
- **File Storage**: Supabase Storage buckets store uploaded PDF files (≤20 MB, ≤200 pages).
- **Data Practices**:
  - Tag every record (documents, embeddings, messages) with `owner_id`.
  - Encrypt data at rest (handled by Supabase) and in transit (TLS everywhere).
  - GDPR compliance: data deletion endpoints, 30-day retention after termination, audit logs.

## 3. Database Schema

### Human-Readable Overview
- **users**: Customer accounts and global admins, with roles.
- **customers**: Stores subscription and account details (plan, ManyChat key, webhook URL).
- **documents**: Metadata for each uploaded PDF (filename, upload date, status).
- **document_chunks**: Split text pieces, their vector embeddings, and references to `documents`.
- **messages**: Conversation history between end users and the AI.
- **subscriptions**: Tier definitions and usage limits.
- **billing_records**: Invoicing and overage fees.

### SQL (PostgreSQL) Schema
```sql
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  hashed_password TEXT,
  role TEXT NOT NULL CHECK(role IN ('global_admin','account_user','support_user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Customers (tenants)
CREATE TABLE customers (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  plan_id UUID REFERENCES subscriptions(id),
  manychat_api_key TEXT,
  webhook_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  filename TEXT NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT NOT NULL CHECK(status IN ('pending','processed','failed'))
);

-- Document Chunks & Embeddings
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES documents(id),
  chunk_index INT,
  text_chunk TEXT,
  embedding VECTOR(1536)
);

-- Messages (chat history)
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  user_phone TEXT,
  direction TEXT NOT NULL CHECK(direction IN ('inbound','outbound')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Subscription Plans
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  monthly_request_limit INT,
  storage_limit_mb INT,
  price_cents INT
);

-- Billing Records
CREATE TABLE billing_records (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  period_start DATE,
  period_end DATE,
  amount_cents INT,
  overage_cents INT
);
```

## 4. API Design and Endpoints

All endpoints follow a RESTful style under `/api/v1`.

- **Authentication**:
  - POST `/auth/signup` → create account
  - POST `/auth/login` → return JWT
  - POST `/auth/logout`

- **Onboarding & Config**:
  - GET `/customers/me` → account details
  - PATCH `/customers/me` → update ManyChat key or webhook URL
  - POST `/webhook/manychat` → receives WhatsApp messages from ManyChat

- **Document Management**:
  - POST `/documents/upload` → upload PDF, triggers ingestion
  - GET `/documents` → list uploaded PDFs
  - DELETE `/documents/:id` → remove a document and its chunks

- **Chat & RAG**:
  - POST `/query` → converts question to embedding, retrieves chunks, calls Gemini, returns AI answer
  - GET `/messages` → fetch conversation history

- **Billing & Usage**:
  - GET `/billing/usage` → current usage vs. limits
  - GET `/billing/invoices` → past invoices

- **Admin**:
  - GET `/admin/customers` → list all tenants (global_admin only)
  - POST `/admin/subscriptions` → create or update plans

## 5. Hosting Solutions

- **API Containers**: Docker images deployed to AWS ECS (or GCP Cloud Run).
- **Database & Storage**: Supabase (highly available, managed Postgres + storage).
- **CI/CD**: GitHub Actions builds Docker images, runs tests, and deploys on merge to `main`.
- **Frontend**: Vercel for Next.js deployment.

**Benefits**:
- Managed services reduce ops overhead.
- Auto-scaling API containers handle spikes.
- Vercel CDN delivers static assets globally.

## 6. Infrastructure Components

- **Load Balancer**: AWS Application Load Balancer routes traffic to healthy containers.
- **Container Orchestration**: ECS/EKS or Cloud Run automatically spin up/down pods.
- **CDN**: Vercel’s edge network for the dashboard and static files.
- **Background Tasks**: FastAPI’s built-in background tasks for low-latency acknowledgment.
- **Logging & Tracing**: Structured logs sent to CloudWatch (AWS) or Stackdriver (GCP).

## 7. Security Measures

- **Transport Encryption**: TLS 1.2+ everywhere (API, database, storage).
- **Authentication & Authorization**:
  - Supabase Auth issues JWTs.
  - Role-based checks in the API (global_admin, account_user, support_user).
- **Row-Level Security**: PostgreSQL policies ensure each query filters by `customer_id` = JWT’s owner.
- **Data Encryption**: Handled at rest by Supabase (AES-256).
- **Input Validation**: Pydantic schemas block malicious payloads.
- **GDPR Compliance**:
  - Users can export or delete their data (automated endpoints).
  - 30-day post-deletion retention window.
  - Audit logs of data access and processing.

## 8. Monitoring and Maintenance

- **Performance Metrics**: Prometheus scrapes API metrics, Grafana dashboards track latency and error rates.
- **Error Tracking**: Sentry captures exceptions and alert notifications.
- **Logs**: Centralized JSON logs in CloudWatch/Stackdriver for search and retention.
- **Backups**: Supabase daily backups with point-in-time restore.
- **CI/CD & Migrations**:
  - Database migrations via Alembic run as part of deploy.
  - Automated tests and linting in GitHub Actions.
- **Maintenance Windows**: Monthly scheduled checks, dependency updates, and load-testing.

## 9. Conclusion and Overall Backend Summary

This backend combines Python/FastAPI with Supabase’s managed Postgres (and pgvector) to deliver a fast, secure, multi-tenant middleware. Incoming WhatsApp messages get an instant acknowledgment, while background processes handle vector searches and AI calls. Automatic scaling, containerization, and managed services ensure we meet our 99.9% uptime target. Role-based access, encryption, and GDPR workflows protect customer data, and a clear modular design makes future enhancements straightforward. The result is a reliable, maintainable backend that aligns perfectly with the project goals: speed, accuracy, security, and ease of use.