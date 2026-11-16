import json
import os
import tempfile
import unittest

from evaluation.agreement_tracker import (
    CRITICAL_ALERT_THRESHOLD_PERCENT,
    DEFAULT_CATEGORIES,
    AgreementTracker,
    generate_benchmark_dataset,
)


class AgreementTrackerTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tracker = AgreementTracker(alert_threshold=70.0)

    def test_empty_tracker_defaults(self) -> None:
        self.assertEqual(self.tracker.calculate_agreement_rate(), 100.0)
        self.assertFalse(self.tracker.is_alert_triggered())
        report = self.tracker.get_summary_report()
        self.assertEqual(report["totalEvaluated"], 0)
        self.assertEqual(report["agreedCount"], 0)
        self.assertEqual(report["overriddenCount"], 0)

    def test_agreement_rate_calculation(self) -> None:
        # 3 concordants, 1 non concordant => 75%
        self.tracker.record_sample("REP-1", "DEPOT_SAUVAGE", "DEPOT_SAUVAGE", ai_overridden=False)
        self.tracker.record_sample("REP-2", "ENCOMBRANTS", "ENCOMBRANTS", ai_overridden=False)
        self.tracker.record_sample("REP-3", "GRAFFITI", "GRAFFITI", ai_overridden=False)
        self.tracker.record_sample("REP-4", "DEPOT_SAUVAGE", "ENCOMBRANTS", ai_overridden=True)

        self.assertEqual(self.tracker.calculate_agreement_rate(), 75.0)
        self.assertFalse(self.tracker.is_alert_triggered())

    def test_alert_triggered_below_70_percent(self) -> None:
        # 2 concordants, 2 non concordants => 50% (< 70%)
        self.tracker.record_sample("REP-1", "DEPOT_SAUVAGE", "DEPOT_SAUVAGE", ai_overridden=False)
        self.tracker.record_sample("REP-2", "ENCOMBRANTS", "ENCOMBRANTS", ai_overridden=False)
        self.tracker.record_sample("REP-3", "DEPOT_SAUVAGE", "ENCOMBRANTS", ai_overridden=True)
        self.tracker.record_sample("REP-4", "DECHETS_VERTS", "AUTRE", ai_overridden=True)

        self.assertEqual(self.tracker.calculate_agreement_rate(), 50.0)
        self.assertTrue(self.tracker.is_alert_triggered())
        report = self.tracker.get_summary_report()
        self.assertTrue(report["isAlertTriggered"])
        self.assertIn("ALERTE MLOPS", report["alertMessage"])

    def test_confusion_matrix_dimensions_and_values(self) -> None:
        self.tracker.record_sample("REP-1", "DEPOT_SAUVAGE", "DEPOT_SAUVAGE", ai_overridden=False)
        self.tracker.record_sample("REP-2", "DEPOT_SAUVAGE", "ENCOMBRANTS", ai_overridden=True)
        self.tracker.record_sample("REP-3", "DEPOT_SAUVAGE", "ENCOMBRANTS", ai_overridden=True)
        self.tracker.record_sample("REP-4", "GRAFFITI", "GRAFFITI", ai_overridden=False)

        matrix = self.tracker.build_confusion_matrix()

        # Matrice 6x6
        self.assertEqual(len(matrix), 6)
        for row in matrix.values():
            self.assertEqual(len(row), 6)

        # Vérification des cellules
        self.assertEqual(matrix["DEPOT_SAUVAGE"]["DEPOT_SAUVAGE"], 1)
        self.assertEqual(matrix["DEPOT_SAUVAGE"]["ENCOMBRANTS"], 2)
        self.assertEqual(matrix["GRAFFITI"]["GRAFFITI"], 1)

    def test_most_confused_classes(self) -> None:
        # 3 erreurs DEPOT_SAUVAGE -> ENCOMBRANTS
        for i in range(3):
            self.tracker.record_sample(f"REP-A{i}", "DEPOT_SAUVAGE", "ENCOMBRANTS", ai_overridden=True)
        # 1 erreur GRAVATS -> DEPOT_SAUVAGE
        self.tracker.record_sample("REP-B", "GRAVATS_CHANTIER", "DEPOT_SAUVAGE", ai_overridden=True)

        confused = self.tracker.get_most_confused_classes(limit=2)
        self.assertEqual(len(confused), 2)
        self.assertEqual(confused[0]["predicted"], "DEPOT_SAUVAGE")
        self.assertEqual(confused[0]["actual"], "ENCOMBRANTS")
        self.assertEqual(confused[0]["occurrences"], 3)

    def test_export_active_learning_dataset(self) -> None:
        self.tracker.record_sample("REP-1", "DEPOT_SAUVAGE", "DEPOT_SAUVAGE", ai_overridden=False)
        self.tracker.record_sample(
            "REP-2",
            "DEPOT_SAUVAGE",
            "ENCOMBRANTS",
            confidence=0.88,
            image_url="/assets/reports/rep2.png",
            ai_overridden=True,
        )

        with tempfile.TemporaryDirectory() as tmpdir:
            out_file = os.path.join(tmpdir, "test_active_learning.json")
            count, path = self.tracker.export_divergences_to_json(out_file)

            self.assertEqual(count, 1)
            self.assertTrue(os.path.exists(path))

            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)

            self.assertEqual(data["totalDivergences"], 1)
            sample = data["samples"][0]
            self.assertEqual(sample["reportId"], "REP-2")
            self.assertEqual(sample["predictedCategory"], "DEPOT_SAUVAGE")
            self.assertEqual(sample["actualCategory"], "ENCOMBRANTS")
            self.assertEqual(sample["reannotationPriority"], "HIGH")

    def test_benchmark_dataset(self) -> None:
        tracker = generate_benchmark_dataset(count=450, seed=42)
        report = tracker.get_summary_report()

        self.assertEqual(report["totalEvaluated"], 450)
        self.assertGreater(report["agreementRateValue"], 80.0)
        self.assertLess(report["agreementRateValue"], 95.0)
        self.assertFalse(report["isAlertTriggered"])


if __name__ == "__main__":
    unittest.main()
