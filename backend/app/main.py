from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, customers, documents, webhook, messages, billing

app = FastAPI(
    title="WhatsApp RAG Chatbot API",
    description="Intelligent middleware SaaS connecting WhatsApp via ManyChat with Google Gemini Pro",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(customers.router, prefix="/api/v1")
app.include_router(documents.router, prefix="/api/v1")
app.include_router(webhook.router, prefix="/api/v1")
app.include_router(messages.router, prefix="/api/v1")
app.include_router(billing.router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"message": "WhatsApp RAG Chatbot API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
