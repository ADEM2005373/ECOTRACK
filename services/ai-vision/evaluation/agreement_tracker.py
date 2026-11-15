#!/usr/bin/env python3
"""
EcoTrack V2 - AI/MLOps Concordance & Active Learning Tracker
Ticket Jira: SCRUM-61 (ECO-43)
User Story: US-11 - Observabilité de l'IA & Amélioration Continue (Active Learning)

Responsable: Hiba Dhouib (AI / MLOps)
"""

import json
import logging
import os
import random
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("AgreementTracker")

# Standard CDCF V2 & Data Warehouse 6 categories
DEFAULT_CATEGORIES: Tuple[str, ...] = (
    "DEPOT_SAUVAGE",
    "ENCOMBRANTS",
    "DECHETS_VERTS",
    "GRAVATS_CHANTIER",
    "GRAFFITI",
    "AUTRE",
)

CRITICAL_ALERT_THRESHOLD_PERCENT: float = 70.0


@dataclass
class EvaluationSample:
    report_id: str
    predicted_category: str
    actual_category: str
    confidence_score: float
    is_concordant: bool
    ai_overridden: bool
    image_url: Optional[str] = None
    timestamp: Optional[str] = None


class AgreementTracker:
    """
    Suivi scientifique de la concordance entre prédictions IA et validations humaines (Agent municipal).
    Gère le calcul du taux d'accord global, les métriques par classe, la matrice de confusion 6x6,
    le système d'alerte sous le seuil critique (70%) et l'export Active Learning.
    """

    def __init__(
        self,
        categories: Optional[Tuple[str, ...]] = None,
        alert_threshold: float = CRITICAL_ALERT_THRESHOLD_PERCENT,
    ) -> None:
        self.categories: Tuple[str, ...] = categories or DEFAULT_CATEGORIES
        self.alert_threshold: float = alert_threshold
        self.samples: List[EvaluationSample] = []

    def record_sample(
        self,
        report_id: str,
        predicted: str,
        actual: str,
        confidence: float = 0.85,
        image_url: Optional[str] = None,
        ai_overridden: Optional[bool] = None,
        timestamp: Optional[str] = None,
    ) -> EvaluationSample:
        """Enregistre une observation issue de la qualification agent."""
        norm_predicted = predicted.strip().upper()
        norm_actual = actual.strip().upper()

        # Si ai_overridden n'est pas fourni, déduit de l'égalité prédiction vs réel
        if ai_overridden is None:
            ai_overridden = norm_predicted != norm_actual

        is_concordant = not ai_overridden and (norm_predicted == norm_actual)

        sample = EvaluationSample(
            report_id=report_id,
            predicted_category=norm_predicted,
            actual_category=norm_actual,
            confidence_score=round(float(confidence), 4),
            is_concordant=is_concordant,
            ai_overridden=ai_overridden,
            image_url=image_url or f"/assets/reports/{report_id}.png",
            timestamp=timestamp or datetime.now(timezone.utc).isoformat(),
        )
        self.samples.append(sample)
        return sample

    def calculate_agreement_rate(self) -> float:
        """
        Formule CDCF V2:
        aiAgreementRate = (Validés sans modification / Total validés) * 100
        """
        if not self.samples:
            return 100.0

        concordant_count = sum(1 for s in self.samples if s.is_concordant)
        total = len(self.samples)
        return round((concordant_count / total) * 100.0, 2)

    def is_alert_triggered(self) -> bool:
        """Alerte déclenchée si le taux de concordance descend sous le seuil critique (70%)."""
        if not self.samples:
            return False
        return self.calculate_agreement_rate() < self.alert_threshold

    def build_confusion_matrix(self) -> Dict[str, Dict[str, int]]:
        """
        Génère la matrice de confusion 6x6.
        Lignes : Catégorie Prédite par l'IA
        Colonnes : Vraie Catégorie validée par l'Humain
        """
        matrix: Dict[str, Dict[str, int]] = {
            pred: {act: 0 for act in self.categories} for pred in self.categories
        }

        for s in self.samples:
            pred = s.predicted_category if s.predicted_category in self.categories else "AUTRE"
            act = s.actual_category if s.actual_category in self.categories else "AUTRE"
            matrix[pred][act] += 1

        return matrix

    def get_most_confused_classes(self, limit: int = 5) -> List[Dict[str, Any]]:
        """Identifie les couples (prédit, réel) ayant le plus d'erreurs (divergences)."""
        divergences: Dict[Tuple[str, str], int] = {}

        for s in self.samples:
            if not s.is_concordant:
                pair = (s.predicted_category, s.actual_category)
                divergences[pair] = divergences.get(pair, 0) + 1

        sorted_confusions = sorted(divergences.items(), key=lambda item: item[1], reverse=True)

        return [
            {"predicted": pair[0], "actual": pair[1], "occurrences": count}
            for pair, count in sorted_confusions[:limit]
        ]

    def calculate_per_class_metrics(self) -> Dict[str, Dict[str, float]]:
        """Calcule Précision, Rappel et F1-Score par catégorie."""
        matrix = self.build_confusion_matrix()
        metrics: Dict[str, Dict[str, float]] = {}

        for cat in self.categories:
            tp = matrix[cat][cat]
            fp = sum(matrix[cat][other] for other in self.categories if other != cat)
            fn = sum(matrix[other][cat] for other in self.categories if other != cat)

            precision = (tp / (tp + fp)) if (tp + fp) > 0 else 0.0
            recall = (tp / (tp + fn)) if (tp + fn) > 0 else 0.0
            f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 0.0

            metrics[cat] = {
                "precision": round(precision * 100, 2),
                "recall": round(recall * 100, 2),
                "f1_score": round(f1 * 100, 2),
                "support": tp + fn,
            }

        return metrics

    def export_divergences_to_json(
        self, output_path: str = "active_learning_dataset.json"
    ) -> Tuple[int, str]:
        """
        Étape 2 du ticket: Exporte les cas de divergence vers un fichier JSON
        pour le pipeline d'Active Learning (réentraînement du modèle).
        """
        divergences = [
            {
                "reportId": s.report_id,
                "imageUrl": s.image_url,
                "predictedCategory": s.predicted_category,
                "actualCategory": s.actual_category,
                "confidenceScore": s.confidence_score,
                "timestamp": s.timestamp,
                "reannotationPriority": "HIGH" if s.confidence_score > 0.8 else "NORMAL",
            }
            for s in self.samples
            if s.ai_overridden or not s.is_concordant
        ]

        payload = {
            "datasetName": "EcoTrack-ActiveLearning-Divergences",
            "exportedAt": datetime.now(timezone.utc).isoformat(),
            "totalDivergences": len(divergences),
            "sourceModel": "MobileNetV3-Small-EcoTrack-v2",
            "samples": divergences,
        }

        path_obj = Path(output_path).resolve()
        path_obj.parent.mkdir(parents=True, exist_ok=True)

        with open(path_obj, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2, ensure_ascii=False)

        logger.info(f"Export Active Learning généré : {len(divergences)} cas enregistrés dans {path_obj}")
        return len(divergences), str(path_obj)

    def get_summary_report(self) -> Dict[str, Any]:
        """Construit le rapport d'observabilité MLOps complet conforme aux exigences."""
        total = len(self.samples)
        concordant = sum(1 for s in self.samples if s.is_concordant)
        overridden = total - concordant
        agreement_rate = self.calculate_agreement_rate()
        alert = self.is_alert_triggered()

        return {
            "totalEvaluated": total,
            "agreedCount": concordant,
            "overriddenCount": overridden,
            "overallAgreementRate": f"{agreement_rate:.1f}%",
            "agreementRateValue": agreement_rate,
            "alertThreshold": f"{self.alert_threshold:.1f}%",
            "isAlertTriggered": alert,
            "alertMessage": (
                f"ALERTE MLOPS: Taux de concordance ({agreement_rate:.1f}%) inférieur au seuil critique de {self.alert_threshold:.1f}% !"
                if alert
                else "OK: Performance IA conforme au cahier des charges (>= 70%)."
            ),
            "categories": list(self.categories),
            "confusionMatrix": self.build_confusion_matrix(),
            "mostConfusedClasses": self.get_most_confused_classes(limit=5),
            "perClassMetrics": self.calculate_per_class_metrics(),
        }


