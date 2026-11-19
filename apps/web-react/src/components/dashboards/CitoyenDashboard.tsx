import React, { useState, useEffect } from 'react';
import { getReports, type ReportItem } from '../../services/reportApi';
import { 
  PlusCircle, 
  Clock, 
  CheckCircle2, 
  MapPin, 
  Camera, 
  FileText, 
  Sparkles,
  Send
} from 'lucide-react';

export const CitoyenDashboard: React.FC = () => {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [showNewModal, setShowNewModal] = useState(false);

  // Formulaire nouveau signalement
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('DEPOT_SAUVAGE');
  const [district, setDistrict] = useState('Centre-Ville');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const fetchCitizenReports = async () => {
    try {
      const res = await getReports();
      setReports(res.data);
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    void fetchCitizenReports();
  }, []);

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    try {
      // Simulation d'envoi API
      const newReport: ReportItem = {
        id: `cit_${Date.now()}`,
        reference: `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        title: title || 'Anomalie signalée par le citoyen',
        category: category as any,
        district,
        status: 'NOUVEAU',
        confidence: 0.94,
        timeAgo: "À l'instant",
        imageUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&auto=format&fit=crop&q=60',
      };

      setReports(prev => [newReport, ...prev]);
      setSubmitSuccess(`Votre signalement ${newReport.reference} a été transmis à la Mairie avec succès !`);
      setShowNewModal(false);
      setTitle('');
      setDescription('');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmitSuccess(null), 5000);
    }
  };

  const resolvedCount = reports.filter(r => r.status === 'RESOLU').length;
  const inProgressCount = reports.filter(r => r.status === 'EN_TRAITEMENT' || r.status === 'A_QUALIFIER').length;

  return (
    <div className="space-y-6">
      {/* Header Citoyen */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-white font-heading">Espace Citoyen</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
              Mes Démarches Urbaines
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Signalez des anomalies dans votre quartier et suivez les réparations effectuées par les équipes municipales.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/30 text-xs transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Faire un Signalement</span>
        </button>
      </div>

      {submitSuccess && (
        <div className="bg-emerald-950/70 border border-emerald-500/40 p-4 rounded-xl flex items-center justify-between text-xs text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{submitSuccess}</span>
          </div>
          <button onClick={() => setSubmitSuccess(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* KPIs Personnels Citoyen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Mes Réclamations</span>
            <FileText className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{reports.length}</div>
          <p className="text-[10px] text-slate-500 mt-1">Transmises à la collectivité</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>En Traitement</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{inProgressCount}</div>
          <p className="text-[10px] text-amber-400 mt-1">Ouvriers dépêchés sur site</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Résolues & Clôturées</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{resolvedCount}</div>
          <p className="text-[10px] text-emerald-400 mt-1">Avec preuve photo après travaux</p>
        </div>
      </div>

      {/* Liste des réclamations du citoyen */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Historique de mes réclamations</span>
          </h2>
          <span className="text-xs text-slate-400">{reports.length} déclarations enregistrées</span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {reports.map((r) => (
            <div key={r.id} className="p-4 hover:bg-slate-850/50 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <img
                  src={r.imageUrl}
                  alt={r.title}
                  className="w-14 h-14 rounded-xl object-cover border border-slate-800 shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{r.reference}</span>
                    <span className="text-[10px] text-slate-500">{r.timeAgo}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {r.category}
                    </span>
                  </div>
                  <h3 className="text-xs font-semibold text-slate-200 mt-0.5 truncate">{r.title}</h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    <span>{r.district}, Tunis</span>
                    <span>•</span>
                    <span>Équipe: {r.worker || 'En attente d’assignation'}</span>
                  </div>
                </div>
              </div>

              {/* Timeline Statut FSM */}
              <div className="flex items-center gap-2 shrink-0">
                <div className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                  r.status === 'RESOLU'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : r.status === 'EN_TRAITEMENT'
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                    : r.status === 'A_QUALIFIER'
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    : 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                }`}>
                  {r.status === 'RESOLU' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                  <span>{r.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Nouveau Signalement (Figma: MOB_CIT_03_REPORT_FORM) */}
      {showNewModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Nouveau Signalement Citoyen</h3>
              </div>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateReport} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Catégorie d'anomalie</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="DEPOT_SAUVAGE">Dépôt sauvage d'ordures</option>
                  <option value="ENCOMBRANTS">Objets encombrants sur voie publique</option>
                  <option value="GRAFFITI">Dégradation & Graffiti</option>
                  <option value="DECHETS_DANGEREUX">Déchets dangereux / Produits chimiques</option>
                  <option value="AUTRE">Autre nuisance de voirie</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Quartier / Localisation</label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Centre-Ville">Centre-Ville (Tunis)</option>
                  <option value="El Menzah">El Menzah</option>
                  <option value="Ariana">Ariana</option>
                  <option value="La Marsa">La Marsa</option>
                  <option value="Les Berges du Lac">Les Berges du Lac</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Titre court</label>
                <input
                  type="text"
                  placeholder="Ex: Sacs et gravats abandonnés près du trottoir"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description précise de l'anomalie</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Décrivez l'emplacement exact, la taille de l'anomalie et tout danger potentiel..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 bg-emerald-950/30 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-emerald-300 text-[11px]">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>L'IA Vision analysera la photo pour catégoriser automatiquement l'anomalie. Les métadonnées EXIF sensibles seront purgées (RGPD).</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Transmission...' : 'Envoyer à la Mairie'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
