"""Unit test untuk mesin inferensi backward chaining dan Certainty Factor."""

import unittest

from core.config import CF_ACCEPT, TIDAK, YA
from core.expert_system import (
    HypothesisResult,
    best_case_cf,
    cf_label,
    combine,
    decide,
    evaluate_session,
)


class TestExpertSystem(unittest.TestCase):
    """Menguji perhitungan CF, pruning, dan alur backward chaining."""

    def test_combine_mycin_incremental(self) -> None:
        """Kombinasi MB 0.90 dan 0.90 harus menghasilkan 0.99."""
        self.assertAlmostEqual(combine(0.0, 0.90), 0.90)
        self.assertAlmostEqual(combine(0.90, 0.90), 0.99)

    def test_cf_label_thresholds(self) -> None:
        """Label keyakinan harus mengikuti ambang batas CF."""
        self.assertEqual(cf_label(0.90), "Sangat yakin")
        self.assertEqual(cf_label(0.70), "Yakin")
        self.assertEqual(cf_label(0.50), "Cukup yakin")
        self.assertEqual(cf_label(0.30), "Kurang yakin")
        self.assertEqual(cf_label(0.10), "Tidak terbukti")

    def test_best_case_cf_assumes_unanswered_are_ya(self) -> None:
        """CF maksimum mengasumsikan gejala tersisa bernilai YA."""
        cf_max = best_case_cf("Hawar", {"G4": TIDAK}, idx=0, mb=0.0, md=0.0)
        self.assertAlmostEqual(cf_max, 0.60)

    def test_evaluate_session_karat_with_cnn_matches_notebook(self) -> None:
        """Skenario notebook: CNN=Karat, G1=ya, G2=tidak, G3=ya -> CF=0.99, SESUAI."""
        state1 = evaluate_session({}, cnn_label="Karat")
        self.assertFalse(state1.is_complete)
        self.assertEqual(state1.next_fact_id, "G1")

        state2 = evaluate_session({"G1": YA}, cnn_label="Karat")
        self.assertFalse(state2.is_complete)
        self.assertEqual(state2.next_fact_id, "G2")
        self.assertAlmostEqual(state2.current_mb, 0.90)
        self.assertAlmostEqual(state2.current_cf, 0.90)

        state3 = evaluate_session({"G1": YA, "G2": TIDAK}, cnn_label="Karat")
        self.assertFalse(state3.is_complete)
        self.assertEqual(state3.next_fact_id, "G3")

        final = evaluate_session({"G1": YA, "G2": TIDAK, "G3": YA}, cnn_label="Karat")
        self.assertTrue(final.is_complete)
        self.assertIsNone(final.next_fact_id)
        self.assertIsNotNone(final.best)
        assert final.best is not None
        self.assertEqual(final.best.goal, "Karat")
        self.assertAlmostEqual(final.best.cf, 0.99)
        self.assertTrue(final.best.proven)
        self.assertEqual(final.status_match, "SESUAI")
        self.assertIn("Terdiagnosis: Karat", final.final_decision)

    def test_evaluate_session_prunes_when_best_case_below_threshold(self) -> None:
        """Jika CF maksimum yang tersisa < CF_ACCEPT, hipotesis langsung dipangkas."""
        state = evaluate_session({"G6": TIDAK}, cnn_label="Sehat")
        self.assertTrue(state.is_complete)
        self.assertIsNone(state.next_fact_id)
        self.assertEqual(len(state.results), 1)
        self.assertTrue(state.results[0].pruned)
        self.assertLess(state.results[0].cf, CF_ACCEPT)
        self.assertEqual(state.status_match, "TIDAK SESUAI")

    def test_evaluate_session_without_cnn_iterates_goal_order(self) -> None:
        """Tanpa CNN, sistem menanyakan berurutan dan berhenti saat satu goal terbukti."""
        known = {"G1": YA, "G2": YA, "G3": YA}
        final = evaluate_session(known, cnn_label=None)
        self.assertTrue(final.is_complete)
        self.assertIsNotNone(final.best)
        assert final.best is not None
        self.assertEqual(final.best.goal, "Karat")
        self.assertIsNone(final.status_match)
        self.assertEqual(len(final.results), 1)

    def test_decide_dugaan_and_unknown(self) -> None:
        """Uji kategori Dugaan (0.30 <= CF < 0.60) dan Tidak dapat menentukan."""
        dugaan_res = [
            HypothesisResult(goal="Sehat", mb=0.5, md=0.0, cf=0.5, pruned=False, proven=False)
        ]
        best, text = decide(dugaan_res)
        self.assertIsNotNone(best)
        self.assertIsNotNone(text)
        assert text is not None
        self.assertTrue(text.startswith("Dugaan: Sehat"))

        unknown_res = [
            HypothesisResult(goal="Karat", mb=0.0, md=0.0, cf=0.0, pruned=True, proven=False)
        ]
        best_u, text_u = decide(unknown_res)
        self.assertIsNone(best_u)
        self.assertIsNone(text_u)


if __name__ == "__main__":
    unittest.main()
