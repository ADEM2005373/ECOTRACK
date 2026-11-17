#!/usr/bin/env python3
"""
Unit tests for AI Vision Scientific Benchmark Evaluator
Ticket Jira: SCRUM-63 (ECO-51)
Exigence: NFR-02 : Précision Scientifique & Métrologie IA
"""

import json
import os
import tempfile
import unittest

from evaluation.benchmark import (
    CRITICAL_F1_THRESHOLD,
    DEFAULT_CLASSES,
    BenchmarkEvaluator,
)


class BenchmarkEvaluatorTests(unittest.TestCase):
    def setUp(self) -> None:
        self.evaluator = BenchmarkEvaluator(min_f1_threshold=0.80)

    def test_empty_evaluator_defaults(self) -> None:
        metrics = self.evaluator.compute_metrics()
        self.assertEqual(metrics["total_samples"], 0)
        self.assertEqual(metrics["accuracy"], 0.0)
        self.assertEqual(metrics["macro_f1"], 0.0)
        self.assertEqual(metrics["weighted_f1"], 0.0)
        self.assertFalse(metrics["is_threshold_met"])

    def test_perfect_classification_metrics(self) -> None:
        # 1 sample correct pour chaque classe => 100% de précision et rappel
        for i, cat in enumerate(DEFAULT_CLASSES):
            self.evaluator.add_sample(f"ID-{i}", ground_truth=cat, predicted=cat)

        metrics = self.evaluator.compute_metrics()
        self.assertEqual(metrics["total_samples"], len(DEFAULT_CLASSES))
        self.assertEqual(metrics["accuracy"], 1.0)
        self.assertEqual(metrics["macro_precision"], 1.0)
        self.assertEqual(metrics["macro_recall"], 1.0)
        self.assertEqual(metrics["macro_f1"], 1.0)
        self.assertEqual(metrics["weighted_f1"], 1.0)
        self.assertTrue(metrics["is_threshold_met"])

    def test_hand_crafted_metrics_calculation(self) -> None:
        # DEPOT_SAUVAGE:
        # 2 TP (vrai=DEPOT, pred=DEPOT)
        # 1 FN (vrai=DEPOT, pred=ENCOMBRANTS)
        # 1 FP (vrai=ENCOMBRANTS, pred=DEPOT)
        self.evaluator.add_sample("S1", "DEPOT_SAUVAGE", "DEPOT_SAUVAGE")
        self.evaluator.add_sample("S2", "DEPOT_SAUVAGE", "DEPOT_SAUVAGE")
        self.evaluator.add_sample("S3", "DEPOT_SAUVAGE", "ENCOMBRANTS")
        self.evaluator.add_sample("S4", "ENCOMBRANTS", "DEPOT_SAUVAGE")

        metrics = self.evaluator.compute_metrics()
        depot = metrics["classes"]["DEPOT_SAUVAGE"]

        self.assertEqual(depot["tp"], 2)
        self.assertEqual(depot["fp"], 1)
        self.assertEqual(depot["fn"], 1)
        self.assertEqual(depot["support"], 3)

        # Precision = 2 / (2 + 1) = 0.6667
        # Recall = 2 / (2 + 1) = 0.6667
        # F1 = 2 * (0.6667 * 0.6667) / (0.6667 + 0.6667) = 0.6667
        self.assertAlmostEqual(depot["precision"], 0.6667, places=3)
        self.assertAlmostEqual(depot["recall"], 0.6667, places=3)
        self.assertAlmostEqual(depot["f1_score"], 0.6667, places=3)

    def test_zero_division_safety(self) -> None:
        # Une seule classe représentée, les autres ont 0 TP, 0 FP, 0 FN
        self.evaluator.add_sample("S1", "GRAFFITI", "GRAFFITI")
        metrics = self.evaluator.compute_metrics()

        autre = metrics["classes"]["AUTRE"]
        self.assertEqual(autre["precision"], 0.0)
        self.assertEqual(autre["recall"], 0.0)
        self.assertEqual(autre["f1_score"], 0.0)
        self.assertEqual(autre["support"], 0)

    def test_confusion_matrix_dimensions_and_values(self) -> None:
        self.evaluator.add_sample("S1", "DEPOT_SAUVAGE", "DEPOT_SAUVAGE")
        self.evaluator.add_sample("S2", "DEPOT_SAUVAGE", "ENCOMBRANTS")
        self.evaluator.add_sample("S3", "DECHETS_VERTS", "DECHETS_VERTS")

        matrix = self.evaluator.build_confusion_matrix()

        # Matrice carrée 6x6
        self.assertEqual(len(matrix), 6)
        for row in matrix.values():
            self.assertEqual(len(row), 6)

        self.assertEqual(matrix["DEPOT_SAUVAGE"]["DEPOT_SAUVAGE"], 1)
        self.assertEqual(matrix["DEPOT_SAUVAGE"]["ENCOMBRANTS"], 1)
        self.assertEqual(matrix["DECHETS_VERTS"]["DECHETS_VERTS"], 1)
        self.assertEqual(matrix["ENCOMBRANTS"]["DEPOT_SAUVAGE"], 0)

    def test_threshold_validation(self) -> None:
        # Cas 1 : Évaluation avec F1 bas (50%)
        low_eval = BenchmarkEvaluator(min_f1_threshold=0.80)
        low_eval.add_sample("S1", "DEPOT_SAUVAGE", "DEPOT_SAUVAGE")
        low_eval.add_sample("S2", "DEPOT_SAUVAGE", "ENCOMBRANTS")
        res_low = low_eval.compute_metrics()
        self.assertFalse(res_low["is_threshold_met"])

        # Cas 2 : Évaluation avec F1 élevé (100%)
        high_eval = BenchmarkEvaluator(min_f1_threshold=0.80)
        high_eval.add_sample("S1", "DEPOT_SAUVAGE", "DEPOT_SAUVAGE")
        res_high = high_eval.compute_metrics()
        self.assertTrue(res_high["is_threshold_met"])

    def test_reference_benchmark_dataset_execution(self) -> None:
        evaluator = BenchmarkEvaluator.generate_reference_dataset(count=200, seed=42)
        metrics = evaluator.compute_metrics()

        # Vérification du nombre d'échantillons (200 photos)
        self.assertEqual(metrics["total_samples"], 200)

        # Vérification du seuil contractuel (> 80%)
        self.assertGreaterEqual(metrics["weighted_f1"], 0.80)
        self.assertGreaterEqual(metrics["macro_f1"], 0.80)
        self.assertGreaterEqual(metrics["accuracy"], 0.80)
        self.assertTrue(metrics["is_threshold_met"])

        # Vérification des supports par classe
        classes = metrics["classes"]
        self.assertEqual(classes["DEPOT_SAUVAGE"]["support"], 50)
        self.assertEqual(classes["ENCOMBRANTS"]["support"], 45)
        self.assertEqual(classes["DECHETS_VERTS"]["support"], 35)
        self.assertEqual(classes["GRAVATS_CHANTIER"]["support"], 30)
        self.assertEqual(classes["GRAFFITI"]["support"], 25)
        self.assertEqual(classes["AUTRE"]["support"], 15)

        # Temps d'inférence < 100ms
        self.assertLess(metrics["mean_inference_time_ms"], 100.0)

    def test_export_results_json(self) -> None:
        evaluator = BenchmarkEvaluator.generate_reference_dataset(count=200, seed=42)
        with tempfile.TemporaryDirectory() as tmpdir:
            out_file = os.path.join(tmpdir, "test_benchmark_results.json")
            returned_path = evaluator.export_results_json(out_file)

            self.assertTrue(os.path.exists(returned_path))
            with open(returned_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            self.assertEqual(data["datasetSize"], 200)
            self.assertEqual(data["modelName"], "MobileNetV3-Small-EcoTrack-v2")
            self.assertTrue(data["summary"]["thresholdPassed"])
            self.assertIn("DEPOT_SAUVAGE", data["perClassMetrics"])
            self.assertIn("tp", data["perClassMetrics"]["DEPOT_SAUVAGE"])
            self.assertIn("f1_score", data["perClassMetrics"]["DEPOT_SAUVAGE"])


if __name__ == "__main__":
    unittest.main()
