import mongoose from 'mongoose';
import { connectMongo, UserModel, ReportModel, AuditLogModel } from '@ecotrack/db';
import { UserRole } from '@ecotrack/shared';

async function purgeFakeData() {
  await connectMongo();
  console.log('[PURGE] Connecté à MongoDB');

  // 1. Purge des 500 signalements fictifs
  const reportsResult = await ReportModel.deleteMany({});
  console.log(`[PURGE] ✅ Signalements supprimés: ${reportsResult.deletedCount}`);

  // 2. Purge des faux comptes utilisateurs (conservation stricte d'admin@ecotrack.tn)
  const usersResult = await UserModel.deleteMany({ email: { $ne: 'admin@ecotrack.tn' } });
  console.log(`[PURGE] ✅ Comptes fictifs supprimés: ${usersResult.deletedCount}`);

  // 3. Purge des faux logs d'audit via le driver natif pour réinitialiser la chaîne
  const auditResult = await mongoose.connection.collection('auditlogs').deleteMany({});
  console.log(`[PURGE] ✅ Anciens logs d'audit supprimés: ${auditResult.deletedCount}`);

  // 4. Vérification et confirmation du compte Admin SaaS racine
  const adminUser = await UserModel.findOne({ email: 'admin@ecotrack.tn' });
  if (adminUser) {
    adminUser.role = UserRole.ADMIN_SAAS;
    adminUser.fullName = 'Administrateur SaaS Principal';
    adminUser.municipality = 'Supervision Centrale';
    adminUser.isActive = true;
    await adminUser.save();
    console.log(`[PURGE] ✅ Compte Admin SaaS racine préservé: ${adminUser.email} (Rôle: ${adminUser.role})`);

    // Inscription du log d'audit officiel
    await AuditLogModel.create({
      actorId: adminUser._id.toString(),
      actorRole: 'ADMIN_SAAS',
      action: 'SYSTEM_PURGE_AND_RESET',
      entityType: 'PLATFORM',
      entityId: 'ROOT',
      ipTruncated: '127.0.0.0/24',
      reason: 'Base de données purgée de toutes les données fictives. Seul le compte Administrateur SaaS racine est conservé.',
      userAgent: 'EcoTrack CLI Purge Script',
      timestamp: new Date()
    });
    console.log(`[PURGE] ✅ Log d'audit de réinitialisation immuable créé.`);
  }

  const remainingUsers = await UserModel.find({}, { password: 0 });
  console.log('[PURGE] Utilisateurs restants en base:', remainingUsers);

  const remainingReportsCount = await ReportModel.countDocuments();
  console.log('[PURGE] Signalements restants en base:', remainingReportsCount);

  process.exit(0);
}

purgeFakeData().catch(err => {
  console.error('[PURGE] ❌ Erreur lors de la purge:', err);
  process.exit(1);
});
