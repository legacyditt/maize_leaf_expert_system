"""Unit test untuk preprocessing citra dan wrapper prediksi CNN."""

import unittest
from pathlib import Path

import numpy as np
from PIL import Image

from core.cnn_predictor import load_keras_model, predict_image, preprocess_image
from core.config import CLASS_NAMES, IMG_SIZE


class _DummyKerasModel:
    """Mock model Keras untuk menguji pipeline prediksi tanpa file .keras."""

    def __init__(self, probs: list[float]) -> None:
        self._probs = np.array([probs], dtype=np.float32)
        self.last_input_shape: tuple[int, ...] | None = None
        self.last_training_flag: bool | None = None

    def __call__(self, x: np.ndarray, training: bool = False) -> np.ndarray:
        self.last_input_shape = x.shape
        self.last_training_flag = training
        return self._probs


class TestCnnPredictor(unittest.TestCase):
    """Menguji preprocessing RGBA/RGB dan pemetaan probabilitas kelas."""

    def test_preprocess_image_converts_rgba_to_rgb_batch(self) -> None:
        """Gambar RGBA ukuran bebas harus menjadi tensor float32 (1, 256, 256, 3)."""
        rgba_img = Image.new("RGBA", (640, 480), (10, 120, 200, 255))
        batch = preprocess_image(rgba_img)
        self.assertEqual(batch.shape, (1, IMG_SIZE, IMG_SIZE, 3))
        self.assertEqual(batch.dtype, np.float32)
        self.assertGreater(float(batch.max()), 1.0)  # skala 0-255 dipertahankan

    def test_predict_image_returns_highest_class_and_probabilities(self) -> None:
        """Prediksi harus memilih kelas probabilitas tertinggi dengan training=False."""
        dummy_model = _DummyKerasModel([0.026, 0.974, 0.000])
        rgb_img = Image.new("RGB", (300, 300), (50, 150, 50))

        result = predict_image(dummy_model, rgb_img)
        self.assertEqual(dummy_model.last_input_shape, (1, IMG_SIZE, IMG_SIZE, 3))
        self.assertFalse(dummy_model.last_training_flag)
        self.assertEqual(result.label, "Karat")
        self.assertAlmostEqual(result.confidence, 0.974, places=3)
        self.assertEqual(tuple(result.probabilities.keys()), CLASS_NAMES)

    def test_load_keras_model_raises_clear_error_when_missing(self) -> None:
        """File model yang tidak ada harus memunculkan FileNotFoundError."""
        with self.assertRaises(FileNotFoundError):
            load_keras_model(Path("models/tidak_ada.keras"))


if __name__ == "__main__":
    unittest.main()

