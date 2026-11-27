"""Komponen halaman User UI (1 halaman 1 fitur) bertema Maize."""

from datetime import datetime
from html import escape
from io import BytesIO
from typing import Any

from PIL import Image
import streamlit as st

from core.cnn_predictor import load_keras_model, predict_image
from core.config import MODEL_PATH, TIDAK, YA
from core.expert_system import DiagnosisState, evaluate_session
from core.knowledge_store import (
    DiagnosisLogEntry,
    append_diagnosis_log,
    load_knowledge_base,
)
from ui.state import (
    get_cnn_result,
    get_image_preview,
    get_image_signature,
    get_known_answers,
    go_to_step,
    is_using_cnn_guide,
    mark_history_logged,
    record_answer,
    retry_questionnaire,
    set_uploaded_image,
    set_use_cnn_guide,
    start_new_diagnosis,
)

_SYMPTOM_HINTS: dict[str, str] = {
    "G1": "Ciri khas common rust: bintik serbuk cokelat/kayu manis di permukaan daun.",
    "G2": "Terjadi pada infeksi berat ketika jaringan daun mulai mengering.",
    "G3": "Periksa bagian atas dan balik daun jagung untuk memastikan sebaran pustula.",
    "G4": "Ciri khas Northern Corn Leaf Blight (NCLB): bercak memanjang seperti cerutu.",
    "G5": "Gejala awal hawar daun sebelum lesi membesar dan mengering.",
    "G6": "Permukaan daun tampak bersih tanpa bercak nekrotik.",
    "G7": "Tidak terlihat benjolan spora karat maupun lesi memanjang hawar.",
}


@st.cache_resource
def get_cached_model() -> Any:
    """Memuat model Keras sekali per server dan menyimpannya di cache resource."""
    return load_keras_model(MODEL_PATH)


