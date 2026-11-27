"""Wrapper inferensi model CNN Keras untuk klasifikasi penyakit daun jagung.

Modul ini terpisah dari UI Streamlit sehingga caching model (`@st.cache_resource`)
diterapkan di lapisan UI, sementara preprocessing dan prediksi tetap murni Python.
"""

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image

from core.config import CLASS_NAMES, IMG_SIZE, MODEL_PATH


@dataclass(frozen=True)
class PredictionResult:
    """Hasil prediksi CNN untuk satu gambar daun."""

    label: str
    confidence: float
    probabilities: dict[str, float]


def load_keras_model(model_path: Path = MODEL_PATH) -> Any:
    """Memuat file model `.keras` dari disk.

    TensorFlow di-import secara lazy agar modul tetap ringan saat unit test
    atau saat hanya bagian sistem pakar yang dipakai.
    """
    if not model_path.exists():
        raise FileNotFoundError(
            f"File model tidak ditemukan di '{model_path}'. "
            "Salin file maize_leaf_model.keras ke folder models/ terlebih dahulu."
        )

    import tensorflow as tf  # noqa: PLC0415

    return tf.keras.models.load_model(model_path)


def preprocess_image(image: Image.Image, target_size: int = IMG_SIZE) -> np.ndarray:
    """Mengubah objek PIL Image menjadi batch tensor (1, H, W, 3) skala 0-255."""
    rgb_image = image.convert("RGB").resize((target_size, target_size))
    array = np.asarray(rgb_image, dtype=np.float32)
    return np.expand_dims(array, axis=0)


def predict_image(model: Any, image: Image.Image) -> PredictionResult:
    """Menjalankan inferensi CNN tanpa training dan memetakan probabilitas kelas."""
    batch = preprocess_image(image)
    raw_output = model(batch, training=False)
    probs_array = raw_output.numpy()[0] if hasattr(raw_output, "numpy") else np.asarray(raw_output)[0]

    probabilities = {
        name: float(probs_array[idx])
        for idx, name in enumerate(CLASS_NAMES)
    }
    best_idx = int(np.argmax(probs_array))
    best_label = CLASS_NAMES[best_idx]

    return PredictionResult(
        label=best_label,
        confidence=float(probs_array[best_idx]),
        probabilities=probabilities,
    )

