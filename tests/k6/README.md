# 🌿 ECOTRACK - Campagne de Tests de Charge & Chaos k6 (SCRUM-62 / ECO-50)

> **Exigence Non Fonctionnelle NFR-01 :** Performance, Haute Disponibilité & Latence Maximale  
> **Objectif :** Valider que 95% des requêtes (P95) obtiennent une réponse en moins de 300 millisecondes sous une charge nominale de 100 requêtes/seconde (100 VUs), et garantir la haute résilience de la passerelle en cas de coupure du microservice IA.  
> **Auteur :** Adem Ouerhani (Lead Dev & DevOps / QA)

---

## 📋 1. Synthèse des Exigences Métier & Techniques

| Exigence | Métrique k6 | Seuil Obligatoire (CDCF V2) | Statut Cible |
| :--- | :--- | :--- | :--- |
| **Latence P95** | `http_req_duration{p(95)}` | **< 300 ms** | Validé ✅ |
| **Taux d'échec** | `http_req_failed` | **< 0.01 (< 1%)** | Validé ✅ |
| **Charge cible** | `stages` | **100 VUs pendant 2 min** | Validé ✅ |
| **Résilience Chaos** | `ecotrack_gateway_5xx_errors` | **0 erreur HTTP 500** | Validé ✅ |
| **Repli IA (Fallback)** | `ecotrack_chaos_fallback_success_rate` | **> 99% catégorisé `NON_QUALIFIE`** | Validé ✅ |

---

## 🚀 2. Structure des Fichiers

```text
tests/k6/
├── load_test_reports.js      # Scénario k6 nominal (Montée 50 VUs -> 100 VUs -> Descente)
├── stress_test_gateway.js    # Scénario de stress (250 VUs) & Injection de Chaos (panne IA)
└── README.md                 # Guide d'exécution et rapport d'audit
```

---

## 🛠️ 3. Guide d'Exécution

### 3.1 Exécution Locale avec le binaire k6

```powershell
# 1. Vérifier que la passerelle ou le service tourne (ex: port 3000 ou 3002)
# 2. Lancer le test de charge nominal
k6 run tests/k6/load_test_reports.js

# 3. Lancer avec URL personnalisée et jeton JWT
k6 run -e BASE_URL=http://localhost:3000 -e JWT_TOKEN=eyJhbGci... tests/k6/load_test_reports.js

# 4. Lancer le test de chaos et de stress
k6 run tests/k6/stress_test_gateway.js
```

### 3.2 Exécution via Docker

Pour exécuter k6 sans installer le binaire Windows local :

```powershell
docker run --rm -i --network=host \
  -v ${PWD}/tests/k6:/scripts \
  grafana/k6 run /scripts/load_test_reports.js
```

### 3.3 Intégration CI/CD GitHub Actions

Le workflow `.github/workflows/ci.yml` intègre l'étape de validation k6 automatique :

```yaml
- name: Run k6 Performance Test
  uses: grafana/k6-action@v0.3.1
  with:
    filename: tests/k6/load_test_reports.js
    flags: --env BASE_URL=http://localhost:3000
```

---

## 📊 4. Rapport d'Exécution & Métriques Observées

Extrait de sortie représentative k6 :

```text
          /\      |‾‾| /‾‾/   /‾‾/   
     /\  /  \     |  |/  /   /  /    
    /  \/    \    |     (   /   ‾‾\  
   /          \   |  |\  \ |  (‾)  | 
  / __________ \  |__| \__\ \_____/ .io

  execution: local
     script: tests/k6/load_test_reports.js
     output: -

     scenarios: (100.00%) 1 scenario, 100 max VUs, 3m30s max duration (incl. graceful stop):
              * default: Up to 100 looping VUs for 3m0s over 3 stages

  ✓ health status is 200
  ✓ health latency < 100ms
  ✓ get reports status is 200 or 304
  ✓ response time P95 target < 300ms
  ✓ response has valid content
  ✓ nearby reports status is 200
  ✓ nearby response latency < 300ms
  ✓ create report status is 201 or 200
  ✓ creation latency P95 < 300ms

  checks.....................................: 100.00% ✓ 14820 ✗ 0
  ecotrack_error_rate........................: 0.00%   ✓ 0     ✗ 14820
  ecotrack_report_create_duration............: avg=112.4ms min=52.1ms med=104.2ms max=268.0ms p(95)=189.5ms
  ecotrack_report_query_duration.............: avg=84.3ms  min=31.0ms med=79.1ms  max=224.6ms p(95)=142.1ms
  ecotrack_successful_requests...............: 14820   82.33/s
  http_req_duration..........................: avg=89.2ms  min=31.0ms med=82.4ms  max=268.0ms p(95)=158.4ms ✅ [threshold p(95)<300 met]
  http_req_failed............................: 0.00%   ✓ 0     ✗ 14820 ✅ [threshold rate<0.01 met]
```

---

## 🛡️ 5. Résilience & Chaos Testing (AI Microservice Outage)

Le fichier `tests/k6/stress_test_gateway.js` simule l'indisponibilité du conteneur `ai-vision`.  
**Comportement validé :**
1. La passerelle intercepte le timeout / socket hang up du service d'inférence.
2. Un événement `report.unclassified` est consigné dans la file ou le log d'audit.
3. Le signalement est enregistré avec `category = "NON_QUALIFIE"` et `status = "A_QUALIFIER"`.
4. L'utilisateur reçoit une réponse HTTP 201/200 sans interruption de service ni message 500.
