import React, { useState, useEffect } from 'react';
import { getReports, type ReportItem } from '../../services/reportApi';
import { useAuth } from '../../store/authStore';
import {
  Wrench,
  Clock,
  CheckCircle2,
  MapPin,
  Camera,
  Play,
  Check,
  AlertTriangle
} from 'lucide-react';

export const ChefOuvrierDashboard: React.FC = () => {
  const { state: authState } = useAuth();
  const [missions, setMissions] = useState<ReportItem[]>([]);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Modal de clôture avec preuve photo
  const [selectedMission, setSelectedMission] = useState<ReportItem | null>(null);
  const proofPhoto = 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=500&auto=format&fit=crop&q=60';
  const [closing, setClosing] = useState(false);

  const fetchMissions = async () => {
    try {
      const res = await getReports();
      setMissions(res.data);
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    void fetchMissions();
  }, []);

  // Action : Démarrer intervention (Transition T3 -> EN_TRAITEMENT)
  const handleStartWork = (mission: ReportItem) => {
    setMissions(prev =>
      prev.map(m => m.id === mission.id ? { ...m, status: 'EN_TRAITEMENT' } : m)
    );
    setActionNotice(`Intervention démarrée sur site pour ${mission.reference} (Statut: EN_TRAITEMENT)`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Action : Clôturer avec photo après travaux (Transition T4 -> RESOLU)
  const handleResolveWork = () => {
    if (!selectedMission) return;
    setClosing(true);

    setTimeout(() => {
      setMissions(prev =>
        prev.map(m => m.id === selectedMission.id ? { ...m, status: 'RESOLU' } : m)
      );
      setActionNotice(`Intervention ${selectedMission.reference} clôturée avec succès avec preuve photo après travaux !`);
      setSelectedMission(null);
      setClosing(false);
      setTimeout(() => setActionNotice(null), 5000);
    }, 800);
  };

  const assignedCount = missions.filter(m => m.status === 'A_QUALIFIER' || m.status === 'NOUVEAU').length;
  const inProgressCount = missions.filter(m => m.status === 'EN_TRAITEMENT').length;
  const resolvedCount = missions.filter(m => m.status === 'RESOLU').length;

  return (
    <div className="space-y-6">
      {/* Header Chef Ouvrier */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-white font-heading">Feuille de Route Terrain</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Brigade Voirie & Salubrité
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gérez les missions assignées à votre équipe, démarrez les travaux et validez la conformité avec la photo après réparation.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
            Secteur : <strong>{authState.user?.municipality || 'Grand Tunis'}</strong>
          </span>
        </div>
      </div>

      {actionNotice && (
        <div className="bg-emerald-950/70 border border-emerald-500/40 p-4 rounded-xl flex items-center justify-between text-xs text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* KPIs Opérationnels Ouvrier */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Missions en Attente</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{assignedCount}</div>
          <p className="text-[10px] text-slate-500 mt-1">À prendre en charge</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Chantiers en Cours (T3)</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{inProgressCount}</div>
          <p className="text-[10px] text-blue-400 mt-1">Ouvriers sur place</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Clôturés & Preuve Validée (T4)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{resolvedCount}</div>
          <p className="text-[10px] text-emerald-400 mt-1">Anti-fraude 100% conforme</p>
        </div>
      </div>

      {/* Liste des Missions Terrain (Figma: MOB_WRK_01_ROUTE) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Wrench className="w-4 h-4 text-amber-400" />
            <span>Missions assignées à l'équipe</span>
          </h2>
          <span className="text-xs text-slate-400">{missions.length} interventions recensées</span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {missions.map((m) => (
            <div key={m.id} className="p-4 hover:bg-slate-850/50 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <img
                  src={m.imageUrl}
                  alt={m.title}
                  className="w-16 h-16 rounded-xl object-cover border border-slate-800 shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{m.reference}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {m.category}
                    </span>
                    <span className="text-[10px] text-slate-500">{m.timeAgo}</span>
                  </div>
                  <h3 className="text-xs font-semibold text-slate-200 mt-1 truncate">{m.title}</h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-brand-400" />
                    <span>{m.district}, Tunis</span>
                    <span>•</span>
                    <span className="text-emerald-400">Priorité: Élevée</span>
                  </div>
                </div>
              </div>

              {/* Actions Métier Chef Ouvrier */}
              <div className="flex items-center gap-2 shrink-0">
                {m.status !== 'RESOLU' && m.status !== 'EN_TRAITEMENT' && (
                  <button
                    onClick={() => handleStartWork(m)}
                    className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition shadow-lg shadow-blue-600/20"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Démarrer Chantier (T3)</span>
                  </button>
                )}

                {m.status === 'EN_TRAITEMENT' && (
                  <button
                    onClick={() => setSelectedMission(m)}
                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition shadow-lg shadow-emerald-600/20 animate-pulse"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Clôturer avec Preuve Photo (T4)</span>
                  </button>
                )}

                {m.status === 'RESOLU' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <Check className="w-3.5 h-3.5" />
                    <span>Clôturé & Conforme</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Clôture avec Preuve Photo (Figma: MOB_WRK_03_RESOLUTION) */}
      {selectedMission && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Preuve de Résolution des Travaux (T4)</h3>
              </div>
              <button onClick={() => setSelectedMission(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="text-xs space-y-3">
              <p className="text-slate-300">
                Conformément à la règle anti-fraude CDCF V2, une photo nette du lieu réparé est obligatoire pour clôturer <strong>{selectedMission.reference}</strong>.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 text-[11px] font-semibold">Photo Initiale (Avant)</label>
                  <img
                    src={selectedMission.imageUrl}
                    alt="Avant"
                    className="w-full h-32 rounded-xl object-cover border border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-emerald-400 mb-1 text-[11px] font-semibold">Photo Après Travaux</label>
                  <img
                    src={proofPhoto}
                    alt="Après"
                    className="w-full h-32 rounded-xl object-cover border border-emerald-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Rapport d'intervention de l'équipe</label>
                <textarea
                  rows={2}
                  defaultValue="Évacuation complète des encombrants et nettoyage de la chaussée effectué par la brigade voirie."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedMission(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleResolveWork}
                  disabled={closing}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{closing ? 'Validation...' : 'Valider la Clôture Définitive'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
