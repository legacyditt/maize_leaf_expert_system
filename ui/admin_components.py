"""Komponen halaman Admin UI (1 halaman 1 fitur) untuk MaizeCare AI."""

import json
import zipfile

import streamlit as st

from core.config import CLASS_NAMES, IMG_SIZE, MODEL_PATH
from core.knowledge_store import (
    KnowledgeBase,
    clear_diagnosis_history,
    default_knowledge_base,
    history_to_csv,
    load_diagnosis_history,
    load_knowledge_base,
    save_knowledge_base,
)


def render_admin_kb() -> None:
    """Admin 1: Kelola Basis Pengetahuan (Gejala, Bobot MB & MD)."""
    kb = load_knowledge_base()

    st.markdown(
        """
        <div class="maize-hero">
          <div class="maize-tag">Admin 1 dari 3 — Basis Pengetahuan Pakar</div>
          <h1 class="maize-title">Kelola Gejala & Bobot MB / MD</h1>
          <p class="maize-sub">Ubah bobot keyakinan gejala atau tambah aturan baru tanpa mengubah kode inti.</p>
        </div>
        """,
        unsafe_allow_html=True,
    )

    rows = [
        {
            "Penyakit": goal,
            "Kode": fact_id,
            "Gejala": kb.facts.get(fact_id, ""),
            "MB": float(mb),
            "MD": float(md),
        }
        for goal, symptoms in kb.mb_md.items()
        for fact_id, (mb, md) in symptoms.items()
    ]

    with st.container(border=True):
        edited = st.data_editor(
            rows,
            use_container_width=True,
            hide_index=True,
            disabled=["Penyakit", "Kode"],
            column_config={
                "MB": st.column_config.NumberColumn("MB (Ya)", min_value=0.0, max_value=1.0, step=0.05, format="%.2f"),
                "MD": st.column_config.NumberColumn("MD (Tidak)", min_value=0.0, max_value=1.0, step=0.05, format="%.2f"),
            },
        )

        col_save, col_reset = st.columns(2, gap="medium")
        with col_save:
            if st.button("Simpan Perubahan Basis Pengetahuan", type="primary", use_container_width=True):
                new_facts = dict(kb.facts)
                new_mb_md: dict[str, dict[str, tuple[float, float]]] = {g: {} for g in kb.mb_md}
                for row in edited:
                    code = str(row["Kode"])
                    goal = str(row["Penyakit"])
                    new_facts[code] = str(row["Gejala"])
                    new_mb_md[goal][code] = (float(row["MB"]), float(row["MD"]))
                save_knowledge_base(
                    KnowledgeBase(
                        facts=new_facts,
                        mb_md=new_mb_md,
                        goal_order=kb.goal_order,
                        cf_accept=kb.cf_accept,
                        cf_dugaan=kb.cf_dugaan,
                    )
                )
                st.success("Basis pengetahuan berhasil disimpan.")
                st.rerun()

        with col_reset:
            if st.button("Reset ke Default Notebook", use_container_width=True):
                save_knowledge_base(default_knowledge_base())
                st.info("Basis pengetahuan dikembalikan ke nilai awal.")
                st.rerun()

    with st.expander("+ Tambah Gejala / Aturan Baru"):
        with st.form("add_symptom_form", clear_on_submit=True):
            target_goal = st.selectbox("Target Penyakit", options=list(kb.mb_md.keys()))
            new_code = st.text_input("Kode Gejala (mis. G8)").strip().upper()
            new_desc = st.text_input("Deskripsi Pertanyaan Gejala").strip()
            col_mb, col_md = st.columns(2)
            new_mb = col_mb.slider("Bobot MB (jika YA)", 0.0, 1.0, 0.70, 0.05)
            new_md = col_md.slider("Bobot MD (jika TIDAK)", 0.0, 1.0, 0.00, 0.05)
            submitted = st.form_submit_button("Tambahkan Aturan", type="primary")
            if submitted:
                if not new_code or not new_desc:
                    st.error("Kode dan deskripsi gejala wajib diisi.")
                else:
                    new_facts = dict(kb.facts)
                    new_facts[new_code] = new_desc
                    new_mb_md = {g: dict(s) for g, s in kb.mb_md.items()}
                    new_mb_md[target_goal][new_code] = (float(new_mb), float(new_md))
                    save_knowledge_base(
                        KnowledgeBase(
                            facts=new_facts,
                            mb_md=new_mb_md,
                            goal_order=kb.goal_order,
                            cf_accept=kb.cf_accept,
                            cf_dugaan=kb.cf_dugaan,
                        )
                    )
                    st.success(f"Gejala {new_code} ditambahkan ke hipotesis {target_goal}.")
                    st.rerun()


