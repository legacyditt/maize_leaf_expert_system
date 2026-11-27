"""Mesin inferensi sistem pakar (Backward Chaining + Certainty Factor).

Modul ini murni domain logic tanpa ketergantungan UI sehingga dapat diuji
secara terpisah atau dipakai ulang di antarmuka lain (CLI, API, Streamlit).
"""

from dataclasses import dataclass

from core.config import CF_ACCEPT, CF_DUGAAN, TIDAK, YA
from core.knowledge_store import (
    DEFAULT_FACTS,
    DEFAULT_GOAL_ORDER,
    DEFAULT_MB_MD,
    KnowledgeBase,
    default_knowledge_base,
)

# Ekspor ulang konstanta default agar kompatibel dengan pemanggil & unit test yang ada
FACTS: dict[str, str] = DEFAULT_FACTS
MB_MD: dict[str, dict[str, tuple[float, float]]] = DEFAULT_MB_MD
RULES: dict[str, list[str]] = {goal: list(symptoms) for goal, symptoms in MB_MD.items()}
GOAL_ORDER: tuple[str, ...] = DEFAULT_GOAL_ORDER


@dataclass(frozen=True)
class HypothesisResult:
    """Hasil evaluasi satu hipotesis penyakit."""

    goal: str
    mb: float
    md: float
    cf: float
    pruned: bool
    proven: bool


@dataclass(frozen=True)
class DiagnosisState:
    """Snapshot status sesi backward chaining berdasarkan jawaban saat ini."""

    is_complete: bool
    current_goal: str | None
    next_fact_id: str | None
    results: list[HypothesisResult]
    trace: list[str]
    best: HypothesisResult | None
    final_decision: str
    status_match: str | None
    current_mb: float = 0.0
    current_md: float = 0.0
    current_cf: float = 0.0


def cf_label(cf: float) -> str:
    """Mengubah nilai Certainty Factor menjadi label interpretasi bahasa manusia."""
    if cf >= 0.8:
        return "Sangat yakin"
    if cf >= 0.6:
        return "Yakin"
    if cf >= 0.4:
        return "Cukup yakin"
    if cf >= 0.2:
        return "Kurang yakin"
    return "Tidak terbukti"


def combine(old: float, new: float) -> float:
    """Kombinasi inkremental MYCIN untuk MB atau MD."""
    return old + new * (1.0 - old)


def best_case_cf(
    goal: str,
    known: dict[str, str],
    idx: int,
    mb: float,
    md: float,
    kb: KnowledgeBase | None = None,
) -> float:
    """Menghitung CF maksimum yang masih mungkin jika gejala tersisa dijawab YA."""
    active_kb = kb or default_knowledge_base()
    facts = active_kb.rules[goal]
    for fact_id in facts[idx + 1 :]:
        m_val, d_val = active_kb.mb_md[goal][fact_id]
        if known.get(fact_id) == TIDAK:
            md = combine(md, d_val)
        else:
            mb = combine(mb, m_val)
    return mb - md


def decide(
    results: list[HypothesisResult],
    cf_accept: float = CF_ACCEPT,
    cf_dugaan: float = CF_DUGAAN,
) -> tuple[HypothesisResult | None, str | None]:
    """Menentukan keputusan akhir berdasarkan nilai CF tertinggi."""
    if not results:
        return None, None
    best = max(results, key=lambda item: item.cf)
    if best.cf >= cf_accept:
        return best, f"Terdiagnosis: {best.goal} ({cf_label(best.cf)}, CF = {best.cf:.2f})"
    if best.cf >= cf_dugaan:
        return best, (
            f"Dugaan: {best.goal} ({cf_label(best.cf)}, CF = {best.cf:.2f})"
            " - disarankan verifikasi ahli / foto ulang"
        )
    return None, None


def _evaluate_goal(
    goal: str,
    known: dict[str, str],
    trace: list[str],
    kb: KnowledgeBase,
) -> tuple[HypothesisResult | None, str | None, float, float]:
    """Mengevaluasi satu hipotesis; kembalikan fact_id berikutnya dan MB/MD sementara."""
    facts = kb.rules[goal]
    trace.append(f"Goal {goal}: premis = {facts}")
    mb = 0.0
    md = 0.0
    pruned = False

    for idx, fact_id in enumerate(facts):
        if fact_id not in known:
            return None, fact_id, mb, md

        ans = known[fact_id]
        m_val, d_val = kb.mb_md[goal][fact_id]
        if ans == YA:
            mb = combine(mb, m_val)
            note = f"YA (MB gejala {m_val:.2f})"
        else:
            md = combine(md, d_val)
            note = f"TIDAK (MD gejala {d_val:.2f})"

        trace.append(f"  {fact_id} = {note} -> MB={mb:.3f} MD={md:.3f} CF={mb - md:+.3f}")

        if any(rem not in known for rem in facts[idx + 1 :]):
            cf_max = best_case_cf(goal, known, idx, mb, md, kb=kb)
            if cf_max < kb.cf_accept:
                pruned = True
                trace.append(
                    f"  => {goal} DIPANGKAS (CF maks. yang mungkin {cf_max:+.3f} < {kb.cf_accept})"
                )
                break

    cf = mb - md
    proven = (not pruned) and cf >= kb.cf_accept
    partial_tag = " [parsial]" if pruned else ""
    trace.append(f"  => {goal}: MB={mb:.3f} MD={md:.3f} CF={cf:+.3f} ({cf_label(cf)}){partial_tag}")
    trace.append(f"  => {goal} {'terbukti' if proven else 'tidak terbukti'}")

    return HypothesisResult(goal=goal, mb=mb, md=md, cf=cf, pruned=pruned, proven=proven), None, mb, md


def evaluate_session(
    known: dict[str, str],
    cnn_label: str | None = None,
    kb: KnowledgeBase | None = None,
) -> DiagnosisState:
    """Mengevaluasi state backward chaining secara deterministik tanpa blocking I/O."""
    active_kb = kb or default_knowledge_base()
    rules = active_kb.rules
    target_goals = [cnn_label] if cnn_label in rules else list(active_kb.goal_order)
    results: list[HypothesisResult] = []
    trace: list[str] = []

    for goal in target_goals:
        result, next_fact, cur_mb, cur_md = _evaluate_goal(goal, known, trace, kb=active_kb)
        if next_fact is not None:
            return DiagnosisState(
                is_complete=False,
                current_goal=goal,
                next_fact_id=next_fact,
                results=results,
                trace=trace,
                best=None,
                final_decision="",
                status_match=None,
                current_mb=cur_mb,
                current_md=cur_md,
                current_cf=cur_mb - cur_md,
            )
        assert result is not None
        results.append(result)
        if cnn_label is None and result.proven:
            break

    best, final_text = decide(results, cf_accept=active_kb.cf_accept, cf_dugaan=active_kb.cf_dugaan)
    expert_goal = best.goal if best else None

    if cnn_label is not None:
        if expert_goal == cnn_label and final_text is not None:
            final_decision = final_text
            status_match: str | None = "SESUAI"
        else:
            final_decision = "Sistem tidak dapat menentukan kondisi daun"
            status_match = "TIDAK SESUAI"
    else:
        final_decision = final_text if final_text else "Sistem tidak dapat menentukan"
        status_match = None

    return DiagnosisState(
        is_complete=True,
        current_goal=None,
        next_fact_id=None,
        results=results,
        trace=trace,
        best=best,
        final_decision=final_decision,
        status_match=status_match,
    )