def render_page_cnn() -> None:
    """Halaman User 1: Fokus upload foto daun jagung dan hasil klasifikasi CNN."""
    st.markdown(
        """
        <div class="maize-hero">
          <div class="maize-tag">Tahap 1 dari 3 — Deteksi Visual Daun Jagung</div>
          <h1 class="maize-title">Unggah Foto Daun Jagung Anda</h1>
          <p class="maize-sub">Model CNN (256x256) mendeteksi Hawar, Karat, atau Sehat sebelum validasi sistem pakar.</p>
        </div>
        """,
        unsafe_allow_html=True,
    )

    with st.container(border=True):
        col_upload, col_pred = st.columns([1, 1.1], gap="large")

        with col_upload:
            uploaded = st.file_uploader(
                "Pilih foto daun jagung (JPG, PNG, WEBP)",
                type=["jpg", "jpeg", "png", "webp"],
            )
            if uploaded is not None:
                _process_uploaded_file(uploaded)

            img_bytes, img_name = get_image_preview()
            if img_bytes is not None:
                st.image(img_bytes, caption=f"{img_name} (input 256x256)", use_container_width=True)
            else:
                st.info("Belum ada foto diunggah. Unggah foto daun jagung di atas untuk memulai.")

        with col_pred:
            cnn_result = get_cnn_result()
            if cnn_result is None:
                st.markdown("#### Hasil Klasifikasi CNN")
                st.caption("Hasil prediksi dan probabilitas kelas akan muncul di sini setelah foto diunggah.")
            else:
                box_cls = "maize-pred-box sehat" if cnn_result.label == "Sehat" else "maize-pred-box"
                st.markdown(
                    f"""
                    <div class="{box_cls}">
                      <span class="maize-pred-label">{escape(cnn_result.label)}</span>
                      <span class="maize-pred-conf">{cnn_result.confidence:.1%}</span>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )
                for cls_name, prob in cnn_result.probabilities.items():
                    st.progress(min(max(prob, 0.0), 1.0), text=f"{cls_name}: {prob:.1%}")

                st.write("")
                if st.button("Lanjut ke Validasi Gejala →", type="primary", use_container_width=True):
                    set_use_cnn_guide(True)
                    go_to_step(2)
                    st.rerun()

    st.write("")
    if st.button("Atau lewati foto dan langsung mulai penelusuran gejala penuh →", use_container_width=True):
        set_use_cnn_guide(False)
        retry_questionnaire()
        st.rerun()


def render_page_expert() -> None:
    """Halaman User 2: Fokus tanya-jawab Backward Chaining + Certainty Factor."""
    kb = load_knowledge_base()
    cnn_result = get_cnn_result()
    use_cnn = is_using_cnn_guide() and cnn_result is not None
    cnn_label = cnn_result.label if (use_cnn and cnn_result is not None) else None

    known = get_known_answers()
    state = evaluate_session(known, cnn_label=cnn_label, kb=kb)

    if state.is_complete:
        go_to_step(3)
        st.rerun()
        return

    assert state.next_fact_id is not None and state.current_goal is not None
    fact_id = state.next_fact_id
    goal_facts = kb.rules[state.current_goal]
    step_idx = goal_facts.index(fact_id) + 1
    total_steps = len(goal_facts)

    _, img_name = get_image_preview()
    if cnn_result is not None and use_cnn:
        ctx_left = f"Target Hipotesis CNN: {cnn_result.label} ({cnn_result.confidence:.1%}) — {img_name}"
    else:
        ctx_left = "Mode Penelusuran Penuh: " + " → ".join(kb.goal_order)

    st.markdown(
        f"""
        <div class="maize-hero">
          <div class="maize-tag">Tahap 2 dari 3 — Validasi Gejala Sistem Pakar</div>
          <h1 class="maize-title">Konfirmasi Kondisi Daun Jagung</h1>
        </div>
        <div class="maize-ctx-bar">
          <span>{escape(ctx_left)}</span>
          <span>Pertanyaan {step_idx} dari {total_steps} ({escape(state.current_goal)})</span>
        </div>
        """,
        unsafe_allow_html=True,
    )

    with st.container(border=True):
        st.caption(f"GEJALA {fact_id} — VALIDASI HIPOTESIS {state.current_goal.upper()}")
        st.markdown(f"### {kb.facts.get(fact_id, fact_id)}?")
        st.caption(_SYMPTOM_HINTS.get(fact_id, "Jawab sesuai kondisi fisik daun jagung."))
        st.write("")

        col_yes, col_no = st.columns(2, gap="medium")
        with col_yes:
            if st.button("✓  Ya, Ada Gejala", key=f"ya_{fact_id}", type="primary", use_container_width=True):
                record_answer(fact_id, YA)
                st.rerun()
        with col_no:
            if st.button("✕  Tidak Ada", key=f"no_{fact_id}", use_container_width=True):
                record_answer(fact_id, TIDAK)
                st.rerun()

    st.markdown(
        f"""
        <div class="maize-cf-meter">
          Keyakinan Sementara ({escape(state.current_goal)}):
          MB = {state.current_mb:.3f} &nbsp;|&nbsp;
          MD = {state.current_md:.3f} &nbsp;|&nbsp;
          CF = {state.current_cf:+.3f}
        </div>
        """,
        unsafe_allow_html=True,
    )

    st.write("")
    if st.button("← Kembali ke Upload Foto"):
        go_to_step(1)
        st.rerun()


def render_page_result() -> None:
    """Halaman User 3: Fokus keputusan akhir, validasi silang CNN, tabel CF, dan trace."""
    kb = load_knowledge_base()
    cnn_result = get_cnn_result()
    use_cnn = is_using_cnn_guide() and cnn_result is not None
    cnn_label = cnn_result.label if (use_cnn and cnn_result is not None) else None
    known = get_known_answers()

    state = evaluate_session(known, cnn_label=cnn_label, kb=kb)
    _log_completed_diagnosis(state, cnn_label, cnn_result.confidence if cnn_result else 0.0, known)

    st.markdown(
        """
        <div class="maize-hero">
          <div class="maize-tag">Tahap 3 dari 3 — Hasil Akhir Diagnosis Daun Jagung</div>
          <h1 class="maize-title">Ringkasan Diagnosis & Jejak Penalaran</h1>
        </div>
        """,
        unsafe_allow_html=True,
    )

    _render_verdict_banner(state)

    if cnn_label is not None and cnn_result is not None:
        expert_text = f"{state.best.goal} (CF {state.best.cf:.2f})" if state.best else "Tidak Terbukti"
        col1, col2, col3 = st.columns(3, gap="medium")
        with col1:
            with st.container(border=True):
                st.metric("Prediksi CNN", f"{cnn_label} ({cnn_result.confidence:.1%})")
        with col2:
            with st.container(border=True):
                st.metric("Diagnosis Sistem Pakar", expert_text)
        with col3:
            with st.container(border=True):
                st.metric("Validasi Silang", state.status_match or "-")

    if state.results:
        rows = [
            {
                "Hipotesis": r.goal,
                "MB": round(r.mb, 3),
                "MD": round(r.md, 3),
                "CF": round(r.cf, 3),
                "Status": "Parsial (Dipangkas)" if r.pruned else ("Terbukti" if r.proven else "Tidak Terbukti"),
            }
            for r in state.results
        ]
        st.dataframe(rows, use_container_width=True, hide_index=True)

    trace_text = escape("\n".join(state.trace))
    st.html(
        '<div class="maize-trace-box">'
        '<div class="maize-trace-title">JEJAK PENALARAN BACKWARD CHAINING & CERTAINTY FACTOR</div>'
        f'<pre class="maize-trace-pre">{trace_text}</pre>'
        "</div>"
    )

    col_retry, col_new = st.columns(2, gap="medium")
    with col_retry:
        if st.button("Ulangi Pertanyaan Gejala", use_container_width=True):
            retry_questionnaire()
            st.rerun()
    with col_new:
        if st.button("Diagnosis Daun Baru", type="primary", use_container_width=True):
            start_new_diagnosis()
            st.rerun()


def _log_completed_diagnosis(
    state: DiagnosisState,
    cnn_label: str | None,
    cnn_conf: float,
    known: dict[str, str],
) -> None:
    """Mencatat hasil diagnosis sekali per sesi ke riwayat JSON."""
    _, img_name = get_image_preview()
    sig = f"{img_name or 'tanpa-foto'}:{cnn_label}:{sorted(known.items())}"
    if not mark_history_logged(sig):
        return

    append_diagnosis_log(
        DiagnosisLogEntry(
            timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            image_name=img_name or "Tanpa Foto",
            cnn_label=cnn_label or "-",
            cnn_confidence=cnn_conf,
            expert_label=state.best.goal if state.best else "Tidak Terbukti",
            expert_cf=state.best.cf if state.best else 0.0,
            status_match=state.status_match or "MODE PAKAR",
            final_decision=state.final_decision,
        )
    )


def _process_uploaded_file(uploaded: Any) -> None:
    """Memproses file gambar baru hanya jika signature berubah."""
    raw_bytes = uploaded.getvalue()
    signature = f"{uploaded.name}:{len(raw_bytes)}"
    if get_image_signature() == signature:
        return

    try:
        image = Image.open(BytesIO(raw_bytes))
        with st.status("Memuat model & memprediksi gambar...", expanded=False) as status:
            model = get_cached_model()
            prediction = predict_image(model, image)
            set_uploaded_image(signature, uploaded.name, raw_bytes, prediction)
            status.update(label="Prediksi CNN selesai", state="complete")
    except FileNotFoundError as exc:
        st.error(str(exc))
    except Exception as exc:  # noqa: BLE001
        st.error(f"Gagal memproses gambar atau model: {exc}")


def _render_verdict_banner(state: DiagnosisState) -> None:
    """Menampilkan banner status keputusan akhir sesuai kecocokan hasil."""
    if state.status_match == "SESUAI" or (state.best is not None and state.best.proven):
        st.success(f"**{state.final_decision}**")
    elif state.status_match == "TIDAK SESUAI":
        st.warning(f"**{state.final_decision}**")
    else:
        st.info(f"**{state.final_decision}**")
