#!/usr/bin/env ts-node
/**
 * 🌿 ECOTRACK - SCRUM-65 (ECO-53)
 * Script de peuplement ("Seed") de 500 signalements réalistes pour démonstration & Power BI.
 * 
 * Répartition statistique selon CDCF V2 :
 * - 60% Résolus (RESOLU) avec photo après-travaux purgée d'EXIF
 * - 20% En traitement (EN_TRAITEMENT / EN_COURS)
 * - 15% Nouveaux (NOUVEAU / A_QUALIFIER)
 * - 5% Rejetés (REJETE)
 * 
 * Géolocalisation : 6 quartiers réalistes de Tunis (Point GeoJSON [lng, lat])
 * Temporalité : Dates échelonnées sur les 90 derniers jours (3 mois)
 * 
 * Auteur : Adem Ouerhani (Lead Dev & DevOps)
 */

import * as fs from 'fs';
import * as path from 'path';

export interface GeoLocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface StatusHistoryEntry {
  fromStatus: string;
  toStatus: string;
  changedBy: string;
  timestamp: string;
  comment?: string;
}

export interface SeedReport {
  id: string;
  citizenId: string;
  citizenName: string;
  title: string;
  description: string;
  category: 'DECHARGE_SAUVAGE' | 'GRAFFITI' | 'ENCOMBRANT' | 'DEPOT_SAUVAGE' | 'AUTRE';
  status: 'NOUVEAU' | 'A_QUALIFIER' | 'EN_TRAITEMENT' | 'EN_COURS' | 'RESOLU' | 'REJETE';
  location: GeoLocation;
  address: string;
  district: string;
  imageUrl: string;
  afterImageUrl?: string;
  aiPredictedCategory?: string;
  aiConfidence?: number;
  assignedWorkerId?: string;
  assignedWorkerName?: string;
  slaHoursTarget: number;
  slaBreached: boolean;
  leadTimeHours?: number;
  history: StatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export const DISTRICTS = [
  { name: 'Centre-Ville', center: { lat: 36.8008, lng: 10.1800 }, radiusKm: 1.5 },
  { name: 'El Menzah', center: { lat: 36.8372, lng: 10.1789 }, radiusKm: 2.0 },
  { name: 'Ariana', center: { lat: 36.8625, lng: 10.1956 }, radiusKm: 2.5 },
  { name: 'La Marsa', center: { lat: 36.8782, lng: 10.3247 }, radiusKm: 2.0 },
  { name: 'Les Berges du Lac', center: { lat: 36.8331, lng: 10.2355 }, radiusKm: 2.0 },
  { name: 'Carthage', center: { lat: 36.8528, lng: 10.3233 }, radiusKm: 1.5 },
];

export const CATEGORIES = [
  'DECHARGE_SAUVAGE',
  'GRAFFITI',
  'ENCOMBRANT',
  'DEPOT_SAUVAGE',
  'AUTRE',
] as const;

export const WORKERS = [
  { id: 'usr_wrk_001', name: 'Karim Ben Salem', district: 'Centre-Ville' },
  { id: 'usr_wrk_002', name: 'Tarek Jouini', district: 'El Menzah' },
  { id: 'usr_wrk_003', name: 'Youssef Trabelsi', district: 'Ariana' },
  { id: 'usr_wrk_004', name: 'Mehdi Gharbi', district: 'La Marsa' },
  { id: 'usr_wrk_005', name: 'Hamza Dridi', district: 'Les Berges du Lac' },
  { id: 'usr_wrk_006', name: 'Slimane Riahi', district: 'Carthage' },
];

export const CITIZENS = [
  { id: 'usr_cit_01', name: 'Anis Mahjoub' },
  { id: 'usr_cit_02', name: 'Leila Chaabane' },
  { id: 'usr_cit_03', name: 'Mounir Sassi' },
  { id: 'usr_cit_04', name: 'Fatma Khemir' },
  { id: 'usr_cit_05', name: 'Nidhal Ben Amor' },
];

function randomCoordinateNear(lat: number, lng: number, radiusKm: number): [number, number] {
  const radiusInDegrees = radiusKm / 111.0;
  const u = Math.random();
  const v = Math.random();
  const w = radiusInDegrees * Math.sqrt(u);
  const t = 2 * Math.PI * v;
  const deltaLat = w * Math.cos(t);
  const deltaLng = (w * Math.sin(t)) / Math.cos((lat * Math.PI) / 180.0);
  return [Number((lng + deltaLng).toFixed(6)), Number((lat + deltaLat).toFixed(6))];
}

export function generateSeedReports(count: number = 500): SeedReport[] {
  const reports: SeedReport[] = [];
  const now = new Date('2026-11-17T12:00:00Z').getTime();
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;

  // Breakdown targets:
  // 60% RESOLU (count * 0.60)
  // 20% EN_TRAITEMENT (count * 0.20)
  // 15% NOUVEAU (count * 0.15)
  // 5% REJETE (count * 0.05)
  const resolvedTarget = Math.round(count * 0.60);
  const inProgressTarget = Math.round(count * 0.20);
  const newTarget = Math.round(count * 0.15);
  const rejectedTarget = count - resolvedTarget - inProgressTarget - newTarget;

  const statuses: ('RESOLU' | 'EN_TRAITEMENT' | 'NOUVEAU' | 'REJETE')[] = [];
  for (let i = 0; i < resolvedTarget; i++) statuses.push('RESOLU');
  for (let i = 0; i < inProgressTarget; i++) statuses.push('EN_TRAITEMENT');
  for (let i = 0; i < newTarget; i++) statuses.push('NOUVEAU');
  for (let i = 0; i < rejectedTarget; i++) statuses.push('REJETE');

  // Shuffle statuses
  for (let i = statuses.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [statuses[i], statuses[j]] = [statuses[j], statuses[i]];
  }

  for (let i = 0; i < count; i++) {
    const idNum = String(i + 1).padStart(4, '0');
    const districtObj = DISTRICTS[i % DISTRICTS.length];
    const category = CATEGORIES[i % CATEGORIES.length];
    const citizen = CITIZENS[i % CITIZENS.length];
    const worker = WORKERS.find((w) => w.district === districtObj.name) || WORKERS[0];
    const status = statuses[i];

    // Timestamp between now - 90 days and now
    const ageMs = Math.random() * ninetyDaysMs;
    const createdAtDate = new Date(now - ageMs);
    const createdAtStr = createdAtDate.toISOString();

    const [lng, lat] = randomCoordinateNear(
      districtObj.center.lat,
      districtObj.center.lng,
      districtObj.radiusKm
    );

    const history: StatusHistoryEntry[] = [
      {
        fromStatus: 'INITIAL',
        toStatus: 'NOUVEAU',
        changedBy: citizen.id,
        timestamp: createdAtStr,
        comment: 'Création du signalement par le citoyen.',
      },
    ];

    let updatedAt = createdAtStr;
    let resolvedAt: string | undefined = undefined;
    let leadTimeHours: number | undefined = undefined;
    const slaHoursTarget = category === 'DECHARGE_SAUVAGE' ? 24 : 48;
    let slaBreached = false;
    let afterImageUrl: string | undefined = undefined;

    if (status === 'REJETE') {
      const rejectTime = new Date(createdAtDate.getTime() + 2 * 3600 * 1000);
      updatedAt = rejectTime.toISOString();
      history.push({
        fromStatus: 'NOUVEAU',
        toStatus: 'REJETE',
        changedBy: 'usr_agt_001',
        timestamp: updatedAt,
        comment: 'Photo floue ou doublon rejeté conformément à la politique municipale.',
      });
    } else if (status === 'EN_TRAITEMENT') {
      const qualifTime = new Date(createdAtDate.getTime() + 4 * 3600 * 1000);
      const assignTime = new Date(createdAtDate.getTime() + 8 * 3600 * 1000);
      updatedAt = assignTime.toISOString();
      history.push(
        {
          fromStatus: 'NOUVEAU',
          toStatus: 'A_QUALIFIER',
          changedBy: 'sys_ai_vision',
          timestamp: qualifTime.toISOString(),
          comment: 'Qualification IA automatique MobileNetV3.',
        },
        {
          fromStatus: 'A_QUALIFIER',
          toStatus: 'EN_TRAITEMENT',
          changedBy: 'usr_agt_001',
          timestamp: assignTime.toISOString(),
          comment: `Affectation à l'ouvrier ${worker.name}.`,
        }
      );
    } else if (status === 'RESOLU') {
      // Lead time between 6h and 60h
      const durationHours = Number((Math.random() * 48 + 6).toFixed(1));
      leadTimeHours = durationHours;
      slaBreached = durationHours > slaHoursTarget;
      const resolveDate = new Date(createdAtDate.getTime() + durationHours * 3600 * 1000);
      resolvedAt = resolveDate.toISOString();
      updatedAt = resolvedAt;
      afterImageUrl = `https://storage.ecotrack.local/reports/proof-resolved-${idNum}.jpg`;

      history.push(
        {
          fromStatus: 'NOUVEAU',
          toStatus: 'A_QUALIFIER',
          changedBy: 'sys_ai_vision',
          timestamp: new Date(createdAtDate.getTime() + 1 * 3600 * 1000).toISOString(),
        },
        {
          fromStatus: 'A_QUALIFIER',
          toStatus: 'EN_TRAITEMENT',
          changedBy: 'usr_agt_001',
          timestamp: new Date(createdAtDate.getTime() + 3 * 3600 * 1000).toISOString(),
        },
        {
          fromStatus: 'EN_TRAITEMENT',
          toStatus: 'RESOLU',
          changedBy: worker.id,
          timestamp: resolvedAt,
          comment: 'Chantier nettoyé, photo après travaux enregistrée (T4).',
        }
      );
    }

    reports.push({
      id: `REP-2026-${idNum}`,
      citizenId: citizen.id,
      citizenName: citizen.name,
      title: `${category.replace('_', ' ')} signalé à ${districtObj.name}`,
      description: `Présence anormale de type ${category.toLowerCase()} constatée sur la voie publique à ${districtObj.name}. Nécessite intervention de salubrité municipale.`,
      category: category as any,
      status: status as any,
      location: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      address: `Avenue Habib Bourguiba, quartier ${districtObj.name}, Tunis`,
      district: districtObj.name,
      imageUrl: `https://storage.ecotrack.local/reports/anomaly-${idNum}.jpg`,
      afterImageUrl,
      aiPredictedCategory: category,
      aiConfidence: Number((0.85 + Math.random() * 0.14).toFixed(3)),
      assignedWorkerId: status !== 'NOUVEAU' && status !== 'REJETE' ? worker.id : undefined,
      assignedWorkerName: status !== 'NOUVEAU' && status !== 'REJETE' ? worker.name : undefined,
      slaHoursTarget,
      slaBreached,
      leadTimeHours,
      history,
      createdAt: createdAtStr,
      updatedAt,
      resolvedAt,
    });
  }

  return reports;
}

// CLI Execution Support
if (require.main === module) {
  const countArg = process.argv.find((arg) => arg.startsWith('--count='));
  const count = countArg ? parseInt(countArg.split('=')[1], 10) : 500;

  console.log(`[SEED] Génération de ${count} signalements historiques réalistes...`);
  const data = generateSeedReports(count);

  const outputPath = path.join(__dirname, 'demo_500_reports.json');
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');

  const resolved = data.filter((r) => r.status === 'RESOLU').length;
  const inProgress = data.filter((r) => r.status === 'EN_TRAITEMENT').length;
  const newReports = data.filter((r) => r.status === 'NOUVEAU').length;
  const rejected = data.filter((r) => r.status === 'REJETE').length;

  console.log(`[SEED] Insertion terminée avec succès :`);
  console.log(`       - Résolus        : ${resolved} (${((resolved / count) * 100).toFixed(1)}%) [Cible ~60%]`);
  console.log(`       - En traitement  : ${inProgress} (${((inProgress / count) * 100).toFixed(1)}%) [Cible ~20%]`);
  console.log(`       - Nouveaux       : ${newReports} (${((newReports / count) * 100).toFixed(1)}%) [Cible ~15%]`);
  console.log(`       - Rejetés        : ${rejected} (${((rejected / count) * 100).toFixed(1)}%) [Cible ~5%]`);
  console.log(`[SEED] Fichier exporté : ${outputPath}`);
  console.log(`[SEED] Cartographie et rapports Power BI prêts pour la soutenance ! 🌿`);
}