def generate_benchmark_dataset(count: int = 450, seed: int = 42) -> AgreementTracker:
    """
    Génère un jeu de données d'évaluation synthétique représentatif de 450 signalements,
    reproduisant fidèlement le cas d'usage mentionné dans le ticket Jira SCRUM-61 :
    ~88.0% d'accord global, avec la confusion majeure DEPOT_SAUVAGE / ENCOMBRANTS.
    """
    random.seed(seed)
    tracker = AgreementTracker()

    # Poids de répartition des signalements par catégorie
    category_weights = {
        "DEPOT_SAUVAGE": 150,
        "ENCOMBRANTS": 110,
        "DECHETS_VERTS": 75,
        "GRAVATS_CHANTIER": 50,
        "GRAFFITI": 40,
        "AUTRE": 25,
    }

    report_id_counter = 1000

    for cat, n in category_weights.items():
        for _ in range(n):
            report_id_counter += 1
            rep_id = f"ECO-REP-{report_id_counter}"

            # 88% de concordance globale
            is_agree = random.random() < 0.88

            if is_agree:
                pred = cat
                actual = cat
                conf = round(random.uniform(0.82, 0.98), 4)
                tracker.record_sample(rep_id, pred, actual, confidence=conf, ai_overridden=False)
            else:
                # Modélisation des confusions réalistes :
                if cat == "DEPOT_SAUVAGE":
                    actual = "ENCOMBRANTS" if random.random() < 0.65 else "DECHETS_VERTS"
                elif cat == "ENCOMBRANTS":
                    actual = "DEPOT_SAUVAGE"
                elif cat == "GRAVATS_CHANTIER":
                    actual = "DEPOT_SAUVAGE"
                elif cat == "GRAFFITI":
                    actual = "AUTRE"
                else:
                    actual = "DEPOT_SAUVAGE"

                pred = cat
                conf = round(random.uniform(0.60, 0.79), 4)
                tracker.record_sample(rep_id, pred, actual, confidence=conf, ai_overridden=True)

    return tracker


