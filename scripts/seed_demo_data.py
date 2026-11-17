#!/usr/bin/env python3
"""
🌿 ECOTRACK - SCRUM-65 (ECO-53)
Python CLI pour la génération de 500 signalements réalistes (Seed Demo Data).
Miroir conforme de scripts/seed_demo_data.ts pour exécution immédiate sans dépendance Node.js.
"""

import sys
import os
import json
import random
import math
from datetime import datetime, timedelta, timezone

DISTRICTS = [
    {"name": "Centre-Ville", "lat": 36.8008, "lng": 10.1800, "radius_km": 1.5},
    {"name": "El Menzah", "lat": 36.8372, "lng": 10.1789, "radius_km": 2.0},
    {"name": "Ariana", "lat": 36.8625, "lng": 10.1956, "radius_km": 2.5},
    {"name": "La Marsa", "lat": 36.8782, "lng": 10.3247, "radius_km": 2.0},
    {"name": "Les Berges du Lac", "lat": 36.8331, "lng": 10.2355, "radius_km": 2.0},
    {"name": "Carthage", "lat": 36.8528, "lng": 10.3233, "radius_km": 1.5},
]

CATEGORIES = [
    "DECHARGE_SAUVAGE",
    "GRAFFITI",
    "ENCOMBRANT",
    "DEPOT_SAUVAGE",
    "AUTRE",
]

WORKERS = [
    {"id": "usr_wrk_001", "name": "Karim Ben Salem", "district": "Centre-Ville"},
    {"id": "usr_wrk_002", "name": "Tarek Jouini", "district": "El Menzah"},
    {"id": "usr_wrk_003", "name": "Youssef Trabelsi", "district": "Ariana"},
    {"id": "usr_wrk_004", "name": "Mehdi Gharbi", "district": "La Marsa"},
    {"id": "usr_wrk_005", "name": "Hamza Dridi", "district": "Les Berges du Lac"},
    {"id": "usr_wrk_006", "name": "Slimane Riahi", "district": "Carthage"},
]

CITIZENS = [
    {"id": "usr_cit_01", "name": "Anis Mahjoub"},
    {"id": "usr_cit_02", "name": "Leila Chaabane"},
    {"id": "usr_cit_03", "name": "Mounir Sassi"},
    {"id": "usr_cit_04", "name": "Fatma Khemir"},
    {"id": "usr_cit_05", "name": "Nidhal Ben Amor"},
]

def random_coordinate_near(lat: float, lng: float, radius_km: float):
    radius_in_degrees = radius_km / 111.0
    u = random.random()
    v = random.random()
    w = radius_in_degrees * math.sqrt(u)
    t = 2.0 * math.pi * v
    delta_lat = w * math.cos(t)
    delta_lng = (w * math.sin(t)) / math.cos(math.radians(lat))
    return round(lng + delta_lng, 6), round(lat + delta_lat, 6)

