from __future__ import annotations

import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

sys.path.insert(0, str(Path(__file__).resolve().parent))

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings, init_db, logger
from app.database.seed import seed_database
from app.database import SessionLocal
from app.api.router import router
from app.utils.routes import router as utils_router
from app.middleware import RateLimitMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting %s v%s", settings.APP_NAME, settings.APP_VERSION)
    init_db()
    db = SessionLocal()
    try:
        seed_database(db)
    except Exception as exc:
        logger.error("Database seeding failed: %s", exc)
    finally:
        db.close()

    _initialize_rag()

    yield
    logger.info("Shutting down %s", settings.APP_NAME)


def _initialize_rag():
    try:
        from app.rag.loader import KnowledgeLoader
        from app.rag.splitter import DocumentSplitter
        from app.rag.vector_store import VectorStoreManager

        loader = KnowledgeLoader()
        docs = loader.load_all()
        if not docs:
            logger.warning("No knowledge base documents found. RAG pipeline empty.")
            return

        splitter = DocumentSplitter()
        chunks = splitter.split(docs)

        vector_store = VectorStoreManager()
        vector_store.add_documents(chunks)
        logger.info("RAG pipeline initialized: %d chunks indexed.", len(chunks))
    except Exception as exc:
        logger.warning("RAG initialization skipped: %s", exc)


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(RateLimitMiddleware)

app.include_router(router, prefix="/api/v1")
app.include_router(utils_router, prefix="/api/v1")


@app.get("/")
def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
