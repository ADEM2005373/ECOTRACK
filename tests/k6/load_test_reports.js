import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

/**
 * 🌿 ECOTRACK - SCRUM-62 (ECO-50)
 * Tests de charge k6 validant l'Exigence Non Fonctionnelle NFR-01:
 * - 95% des requêtes (P95) obtiennent une réponse en moins de 300 millisecondes (p(95)<300).
 * - Moins de 1% d'erreurs tolérées (http_req_failed < 1%).
 * - Montée en charge à 100 requêtes/seconde (100 VUs).
 *
 * Auteur : Adem Ouerhani (QA / DevOps)
 */

// Custom metrics for granular observability
const reportCreationDuration = new Trend('ecotrack_report_create_duration', true);
const reportQueryDuration = new Trend('ecotrack_report_query_duration', true);
const reportErrorRate = new Rate('ecotrack_error_rate');
const successfulRequestsCounter = new Counter('ecotrack_successful_requests');

export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Montée progressive : 0 à 50 VUs en 30 secondes
    { duration: '2m', target: 100 },  // Charge stable : 100 VUs pendant 2 minutes (100 req/s)
    { duration: '30s', target: 0 },   // Descente progressive : retour à 0 en 30 secondes
  ],
  thresholds: {
    // 🚨 Condition bloquante CDCF NFR-01 : P95 < 300ms
    http_req_duration: ['p(95)<300'],
    // Moins de 1% d'échecs tolérés
    http_req_failed: ['rate<0.01'],
    // Métriques métier personnalisées
    ecotrack_error_rate: ['rate<0.01'],
    ecotrack_report_query_duration: ['p(95)<250'],
    ecotrack_report_create_duration: ['p(95)<300'],
  },
  ext: {
    loadimpact: {
      projectID: 3672041,
      name: 'ECOTRACK - NFR-01 API Report Service Load Test',
    },
  },
};

const BASE_URL = __ENV.API_URL || __ENV.BASE_URL || 'http://localhost:3000';

const DISTRICTS_COORDINATES = [
  { name: 'Centre-Ville', latitude: 36.8008, longitude: 10.1800 },
  { name: 'El Menzah', latitude: 36.8372, longitude: 10.1789 },
  { name: 'Ariana', latitude: 36.8625, longitude: 10.1956 },
  { name: 'La Marsa', latitude: 36.8782, longitude: 10.3247 },
  { name: 'Les Berges du Lac', latitude: 36.8331, longitude: 10.2355 },
  { name: 'Carthage', latitude: 36.8528, longitude: 10.3233 },
];

const ANOMALY_CATEGORIES = [
  'DECHARGE_SAUVAGE',
  'GRAFFITI',
  'ENCOMBRANT',
  'DEPOT_SAUVAGE',
  'AUTRE',
];

export default function () {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'k6-load-test/ecotrack-v2',
  };

  if (__ENV.JWT_TOKEN) {
    headers['Authorization'] = `Bearer ${__ENV.JWT_TOKEN}`;
  }

  // 1. Health & Readiness Probe Check
  group('01_Health_Check', () => {
    const res = http.get(`${BASE_URL}/health`, { headers, tags: { name: 'HealthCheck' } });
    const passed = check(res, {
      'health status is 200': (r) => r.status === 200,
      'health latency < 100ms': (r) => r.timings.duration < 100,
    });
    reportErrorRate.add(!passed);
    if (passed) successfulRequestsCounter.add(1);
  });

  sleep(0.1);

  // 2. Query Paginated Reports List (Read-Heavy traffic)
  group('02_Get_Reports_List', () => {
    const page = Math.floor(Math.random() * 5) + 1;
    const url = `${BASE_URL}/api/reports?page=${page}&limit=20`;
    const res = http.get(url, { headers, tags: { name: 'GetReportsList' } });

    reportQueryDuration.add(res.timings.duration);
    const passed = check(res, {
      'get reports status is 200 or 304': (r) => r.status === 200 || r.status === 304,
      'response time P95 target < 300ms': (r) => r.timings.duration < 300,
      'response has valid content': (r) => r.body && r.body.length > 0,
    });
    reportErrorRate.add(!passed);
    if (passed) successfulRequestsCounter.add(1);
  });

  sleep(0.2);

  // 3. Geospatial Proximity Search ($near query)
  group('03_Get_Nearby_Reports', () => {
    const district = DISTRICTS_COORDINATES[Math.floor(Math.random() * DISTRICTS_COORDINATES.length)];
    const url = `${BASE_URL}/api/reports/nearby?latitude=${district.latitude}&longitude=${district.longitude}&radius=3000`;
    const res = http.get(url, { headers, tags: { name: 'GetNearbyReports' } });

    reportQueryDuration.add(res.timings.duration);
    const passed = check(res, {
      'nearby reports status is 200': (r) => r.status === 200,
      'nearby response latency < 300ms': (r) => r.timings.duration < 300,
    });
    reportErrorRate.add(!passed);
    if (passed) successfulRequestsCounter.add(1);
  });

  sleep(0.3);

  // 4. Create New Incident Report (Write traffic - 20% of iterations)
  if (Math.random() < 0.2) {
    group('04_Create_Report', () => {
      const district = DISTRICTS_COORDINATES[Math.floor(Math.random() * DISTRICTS_COORDINATES.length)];
      const category = ANOMALY_CATEGORIES[Math.floor(Math.random() * ANOMALY_CATEGORIES.length)];
      
      const payload = JSON.stringify({
        description: `Signalement automatique de charge k6 - ${category} à ${district.name}`,
        category: category,
        location: {
          type: 'Point',
          coordinates: [district.longitude, district.latitude],
        },
        address: `Rue de ${district.name}, Tunis`,
        district: district.name,
        imageUrl: 'https://storage.ecotrack.local/reports/k6-test-sample.jpg',
        source: 'CITIZEN_MOBILE',
      });

      const res = http.post(`${BASE_URL}/api/reports`, payload, {
        headers,
        tags: { name: 'CreateReport' },
      });

      reportCreationDuration.add(res.timings.duration);
      const passed = check(res, {
        'create report status is 201 or 200': (r) => r.status === 201 || r.status === 200,
        'creation latency P95 < 300ms': (r) => r.timings.duration < 300,
      });
      reportErrorRate.add(!passed);
      if (passed) successfulRequestsCounter.add(1);
    });
  }

  // Pacing: simulate realistic citizen/agent interaction intervals
  sleep(Math.random() * 0.5 + 0.2);
}
