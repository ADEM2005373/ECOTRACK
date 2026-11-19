import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Brain,
  ShieldCheck,
  BarChart3,
  MapPin,
  Server,
  Layers,
  RotateCcw,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

export const AdminSaasDashboard: React.FC = () => {
  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [reopenTarget, setReopenTarget] = useState('REC-2026-0312');
  const [reopenReason, setReopenReason] = useState('Contestation citoyenne : dépôt non entièrement déblayé.');
  const [reopenSuccess, setReopenSuccess] = useState<string | null>(null);

  const handleConfirmReopen = () => {
    setReopenSuccess(`Réclamation ${reopenTarget} rouverte administrativement avec succès (Statut remis à : ASSIGNÉ pour nouvelle intervention)`);
    setReopenModalOpen(false);
    setTimeout(() => setReopenSuccess(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Header Admin SaaS (Figma: WEB_ADM_MODAL_REOPEN background) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#0f172a] font-heading tracking-tight">
            Tour de Contrôle SaaS
          </h1>
          <p className="text-[13px] text-[#475569] mt-0.5">
            Supervision métropolitaine globale, gouvernance des modèles IA et administration multi-collectivités.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setReopenModalOpen(true)}
            className="inline-flex items-center gap-2 bg-[#d97706] hover:bg-[#b45309] text-white font-semibold px-4 h-[44px] rounded-[8px] text-[13px] transition shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Réouverture Administrative</span>
          </button>
          <Link
            to="/admin/ai-governance"
            className="inline-flex items-center gap-2 bg-[#059669] hover:bg-[#047857] text-white font-semibold px-4 h-[44px] rounded-[8px] text-[13px] transition shadow-sm"
          >
            <Brain className="w-4 h-4" />
            <span>Gouvernance IA & MLOps</span>
          </Link>
        </div>
      </div>

      {reopenSuccess && (
        <div className="bg-[#ecfdf5] border border-[#a7f3d0] p-4 rounded-[8px] flex items-center justify-between text-xs text-[#065f46]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#059669]" />
            <span className="font-semibold">{reopenSuccess}</span>
          </div>
          <button onClick={() => setReopenSuccess(null)} className="text-[#059669] hover:text-[#064e3b] font-bold">✕</button>
        </div>
      )}

      {/* Cartes Métriques Globales */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-[#e2e8f0] p-5 rounded-[12px] shadow-sm">
          <div className="flex items-center justify-between text-[12px] text-[#475569]">
            <span>Collectivités Déployées</span>
            <Layers className="w-4 h-4 text-[#2563eb]" />
          </div>
          <div className="text-[28px] font-bold text-[#0f172a] mt-2 font-heading">3</div>
          <p className="text-[11px] text-[#059669] font-medium mt-1">Tunis · La Marsa · Ariana</p>
        </div>

        <div className="bg-white border border-[#e2e8f0] p-5 rounded-[12px] shadow-sm">
          <div className="flex items-center justify-between text-[12px] text-[#475569]">
            <span>Disponibilité Microservices K8s</span>
            <Server className="w-4 h-4 text-[#059669]" />
          </div>
          <div className="text-[28px] font-bold text-[#0f172a] mt-2 font-heading">99.98%</div>
          <p className="text-[11px] text-[#059669] font-medium mt-1">6/6 services opérationnels</p>
        </div>

        <div className="bg-white border border-[#e2e8f0] p-5 rounded-[12px] shadow-sm">
          <div className="flex items-center justify-between text-[12px] text-[#475569]">
            <span>Précision Modèle IA Vision</span>
            <Brain className="w-4 h-4 text-[#7c3aed]" />
          </div>
          <div className="text-[28px] font-bold text-[#0f172a] mt-2 font-heading">91.4%</div>
          <p className="text-[11px] text-[#059669] font-medium mt-1">F1-Score conforme CDCF</p>
        </div>

        <div className="bg-white border border-[#e2e8f0] p-5 rounded-[12px] shadow-sm">
          <div className="flex items-center justify-between text-[12px] text-[#475569]">
            <span>Réclamations Traitées</span>
            <ShieldCheck className="w-4 h-4 text-[#059669]" />
          </div>
          <div className="text-[28px] font-bold text-[#0f172a] mt-2 font-heading">1 428</div>
          <p className="text-[11px] text-[#64748b] mt-1">Audit immuable SHA-256 actif</p>
        </div>
      </div>

      {/* Cartes d'action & MLOps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-[#e2e8f0] rounded-[12px] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-[8px] bg-[#f5f3ff] text-[#7c3aed] flex items-center justify-center mb-4">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#0f172a]">
              Gouvernance MLOps & Matrice IA
            </h3>
            <p className="text-xs text-[#475569] mt-2 leading-relaxed">
              Surveillance du taux d'accord agent/IA, dérive des données et déclenchement des cycles de réentraînement actif.
            </p>
          </div>
          <Link
            to="/admin/ai-governance"
            className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-[#7c3aed] hover:underline"
          >
            <span>Explorer la Matrice MLOps</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-[12px] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-[8px] bg-[#eff6ff] text-[#2563eb] flex items-center justify-center mb-4">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#0f172a]">
              Entrepôt PostgreSQL & Power BI
            </h3>
            <p className="text-xs text-[#475569] mt-2 leading-relaxed">
              Synchronisation des faits et dimensions vers l'entrepôt PostgreSQL en schéma étoile pour reporting analytique.
            </p>
          </div>
          <Link
            to="/admin/analytics"
            className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-[#2563eb] hover:underline"
          >
            <span>Consulter les Rapports Power BI</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-[12px] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-[8px] bg-[#ecfdf5] text-[#059669] flex items-center justify-center mb-4">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#0f172a]">
              Cartographie 2dsphere Métropolitaine
            </h3>
            <p className="text-xs text-[#475569] mt-2 leading-relaxed">
              Supervision géospatiale de tous les signalements de la métropole avec clustering et filtres territoriaux.
            </p>
          </div>
          <Link
            to="/supervision"
            className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-[#059669] hover:underline"
          >
            <span>Ouvrir la Carte Métropolitaine</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ================= MODALE FIGMA REOUVERTURE (WEB_ADM_MODAL_REOPEN) ================= */}
      {reopenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#e2e8f0] rounded-[12px] p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
              <div className="flex items-center gap-2 text-[#d97706]">
                <RotateCcw className="w-5 h-5" />
                <h3 className="text-base font-bold text-[#0f172a]">
                  Réouverture Administrative d'un Signalement
                </h3>
              </div>
              <button
                onClick={() => setReopenModalOpen(false)}
                className="text-[#94a3b8] hover:text-[#0f172a]"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#475569]">
              Conformément à la gouvernance EcoTrack V2, seul l'<strong>Admin SaaS</strong> peut rouvrir un signalement clôturé pour déclencher une ré-intervention de brigade suite à une réclamation citoyenne.
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#0f172a] mb-1">
                Référence du signalement clôturé
              </label>
              <input
                type="text"
                value={reopenTarget}
                onChange={e => setReopenTarget(e.target.value)}
                className="w-full bg-white border border-[#e2e8f0] rounded-[8px] p-2.5 text-xs text-[#0f172a]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0f172a] mb-1">
                Motif administratif obligatoire
              </label>
              <textarea
                rows={3}
                value={reopenReason}
                onChange={e => setReopenReason(e.target.value)}
                className="w-full bg-white border border-[#e2e8f0] rounded-[8px] p-2.5 text-xs text-[#0f172a]"
                placeholder="Précisez la raison de la réouverture..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e2e8f0]">
              <button
                type="button"
                onClick={() => setReopenModalOpen(false)}
                className="px-4 py-2 rounded-[8px] text-xs font-semibold text-[#475569] hover:bg-[#f1f5f9]"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmReopen}
                className="px-4 py-2 rounded-[8px] text-xs font-semibold bg-[#d97706] hover:bg-[#b45309] text-white shadow-sm"
              >
                Confirmer la Réouverture
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
