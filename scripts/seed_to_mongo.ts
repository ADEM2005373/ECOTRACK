import * as fs from 'fs';
import * as path from 'path';
import mongoose, { Types } from 'mongoose';
import { connectMongo, ReportModel, AuditLogModel } from '@ecotrack/db';
import { ReportStatus, UserRole } from '@ecotrack/shared';

async function seed() {
  await connectMongo();
  console.log('[SEED] Connected to MongoDB');

  // 1. Seed Reports
  const reportsCount = await ReportModel.countDocuments();
  console.log(`[SEED] Current reports in DB: ${reportsCount}`);

  if (reportsCount === 0) {
    const rawData = fs.readFileSync(path.join(__dirname, 'demo_500_reports.json'), 'utf-8');
    const demoReports = JSON.parse(rawData);
    console.log(`[SEED] Seeding ${demoReports.length} reports...`);

    const docs = demoReports.map((r: any) => {
      let status = r.status;
      if (status === 'A_QUALIFIER') status = ReportStatus.EN_COURS_DE_VALIDATION;
      if (status === 'EN_COURS') status = ReportStatus.EN_TRAITEMENT;
      if (!Object.values(ReportStatus).includes(status)) {
        status = ReportStatus.NOUVEAU;
      }

      return {
        _id: new Types.ObjectId(),
        reporterId: new Types.ObjectId(),
        category: r.category || 'DEPOT_SAUVAGE',
        categoryValidated: r.status === 'RESOLU' || r.status === 'VALIDE' ? r.category : undefined,
        description: r.description,
        imageUrl: r.imageUrl || 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800',
        thumbnailUrl: r.imageUrl || 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=200',
        afterImageUrl: r.afterImageUrl,
        location: {
          type: 'Point',
          coordinates: r.location.coordinates, // [lng, lat]
        },
        status: status,
        assignedTeamId: r.assignedWorkerId ? new Types.ObjectId() : undefined,
        assignedWorkerName: r.assignedWorkerName,
        createdAt: new Date(r.createdAt),
        updatedAt: new Date(r.updatedAt || r.createdAt),
        resolvedAt: r.resolvedAt ? new Date(r.resolvedAt) : undefined,
      };
    });

    await ReportModel.insertMany(docs);
    console.log(`[SEED] Successfully inserted ${docs.length} reports!`);
  }

  // 2. Seed Audit Logs
  const auditCount = await AuditLogModel.countDocuments();
  console.log(`[SEED] Current audit logs in DB: ${auditCount}`);

  if (auditCount === 0) {
    console.log('[SEED] Seeding initial audit trail logs...');
    const auditLogs = [
      {
        actorId: 'usr_saas_01',
        actorRole: UserRole.ADMIN_SAAS,
        action: 'MUNICIPALITY_ONBOARDED',
        entityType: 'MUNICIPALITY',
        entityId: 'mun_tunis_01',
        before: null,
        after: { name: 'Ville de Tunis', code: 'TN-TUNIS', region: 'Grand Tunis', status: 'ACTIVE' },
        reason: 'Onboarding officiel de la collectivité métropolitaine de Tunis',
        ipTruncated: '197.14.***.***',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) EcoTrack-Console',
        timestamp: new Date(Date.now() - 3600000 * 48),
      },
      {
        actorId: 'usr_saas_01',
        actorRole: UserRole.ADMIN_SAAS,
        action: 'MUNICIPALITY_ONBOARDED',
        entityType: 'MUNICIPALITY',
        entityId: 'mun_marsa_02',
        before: null,
        after: { name: 'Mairie de La Marsa', code: 'TN-MARSA', region: 'Banlieue Nord', status: 'ACTIVE' },
        reason: 'Déploiement salubrité côtière',
        ipTruncated: '197.14.***.***',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) EcoTrack-Console',
        timestamp: new Date(Date.now() - 3600000 * 36),
      },
      {
        actorId: 'usr_saas_01',
        actorRole: UserRole.ADMIN_SAAS,
        action: 'ADMIN_REOPEN',
        entityType: 'REPORT',
        entityId: 'REC-2026-0312',
        before: { status: 'RESOLU' },
        after: { status: 'ASSIGNE' },
        reason: 'Contestation citoyenne : décharge non entièrement débarrassée',
        ipTruncated: '197.14.***.***',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) EcoTrack-Console',
        timestamp: new Date(Date.now() - 3600000 * 12),
      },
      {
        actorId: 'usr_adm_tunis_01',
        actorRole: UserRole.ADMIN_MUNICIPALITE,
        action: 'BRIGADE_ASSIGNED',
        entityType: 'INTERVENTION',
        entityId: 'INT-2026-0044',
        before: { status: 'VALIDE' },
        after: { status: 'ASSIGNE', team: 'Brigade Centre-Ville Nord' },
        reason: 'Affectation équipe voirie salubrité prioritaire',
        ipTruncated: '197.28.***.***',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) EcoTrack-Mairie',
        timestamp: new Date(Date.now() - 3600000 * 6),
      },
      {
        actorId: 'usr_agent_01',
        actorRole: UserRole.AGENT_MAIRIE,
        action: 'REPORT_QUALIFIED',
        entityType: 'REPORT',
        entityId: 'REP-2026-0012',
        before: { status: 'NOUVEAU', category: 'DEPOT_SAUVAGE' },
        after: { status: 'VALIDE', category: 'DEPOT_SAUVAGE', aiConfidence: 0.94 },
        reason: 'Validation conforme après analyse visuelle agent',
        ipTruncated: '197.28.***.***',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) EcoTrack-Agent',
        timestamp: new Date(Date.now() - 3600000 * 2),
      },
    ];

    await AuditLogModel.insertMany(auditLogs);
    console.log(`[SEED] Successfully seeded ${auditLogs.length} audit logs!`);
  }

  await mongoose.disconnect();
  console.log('[SEED] Done!');
}

seed().catch(err => {
  console.error('[SEED] Error:', err);
  process.exit(1);
});
