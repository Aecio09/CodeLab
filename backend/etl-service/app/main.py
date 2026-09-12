import os
from typing import Any

from fastapi import FastAPI, HTTPException

from app.kafka import TOPIC_QUESTIONS_IMPORTED, send_to_kafka
from app.models import ImportRequest, ImportResponse
from app.seed_loader import load_seed_from_disk

app = FastAPI(title="codelab-etl", version="0.1.0")


@app.get("/api/etl/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "groq": "configured" if os.getenv("GROQ_API_KEY") else "missing",
        "kafka": os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092"),
    }


@app.post("/api/etl/import", response_model=ImportResponse)
def do_import(req: ImportRequest) -> ImportResponse:
    result = load_seed_from_disk(req.seed_path)
    if not req.dry_run:
        send_to_kafka(TOPIC_QUESTIONS_IMPORTED, {"batch": result.to_payload(), "dryRun": False})
    return ImportResponse(
        imported=result.imported,
        rejected=result.rejected,
        source_files=result.source_files,
        dry_run=req.dry_run,
    )
