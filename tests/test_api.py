"""Integration test untuk FastAPI backend (auth, diagnosis CF, dan admin KB)."""

import io
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient
from PIL import Image

from core.cnn_predictor import PredictionResult


class TestFastApiBackend(unittest.TestCase):
    """Menguji endpoint FastAPI tanpa memuat model TensorFlow asli."""

    def setUp(self) -> None:
        self._tmpdir = tempfile.TemporaryDirectory()
        self._kb_path = Path(self._tmpdir.name) / "kb.json"
        self._hist_path = Path(self._tmpdir.name) / "history.json"

        self._patches = [
            patch("api.routes_diagnosis.KB_PATH", self._kb_path),
            patch("api.routes_diagnosis.HISTORY_PATH", self._hist_path),
            patch("api.routes_admin.KB_PATH", self._kb_path),
            patch("api.routes_admin.HISTORY_PATH", self._hist_path),
        ]
        for p in self._patches:
            p.start()

        from api.main import create_app

        self.client = TestClient(create_app())

    def tearDown(self) -> None:
        for p in self._patches:
            p.stop()
        self._tmpdir.cleanup()

    def test_health_endpoint(self) -> None:
        """Health endpoint harus mengembalikan status ok."""
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "ok")

    def test_predict_endpoint_with_mocked_cnn(self) -> None:
        """Upload gambar ke /api/predict harus mengembalikan label & probabilitas."""
        img = Image.new("RGB", (64, 64), (30, 120, 40))
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)

        fake_pred = PredictionResult(
            label="Karat",
            confidence=0.974,
            probabilities={"Hawar": 0.026, "Karat": 0.974, "Sehat": 0.0},
        )
        with (
            patch("api.routes_diagnosis.get_cached_model", return_value=object()),
            patch("api.routes_diagnosis.predict_image", return_value=fake_pred),
        ):
            res = self.client.post(
                "/api/predict",
                files={"file": ("leaf.png", buf.getvalue(), "image/png")},
            )

        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertEqual(body["label"], "Karat")
        self.assertAlmostEqual(body["confidence"], 0.974)

    def test_expert_evaluate_and_history_flow(self) -> None:
        """Evaluasi backward chaining bertahap dan pencatatan riwayat."""
        step1 = self.client.post(
            "/api/expert/evaluate",
            json={"known": {}, "cnn_label": "Karat"},
        )
        self.assertEqual(step1.status_code, 200)
        self.assertFalse(step1.json()["is_complete"])
        self.assertEqual(step1.json()["next_fact_id"], "G1")

        final = self.client.post(
            "/api/expert/evaluate",
            json={
                "known": {"G1": "ya", "G2": "tidak", "G3": "ya"},
                "cnn_label": "Karat",
                "cnn_confidence": 0.974,
                "image_name": "018.jpg",
                "log_history": True,
            },
        )
        self.assertEqual(final.status_code, 200)
        data = final.json()
        self.assertTrue(data["is_complete"])
        self.assertEqual(data["status_match"], "SESUAI")
        self.assertAlmostEqual(data["best"]["cf"], 0.99)

    def test_admin_endpoints_require_auth_and_allow_updates(self) -> None:
        """Endpoint /api/admin/* wajib menolak request tanpa token yang valid."""
        unauth = self.client.get("/api/admin/kb")
        self.assertEqual(unauth.status_code, 401)

        bad_login = self.client.post("/api/auth/login", json={"password": "salah"})
        self.assertEqual(bad_login.status_code, 401)

        login = self.client.post("/api/auth/login", json={"password": "admin123"})
        self.assertEqual(login.status_code, 200)
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        kb_res = self.client.get("/api/admin/kb", headers=headers)
        self.assertEqual(kb_res.status_code, 200)
        kb_data = kb_res.json()
        self.assertAlmostEqual(kb_data["cf_accept"], 0.60)

        kb_data["cf_accept"] = 0.70
        upd = self.client.put("/api/admin/kb", json=kb_data, headers=headers)
        self.assertEqual(upd.status_code, 200)
        self.assertAlmostEqual(upd.json()["cf_accept"], 0.70)


if __name__ == "__main__":
    unittest.main()

