import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStats, getReports, type ReportStats, type ReportItem, MOCK_STATS } from '../../services/reportApi';
import {
  ShieldCheck,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  Eye,
  UserCheck,
  XCircle,
  Search,
  Filter,
  Info
} from 'lucide-react';

export const AgentMairieDashboard: React.FC = () => {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [, setStats] = useState<ReportStats>(MOCK_STATS);
  const [notice, setNotice] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal d'assignation rapide
  const [assignTarget, setAssignTarget] = useState<ReportItem | null>(null);
  const [selectedBrigade, setSelectedBrigade] = useState('Brigade Voirie Centre-Ville');
  const [selectedWorker, setSelectedWorker] = useState('Karim Ben Salem');
  const [priority, setPriority] = useState('HAUTE');

  // Modal de rejet rapide
  const [rejectTarget, setRejectTarget] = useState<ReportItem | null>(null);
  const [rejectReason, setRejectReason] = useState('Photo inexploitable ou hors compétence communale');

  const loadData = async () => {
    try {
      const [s, r] = await Promise.all([getStats(), getReports()]);
      setStats(s.data);
      setReports(r.data);
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleConfirmAssign = () => {
    if (!assignTarget) return;
    setReports(prev =>
      prev.map(r => r.id === assignTarget.id ? { ...r, status: 'EN_TRAITEMENT', worker: selectedWorker } : r)
    );
    setNotice(`Anomalie ${assignTarget.reference} assignée avec succès à ${selectedWorker} (${selectedBrigade})`);
    setAssignTarget(null);
    setTimeout(() => setNotice(null), 4000);
  };

  const handleConfirmReject = () => {
    if (!rejectTarget) return;
    setReports(prev =>
      prev.map(r => r.id === rejectTarget.id ? { ...r, status: 'REJETE' } : r)
    );
    setNotice(`Signalement ${rejectTarget.reference} rejeté avec motif : "${rejectReason}"`);
    setRejectTarget(null);
    setTimeout(() => setNotice(null), 4000);
  };

  const filteredReports = reports.filter(r => {
    const matchesSearch = r.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.district.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Agent Mairie (Figma: WEB_AGT_01_INBOX) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#0f172a] font-heading tracking-tight">
            Boîte de réception
          </h1>
          <p className="text-[13px] text-[#475569] mt-0.5">
            Qualifiez les signalements et coordonnez les interventions sur votre territoire.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/supervision"
            className="inline-flex items-center gap-2 bg-white border border-[#1e3a8a] text-[#1e3a8a] hover:bg-[#eff6ff] font-semibold px-4 h-[44px] rounded-[8px] text-[13px] transition shadow-sm"
          >
            <MapPin className="w-4 h-4" />
            <span>Voir la carte</span>
          </Link>
          <Link
            to="/agent/qualification"
            className="inline-flex items-center gap-2 bg-[#059669] hover:bg-[#047857] text-white font-semibold px-4 h-[44px] rounded-[8px] text-[13px] transition shadow-sm shadow-emerald-600/20"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Atelier de Qualification</span>
          </Link>
        </div>
      </div>

      {notice && (
        <div className="bg-[#ecfdf5] border border-[#a7f3d0] p-4 rounded-[8px] flex items-center justify-between text-xs text-[#065f46]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#059669]" />
            <span className="font-medium">{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-[#059669] hover:text-[#064e3b] font-bold">✕</button>
        </div>
      )}

      {/* Bannière de notification Figma (WEB_AGT_01_INBOX) */}
      <div className="bg-[#eff6ff] border border-[#bfdbfe] p-3 rounded-[8px] flex items-center gap-3 text-[12px] text-[#1e3a8a]">
        <Info className="w-4 h-4 text-[#2563eb] shrink-0" />
        <p className="leading-snug">
          <strong>Nouveau signalement reçu à l'instant</strong> · Dépôt sauvage détecté par l'IA Vision avec 94% de confiance. Prêt pour qualification par l'agent municipal.
        </p>
      </div>

      {/* Barre de Filtres Figma */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par référence, adresse ou mot-clé..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-[#e2e8f0] rounded-[8px] pl-10 pr-4 h-[44px] text-[13px] text-[#0f172a] focus:outline-none focus:border-[#059669] transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Filter className="w-3.5 h-3.5 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-white border border-[#e2e8f0] rounded-[8px] pl-8 pr-8 h-[44px] text-[13px] text-[#0f172a] focus:outline-none focus:border-[#059669] transition appearance-none cursor-pointer"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="NOUVEAU">Nouveau (À qualifier)</option>
              <option value="A_QUALIFIER">À vérifier</option>
              <option value="EN_TRAITEMENT">En intervention</option>
              <option value="RESOLU">Résolu</option>
              <option value="REJETE">Rejeté</option>
            </select>
          </div>

          <button
            onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); }}
            className="h-[44px] px-4 rounded-[8px] text-[13px] font-semibold text-[#1e3a8a] hover:bg-[#eff6ff] transition"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Table de données officielle Figma (WEB_AGT_01_INBOX) */}
      <div className="bg-white border border-[#e2e8f0] rounded-[12px] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] text-[#475569] text-[11px] font-semibold uppercase tracking-wider border-b border-[#e2e8f0] h-[44px]">
                <th className="py-2.5 px-4">Signalement</th>
                <th className="py-2.5 px-4">Catégorie</th>
                <th className="py-2.5 px-4">Localisation</th>
                <th className="py-2.5 px-4">Statut</th>
                <th className="py-2.5 px-4">Brigade & Ouvrier</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0] text-[12px]">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[#64748b]">
                    <ShieldCheck className="w-8 h-8 mx-auto text-[#94a3b8] mb-2" />
                    <p className="font-semibold text-sm text-[#0f172a]">Boîte de réception municipale vide</p>
                    <p className="text-xs text-[#64748b] mt-1 max-w-sm mx-auto">
                      Toutes les données de test ont été purgées. Les nouvelles réclamations déposées par les citoyens apparaîtront ici pour qualification.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredReports.map((incident) => (
                  <tr key={incident.id} className="hover:bg-[#f8fafc] transition-colors h-[64px]">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={incident.imageUrl}
                        alt="Photo anomalie"
                        className="w-10 h-10 rounded-[6px] object-cover border border-[#e2e8f0] shrink-0"
                      />
                      <div>
                        <div className="font-semibold text-[#1e3a8a] flex items-center gap-1.5">
                          <span>{incident.reference}</span>
                          <span className="text-[10px] text-[#64748b] font-normal">({incident.timeAgo})</span>
                        </div>
                        <div className="text-[#475569] text-[11px] truncate max-w-xs">{incident.title}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium text-[#0f172a]">
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#4338ca] bg-[#eef2ff] px-2 py-0.5 rounded border border-[#c7d2fe]">
                      {incident.category} ({(incident.confidence * 100).toFixed(0)}%)
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#475569]">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#059669]" />
                      <span>{incident.district}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {incident.status === 'RESOLU' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-[11px] font-semibold bg-white text-[#047857] border border-[#059669]">
                        <CheckCircle2 className="w-3 h-3 text-[#059669]" /> Résolu
                      </span>
                    )}
                    {incident.status === 'EN_TRAITEMENT' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-[11px] font-semibold bg-white text-[#b45309] border border-[#d97706]">
                        <Clock className="w-3 h-3 text-[#d97706]" /> En intervention
                      </span>
                    )}
                    {(incident.status === 'A_QUALIFIER' || incident.status === 'NOUVEAU') && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-[11px] font-semibold bg-white text-[#1e3a8a] border border-[#1e3a8a]">
                        <Sparkles className="w-3 h-3 text-[#1e3a8a]" /> À qualifier
                      </span>
                    )}
                    {incident.status === 'REJETE' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-[11px] font-semibold bg-white text-[#dc2626] border border-[#dc2626]">
                        <XCircle className="w-3 h-3 text-[#dc2626]" /> Rejeté
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {incident.worker ? (
                      <span className="text-[#0f172a] font-medium">{incident.worker}</span>
                    ) : (
                      <span className="text-[#94a3b8] italic">Non assigné</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        to="/agent/qualification"
                        className="p-2 rounded-[6px] bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#334155] transition"
                        title="Ouvrir dans l'Atelier de Qualification"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => setAssignTarget(incident)}
                        className="bg-[#059669] hover:bg-[#047857] text-white font-semibold text-[11px] px-2.5 py-1.5 rounded-[6px] transition flex items-center gap-1"
                      >
                        <UserCheck className="w-3 h-3" />
                        <span>Assigner</span>
                      </button>
                      <button
                        onClick={() => setRejectTarget(incident)}
                        className="bg-white border border-[#dc2626] text-[#dc2626] hover:bg-rose-50 font-semibold text-[11px] px-2.5 py-1.5 rounded-[6px] transition"
                      >
                        Rejeter
                      </button>
                    </div>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODALE ASSIGNATION FIGMA (WEB_AGT_MODAL_ASSIGN) ================= */}
      {assignTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#e2e8f0] rounded-[12px] p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
              <h3 className="text-base font-bold text-[#0f172a]">Assignation de Brigade Terrain</h3>
              <button onClick={() => setAssignTarget(null)} className="text-[#94a3b8] hover:text-[#0f172a]">✕</button>
            </div>

            <div className="p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] text-xs space-y-1">
              <p><strong>Référence :</strong> {assignTarget.reference}</p>
              <p><strong>Type d'anomalie :</strong> {assignTarget.category}</p>
              <p><strong>Localisation :</strong> {assignTarget.district}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0f172a] mb-1">Brigade Municipale Dédiée</label>
              <select
                value={selectedBrigade}
                onChange={e => setSelectedBrigade(e.target.value)}
                className="w-full bg-white border border-[#e2e8f0] rounded-[8px] p-2.5 text-xs text-[#0f172a]"
              >
                <option value="Brigade Voirie Centre-Ville">Brigade Voirie Centre-Ville</option>
                <option value="Brigade Salubrité & Déchets">Brigade Salubrité & Déchets</option>
                <option value="Brigade Éclairage & Réseaux">Brigade Éclairage & Réseaux</option>
                <option value="Équipe Intervention Rapide">Équipe Intervention Rapide</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0f172a] mb-1">Chef Ouvrier Responsable</label>
              <select
                value={selectedWorker}
                onChange={e => setSelectedWorker(e.target.value)}
                className="w-full bg-white border border-[#e2e8f0] rounded-[8px] p-2.5 text-xs text-[#0f172a]"
              >
                <option value="Karim Ben Salem">Karim Ben Salem (Chef Brigade Voirie)</option>
                <option value="Tarek Jouini">Tarek Jouini (Chef Salubrité)</option>
                <option value="Youssef Trabelsi">Youssef Trabelsi (Équipe Mobile)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0f172a] mb-1">Niveau de Priorité</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className="w-full bg-white border border-[#e2e8f0] rounded-[8px] p-2.5 text-xs text-[#0f172a]"
              >
                <option value="HAUTE">Haute (Intervention &lt; 24h)</option>
                <option value="MOYENNE">Moyenne (Intervention &lt; 48h)</option>
                <option value="URGENTE">Urgente (Immédiate &lt; 6h)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
              <button
                type="button"
                onClick={() => setAssignTarget(null)}
                className="px-4 py-2 rounded-[8px] text-xs font-semibold text-[#475569] hover:bg-[#f1f5f9]"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmAssign}
                className="px-4 py-2 rounded-[8px] text-xs font-semibold bg-[#059669] hover:bg-[#047857] text-white shadow-sm"
              >
                Confirmer l'Affectation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODALE REJET FIGMA (WEB_AGT_MODAL_REJECT) ================= */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#e2e8f0] rounded-[12px] p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
              <h3 className="text-base font-bold text-[#dc2626]">Rejet Motivé du Signalement</h3>
              <button onClick={() => setRejectTarget(null)} className="text-[#94a3b8] hover:text-[#0f172a]">✕</button>
            </div>

            <p className="text-xs text-[#475569]">
              Indiquez le motif officiel du rejet pour informer le citoyen et clore le dossier :
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#0f172a] mb-1">Motif de Rejet</label>
              <select
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                className="w-full bg-white border border-[#e2e8f0] rounded-[8px] p-2.5 text-xs text-[#0f172a]"
              >
                <option value="Photo inexploitable ou floue">Photo inexploitable ou floue</option>
                <option value="Domaine privé / Hors compétence municipale">Domaine privé / Hors compétence municipale</option>
                <option value="Doublon / Déjà pris en charge">Doublon / Déjà pris en charge</option>
                <option value="Signalement infondé / Aucune anomalie constatée">Signalement infondé / Aucune anomalie constatée</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="px-4 py-2 rounded-[8px] text-xs font-semibold text-[#475569] hover:bg-[#f1f5f9]"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-[8px] text-xs font-semibold bg-[#dc2626] hover:bg-[#b91c1c] text-white shadow-sm"
              >
                Confirmer le Rejet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
