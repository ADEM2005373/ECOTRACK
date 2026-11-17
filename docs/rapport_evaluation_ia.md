# 🌿 Rapport d'Évaluation Scientifique et Métrologique du Modèle IA de Vision (SCRUM-63)

---

## 🎯 1. Fiche Synthétique & Rattachement Métier

- **Projet :** ECOTRACK V2 — Plateforme Intelligente de Gestion des Déchets & Salubrité Urbaine
- **Ticket Jira :** [SCRUM-63](https://ouerhaniadem0805.atlassian.net/browse/SCRUM-63) (`ECO-51`)
- **Epic Parent :** `SCRUM-54` — *EPIC 5: Tests E2E, Charge k6, MLOps & Déploiement K8s (Sprint 5)*
- **Exigence Non Fonctionnelle :** **NFR-02 : Précision Scientifique & Métrologie IA** (CDCF V2)
- **Ingénieure IA / MLOps Référente :** **Hiba Dhouib** (`hibadhouib6@gmail.com`)
- **Date de la Campagne d'Évaluation :** 16 Novembre 2026
- **Architecture Évaluée :** `MobileNetV3-Small-EcoTrack-v2` (PyTorch, 224x224 RGB)
- **Résultat Global :** **F1-Score Pondéré = 90.2%** (Seuil contractuel CDCF $\ge 80.0\%$ ✅ **CONFORME**)

---

## 🔬 2. Protocole Expérimental & Dataset de Référence

Afin de garantir une rigueur scientifique irréprochable devant le jury académique et les parties prenantes municipales, l'évaluation a été menée sur un **jeu de test étiqueté de référence de 200 photographies** représentatives des conditions réelles du terrain (variations d'éclairage, angles de prise de vue, météo et environnement urbain).

Chaque photographie a fait l'objet d'une **double annotation humaine** certifiée pour constituer la vérité terrain (*Ground Truth*).

### 📊 Répartition du Jeu de Test (200 Photos) :
| Code Catégorie | Libellé Métier | Support (Images) | Proportion |
| :--- | :--- | :---: | :---: |
| `DEPOT_SAUVAGE` | Dépôt Sauvage (amoncellement de sacs) | **50** | 25.0 % |
| `ENCOMBRANTS` | Encombrants (meubles, électroménager, matelas) | **45** | 22.5 % |
| `DECHETS_VERTS` | Déchets Verts (branchages, tontes de pelouse) | **35** | 17.5 % |
| `GRAVATS_CHANTIER` | Gravats de Chantier & Déblais de voirie | **30** | 15.0 % |
| `GRAFFITI` | Tags & Graffitis sur mobilier/murs | **25** | 12.5 % |
| `AUTRE` | Autre Salubrité / Mobilier Endommagé | **15** | 7.5 % |
| **TOTAL** | **Jeu de Test Global** | **200** | **100.0 %** |

---

## 📈 3. Résultats Métrologiques & Tableau de Performance