def main() -> None:
    """Exécution CLI principale."""
    print("=" * 72)
    print("🌿 ECOTRACK V2 — Suivi MLOps Concordance IA / Humain (SCRUM-61 / ECO-43)")
    print("=" * 72)

    tracker = generate_benchmark_dataset(count=450, seed=42)
    report = tracker.get_summary_report()

    print(f"\n📊 Résultats d'Évaluation :")
    print(f"  • Total Signalements Évalués : {report['totalEvaluated']}")
    print(f"  • Validés sans modification : {report['agreedCount']}")
    print(f"  • Corrigés par l'Agent :     {report['overriddenCount']}")
    print(f"  • Taux d'Accord Global :     {report['overallAgreementRate']} (Seuil: {report['alertThreshold']})")
    print(f"  • Statut Alerte :            {report['alertMessage']}")

    print(f"\n🔍 Principales Confusions Détectées :")
    for item in report["mostConfusedClasses"]:
        print(f"  → Prédit: {item['predicted']:<16} | Réel: {item['actual']:<16} ({item['occurrences']} cas)")

    print(f"\n📐 Matrice de Confusion 6x6 :")
    title_col = "Prédit \\ Réel"
    header = f"{title_col:<18} " + " ".join(f"{c[:8]:>8}" for c in tracker.categories)
    print(header)
    print("-" * len(header))
    matrix = report["confusionMatrix"]
    for pred in tracker.categories:
        row = f"{pred:<18} " + " ".join(f"{matrix[pred][act]:>8}" for act in tracker.categories)
        print(row)

    # Export des cas d'Active Learning
    export_path = os.path.join(os.path.dirname(__file__), "active_learning_dataset.json")
    count, path = tracker.export_divergences_to_json(export_path)
    print(f"\n💾 Dataset Active Learning généré avec succès ({count} divergences) :")
    print(f"  📁 {path}")
    print("=" * 72)


if __name__ == "__main__":
    main()
