import React, { useState } from 'react';
import {
  Wrench,
  MapPin,
  Clock,
  CheckCircle2,
  Camera,
  Play,
  Upload,
  AlertCircle
} from 'lucide-react';

interface WorkerTask {
  id: string;
  reference: string;
  title: string;
  district: string;
  address: string;
  priority: 'HAUTE' | 'MOYENNE' | 'URGENTE';
  status: 'ASSIGNE' | 'EN_COURS' | 'RESOLU';
  initialPhoto: string;
  proofPhoto?: string;
  assignedAt: string;
}

export const ChefOuvrierDashboard: React.FC = () => {
  const [tasks, setTasks] = useState<WorkerTask[]>([
    {
      id: 'tsk_1',
      reference: 'REC-2026-0842',
      title: 'Dépôt sauvage de gravats et sacs plastiques',
      district: 'Centre-Ville',
      address: '18 Rue de Marseille, Tunis',
      priority: 'URGENTE',
      status: 'ASSIGNE',
      initialPhoto: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&auto=format&fit=crop&q=60',
      assignedAt: 'Il y a 25 min'
    },
    {
      id: 'tsk_2',
      reference: 'REC-2026-0810',
      title: 'Encombrants électroménagers abandonnés sur trottoir',
      district: 'El Menzah',
      address: '45 Avenue Habib Bourguiba, Menzah 1',
      priority: 'HAUTE',
      status: 'EN_COURS',
      initialPhoto: 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?w=500&auto=format&fit=crop&q=60',
      assignedAt: 'Il y a 1h 10min'
    },
    {
      id: 'tsk_3',
      reference: 'REC-2026-0795',
      title: 'Pots de peinture usagés et solvants chimiques',
      district: 'Bab Bhar',
      address: 'Rue d\'Italie, Tunis',
      priority: 'MOYENNE',
      status: 'RESOLU',
      initialPhoto: 'https://images.unsplash.com/photo-1528323273322-d81458248d40?w=500&auto=format&fit=crop&q=60',
      proofPhoto: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=500&auto=format&fit=crop&q=60',
      assignedAt: 'Hier'
    }
  ]);

  const [activeTaskForProof, setActiveTaskForProof] = useState<WorkerTask | null>(null);
  const [uploadedProofUrl, setUploadedProofUrl] = useState<string>('');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Action : Démarrer intervention
  const handleStartJob = (taskId: string) => {
    setTasks(prev =>
      prev.map(t => t.id === taskId ? { ...t, status: 'EN_COURS' } : t)
    );
    setFeedback(`Intervention démarrée sur le chantier. Statut mis à jour : En cours de traitement.`);
    setTimeout(() => setFeedback(null), 4000);
  };

  // Action : Clôturer avec photo après travaux
  const handleCompleteJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTaskForProof) return;

    const proof = uploadedProofUrl.trim() || 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=500&auto=format&fit=crop&q=60';
    setTasks(prev =>
      prev.map(t => t.id === activeTaskForProof.id ? { ...t, status: 'RESOLU', proofPhoto: proof } : t)
    );
    setFeedback(`Mission ${activeTaskForProof.reference} résolue ! Photo de preuve validée et transmise au superviseur.`);
    setActiveTaskForProof(null);
    setUploadedProofUrl('');
    setTimeout(() => setFeedback(null), 4000);
  };

  const pendingCount = tasks.filter(t => t.status === 'ASSIGNE').length;
  const inProgressCount = tasks.filter(t => t.status === 'EN_COURS').length;
  const resolvedCount = tasks.filter(t => t.status === 'RESOLU').length;

  return (
    <div className="space-y-6">
      {/* Header Chef Ouvrier (Figma: MOB_WRK_01_ROUTE) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#0f172a] font-heading tracking-tight">
            Feuille de Route des Missions
          </h1>
          <p className="text-[13px] text-[#475569] mt-0.5">
            Brigade Voirie & Salubrité · Prise en charge des interventions terrain et clôture par preuve photographique.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-[8px] bg-white border border-[#e2e8f0] text-xs font-semibold text-[#0f172a] shadow-sm flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#059669] animate-pulse" />
            <span>GPS Camion Déployé : Équipe 04</span>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="bg-[#ecfdf5] border border-[#a7f3d0] p-4 rounded-[8px] flex items-center justify-between text-xs text-[#065f46]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#059669]" />
            <span className="font-semibold">{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-[#059669] hover:text-[#064e3b] font-bold">✕</button>
        </div>
      )}

      {/* Compteurs de Progression Journalière */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#e2e8f0] p-5 rounded-[12px] shadow-sm">
          <div className="flex items-center justify-between text-[12px] text-[#475569]">
            <span>Missions en Attente</span>
            <AlertCircle className="w-4 h-4 text-[#d97706]" />
          </div>
          <div className="text-[28px] font-bold text-[#0f172a] mt-2 font-heading">{pendingCount}</div>
          <p className="text-[11px] text-[#475569] mt-1">À prendre en charge aujourd'hui</p>
        </div>

        <div className="bg-white border border-[#e2e8f0] p-5 rounded-[12px] shadow-sm">
          <div className="flex items-center justify-between text-[12px] text-[#475569]">
            <span>Chantiers en Cours</span>
            <Clock className="w-4 h-4 text-[#2563eb]" />
          </div>
          <div className="text-[28px] font-bold text-[#0f172a] mt-2 font-heading">{inProgressCount}</div>
          <p className="text-[11px] text-[#2563eb] font-semibold mt-1">Travaux de voirie en cours</p>
        </div>

        <div className="bg-white border border-[#e2e8f0] p-5 rounded-[12px] shadow-sm">
          <div className="flex items-center justify-between text-[12px] text-[#475569]">
            <span>Clôturés & Preuve Validée</span>
            <CheckCircle2 className="w-4 h-4 text-[#059669]" />
          </div>
          <div className="text-[28px] font-bold text-[#0f172a] mt-2 font-heading">{resolvedCount}</div>
          <p className="text-[11px] text-[#059669] font-semibold mt-1">Photos après-travaux transmises</p>
        </div>
      </div>

      {/* Liste des chantiers terrain (Figma: MOB_WRK_01_ROUTE / MOB_WRK_02_JOB_DETAIL) */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-[#0f172a]">Chantiers Assignés à la Brigade</h2>

        <div className="grid grid-cols-1 gap-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-white border border-[#e2e8f0] rounded-[12px] p-5 shadow-sm hover:border-[#cbd5e1] transition flex flex-col md:flex-row gap-5 items-start md:items-center justify-between"
            >
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <img
                  src={task.initialPhoto}
                  alt="Constat initial"
                  className="w-24 h-24 rounded-[8px] object-cover border border-[#e2e8f0] shrink-0"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#1e3a8a] text-sm">{task.reference}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      task.priority === 'URGENTE' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      task.priority === 'HAUTE' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      Priorité {task.priority}
                    </span>
                    <span className="text-xs text-[#94a3b8]">• {task.assignedAt}</span>
                  </div>

                  <h3 className="text-sm font-bold text-[#0f172a]">{task.title}</h3>

                  <p className="text-xs text-[#475569] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#059669]" />
                    <span>{task.address} ({task.district})</span>
                  </p>

                  <div className="pt-1">
                    {task.status === 'ASSIGNE' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#b45309] bg-[#fffbeb] border border-[#fef3c7] px-2.5 py-0.5 rounded-[6px]">
                        <Clock className="w-3 h-3" /> Assigné (En attente de démarrage)
                      </span>
                    )}
                    {task.status === 'EN_COURS' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1d4ed8] bg-[#eff6ff] border border-[#dbeafe] px-2.5 py-0.5 rounded-[6px]">
                        <Wrench className="w-3 h-3 animate-spin" /> Intervention en cours
                      </span>
                    )}
                    {task.status === 'RESOLU' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#047857] bg-[#ecfdf5] border border-[#a7f3d0] px-2.5 py-0.5 rounded-[6px]">
                        <CheckCircle2 className="w-3 h-3" /> Chantier Clôturé avec Preuve
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions ouvrier */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-[#e2e8f0]">
                {task.status === 'ASSIGNE' && (
                  <button
                    onClick={() => handleStartJob(task.id)}
                    className="inline-flex items-center gap-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold text-xs px-4 h-[40px] rounded-[8px] transition shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Démarrer le Chantier</span>
                  </button>
                )}

                {task.status === 'EN_COURS' && (
                  <button
                    onClick={() => setActiveTaskForProof(task)}
                    className="inline-flex items-center gap-1.5 bg-[#059669] hover:bg-[#047857] text-white font-semibold text-xs px-4 h-[40px] rounded-[8px] transition shadow-sm"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Clôturer avec Preuve Photo</span>
                  </button>
                )}

                {task.status === 'RESOLU' && task.proofPhoto && (
                  <div className="flex items-center gap-2">
                    <img
                      src={task.proofPhoto}
                      alt="Preuve après travaux"
                      className="w-10 h-10 rounded-[6px] object-cover border border-[#059669]"
                      title="Preuve photographique après intervention"
                    />
                    <span className="text-xs text-[#059669] font-semibold">Preuve validée</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= MODALE FIGMA CLOTURE (MOB_WRK_03_RESOLUTION) ================= */}
      {activeTaskForProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#e2e8f0] rounded-[12px] p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
              <div className="flex items-center gap-2 text-[#059669]">
                <Camera className="w-5 h-5" />
                <h3 className="text-base font-bold text-[#0f172a]">Preuve de Résolution des Travaux</h3>
              </div>
              <button
                onClick={() => setActiveTaskForProof(null)}
                className="text-[#94a3b8] hover:text-[#0f172a]"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#475569]">
              Conformément au protocole de traçabilité, la clôture d'une mission exige la capture d'une photo des lieux nettoyés/réparés.
            </p>

            <div className="p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] text-xs space-y-1">
              <p><strong>Chantier :</strong> {activeTaskForProof.reference} — {activeTaskForProof.title}</p>
              <p><strong>Adresse :</strong> {activeTaskForProof.address}</p>
            </div>

            <form onSubmit={handleCompleteJob} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0f172a] mb-1">
                  URL ou Capture de la Photo Après Travaux
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://... (ou laissez vide pour simulation appareil photo)"
                    value={uploadedProofUrl}
                    onChange={e => setUploadedProofUrl(e.target.value)}
                    className="flex-1 bg-white border border-[#e2e8f0] rounded-[8px] p-2.5 text-xs text-[#0f172a]"
                  />
                  <button
                    type="button"
                    onClick={() => setUploadedProofUrl('https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=500&auto=format&fit=crop&q=60')}
                    className="px-3 py-2 bg-[#f1f5f9] text-[#0f172a] hover:bg-[#e2e8f0] rounded-[8px] text-xs font-semibold"
                  >
                    Photo démo
                  </button>
                </div>
              </div>

              {uploadedProofUrl && (
                <div className="space-y-1">
                  <span className="text-[11px] text-[#475569]">Aperçu de la preuve photographique :</span>
                  <img
                    src={uploadedProofUrl}
                    alt="Aperçu après"
                    className="w-full h-40 object-cover rounded-[8px] border border-[#e2e8f0]"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setActiveTaskForProof(null)}
                  className="px-4 py-2 rounded-[8px] text-xs font-semibold text-[#475569] hover:bg-[#f1f5f9]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[8px] text-xs font-semibold bg-[#059669] hover:bg-[#047857] text-white shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Confirmer la Clôture & Preuve</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