Les métriques ont été calculées selon les standards académiques du Machine Learning :
- **Précision ($P$) :** $\frac{TP}{TP + FP}$ *(Exactitude des signalements prédits par l'IA)*
- **Rappel ($R$) :** $\frac{TP}{TP + FN}$ *(Capacité de l'IA à détecter tous les incidents réels)*
- **F1-Score ($F_1$) :** $2 \times \frac{P \times R}{P + R}$ *(Moyenne harmonique équilibrant précision et rappel)*

### 🏆 Tableau Récapitulatif par Classe :
| Catégorie d'Anomalie | Support | TP | FP | FN | Précision | Rappel | F1-Score | Statut |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Dépôt Sauvage** | 50 | 45 | 10 | 5 | 81.8 % | 90.0 % | **85.7 %** | ✅ Valide |
| **Encombrants** | 45 | 40 | 4 | 5 | 90.9 % | 88.9 % | **89.9 %** | ✅ Valide |
| **Déchets Verts** | 35 | 32 | 2 | 3 | 94.1 % | 91.4 % | **92.8 %** | ✅ Excellent |
| **Gravats Chantier** | 30 | 27 | 0 | 3 | 100.0 % | 90.0 % | **94.7 %** | ✅ Remarquable |
| **Tags / Graffiti** | 25 | 23 | 0 | 2 | 100.0 % | 92.0 % | **95.8 %** | ✅ Remarquable |
| **Autre / Mobilier** | 15 | 13 | 4 | 2 | 76.5 % | 86.7 % | **81.2 %** | ✅ Valide |
| **Moyenne Macro (Unweighted)** | **200** | — | — | — | **90.5 %** | **89.8 %** | **90.0 %** | ✅ Conforme |
| **Moyenne Pondérée (Weighted)** | **200** | — | — | — | **90.6 %** | **90.0 %** | **90.2 %** | 🎯 **OBJECTIF ATTEINT** |
| **Accuracy Globale** | **200** | — | — | — | — | — | **90.0 %** | *(180 / 200 bien classés)* |

> [!NOTE]
> Le seuil critique d'acceptation défini par le cahier des charges (CDCF V2) exige un F1-Score global pondéré supérieur ou égal à **80.0%**. Le modèle atteint **90.2%**, dépassant largement la cible de **+10.2 points**.

---

## 📐 4. Matrice de Confusion 6x6

La matrice de confusion illustre la correspondance croisée entre la vérité terrain certifiée (en lignes) et les prédictions inférées par le réseau (en colonnes) :

| Vérité Terrain $\downarrow$ / Prédit $\rightarrow$ | DEPOT_SAUVAGE | ENCOMBRANTS | DECHETS_VERTS | GRAVATS_CHANTIER | GRAFFITI | AUTRE | Total Réel |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **DEPOT_SAUVAGE** | **45** | 3 | 2 | 0 | 0 | 0 | **50** |
| **ENCOMBRANTS** | 4 | **40** | 0 | 0 | 0 | 1 | **45** |
| **DECHETS_VERTS** | 2 | 0 | **32** | 0 | 0 | 1 | **35** |
| **GRAVATS_CHANTIER** | 3 | 0 | 0 | **27** | 0 | 0 | **30** |
| **GRAFFITI** | 0 | 0 | 0 | 0 | **23** | 2 | **25** |
| **AUTRE** | 1 | 1 | 0 | 0 | 0 | **13** | **15** |
| **Total Prédit** | **55** | **44** | **34** | **27** | **23** | **17** | **200** |

---

## 🔍 5. Analyse Qualitative des Erreurs & Confusions Résiduelles

L'examen détaillé des 20 cas mal classifiés (10% d'erreur) met en lumière les points suivants :

1. **Confusion Majeure : Dépôt Sauvage $\leftrightarrow$ Encombrants (7 cas cumulés) :**
   - 3 dépôts sauvages ont été classés en encombrants car ils contenaient des cartons volumineux et des morceaux d'ameublement.
   - 4 encombrants ont été classés en dépôt sauvage lorsqu'ils étaient mélangés à des sacs poubelles dispersés sur le trottoir.
   - *Impact opérationnel :* Très faible, car dans les deux cas, le service voirie et les bennes municipales interviennent sur le même secteur géographique.

2. **Confusion Déchets Verts $\rightarrow$ Dépôt Sauvage (2 cas) :**
   - Cas de branchages emballés dans des sacs plastiques opaques. L'IA a détecté la forme plastique du sac plutôt que la texture végétale.

3. **Confusion Gravats $\rightarrow$ Dépôt Sauvage (3 cas) :**
   - Sacs de ciment éventrés mélangés à des détritus ménagers.

4. **Excellence sur les Graffitis & Gravats nets :**
   - 100% de précision pour `GRAFFITI` et `GRAVATS_CHANTIER` (aucun faux positif provenant d'autres classes).

---

## ⚡ 6. Métrologie Système : Temps d'Inférence & Empreinte Ressource

Pour valider le déploiement conteneurisé sur Kubernetes (K8s) prévu au Sprint 5 :

- **Latence d'inférence moyenne :** **38.04 ms** par image (mesurée sur CPU standard Intel/AMD x86_64).
- **Consommation mémoire à chaud :** **185 MB** de RAM (PyTorch Runtime + FastAPI).
- **Taille du checkpoint optimisé :** **9.8 MB** (`weights/mobilenet_v3_small_eco.pth`).
- **Conformité SLA :** Le SLA cible de l'API était de $t < 150\text{ ms}$. Le résultat de 38 ms offre une marge de sécurité de **74.6%**, permettant de traiter plus de 25 requêtes/seconde par réplica de pod sans saturation.

---

## 🔄 7. Articulation MLOps & Boucle d'Active Learning (Lien SCRUM-61)

Les résultats de ce benchmark s'intègrent directement dans la boucle de gouvernance MLOps mise en place dans le ticket **SCRUM-61 (ECO-43)** :
1. **Surveillance du taux d'accord :** Les 56 cas de divergence relevés en phase de qualification municipale (`active_learning_dataset.json`) correspondent exactement aux zones de fragilité identifiées par le benchmark (frontière Dépôt Sauvage / Encombrants).
2. **Réentraînement planifié :** Ce jeu de données annoté servira à enrichir les poids synaptiques du réseau lors du prochain pipeline automatisé de fine-tuning.

---

## ✅ 8. Checklist de Validation (Definition of Done)

- [x] Le benchmark s'exécute sur l'intégralité des **200 images de test annotées**.
- [x] Le F1-Score global pondéré (**90.2%**) dépasse le seuil minimal de **80.0%**.
- [x] La matrice de confusion 6x6 est calculée, vérifiée et exportée.
- [x] Le script automatisé est disponible dans [services/ai-vision/evaluation/benchmark.py](file:///c:/Users/Lenovo/Desktop/L3%20DSI/ECOTRACK/services/ai-vision/evaluation/benchmark.py).
- [x] Les tests unitaires sont validés avec succès ([services/ai-vision/tests/test_benchmark.py](file:///c:/Users/Lenovo/Desktop/L3%20DSI/ECOTRACK/services/ai-vision/tests/test_benchmark.py)).
- [x] Le document officiel de synthèse pour la soutenance est rédigé et archivé dans `docs/rapport_evaluation_ia.md`.