def render_admin_params() -> None:
    """Admin 2: Kalibrasi Threshold CF dan Manajemen File Model .keras."""
    kb = load_knowledge_base()

    st.markdown(
        """
        <div class="maize-hero">
          <div class="maize-tag">Admin 2 dari 3 — Kalibrasi & Model Inferensi</div>
          <h1 class="maize-title">Parameter CF & Manajemen Model .keras</h1>
        </div>
        """,
        unsafe_allow_html=True,
    )

    col_cf, col_model = st.columns(2, gap="large")

    with col_cf:
        with st.container(border=True):
            st.subheader("Ambang Batas Certainty Factor")
            cf_accept = st.slider("CF_ACCEPT (Terdiagnosis & Pruning)", 0.10, 0.95, float(kb.cf_accept), 0.05)
            cf_dugaan = st.slider("CF_DUGAAN (Batas Dugaan)", 0.05, float(cf_accept), min(float(kb.cf_dugaan), float(cf_accept)), 0.05)
            goal_order = st.multiselect(
                "Urutan Penelusuran Tanpa CNN",
                options=list(kb.mb_md.keys()),
                default=list(kb.goal_order),
            )
            if st.button("Simpan Parameter CF", type="primary", use_container_width=True):
                order = tuple(goal_order) if goal_order else kb.goal_order
                save_knowledge_base(
                    KnowledgeBase(
                        facts=kb.facts,
                        mb_md=kb.mb_md,
                        goal_order=order,
                        cf_accept=float(cf_accept),
                        cf_dugaan=float(cf_dugaan),
                    )
                )
                st.success("Parameter CF berhasil diperbarui.")

    with col_model:
        with st.container(border=True):
            st.subheader("Status Model CNN Aktif")
            if MODEL_PATH.exists():
                size_mb = MODEL_PATH.stat().st_size / (1024 * 1024)
                keras_ver = _read_keras_version()
                st.markdown(
                    f"""
                    - **File:** `{MODEL_PATH.name}`
                    - **Ukuran:** `{size_mb:.2f} MB` (`Keras {keras_ver}`)
                    - **Input:** `{IMG_SIZE} x {IMG_SIZE} x 3` (RGB)
                    - **Kelas:** `{", ".join(CLASS_NAMES)}`
                    """
                )
            else:
                st.warning("File `models/maize_leaf_model.keras` belum tersedia.")

            new_model = st.file_uploader("Unggah File .keras Baru (Tanpa Training)", type=["keras"])
            if new_model is not None and st.button("Terapkan Model Baru", use_container_width=True):
                MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
                MODEL_PATH.write_bytes(new_model.getvalue())
                st.cache_resource.clear()
                st.success("Model baru disimpan dan cache dibersihkan.")
                st.rerun()


def render_admin_history() -> None:
    """Admin 3: Monitoring Riwayat Diagnosis & Evaluasi Kecocokan CNN vs Pakar."""
    entries = load_diagnosis_history()

    st.markdown(
        """
        <div class="maize-hero">
          <div class="maize-tag">Admin 3 dari 3 — Monitoring & Log Diagnosis</div>
          <h1 class="maize-title">Riwayat Diagnosis & Kecocokan CNN vs Pakar</h1>
        </div>
        """,
        unsafe_allow_html=True,
    )

    total = len(entries)
    sesuai_count = sum(1 for item in entries if item.status_match == "SESUAI")
    mismatch_count = sum(1 for item in entries if item.status_match == "TIDAK SESUAI")
    sesuai_pct = (sesuai_count / total * 100.0) if total else 0.0

    k1, k2, k3 = st.columns(3, gap="medium")
    with k1:
        with st.container(border=True):
            st.metric("Total Diagnosis", f"{total} Sesi")
    with k2:
        with st.container(border=True):
            st.metric("Kecocokan (SESUAI)", f"{sesuai_pct:.1f}% ({sesuai_count}/{total})")
    with k3:
        with st.container(border=True):
            st.metric("Perlu Verifikasi Pakar", f"{mismatch_count} Kasus")

    if not entries:
        st.info("Belum ada riwayat diagnosis tercatat. Lakukan diagnosis di Mode User untuk mengisi log.")
        return

    rows = [
        {
            "Waktu": item.timestamp,
            "Foto": item.image_name,
            "CNN": f"{item.cnn_label} ({item.cnn_confidence:.0%})" if item.cnn_label != "-" else "-",
            "Pakar": item.expert_label,
            "CF": f"{item.expert_cf:+.2f}",
            "Status": item.status_match,
        }
        for item in entries
    ]
    st.dataframe(rows, use_container_width=True, hide_index=True)

    col_dl, col_clr = st.columns(2, gap="medium")
    with col_dl:
        st.download_button(
            "Unduh Laporan Riwayat (.CSV)",
            data=history_to_csv(entries),
            file_name="riwayat_diagnosis_jagung.csv",
            mime="text/csv",
            type="primary",
            use_container_width=True,
        )
    with col_clr:
        if st.button("Hapus Semua Riwayat", use_container_width=True):
            clear_diagnosis_history()
            st.rerun()


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

