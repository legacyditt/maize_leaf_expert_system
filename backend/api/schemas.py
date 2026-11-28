"""Skema Pydantic v2 untuk request dan response FastAPI."""

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    password: str = Field(min_length=1)


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class PredictResponse(BaseModel):
    label: str
    confidence: float
    probabilities: dict[str, float]
    image_url: str | None = None


class EvaluateRequest(BaseModel):
    known: dict[str, str] = Field(default_factory=dict)
    cnn_label: str | None = None
    cnn_confidence: float = 0.0
    cnn_probabilities: dict[str, float] | None = None
    image_name: str | None = None
    image_url: str | None = None
    log_history: bool = False


class HypothesisResultSchema(BaseModel):
    goal: str
    mb: float
    md: float
    cf: float
    pruned: bool
    proven: bool


class EvaluateResponse(BaseModel):
    is_complete: bool
    current_goal: str | None
    next_fact_id: str | None
    next_fact_text: str | None
    step_index: int | None
    total_steps: int | None
    results: list[HypothesisResultSchema]
    trace: list[str]
    best: HypothesisResultSchema | None
    final_decision: str
    status_match: str | None
    current_mb: float
    current_md: float
    current_cf: float


class KnowledgeBaseSchema(BaseModel):
    facts: dict[str, str]
    mb_md: dict[str, dict[str, tuple[float, float]]]
    goal_order: list[str]
    cf_accept: float = Field(ge=0.05, le=0.99)
    cf_dugaan: float = Field(ge=0.01, le=0.95)


class ModelStatusResponse(BaseModel):
    exists: bool
    filename: str
    size_mb: float
    keras_version: str
    input_size: int
    class_names: list[str]


class HistoryEntrySchema(BaseModel):
    timestamp: str
    image_name: str
    cnn_label: str
    cnn_confidence: float
    expert_label: str
    expert_cf: float
    status_match: str
    final_decision: str
    image_url: str | None = None
    cnn_probabilities: dict[str, float] | None = None
    results: list[HypothesisResultSchema] | None = None


class HistoryResponse(BaseModel):
    total: int
    sesuai_count: int
    mismatch_count: int
    sesuai_pct: float
    entries: list[HistoryEntrySchema]

