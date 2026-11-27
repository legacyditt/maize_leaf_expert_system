# Maize Leaf Disease Expert System (CNN + Backward Chaining CF)

Aplikasi diagnosis penyakit daun jagung (**Hawar**, **Karat**, **Sehat**) yang menggabungkan:
1. **CNN (`maize_leaf_model.keras`)**: klasifikasi citra daun ukuran `256x256` piksel.
2. **Sistem Pakar (Backward Chaining + Certainty Factor)**: validasi gejala interaktif dengan *Measure of Belief* (MB), *Measure of Disbelief* (MD), dan *pruning* (`CF_ACCEPT = 0.60`).

## Arsitektur & Separation of Concerns (SOC)

Proyek dibagi menjadi 3 lapisan agar logika bisnis tidak bercampur dengan kode UI:

```text
maize-leaf-expert-system/
├── app.py                  # Entry point Streamlit (hanya orchestrasi halaman)
├── core/                   # Domain logic & ML inference (bebas dari UI Streamlit)
│   ├── __init__.py
│   ├── config.py           # Konstanta global (IMG_SIZE, CLASS_NAMES, threshold CF)
│   ├── cnn_predictor.py    # Load model & fungsi prediksi citra
│   └── expert_system.py    # Basis pengetahuan (FACTS, MB_MD, RULES) & mesin CF
├── ui/                     # Lapisan presentasi Streamlit
│   ├── __init__.py
│   ├── state.py            # Manajemen st.session_state (init, reset, step jawaban)
│   └── components.py       # Komponen render UI (upload, kuesioner, hasil, trace)
├── models/                 # Direktori penyimpanan maize_leaf_model.keras
├── tests/                  # Unit test untuk lapisan core/
├── .streamlit/config.toml  # Konfigurasi tema & batas upload
└── requirements.txt
```

## Setup Lokal

1. Pastikan Python 3.11+ terpasang.
2. Install dependensi:
   ```bash
   pip install -r requirements.txt
   ```
3. Letakkan file `maize_leaf_model.keras` ke dalam folder `models/`.
4. Jalankan aplikasi:
   ```bash
   streamlit run app.py
   ```
5. Jalankan unit test:
   ```bash
   pytest
   ```

