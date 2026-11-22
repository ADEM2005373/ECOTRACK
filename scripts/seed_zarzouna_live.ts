import mongoose, { Types } from 'mongoose';
import { connectMongo, ReportModel, UserModel } from '@ecotrack/db';
import { ReportStatus } from '@ecotrack/shared';

async function seedLiveReports() {
  await connectMongo();
  console.log('[SEED] Connected to MongoDB');

  const citizen = await UserModel.findOne({ email: 'citoyen@zarzouna.tn' });
  const reporterId = citizen?._id || new Types.ObjectId();

  const reports = [
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
    {
      _id: new Types.ObjectId('6b02f1001111222233334403'),
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
