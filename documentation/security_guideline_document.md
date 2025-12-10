# Step-by-Step Implementation Plan for the WhatsApp–Gemini SaaS Middleware

This plan is organized into phased deliverables. Each phase integrates core security principles (least privilege, defense in depth, input validation, secure defaults, etc.) and enforces multi-tenancy and GDPR compliance.

---

## Phase 1: Project Setup & Architecture

### 1.1 Requirements Finalization
- Review functional and non-functional requirements with stakeholders.  
- Confirm SLA (99.9% uptime), latency targets, GDPR obligations.
- Define success metrics (ack time <1s, answer time <8s).

### 1.2 High-Level Architecture Design
- Draw component diagram: Next.js frontend, FastAPI backend, Supabase (Auth, PostgreSQL + pgvector, Storage), ManyChat/WhatsApp, Google Gemini Pro.  
- Define network boundaries, VPCs, subnets, security groups.  
- Select secrets manager (e.g., AWS Secrets Manager) for API keys and DB credentials.

### 1.3 Security & Compliance Plan
- Document data flows, identify sensitive data in transit/at rest.  
- Define encryption strategy: TLS1.2+ for in transit, AES-256 for storage.  
- Draft RBAC model (global admin, account user, support user).  
- Plan RLS policies in Supabase for multi-tenant isolation.  
- Establish auditing/logging requirements for GDPR (consent, deletion).

---

## Phase 2: Infrastructure Provisioning

### 2.1 IaC Implementation
- Use Terraform (or CloudFormation) to provision AWS/GCP resources:  
  - EKS/ECS or VM cluster for Dockerized backend.  
  - RDS (PostgreSQL) with pgvector enabled.  
  - S3 (or Supabase Storage) bucket for PDFs.  
  - VPC, subnets, route tables, security groups locked to least privilege.
- Store Terraform state securely (e.g., S3 with encryption + DynamoDB lock table).

### 2.2 Network & Security Hardening
- Enforce private subnets for databases and backend.  
- Configure Security Groups:  
  - Backend only accepts traffic from API gateway / internal LB.  
  - Database only accepts connections from backend IPs.  
- Enable AWS Shield/WAF for API endpoints to protect against DDoS and injection.

### 2.3 CI/CD Pipeline Setup
- Create GitHub Actions workflows for build, test, and deploy.  
- Integrate SCA (Dependabot) and static analysis (Bandit for Python, ESLint for TS, Snyk).  
- Store secrets in GitHub Secrets or Vault; ensure limited access.

---

## Phase 3: Authentication & Authorization

### 3.1 Supabase Auth Integration
- Enable Sign-up/Sign-in with email/password.  
- Enforce strong password policy (min 12 chars, mix of classes).  
- Hash with bcrypt/Argon2 + unique salt.  
- Implement optional MFA (TOTP/SMS) for admin roles.

### 3.2 Role-Based Access Control (RBAC)
- Define roles: `admin`, `account_user`, `support_user`.  
- Store roles in Auth metadata and in PostgreSQL user table.  
- Implement server-side checks in FastAPI endpoints (use dependencies).  
- Use OAuth2 password flow or JWT with RS256:  
  - Validate `exp`, `aud`, `iss`.  
  - Rotate signing keys periodically.

### 3.3 Session & Token Security
- Set JWT short expiry (e.g., 15m) and issue refresh tokens with secure storage.  
- Secure cookies (`HttpOnly`, `Secure`, `SameSite=Strict`) for web sessions.  
- Protect against CSRF with synchronizer tokens on state-changing calls.

---

## Phase 4: PDF Upload & Ingestion Pipeline

### 4.1 Frontend Upload Component
- Build React Drag-and-Drop with file type/size checks (<20MB, PDF/A).  
- Client-side validation only; enforce again on server.

### 4.2 Secure File Upload API
- FastAPI endpoint with `multipart/form-data`, strict MIME check (application/pdf).  
- Sanitize filename; generate random storage key.  
- Verify text-based PDF (use `pdfminer` or `PyMuPDF`).  
- Scan upload for malware (ClamAV integration).  
- Stream directly to Supabase Storage with presigned URL.

### 4.3 Background Ingestion Worker
- Deploy Celery or RQ backed by Redis.  
- Task: extract text → split into chunks → embed via Gemini or local model → store vectors in pgvector table.  
- Tag each vector record with `owner_id`.  
- Enforce RLS on vector table: `owner_id = auth.uid()`.

---

