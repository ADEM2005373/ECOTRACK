import mongoose, { Types } from 'mongoose';
import { connectMongo, ReportModel, UserModel } from '@ecotrack/db';
import { ReportStatus } from '@ecotrack/shared';

async function seedLiveReports() {
  await connectMongo();
  console.log('[SEED] Connected to MongoDB');

  const citizen = await UserModel.findOne({ email: 'citoyen@zarzouna.tn' });
  const reporterId = citizen?._id || new Types.ObjectId();

  const reports = [
    // 1. Mission ASSIGNÉE (À traiter) -> Bouton "Démarrer l'intervention (T3)" disponible
    {
      _id: new Types.ObjectId('6b02f1001111222233334401'),
      reporterId,
      category: 'DEPOT_SAUVAGE',
      categoryValidated: 'DEPOT_SAUVAGE',
      description: 'Dépôt sauvage de gravats et mobilier usagé bloquant le trottoir près du marché central de Zarzouna.',
      imageUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=200&q=80',
      location: {
        type: 'Point',
        coordinates: [9.8732, 37.2615], // Zarzouna, Bizerte
      },
      status: ReportStatus.ASSIGNE,
      priority: 'HAUTE',
      assignedTeamId: 'Brigade Voirie & Salubrité',
      assignedWorkerId: 'chef.voirie@zarzouna.tn',
      district: 'Marché Central, Zarzouna',
      statusHistory: [
        {
          from: ReportStatus.NOUVEAU,
          to: ReportStatus.VALIDE,
          transition: 'T1_VALIDATION',
          actorRole: 'AGENT_MAIRIE',
          actorId: 'adel@zarzouna.tn',
          timestamp: new Date(Date.now() - 3600000 * 3),
        },
        {
          from: ReportStatus.VALIDE,
          to: ReportStatus.ASSIGNE,
          transition: 'T2_DISPATCH',
          actorRole: 'AGENT_MAIRIE',
          actorId: 'adel@zarzouna.tn',
          timestamp: new Date(Date.now() - 3600000 * 2),
        },
      ],
      createdAt: new Date(Date.now() - 3600000 * 4),
      updatedAt: new Date(Date.now() - 3600000 * 2),
    },

    // 2. Mission EN COURS (En intervention) -> Bouton "Démarrer" MASQUÉ, Formulaire "Clôture & Preuve T4" AFFICHÉ
    {
      _id: new Types.ObjectId('6b02f1001111222233334402'),
      reporterId,
      category: 'ENCOMBRANTS',
      categoryValidated: 'ENCOMBRANTS',
      description: 'Déchets volumineux et carcasses métalliques entreposés Avenue Habib Bourguiba Zarzouna.',
      imageUrl: 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=800&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=200&q=80',
      location: {
        type: 'Point',
        coordinates: [9.8685, 37.2642],
      },
      status: ReportStatus.EN_TRAITEMENT,
      priority: 'URGENTE',
      assignedTeamId: 'Brigade Voirie & Salubrité',
      assignedWorkerId: 'chef.voirie@zarzouna.tn',
      district: 'Avenue Habib Bourguiba, Zarzouna',
      startedAt: new Date(Date.now() - 3600000),
      statusHistory: [
        {
          from: ReportStatus.ASSIGNE,
          to: ReportStatus.EN_TRAITEMENT,
          transition: 'T3_START',
          actorRole: 'CHEF_OUVRIER',
          actorId: 'chef.voirie@zarzouna.tn',
          timestamp: new Date(Date.now() - 3600000),
        },
      ],
      createdAt: new Date(Date.now() - 3600000 * 6),
      updatedAt: new Date(Date.now() - 3600000),
    },

    // 3. Mission TERMINÉE (Résolue) -> Clôturée avec photo après travaux certifiée
    {
      _id: new Types.ObjectId('6b02f1001111222233334403'),
      reporterId,
      category: 'GRAFFITI',
      categoryValidated: 'GRAFFITI',
      description: 'Tags et graffitis dégradant le mur de l\'école primaire de Zarzouna.',
      imageUrl: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=200&q=80',
      completionPhotoUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
      resolutionNotes: 'Nettoyage haute pression et couche de peinture protectrice appliqués.',
      location: {
        type: 'Point',
        coordinates: [9.8700, 37.2650],
      },
      status: ReportStatus.RESOLU,
      priority: 'MOYENNE',
      assignedTeamId: 'Brigade Voirie & Salubrité',
      assignedWorkerId: 'chef.voirie@zarzouna.tn',
      district: 'Quartier Scolaire, Zarzouna',
      startedAt: new Date(Date.now() - 3600000 * 8),
      resolvedAt: new Date(Date.now() - 3600000 * 2),
      createdAt: new Date(Date.now() - 3600000 * 12),
      updatedAt: new Date(Date.now() - 3600000 * 2),
    },

    // 4. Dossier NOUVEAU -> Pour modération bureautique Mairie
    {
      _id: new Types.ObjectId('6b02f1001111222233334404'),
      reporterId,
      category: 'DECHETS_DANGEREUX',
      categorySuggested: 'DECHETS_DANGEREUX',
      aiConfidenceScore: 0.96,
      description: 'Bidons d\'huiles de vidange industrielles et produits chimiques abandonnés au bord de la chaussée.',
      imageUrl: 'https://images.unsplash.com/photo-1528323273322-d81458248d40?auto=format&fit=crop&w=800&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1528323273322-d81458248d40?auto=format&fit=crop&w=200&q=80',
      location: {
        type: 'Point',
        coordinates: [9.8710, 37.2680],
      },
      status: ReportStatus.NOUVEAU,
      priority: 'CRITIQUE',
      district: 'Zone Industrielle Zarzouna',
      createdAt: new Date(Date.now() - 3600000 * 1),
      updatedAt: new Date(Date.now() - 3600000 * 1),
    },
  ];

  for (const r of reports) {
    await ReportModel.findByIdAndUpdate(r._id, r, { upsert: true, new: true });
  }

  console.log(`[SEED] Seeded ${reports.length} live reports in MongoDB ecotrack_db!`);
  await mongoose.disconnect();
}

seedLiveReports().catch((err) => {
  console.error('[SEED] Failed:', err);
  process.exit(1);
});
