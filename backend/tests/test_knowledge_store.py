"""Unit test untuk penyimpanan basis pengetahuan dinamis dan riwayat diagnosis."""

import tempfile
import unittest
from pathlib import Path

from core.expert_system import evaluate_session
from core.knowledge_store import (
    DiagnosisLogEntry,
    KnowledgeBase,
    append_diagnosis_log,
    history_to_csv,
    load_diagnosis_history,
    load_knowledge_base,
    save_knowledge_base,
)


class TestKnowledgeStore(unittest.TestCase):
    """Menguji load/save JSON basis pengetahuan dan log riwayat diagnosis."""

    def test_load_knowledge_base_returns_defaults_when_missing(self) -> None:
        """Jika file JSON belum ada, kembalikan basis pengetahuan default."""
        with tempfile.TemporaryDirectory() as tmpdir:
            kb = load_knowledge_base(Path(tmpdir) / "kb.json")
            self.assertIn("G1", kb.facts)
            self.assertIn("Karat", kb.mb_md)
            self.assertAlmostEqual(kb.cf_accept, 0.60)
            self.assertAlmostEqual(kb.cf_dugaan, 0.30)

    def test_save_and_reload_knowledge_base(self) -> None:
        """Perubahan bobot MB/MD dan threshold oleh admin harus tersimpan di JSON."""
        with tempfile.TemporaryDirectory() as tmpdir:
            kb_path = Path(tmpdir) / "kb.json"
            kb = load_knowledge_base(kb_path)
            updated_mb_md = dict(kb.mb_md)
            updated_mb_md["Hawar"] = dict(updated_mb_md["Hawar"])
            updated_mb_md["Hawar"]["G4"] = (0.95, 0.05)
            new_kb = KnowledgeBase(
                facts=kb.facts,
                mb_md=updated_mb_md,
                goal_order=kb.goal_order,
                cf_accept=0.65,
                cf_dugaan=0.35,
            )
            save_knowledge_base(new_kb, kb_path)

            reloaded = load_knowledge_base(kb_path)
            self.assertAlmostEqual(reloaded.cf_accept, 0.65)
            self.assertEqual(reloaded.mb_md["Hawar"]["G4"], (0.95, 0.05))

            state = evaluate_session({"G4": "ya", "G5": "tidak"}, cnn_label="Hawar", kb=reloaded)
            self.assertTrue(state.is_complete)
            self.assertIsNotNone(state.best)
            assert state.best is not None
            self.assertAlmostEqual(state.best.cf, 0.95)

    def test_append_history_and_export_csv(self) -> None:
        """Log diagnosis harus tersimpan dan dapat diekspor ke CSV."""
        with tempfile.TemporaryDirectory() as tmpdir:
            hist_path = Path(tmpdir) / "history.json"
            entry = DiagnosisLogEntry(
                timestamp="2026-11-28 01:50:00",
                image_name="018.jpg",
                cnn_label="Karat",
                cnn_confidence=0.974,
                expert_label="Karat",
                expert_cf=0.99,
                status_match="SESUAI",
                final_decision="Terdiagnosis: Karat",
            )
            append_diagnosis_log(entry, hist_path)
            entries = load_diagnosis_history(hist_path)
            self.assertEqual(len(entries), 1)
            self.assertEqual(entries[0].image_name, "018.jpg")

            csv_text = history_to_csv(entries)
            self.assertIn("timestamp,image_name,cnn_label", csv_text)
            self.assertIn("018.jpg,Karat,0.974,Karat,0.990,SESUAI", csv_text)


if __name__ == "__main__":
    unittest.main()

