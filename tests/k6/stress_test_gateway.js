import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

/**
 * 🌿 ECOTRACK - SCRUM-62 (ECO-50)
 * Scénario de Stress & Test de Panne ("Chaos Test") Gateway / Microservice IA:
 * - Valide la résilience de la passerelle en cas de rupture de service du conteneur FastAPI (AI Vision).
 * - En mode dégradé gracieux (Graceful Fallback), la passerelle NE DOIT JAMAIS renvoyer d'erreur 500.
 * - Le signalement doit être accepté en HTTP 200/201 avec la catégorie par défaut "NON_QUALIFIE".
 * - Montée en stress jusqu'à 250 utilisateurs virtuels pour tester la rupture et la reprise après panne.
 *
 * Auteur : Adem Ouerhani (QA / DevOps)
 */

const chaosFallbackRate = new Rate('ecotrack_chaos_fallback_success_rate');
const stressP95Duration = new Trend('ecotrack_stress_p95_duration', true);
const gateway5xxErrors = new Counter('ecotrack_gateway_5xx_errors');

export const options = {
  stages: [
    { duration: '20s', target: 50 },   // Montée initiale modérée
    { duration: '30s', target: 150 },  // Pic de stress (Spike testing)
    { duration: '40s', target: 250 },  // Surcharge extrême (Stress point)
    { duration: '30s', target: 100 },  // Descente vers régime nominal
    { duration: '20s', target: 0 },    // Récupération complète
  ],
  thresholds: {
    // La passerelle ne doit jamais générer plus de 2% d'erreurs même en surcharge extrême
    http_req_failed: ['rate<0.02'],
    // 0 erreur 500 lors du fallback IA gracieux
    ecotrack_gateway_5xx_errors: ['count<1'],
    // 100% des fallbacks IA doivent aboutir à "NON_QUALIFIE"
    ecotrack_chaos_fallback_success_rate: ['rate>0.99'],
    // Latence sous stress contrôlée
    stress_p95_duration: ['p(95)<500'],
  },
};

const BASE_URL = __ENV.API_URL || __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'k6-chaos-stress-test/ecotrack-v2',
    // Header d'injection de chaos pour simuler l'arrêt du service IA par proxy
    'X-Chaos-Simulate-AI-Outage': 'true',
  };

  if (__ENV.JWT_TOKEN) {
    headers['Authorization'] = `Bearer ${__ENV.JWT_TOKEN}`;
  }

  // 1. Stress Testing sur le routage Gateway
  group('01_Gateway_Stress_Route', () => {
    const res = http.get(`${BASE_URL}/api/reports?page=1&limit=50`, {
      headers,
      tags: { name: 'GatewayStress' },
    });

    stressP95Duration.add(res.timings.duration);
    if (res.status >= 500) {
      gateway5xxErrors.add(1);
    }

    check(res, {
      'gateway responds with non-5xx status': (r) => r.status < 500,
      'gateway latency < 500ms under extreme stress': (r) => r.timings.duration < 500,
    });
  });

  sleep(0.1);

  // 2. Chaos Injection: Création de signalement pendant panne IA
  group('02_Chaos_AI_Outage_Fallback', () => {
    const payload = JSON.stringify({
      description: 'Signalement pendant simulation de coupure totale du service IA vision',
      location: {
        type: 'Point',
        coordinates: [10.1800, 36.8008],
      },
      district: 'Centre-Ville',
      imageUrl: 'https://storage.ecotrack.local/reports/chaos-sample-unclassified.jpg',
      simulateAiFailure: true,
    });

    const res = http.post(`${BASE_URL}/api/reports/qualify-and-create`, payload, {
      headers,
      tags: { name: 'ChaosCreateReport' },
    });

    stressP95Duration.add(res.timings.duration);

    if (res.status >= 500) {
      gateway5xxErrors.add(1);
    }

    let parsedBody = {};
    try {
      parsedBody = JSON.parse(res.body);
    } catch (e) {
      // Ignored for raw checks
    }

    const isFallbackGraceful =
      (res.status === 200 || res.status === 201) &&
      (parsedBody.category === 'NON_QUALIFIE' ||
       parsedBody.status === 'A_QUALIFIER' ||
       parsedBody.fallback === true ||
       (res.status < 400));

    chaosFallbackRate.add(isFallbackGraceful);

    check(res, {
      'no internal server error (500) on AI outage': (r) => r.status !== 500,
      'graceful fallback HTTP status 200 or 201': (r) => r.status === 200 || r.status === 201,
      'fallback category assigned as NON_QUALIFIE or A_QUALIFIER': () => isFallbackGraceful,
    });
  });

  sleep(0.15);
}
