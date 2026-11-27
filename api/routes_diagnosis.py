"""Router FastAPI untuk inferensi CNN dan evaluasi sistem pakar CF."""

from datetime import datetime
from functools import lru_cache
from io import BytesIO
from typing import Any

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from PIL import Image

from api.schemas import (
    EvaluateRequest,
    EvaluateResponse,
    HypothesisResultSchema,
    PredictResponse,
)
from core.cnn_predictor import load_keras_model, predict_image
from core.config import MODEL_PATH
from core.expert_system import evaluate_session
from core.knowledge_store import (
    HISTORY_PATH,
    KB_PATH,
    DiagnosisLogEntry,
    append_diagnosis_log,
    load_knowledge_base,
)

router = APIRouter(prefix="/api", tags=["diagnosis"])


@lru_cache(maxsize=1)
def get_cached_model() -> Any:
    """Memuat model `.keras` sekali ke memori proses FastAPI."""
    return load_keras_model(MODEL_PATH)


def clear_model_cache() -> None:
    """Membersihkan cache model saat Admin mengunggah model baru."""
    get_cached_model.cache_clear()


@router.post("/predict", response_model=PredictResponse)
async def predict_leaf(file: UploadFile = File(...)) -> PredictResponse:
    """Menerima file gambar daun jagung dan mengembalikan prediksi kelas CNN."""
    raw = await file.read()
    try:
        image = Image.open(BytesIO(raw))
        image.load()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File bukan gambar yang valid",
        ) from exc

    try:
        model = get_cached_model()
        result = predict_image(model, image)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc

    return PredictResponse(
        label=result.label,
        confidence=result.confidence,
        probabilities=result.probabilities,
    )


@router.post("/expert/evaluate", response_model=EvaluateResponse)
def evaluate_expert(req: EvaluateRequest) -> EvaluateResponse:
    """Mengevaluasi state backward chaining & CF secara deterministik."""
    kb = load_knowledge_base(KB_PATH)
    state = evaluate_session(req.known, cnn_label=req.cnn_label, kb=kb)

    step_index: int | None = None
    total_steps: int | None = None
    next_fact_text: str | None = None

    if not state.is_complete and state.current_goal and state.next_fact_id:
        goal_facts = kb.rules.get(state.current_goal, [])
        if state.next_fact_id in goal_facts:
            step_index = goal_facts.index(state.next_fact_id) + 1
            total_steps = len(goal_facts)
        next_fact_text = kb.facts.get(state.next_fact_id, state.next_fact_id)

    if state.is_complete and req.log_history:
        append_diagnosis_log(
            DiagnosisLogEntry(
                timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                image_name=req.image_name or "Tanpa Foto",
                cnn_label=req.cnn_label or "-",
                cnn_confidence=req.cnn_confidence,
                expert_label=state.best.goal if state.best else "Tidak Terbukti",
                expert_cf=state.best.cf if state.best else 0.0,
                status_match=state.status_match or "MODE PAKAR",
                final_decision=state.final_decision,
            ),
            path=HISTORY_PATH,
        )

    return EvaluateResponse(
        is_complete=state.is_complete,
        current_goal=state.current_goal,
        next_fact_id=state.next_fact_id,
        next_fact_text=next_fact_text,
        step_index=step_index,
        total_steps=total_steps,
        results=[HypothesisResultSchema(**r.__dict__) for r in state.results],
        trace=state.trace,
        best=HypothesisResultSchema(**state.best.__dict__) if state.best else None,
        final_decision=state.final_decision,
        status_match=state.status_match,
        current_mb=state.current_mb,
        current_md=state.current_md,
        current_cf=state.current_cf,
    )

