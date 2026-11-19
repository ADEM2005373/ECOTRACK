import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStats, getReports, type ReportStats, type ReportItem, MOCK_STATS } from '../../services/reportApi';
import {
  Inbox,
  ShieldCheck,
  MapPin,
  Clock,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Eye,
  UserCheck,
  XCircle
} from 'lucide-react';

export const AgentMairieDashboard: React.FC = () => {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [stats, setStats] = useState<ReportStats>(MOCK_STATS);
  const [notice, setNotice] = useState<string | null>(null);

  // Modal d'assignation rapide
  const [assignTarget, setAssignTarget] = useState<ReportItem | null>(null);
  const [selectedBrigade, setSelectedBrigade] = useState('Brigade Voirie Centre-Ville');
  const [selectedWorker, setSelectedWorker] = useState('Karim Ben Salem');
  const [priority, setPriority] = useState('HAUTE');

  // Modal de rejet rapide
  const [rejectTarget, setRejectTarget] = useState<ReportItem | null>(null);
  const [rejectReason, setRejectReason] = useState('Photo inexploitable / floue');

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

  const toQualifyCount = reports.filter(r => r.status === 'A_QUALIFIER' || r.status === 'NOUVEAU').length;

  return (
    <div className="space-y-6">
      {/* Header Agent Mairie (Figma: WEB_AGT_01_INBOX) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-white font-heading">Boîte de Réception & Modération</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Agent Mairie
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Qualifiez les signalements citoyens entrants, validez les prédictions de l'IA Vision et dispatchez les brigades de terrain.
          </p>
        </div>

        <Link
          to="/agent/qualification"
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/30 text-xs transition"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Ouvrir l'Atelier de Qualification (ECO-31)</span>
        </Link>
      </div>

      {notice && (
        <div className="bg-emerald-950/70 border border-emerald-500/40 p-4 rounded-xl flex items-center justify-between text-xs text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* KPIs Agent */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>À Qualifier</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{toQualifyCount}</div>
          <p className="text-[10px] text-amber-400 mt-1">En attente d'arbitrage</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Score F1 IA Vision</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{(stats.aiF1Score * 100).toFixed(1)}%</div>
          <p className="text-[10px] text-purple-400 mt-1">MobileNetV3 Inférence 38 ms</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>En Intervention</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{stats.inProgress}</div>
          <p className="text-[10px] text-blue-400 mt-1">Ouvriers mobilisés</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Taux de Résolution</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{(stats.resolutionRate * 100).toFixed(1)}%</div>
          <p className="text-[10px] text-emerald-400 mt-1">SLA respecté &lt; 48h</p>
        </div>
      </div>

      {/* Tableau Inbox des Signalements (Figma: WEB_AGT_01_INBOX) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Inbox className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">File d'arbitrage & anomalies urbaines</h2>
          </div>
          <Link to="/supervision" className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            <span>Voir sur la carte GIS</span>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Référence</th>
                <th className="py-3 px-4">Photo & Description</th>
                <th className="py-3 px-4">Prédiction IA</th>
                <th className="py-3 px-4">Quartier</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4 text-right">Actions Modérateur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {reports.map((r) => (
                <tr key={r.id} className="hover:bg-slate-850/40 transition">
                  <td className="py-3.5 px-4 font-bold text-white font-mono">{r.reference}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <img src={r.imageUrl} alt={r.title} className="w-10 h-10 rounded-lg object-cover border border-slate-800 shrink-0" />
                      <div className="truncate max-w-xs">
                        <p className="font-semibold text-slate-200 truncate">{r.title}</p>
                        <p className="text-[10px] text-slate-500">{r.timeAgo}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                      {r.category} ({(r.confidence * 100).toFixed(0)}%)
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-300">{r.district}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      r.status === 'RESOLU' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                      r.status === 'EN_TRAITEMENT' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                      r.status === 'REJETE' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                      'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        to="/agent/qualification"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                        title="Qualifier en split-screen"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      {r.status !== 'RESOLU' && r.status !== 'REJETE' && (
                        <>
                          <button
                            onClick={() => setAssignTarget(r)}
                            className="p-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 transition"
                            title="Assigner brigade"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setRejectTarget(r)}
                            className="p-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 transition"
                            title="Rejeter"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal d'Assignation (Figma: WEB_AGT_MODAL_ASSIGN) */}
      {assignTarget && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-400" />
              <span>Assignation de Brigade Terrain (T2)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Affectez une équipe opérationnelle pour traiter le signalement <strong>{assignTarget.reference}</strong> ({assignTarget.district}).
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Brigade Municipale</label>
                <select
                  value={selectedBrigade}
                  onChange={e => setSelectedBrigade(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="Brigade Voirie Centre-Ville">Brigade Voirie Centre-Ville (Tunis)</option>
                  <option value="Brigade Salubrité El Menzah">Brigade Salubrité El Menzah</option>
                  <option value="Équipe Intervention Rapide Ariana">Équipe Intervention Rapide Ariana</option>
                  <option value="Brigade Espaces Publics La Marsa">Brigade Espaces Publics La Marsa</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Chef d'Équipe / Ouvrier Référent</label>
                <select
                  value={selectedWorker}
                  onChange={e => setSelectedWorker(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="Karim Ben Salem">Karim Ben Salem (Chef Ouvrier Voirie)</option>
                  <option value="Tarek Jouini">Tarek Jouini (Opérateur Poids Lourd)</option>
                  <option value="Youssef Trabelsi">Youssef Trabelsi (Agent Salubrité)</option>
                  <option value="Mehdi Gharbi">Mehdi Gharbi (Chef Équipe Voirie)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Priorité de Résolution</label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="URGENTE">🚨 Urgente (SLA &lt; 12h)</option>
                  <option value="HAUTE">⚡ Haute (SLA &lt; 24h)</option>
                  <option value="NORMALE">Standard (SLA &lt; 48h)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => setAssignTarget(null)} className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs">Annuler</button>
              <button
                onClick={handleConfirmAssign}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-lg shadow-blue-600/30 transition"
              >
                Confirmer l'Assignation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Rejet (Figma: WEB_AGT_MODAL_REJECT) */}
      {rejectTarget && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-rose-400 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-500" />
              <span>Rejet Motivé du Signalement (T5)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Conformément à la procédure CDCF V2, un motif documenté est obligatoire pour rejeter <strong>{rejectTarget.reference}</strong>.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Motif réglementaire</label>
                <select
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500"
                >
                  <option value="Photo inexploitable / floue">Photo inexploitable / floue</option>
                  <option value="Hors périmètre municipal">Hors périmètre municipal</option>
                  <option value="Doublon déjà pris en charge">Doublon déjà pris en charge par la brigade</option>
                  <option value="Signalement abusif / Non écologique">Signalement abusif / Non écologique</option>
                  <option value="Propriété privée non accessible">Propriété privée non accessible</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => setRejectTarget(null)} className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs">Annuler</button>
              <button
                onClick={handleConfirmReject}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-lg shadow-rose-600/30 transition"
              >
                Confirmer le Rejet Définitif
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
