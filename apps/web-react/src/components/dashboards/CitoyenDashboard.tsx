import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  const [searchParams, setSearchParams] = useSearchParams();

  // Formulaire nouveau signalement
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('DEPOT_SAUVAGE');
  const [district, setDistrict] = useState('Centre-Ville');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get('tab') === 'new') {
      setShowNewModal(true);
    }
  }, [searchParams]);

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
      setSubmitSuccess(`Votre signalement ${newReport.reference} a été transmis aux services municipaux avec succès !`);
      setShowNewModal(false);
      setSearchParams({});
      setTitle('');
      setDescription('');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmitSuccess(null), 5000);
    }
  };

  const resolvedCount = reports.filter(r => r.status === 'RESOLU').length;
  const inProgressCount = reports.filter(r => r.status === 'EN_TRAITEMENT' || r.status === 'A_QUALIFIER' || r.status === 'NOUVEAU').length;

  return (
    <div className="space-y-6">
      {/* Header Citoyen (Figma: MOB_CIT_01_MAP_HOME / MOB_CIT_04_MY_REPORTS) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#0f172a] font-heading tracking-tight">
            Espace Citoyen
          </h1>
          <p className="text-[13px] text-[#475569] mt-0.5">
            Signalez des anomalies dans votre quartier et suivez l'intervention des équipes municipales en temps réel.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="inline-flex items-center gap-2 bg-[#059669] hover:bg-[#047857] text-white font-semibold px-4 h-[44px] rounded-[8px] text-[13px] transition shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Faire un Signalement</span>
        </button>
      </div>

      {submitSuccess && (
        <div className="bg-[#ecfdf5] border border-[#a7f3d0] p-4 rounded-[8px] flex items-center justify-between text-xs text-[#065f46]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#059669]" />
            <span className="font-semibold">{submitSuccess}</span>
          </div>
          <button onClick={() => setSubmitSuccess(null)} className="text-[#059669] hover:text-[#064e3b] font-bold">✕</button>
        </div>
      )}

      {/* Cartes d'État Citoyen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#e2e8f0] p-5 rounded-[12px] shadow-sm">
          <div className="flex items-center justify-between text-[12px] text-[#475569]">
            <span>Total des Démarches</span>
            <FileText className="w-4 h-4 text-[#2563eb]" />
          </div>
          <div className="text-[28px] font-bold text-[#0f172a] mt-2 font-heading">{reports.length}</div>
          <p className="text-[11px] text-[#475569] mt-1">Signalements transmis par votre compte</p>
        </div>

        <div className="bg-white border border-[#e2e8f0] p-5 rounded-[12px] shadow-sm">
          <div className="flex items-center justify-between text-[12px] text-[#475569]">
            <span>En Traitement / Assigné</span>
            <Clock className="w-4 h-4 text-[#d97706]" />
          </div>
          <div className="text-[28px] font-bold text-[#0f172a] mt-2 font-heading">{inProgressCount}</div>
          <p className="text-[11px] text-[#d97706] font-semibold mt-1">Prise en charge par les brigades</p>
        </div>

        <div className="bg-white border border-[#e2e8f0] p-5 rounded-[12px] shadow-sm">
          <div className="flex items-center justify-between text-[12px] text-[#475569]">
            <span>Résolus & Propreté Restaurée</span>
            <CheckCircle2 className="w-4 h-4 text-[#059669]" />
          </div>
          <div className="text-[28px] font-bold text-[#0f172a] mt-2 font-heading">{resolvedCount}</div>
          <p className="text-[11px] text-[#059669] font-semibold mt-1">Interventions finalisées avec succès</p>
        </div>
      </div>

      {/* Liste de Suivi Citoyen (Figma: MOB_CIT_04_MY_REPORTS) */}
      <div className="bg-white border border-[#e2e8f0] rounded-[12px] shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#0f172a]">Historique de mes Signalements</h2>
          <span className="text-xs text-[#64748b]">{reports.length} réclamations enregistrées</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((r) => (
            <div
              key={r.id}
              className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] p-4 flex gap-4 hover:border-[#cbd5e1] transition"
            >
              <img
                src={r.imageUrl}
                alt={r.title}
                className="w-20 h-20 rounded-[6px] object-cover border border-[#e2e8f0] shrink-0"
              />
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-[#1e3a8a] text-xs truncate">{r.reference}</span>
                  <span className="text-[10px] text-[#64748b]">{r.timeAgo}</span>
                </div>

                <h3 className="text-xs font-bold text-[#0f172a] truncate">{r.title}</h3>

                <p className="text-[11px] text-[#475569] flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#059669]" />
                  <span>{r.district}</span>
                </p>

                <div className="pt-1.5 flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-[#4338ca] border border-[#e2e8f0]">
                    {r.category}
                  </span>

                  {r.status === 'RESOLU' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#047857] bg-white border border-[#059669] px-2 py-0.5 rounded-[6px]">
                      <CheckCircle2 className="w-3 h-3 text-[#059669]" /> Résolu
                    </span>
                  )}
                  {r.status === 'EN_TRAITEMENT' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#b45309] bg-white border border-[#d97706] px-2 py-0.5 rounded-[6px]">
                      <Clock className="w-3 h-3 text-[#d97706]" /> En intervention
                    </span>
                  )}
                  {(r.status === 'A_QUALIFIER' || r.status === 'NOUVEAU') && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1e3a8a] bg-white border border-[#1e3a8a] px-2 py-0.5 rounded-[6px]">
                      <Sparkles className="w-3 h-3 text-[#1e3a8a]" /> Transmis à la mairie
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= MODALE NOUVEAU SIGNALEMENT FIGMA (MOB_CIT_03_REPORT_FORM) ================= */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#e2e8f0] rounded-[12px] p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#059669]" />
                <h3 className="text-base font-bold text-[#0f172a]">Nouveau Signalement Citoyen</h3>
              </div>
              <button
                onClick={() => {
                  setShowNewModal(false);
                  setSearchParams({});
                }}
                className="text-[#94a3b8] hover:text-[#0f172a]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateReport} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0f172a] mb-1">Titre de l'anomalie</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Dépôt d'ordures devant l'école"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-white border border-[#e2e8f0] rounded-[8px] p-2.5 text-xs text-[#0f172a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0f172a] mb-1">Catégorie constatée</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-white border border-[#e2e8f0] rounded-[8px] p-2.5 text-xs text-[#0f172a]"
                  >
                    <option value="DEPOT_SAUVAGE">Dépôt sauvage</option>
                    <option value="ENCOMBRANTS">Objets encombrants</option>
                    <option value="DECHETS_DANGEREUX">Déchets dangereux</option>
                    <option value="GRAFFITI">Graffiti & Dégradation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0f172a] mb-1">Quartier / Arrondissement</label>
                  <select
                    value={district}
                    onChange={e => setDistrict(e.target.value)}
                    className="w-full bg-white border border-[#e2e8f0] rounded-[8px] p-2.5 text-xs text-[#0f172a]"
                  >
                    <option value="Centre-Ville">Centre-Ville</option>
                    <option value="El Menzah">El Menzah</option>
                    <option value="Bab Bhar">Bab Bhar</option>
                    <option value="La Marsa">La Marsa</option>
                    <option value="Les Berges du Lac">Les Berges du Lac</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0f172a] mb-1">Description & Localisation précise</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Indiquez l'adresse exacte, des repères visibles pour aider l'équipe municipale..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-white border border-[#e2e8f0] rounded-[8px] p-2.5 text-xs text-[#0f172a]"
                />
              </div>

              <div className="p-3 bg-[#f8fafc] border border-dashed border-[#cbd5e1] rounded-[8px] text-center space-y-1">
                <Camera className="w-6 h-6 text-[#059669] mx-auto" />
                <p className="text-xs font-semibold text-[#0f172a]">Photo capturée via mobile</p>
                <p className="text-[10px] text-[#64748b]">La géolocalisation GPS et la date seront automatiquement jointes</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-[8px] text-xs font-semibold text-[#475569] hover:bg-[#f1f5f9]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[8px] text-xs font-semibold bg-[#059669] hover:bg-[#047857] text-white shadow-sm disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Transmission...' : 'Transmettre à la Mairie'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
