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
    setReopenSuccess(`Réclamation ${reopenTarget} rouverte administrativement avec succès (Statut remis à : ASSIGNE pour nouvelle intervention)`);
    setReopenModalOpen(false);
    setTimeout(() => setReopenSuccess(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Header Admin SaaS Global */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-white font-heading">Tour de Contrôle SaaS Métropolitaine</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Admin SaaS Global
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Supervision transversale multi-collectivités, gouvernance IA MLOps et intégrité de l'infrastructure distribuée.
          </p>
        </div>

        <button
          onClick={() => setReopenModalOpen(true)}
          className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold px-3.5 py-2.5 rounded-xl text-xs transition"
        >
          <RotateCcw className="w-4 h-4 text-amber-400" />
          <span>Réouverture Administrative (ECO-40)</span>
        </button>
      </div>

      {reopenSuccess && (
        <div className="bg-emerald-950/70 border border-emerald-500/40 p-4 rounded-xl flex items-center justify-between text-xs text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{reopenSuccess}</span>
          </div>
          <button onClick={() => setReopenSuccess(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* KPIs Métropolitains Globaux */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Collectivités Actives</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">6 Mairies</div>
          <p className="text-[10px] text-purple-400 mt-1">Tunis, La Marsa, Ariana, Carthage, Menzah, Lac</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Précision IA (F1-Score)</span>
            <Brain className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">90.2%</div>
          <p className="text-[10px] text-emerald-400 mt-1">Concordance Humain/IA &gt; 88%</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Microservices SOA</span>
            <Server className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">6/6 Opérationnels</div>
          <p className="text-[10px] text-emerald-400 mt-1">P95 &lt; 145 ms (NFR-01 Validé)</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Traces d'Audit (ADR-05)</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">100% Append-Only</div>
          <p className="text-[10px] text-slate-500 mt-1">SHA-256 & non-répudiation</p>
        </div>
      </div>

      {/* Cartes d'Accès aux Modules Décisionnels & Gouvernance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/admin/ai-governance"
          className="bg-slate-900 border border-slate-800 hover:border-purple-500/50 p-5 rounded-2xl flex flex-col justify-between group transition hover:shadow-xl hover:shadow-purple-950/30"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-600/20 text-purple-400 flex items-center justify-center mb-3">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-purple-400 transition">
              Gouvernance MLOps & Matrice IA (ECO-43)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Surveillez la dérive du modèle MobileNetV3 (Model Drift), auditez la matrice de confusion 6x6 et exportez les données d'Active Learning.
            </p>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-purple-400 font-semibold pt-3 border-t border-slate-800">
            <span>Inspecter la Matrice IA</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
          </div>
        </Link>

        <Link
          to="/admin/analytics"
          className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 p-5 rounded-2xl flex flex-col justify-between group transition hover:shadow-xl hover:shadow-blue-950/30"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-600/20 text-blue-400 flex items-center justify-center mb-3">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition">
              Entrepôt PostgreSQL & Power BI (ECO-42)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Consultez le schéma en étoile décisionnel (`fact_signalements`, `dim_temps`, `dim_territoire`) avec isolation RLS par commune.
            </p>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-blue-400 font-semibold pt-3 border-t border-slate-800">
            <span>Ouvrir les Rapports BI</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
          </div>
        </Link>

        <Link
          to="/supervision"
          className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-5 rounded-2xl flex flex-col justify-between group transition hover:shadow-xl hover:shadow-emerald-950/30"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-600/10 border border-emerald-600/20 text-emerald-400 flex items-center justify-center mb-3">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition">
              Cartographie 2dsphere Métropolitaine (ECO-33)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Visualisation spatiale temps réel de l'ensemble des anomalies géolocalisées sur le Grand Tunis avec indexation spatiale MongoDB.
            </p>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-emerald-400 font-semibold pt-3 border-t border-slate-800">
            <span>Explorer la Carte Live</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
          </div>
        </Link>
      </div>

      {/* Modal de Réouverture Administrative (Figma: WEB_ADM_MODAL_REOPEN) */}
      {reopenModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-400" />
              <span>Réouverture Administrative d'un Signalement (ECO-40)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Prérogative exclusive de l'Administrateur SaaS : permet de rouvrir une réclamation préalablement clôturée en cas de contestation ou malfaçon.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Référence du Signalement Résolu</label>
                <input
                  type="text"
                  value={reopenTarget}
                  onChange={e => setReopenTarget(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Motif formel de réouverture (Obligatoire)</label>
                <textarea
                  rows={3}
                  value={reopenReason}
                  onChange={e => setReopenReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => setReopenModalOpen(false)} className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs">Annuler</button>
              <button
                onClick={handleConfirmReopen}
                className="bg-amber-600 hover:bg-amber-700 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-lg shadow-amber-600/30 transition"
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
