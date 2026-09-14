import os
import pathlib
import shutil
import uuid
from typing import Any

import jwt
from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.kafka import TOPIC_QUESTIONS_IMPORTED, flush, send_to_kafka
from app.models import ImportRequest, ImportResponse
from app.seed_loader import SEED_DIR, UPLOAD_DIR, load_json_seed, load_seed_from_disk, normalize_question, persist_questions_to_seed_json

from contextlib import asynccontextmanager

JWT_SECRET = os.getenv("JWT_SECRET", "")
bearer_scheme = HTTPBearer(auto_error=False)


def _require_admin(credentials: HTTPAuthorizationCredentials | None) -> None:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Token ausente")
    try:
        claims = jwt.decode(
            credentials.credentials,
            JWT_SECRET,
            algorithms=["HS256", "HS384", "HS512"],
        )
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido")
    if claims.get("role") != "ADMIN":
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-importar seeds do JSON na inicialização (docx só via upload)
    try:
        print("[etl-service] Carregando seeds do JSON no startup...")
        result, questions = load_json_seed()
        if questions:
            payload = {
                "batch": result.to_payload(),
                "questions": [q.to_payload() for q in questions],
                "dryRun": False,
            }
            send_to_kafka(TOPIC_QUESTIONS_IMPORTED, payload)
            flush()
            print(f"[etl-service] Startup: {len(questions)} questões enviadas para o tópico Kafka {TOPIC_QUESTIONS_IMPORTED}")
    except Exception as e:
        print(f"[etl-service] Erro ao auto-carregar seeds no startup: {e}")
    yield

app = FastAPI(title="codelab-etl", version="0.1.0", lifespan=lifespan)


@app.get("/api/etl/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "groq": "configured" if os.getenv("GROQ_API_KEY") else "missing",
        "kafka": os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092"),
    }


@app.post("/api/etl/import", response_model=ImportResponse)
def do_import(req: ImportRequest) -> ImportResponse:
    result, questions = load_seed_from_disk(req.seed_path)
    if not req.dry_run:
        payload = {
            "batch": result.to_payload(),
            "questions": [q.to_payload() for q in questions],
            "dryRun": False,
        }
        send_to_kafka(TOPIC_QUESTIONS_IMPORTED, payload)
        flush()
    return ImportResponse(
        imported=result.imported,
        rejected=result.rejected,
        source_files=result.source_files,
        dry_run=req.dry_run,
    )


@app.post("/api/etl/import-upload")
def import_upload(
    file: UploadFile = File(...),
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict[str, Any]:
    _require_admin(credentials)

    if file is None or not file.filename:
        raise HTTPException(status_code=400, detail="Arquivo inválido para importação")

    original_name = file.filename.strip()
    lower_name = original_name.lower()
    if not lower_name.endswith(".docx") and not lower_name.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Formato inválido. Use .docx ou .pdf")

    safe_name = pathlib.Path(original_name).name
    save_dir = UPLOAD_DIR / str(uuid.uuid4())[:8]
    save_dir.mkdir(parents=True, exist_ok=True)
    target = save_dir / safe_name
    with target.open("wb") as out:
        shutil.copyfileobj(file.file, out)

    try:
        result, questions = load_seed_from_disk(str(target))
    except Exception as exc:
        shutil.rmtree(save_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=f"Erro ao extrair questões do arquivo: {exc}")

    questions = [normalize_question(q) for q in questions]
    extracted = len(questions)
    if extracted == 0:
        shutil.rmtree(save_dir, ignore_errors=True)
        raise HTTPException(status_code=422, detail="Nenhuma questão extraída do arquivo enviado")

    added = persist_questions_to_seed_json(questions)
    total_seed = len(load_json_seed()[1])

    payload = {
        "batch": result.to_payload(),
        "questions": [q.to_payload() for q in questions],
        "dryRun": False,
    }
    send_to_kafka(TOPIC_QUESTIONS_IMPORTED, payload)
    flush()

    return {
        "sourceFile": safe_name,
        "extractedQuestions": extracted,
        "insertedQuestions": added,
        "seedQuestionsTotal": total_seed,
    }
