"""Router FastAPI khusus Admin (dilindungi autentikasi Bearer token)."""

import json
import zipfile

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile, status

from api.auth import require_admin
from api.routes_diagnosis import clear_model_cache
from api.schemas import (
    HistoryEntrySchema,
    HistoryResponse,
    KnowledgeBaseSchema,
    ModelStatusResponse,
)
from core.config import CLASS_NAMES, IMG_SIZE, MODEL_PATH
from core.knowledge_store import (
    HISTORY_PATH,
    KB_PATH,
    KnowledgeBase,
    clear_diagnosis_history,
    default_knowledge_base,
    history_to_csv,
    load_diagnosis_history,
    load_knowledge_base,
    save_knowledge_base,
)

router = APIRouter(
    prefix="/api/admin",
    tags=["admin"],
    dependencies=[Depends(require_admin)],
)


@router.get("/kb", response_model=KnowledgeBaseSchema)
def get_kb() -> KnowledgeBaseSchema:
    """Mengambil basis pengetahuan dan parameter CF aktif."""
    kb = load_knowledge_base(KB_PATH)
    return KnowledgeBaseSchema(
        facts=kb.facts,
        mb_md=kb.mb_md,
        goal_order=list(kb.goal_order),
        cf_accept=kb.cf_accept,
        cf_dugaan=kb.cf_dugaan,
    )


@router.put("/kb", response_model=KnowledgeBaseSchema)
def update_kb(payload: KnowledgeBaseSchema) -> KnowledgeBaseSchema:
    """Menyimpan pembaruan basis pengetahuan dan parameter CF."""
    if payload.cf_dugaan > payload.cf_accept:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="cf_dugaan tidak boleh lebih besar dari cf_accept",
        )
    kb = KnowledgeBase(
        facts=payload.facts,
        mb_md=payload.mb_md,
        goal_order=tuple(payload.goal_order),
        cf_accept=payload.cf_accept,
        cf_dugaan=payload.cf_dugaan,
    )
    save_knowledge_base(kb, KB_PATH)
    return payload


@router.post("/kb/reset", response_model=KnowledgeBaseSchema)
def reset_kb() -> KnowledgeBaseSchema:
    """Mengembalikan basis pengetahuan ke konfigurasi default notebook."""
    kb = default_knowledge_base()
    save_knowledge_base(kb, KB_PATH)
    return KnowledgeBaseSchema(
        facts=kb.facts,
        mb_md=kb.mb_md,
        goal_order=list(kb.goal_order),
        cf_accept=kb.cf_accept,
        cf_dugaan=kb.cf_dugaan,
    )


@router.get("/model/status", response_model=ModelStatusResponse)
def get_model_status() -> ModelStatusResponse:
    """Mengembalikan metadata model `.keras` aktif di server."""
    if not MODEL_PATH.exists():
        return ModelStatusResponse(
            exists=False,
            filename=MODEL_PATH.name,
            size_mb=0.0,
            keras_version="-",
            input_size=IMG_SIZE,
            class_names=list(CLASS_NAMES),
        )
    size_mb = round(MODEL_PATH.stat().st_size / (1024 * 1024), 2)
    return ModelStatusResponse(
        exists=True,
        filename=MODEL_PATH.name,
        size_mb=size_mb,
        keras_version=_read_keras_version(),
        input_size=IMG_SIZE,
        class_names=list(CLASS_NAMES),
    )


@router.post("/model/upload", response_model=ModelStatusResponse)
async def upload_model(file: UploadFile = File(...)) -> ModelStatusResponse:
    """Mengganti file `.keras` aktif dan membersihkan cache inferensi."""
    if not file.filename or not file.filename.endswith(".keras"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File harus berekstensi .keras",
        )
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    MODEL_PATH.write_bytes(await file.read())
    clear_model_cache()
    return get_model_status()


@router.get("/history", response_model=HistoryResponse)
def get_history() -> HistoryResponse:
    """Mengembalikan ringkasan KPI dan daftar riwayat diagnosis."""
    entries = load_diagnosis_history(HISTORY_PATH)
    total = len(entries)
    sesuai_count = sum(1 for item in entries if item.status_match == "SESUAI")
    mismatch_count = sum(1 for item in entries if item.status_match == "TIDAK SESUAI")
    sesuai_pct = round((sesuai_count / total * 100.0) if total else 0.0, 1)
    return HistoryResponse(
        total=total,
        sesuai_count=sesuai_count,
        mismatch_count=mismatch_count,
        sesuai_pct=sesuai_pct,
        entries=[HistoryEntrySchema(**item.__dict__) for item in entries],
    )


@router.delete("/history")
def delete_history() -> dict[str, str]:
    """Menghapus seluruh catatan riwayat diagnosis."""
    clear_diagnosis_history(HISTORY_PATH)
    return {"status": "cleared"}


@router.get("/history/csv")
def export_history_csv() -> Response:
    """Mengunduh riwayat diagnosis sebagai file CSV."""
    entries = load_diagnosis_history(HISTORY_PATH)
    csv_body = history_to_csv(entries)
    return Response(
        content=csv_body,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="riwayat_diagnosis_jagung.csv"'},
    )


def _read_keras_version() -> str:
    """Membaca versi Keras dari metadata.json di dalam arsip .keras."""
    try:
        with zipfile.ZipFile(MODEL_PATH, "r") as zf:
            if "metadata.json" in zf.namelist():
                meta = json.loads(zf.read("metadata.json"))
                return str(meta.get("keras_version", "-"))
    except Exception:  # noqa: BLE001
        pass
    return "-"