## Phase 5: Vector Search & RAG Engine

### 5.1 Question Embedding Endpoint
- Build FastAPI endpoint to receive question JSON.  
- Validate input schema with Pydantic.  
- Embed question via Gemini embedding API.  
- Query PostgreSQL using `vector <-> query_embedding ORDER BY ... LIMIT k` with `owner_id` filter.

### 5.2 Context Assembly & Generation
- Concatenate top-k passages within token budget.  
- Call Gemini Pro 1.5 chat API with system/user prompts.  
- Validate API responses, check for hallucinations (length, safety filters).

### 5.3 Response Delivery
- Acknowledge receipt immediately (200 OK JSON).  
- Once generation completes, push response to ManyChat via secure webhook with per-tenant API key.  
- Retry with exponential backoff on 429/5xx, log errors for monitoring.

---

## Phase 6: ManyChat & WhatsApp Integration

### 6.1 Secure Webhook Endpoint
- FastAPI POST `/webhook/manychat` with HMAC signature verification.  
- Validate timestamps (replay protection) and body schema.

### 6.2 Outgoing Message API
- Use ManyChat Business API with per-tenant credentials stored in Vault.  
- Rate-limit calls per ManyChat rules.  
- Handle 10s timeout: immediate ack then async reply.

---

## Phase 7: Frontend Dashboard

### 7.1 Next.js & TypeScript Setup
- Configure ESLint, Prettier, TypeScript strict mode.  
- Use CSS Modules or Tailwind (if preferred) with secure default theming.

### 7.2 Secure Data Fetching
- Use `getServerSideProps` or secure API routes.  
- Send auth token in `Authorization` header.  
- Validate response data; escape/encode before rendering.

### 7.3 Features Implementation
- **Analytics**: Chart request volumes/latencies; paginate logs.  
- **Conversation History**: Fetch from Postgres via backend with RLS.  
- **User Management**: Admin CRUD users, roles.  
- **Subscription & Billing**: Integrate Stripe securely (PCI-compliant), webhook handlers with signature verification.

---

## Phase 8: Testing & Quality Assurance

### 8.1 Automated Testing
- **Unit Tests**: FastAPI endpoints, Pydantic models, React components.  
- **Integration Tests**: Supabase RLS, embedding → search flow, ManyChat webhook.
- **Security Tests**: SAST (Bandit, ESLint security rules), DAST (OWASP ZAP scan).

### 8.2 Performance & Load Testing
- Simulate concurrent WhatsApp requests (wrk, locust).  
- Verify ack <1s and end-to-end <8s under load.

### 8.3 Penetration Testing
- Perform manual and automated pentests (SQLi, XSS, CSRF, auth bypass).  
- Remediate findings and retest.

---

## Phase 9: Deployment & Release

### 9.1 Containerization
- Dockerize backend with minimal base image (e.g., python:3.x-slim).  
- Scan images for CVEs; remove build tools in final image.

### 9.2 Production Deployment
- Use Kubernetes/ECS with HealthChecks (liveness/readiness).  
- Enable autoscaling based on CPU/latency.  
- Expose via API gateway with TLS certificates (ACM/LetsEncrypt).

### 9.3 Frontend on Vercel
- Configure environment variables securely.  
- Enforce HTTPS, set proper headers (`CSP`, `HSTS`, `X-Frame-Options`, etc.).

### 9.4 Database Migrations
- Use Alembic for schema changes.  
- Run in CI with dry-run before production.

---

## Phase 10: Monitoring, Logging & Maintenance

### 10.1 Observability
- Integrate Prometheus/Grafana or CloudWatch dashboards.  
- Monitor latencies, error rates, queue lengths.

### 10.2 Centralized Logging
- Ship logs to ELK/Datadog with PII masking.  
- Alert on anomalies (500s, high latency, unauthorized errors).

### 10.3 Backups & Disaster Recovery
- Daily DB snapshots, 7-day retention.  
- Test restore procedures quarterly.

### 10.4 Dependency Updates
- Schedule weekly dependency scans.  
- Apply security patches promptly.

---

## Phase 11: Compliance & Documentation

- Publish SOPS and runbooks: on-call, incident response, data deletion requests.  
- Provide GDPR artifacts: data flow maps, consent records, deletion logs.  
- Maintain API reference (OpenAPI spec) and user guides.

---

**By following this phased plan and embedding security controls at every layer, the project will meet performance, reliability, and compliance requirements while minimizing attack surface.**