def generate_seed_reports(count: int = 500):
    now = datetime(2026, 11, 17, 12, 0, 0, tzinfo=timezone.utc)
    ninety_days_seconds = 90 * 86400

    resolved_target = round(count * 0.60)
    in_progress_target = round(count * 0.20)
    new_target = round(count * 0.15)
    rejected_target = count - resolved_target - in_progress_target - new_target

    statuses = (
        ["RESOLU"] * resolved_target +
        ["EN_TRAITEMENT"] * in_progress_target +
        ["NOUVEAU"] * new_target +
        ["REJETE"] * rejected_target
    )
    random.shuffle(statuses)

    reports = []
    for i in range(count):
        id_num = f"{i + 1:04d}"
        district_obj = DISTRICTS[i % len(DISTRICTS)]
        category = CATEGORIES[i % len(CATEGORIES)]
        citizen = CITIZENS[i % len(CITIZENS)]
        worker = next((w for w in WORKERS if w["district"] == district_obj["name"]), WORKERS[0])
        status = statuses[i]

        age_seconds = random.random() * ninety_days_seconds
        created_at_dt = now - timedelta(seconds=age_seconds)
        created_at_str = created_at_dt.isoformat()

        lng, lat = random_coordinate_near(
            district_obj["lat"],
            district_obj["lng"],
            district_obj["radius_km"]
        )

        history = [
            {
                "fromStatus": "INITIAL",
                "toStatus": "NOUVEAU",
                "changedBy": citizen["id"],
                "timestamp": created_at_str,
                "comment": "Création du signalement par le citoyen.",
            }
        ]

        updated_at = created_at_str
        resolved_at = None
        lead_time_hours = None
        sla_hours_target = 24 if category == "DECHARGE_SAUVAGE" else 48
        sla_breached = False
        after_image_url = None

        if status == "REJETE":
            rej_dt = created_at_dt + timedelta(hours=2)
            updated_at = rej_dt.isoformat()
            history.append({
                "fromStatus": "NOUVEAU",
                "toStatus": "REJETE",
                "changedBy": "usr_agt_001",
                "timestamp": updated_at,
                "comment": "Photo floue ou doublon rejeté conformément à la politique municipale.",
            })
        elif status == "EN_TRAITEMENT":
            qual_dt = created_at_dt + timedelta(hours=4)
            assign_dt = created_at_dt + timedelta(hours=8)
            updated_at = assign_dt.isoformat()
            history.extend([
                {
                    "fromStatus": "NOUVEAU",
                    "toStatus": "A_QUALIFIER",
                    "changedBy": "sys_ai_vision",
                    "timestamp": qual_dt.isoformat(),
                    "comment": "Qualification IA automatique MobileNetV3.",
                },
                {
                    "fromStatus": "A_QUALIFIER",
                    "toStatus": "EN_TRAITEMENT",
                    "changedBy": "usr_agt_001",
                    "timestamp": assign_dt.isoformat(),
                    "comment": f"Affectation à l'ouvrier {worker['name']}.",
                }
            ])
        elif status == "RESOLU":
            duration_hours = round(random.uniform(6.0, 54.0), 1)
            lead_time_hours = duration_hours
            sla_breached = duration_hours > sla_hours_target
            res_dt = created_at_dt + timedelta(hours=duration_hours)
            resolved_at = res_dt.isoformat()
            updated_at = resolved_at
            after_image_url = f"https://storage.ecotrack.local/reports/proof-resolved-{id_num}.jpg"

            history.extend([
                {
                    "fromStatus": "NOUVEAU",
                    "toStatus": "A_QUALIFIER",
                    "changedBy": "sys_ai_vision",
                    "timestamp": (created_at_dt + timedelta(hours=1)).isoformat(),
                },
                {
                    "fromStatus": "A_QUALIFIER",
                    "toStatus": "EN_TRAITEMENT",
                    "changedBy": "usr_agt_001",
                    "timestamp": (created_at_dt + timedelta(hours=3)).isoformat(),
                },
                {
                    "fromStatus": "EN_TRAITEMENT",
                    "toStatus": "RESOLU",
                    "changedBy": worker["id"],
                    "timestamp": resolved_at,
                    "comment": "Chantier nettoyé, photo après travaux enregistrée (T4).",
                }
            ])

        assigned_worker_id = worker["id"] if status not in ("NOUVEAU", "REJETE") else None
        assigned_worker_name = worker["name"] if status not in ("NOUVEAU", "REJETE") else None

        reports.append({
            "id": f"REP-2026-{id_num}",
            "citizenId": citizen["id"],
            "citizenName": citizen["name"],
            "title": f"{category.replace('_', ' ')} signalé à {district_obj['name']}",
            "description": f"Présence anormale de type {category.lower()} constatée sur la voie publique à {district_obj['name']}. Nécessite intervention de salubrité municipale.",
            "category": category,
            "status": status,
            "location": {
                "type": "Point",
                "coordinates": [lng, lat],
            },
            "address": f"Avenue Habib Bourguiba, quartier {district_obj['name']}, Tunis",
            "district": district_obj["name"],
            "imageUrl": f"https://storage.ecotrack.local/reports/anomaly-{id_num}.jpg",
            "afterImageUrl": after_image_url,
            "aiPredictedCategory": category,
            "aiConfidence": round(random.uniform(0.85, 0.99), 3),
            "assignedWorkerId": assigned_worker_id,
            "assignedWorkerName": assigned_worker_name,
            "slaHoursTarget": sla_hours_target,
            "slaBreached": sla_breached,
            "leadTimeHours": lead_time_hours,
            "history": history,
            "createdAt": created_at_str,
            "updatedAt": updated_at,
            "resolvedAt": resolved_at,
        })

    return reports

if __name__ == "__main__":
    count = 500
    for arg in sys.argv[1:]:
        if arg.startswith("--count="):
            count = int(arg.split("=")[1])

    print(f"[SEED] Génération de {count} signalements historiques réalistes...")
    data = generate_seed_reports(count)

    out_file = os.path.join(os.path.dirname(__file__), "demo_500_reports.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    resolved = sum(1 for r in data if r["status"] == "RESOLU")
    in_progress = sum(1 for r in data if r["status"] == "EN_TRAITEMENT")
    new_reports = sum(1 for r in data if r["status"] == "NOUVEAU")
    rejected = sum(1 for r in data if r["status"] == "REJETE")

    print(f"[SEED] Insertion terminée avec succès :")
    print(f"       - Résolus        : {resolved} ({resolved/count*100:.1f}%) [Cible ~60%]")
    print(f"       - En traitement  : {in_progress} ({in_progress/count*100:.1f}%) [Cible ~20%]")
    print(f"       - Nouveaux       : {new_reports} ({new_reports/count*100:.1f}%) [Cible ~15%]")
    print(f"       - Rejetés        : {rejected} ({rejected/count*100:.1f}%) [Cible ~5%]")
    print(f"[SEED] Fichier exporté : {out_file}")
    print(f"[SEED] Cartographie et rapports Power BI prêts pour la soutenance ! 🌿")
