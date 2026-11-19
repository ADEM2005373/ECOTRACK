import React, { useState } from 'react';
import { FigmaLayout } from '../../components/layout/FigmaLayout';
import {
  AlertTriangle,
  Download,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Database,
  Layers,
} from 'lucide-react';

// 6 standard CDCF V2 categories
const CATEGORIES = [
  'DEPOT_SAUVAGE',
  'ENCOMBRANTS',
  'DECHETS_VERTS',
  'GRAVATS_CHANTIER',
  'GRAFFITI',
  'AUTRE',
] as const;

type Category = (typeof CATEGORIES)[number];

const CATEGORY_LABELS: Record<Category, string> = {
  DEPOT_SAUVAGE: 'Dépôt sauvage',
  ENCOMBRANTS: 'Encombrants',
  DECHETS_VERTS: 'Déchets verts',
  GRAVATS_CHANTIER: 'Gravats',
  GRAFFITI: 'Graffiti',
  AUTRE: 'Autre',
};

// Default 6x6 benchmark confusion matrix (450 evaluated samples)
const INITIAL_CONFUSION_MATRIX: Record<Category, Record<Category, number>> = {
  DEPOT_SAUVAGE: { DEPOT_SAUVAGE: 124, ENCOMBRANTS: 15, DECHETS_VERTS: 11, GRAVATS_CHANTIER: 0, GRAFFITI: 0, AUTRE: 0 },
  ENCOMBRANTS: { DEPOT_SAUVAGE: 11, ENCOMBRANTS: 99, DECHETS_VERTS: 0, GRAVATS_CHANTIER: 0, GRAFFITI: 0, AUTRE: 0 },
  DECHETS_VERTS: { DEPOT_SAUVAGE: 7, ENCOMBRANTS: 0, DECHETS_VERTS: 68, GRAVATS_CHANTIER: 0, GRAFFITI: 0, AUTRE: 0 },
  GRAVATS_CHANTIER: { DEPOT_SAUVAGE: 7, ENCOMBRANTS: 0, DECHETS_VERTS: 0, GRAVATS_CHANTIER: 43, GRAFFITI: 0, AUTRE: 0 },
  GRAFFITI: { DEPOT_SAUVAGE: 0, ENCOMBRANTS: 0, DECHETS_VERTS: 0, GRAVATS_CHANTIER: 0, GRAFFITI: 38, AUTRE: 2 },
  AUTRE: { DEPOT_SAUVAGE: 3, ENCOMBRANTS: 0, DECHETS_VERTS: 0, GRAVATS_CHANTIER: 0, GRAFFITI: 0, AUTRE: 22 },
};

const CRITICAL_THRESHOLD = 70.0;

export const AiGovernancePage: React.FC = () => {
  const [matrix] = useState<Record<Category, Record<Category, number>>>(INITIAL_CONFUSION_MATRIX);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  // Compute Total Evaluated & Agreement Rate
  let totalEvaluated = 0;
  let agreedCount = 0;
  let overriddenCount = 0;

  const topConfusions: Array<{ predicted: Category; actual: Category; count: number }> = [];

  CATEGORIES.forEach((pred) => {
    CATEGORIES.forEach((act) => {
      const count = matrix[pred][act];
      totalEvaluated += count;
      if (pred === act) {
        agreedCount += count;
      } else {
        overriddenCount += count;
        if (count > 0) {
          topConfusions.push({ predicted: pred, actual: act, count });
        }
      }
    });
  });

  topConfusions.sort((a, b) => b.count - a.count);
  topConfusions.splice(5); // Keep top 5

  const agreementRate = totalEvaluated > 0 ? (agreedCount / totalEvaluated) * 100 : 0;
  const isAlertTriggered = agreementRate < CRITICAL_THRESHOLD;

  // Handler for Active Learning JSON export
  const handleExportActiveLearning = () => {
    setIsExporting(true);
    try {
      const payload = {
        exportedAt: new Date().toISOString(),
        totalSamples: overriddenCount,
        criticalThreshold: CRITICAL_THRESHOLD,
        agreementRateObserved: Number(agreementRate.toFixed(2)),
        samples: [
          {
            reportId: 'REP-2026-0042',
            imageUri: 's3://ecotrack-reports/anomalies/2026/11/rep-0042.jpg',
            aiPrediction: 'DEPOT_SAUVAGE',
            aiConfidence: 0.88,
            humanCorrection: 'ENCOMBRANTS',
            agentRole: 'AGENT_MAIRIE',
            priority: 'HIGH_UNCERTAINTY',
          },
          {
            reportId: 'REP-2026-0089',
            imageUri: 's3://ecotrack-reports/anomalies/2026/11/rep-0089.jpg',
            aiPrediction: 'DEPOT_SAUVAGE',
            aiConfidence: 0.82,
            humanCorrection: 'DECHETS_VERTS',
            agentRole: 'AGENT_MAIRIE',
            priority: 'HIGH_UNCERTAINTY',
          },
          {
            reportId: 'REP-2026-0105',
            imageUri: 's3://ecotrack-reports/anomalies/2026/11/rep-0105.jpg',
            aiPrediction: 'GRAVATS_CHANTIER',
            aiConfidence: 0.79,
            humanCorrection: 'DEPOT_SAUVAGE',
            agentRole: 'AGENT_MAIRIE',
            priority: 'MEDIUM_UNCERTAINTY',
          },
        ],
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `active_learning_export_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportSuccessMessage(
        `Jeu d'Active Learning exporté avec succès (${payload.samples.length} échantillons labellisés prioritaires pour réentraînement).`
      );
      setTimeout(() => setExportSuccessMessage(null), 6000);
    } finally {
      setIsExporting(false);
    }
  };

  const getCellBg = (pred: Category, act: Category, val: number) => {
    if (val === 0) return 'bg-slate-50 text-slate-400';
    if (pred === act) {
      if (val >= 100) return 'bg-emerald-600 text-white font-bold shadow-sm';
      if (val >= 50) return 'bg-emerald-500 text-white font-semibold';
      return 'bg-emerald-100 text-emerald-800 font-medium';
    }
    if (val >= 10) return 'bg-rose-500 text-white font-bold shadow-sm';
    if (val >= 5) return 'bg-rose-200 text-rose-800 font-semibold';
    return 'bg-rose-50 text-rose-700';
  };

  return (
    <FigmaLayout pageSpace="Gouvernance IA" pageTitle="Observabilité MLOps & Matrice de Confusion">
      <div className="space-y-6">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[26px] font-bold text-[#0f172a] font-heading tracking-tight">
                Gouvernance IA &amp; Observabilité MLOps
              </h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-[#059669] border border-emerald-200">
                Gouvernance IA Active
              </span>
            </div>
            <p className="text-[13px] text-[#475569] mt-0.5">
              Observabilité MLOps &amp; Apprentissage Continu — Suivi de la concordance agent/modèle, détection du drift et cycle d'Active Learning MobileNetV3.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExportActiveLearning}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-4 h-[42px] rounded-lg bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-semibold shadow-sm transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exporter Active Learning (.json)</span>
            </button>
          </div>
        </div>

        {/* Banner Alert if below threshold */}
        {isAlertTriggered ? (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-rose-900">
                Alerte Critique MLOps : Taux de concordance sous le seuil ({agreementRate.toFixed(1)}% &lt; {CRITICAL_THRESHOLD}%)
              </h3>
              <p className="text-xs text-rose-700 mt-1">
                Le modèle présente un taux de divergence anormalement élevé. Veuillez exporter le jeu d'Active Learning pour planifier une session de réentraînement du réseau MobileNetV3.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#059669] shrink-0" />
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#059669]">
                  Gouvernance MLOps Conforme (CDCF V2)
                </span>
                <p className="text-xs text-[#065f46] mt-0.5">
                  Taux de concordance global supérieur au seuil d'alerte contractuel (≥ 70%).
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold font-mono text-[#059669]">
                {agreementRate.toFixed(1)} %
              </span>
              <span className="text-[10px] text-[#475569] block">Objectif ≥ 70 %</span>
            </div>
          </div>
        )}

        {/* Feedback message upon export */}
        {exportSuccessMessage && (
          <div className="p-3 bg-[#059669] text-white text-xs font-semibold rounded-lg shadow-sm flex items-center justify-between">
            <span>{exportSuccessMessage}</span>
          </div>
        )}

        {/* KPI Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 shadow-sm space-y-2">
            <span className="text-xs font-medium text-[#475569]">Total Signalements Évalués</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-[#0f172a] font-mono">{totalEvaluated}</span>
              <Database className="w-4 h-4 text-[#2563eb]" />
            </div>
            <p className="text-[11px] text-[#64748b]">Alimenté par Fact_Reports &amp; Dim_AI_Model</p>
          </div>

          <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 shadow-sm space-y-2">
            <span className="text-xs font-medium text-[#059669]">Validés Sans Modification</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-[#059669] font-mono">{agreedCount}</span>
              <span className="text-xs font-semibold text-[#059669]">
                {((agreedCount / totalEvaluated) * 100).toFixed(1)}%
              </span>
            </div>
            <p className="text-[11px] text-[#64748b]">Accord direct Agent (aiOverridden = false)</p>
          </div>

          <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 shadow-sm space-y-2">
            <span className="text-xs font-medium text-amber-600">Corrigés par l'Agent (Divergences)</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-amber-600 font-mono">{overriddenCount}</span>
              <span className="text-xs font-semibold text-amber-600">
                {((overriddenCount / totalEvaluated) * 100).toFixed(1)}%
              </span>
            </div>
            <p className="text-[11px] text-[#64748b]">Candidats pour réentraînement Active Learning</p>
          </div>

          <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 shadow-sm space-y-2">
            <span className="text-xs font-medium text-[#7c3aed]">Modèle Déployé</span>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-bold text-[#0f172a] truncate">MobileNetV3-Small</span>
              <span className="text-[10px] bg-purple-50 text-[#7c3aed] border border-purple-200 px-1.5 py-0.5 rounded font-mono font-semibold">
                v2.1
              </span>
            </div>
            <p className="text-[11px] text-[#64748b]">Inférence optimisée ONNX / PyTorch</p>
          </div>
        </div>

        {/* Confusion Matrix Section (6x6 Grid) */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[#0f172a] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#7c3aed]" />
                <span>Matrice de Confusion 6x6 (Prédit vs Réel)</span>
              </h2>
              <p className="text-xs text-[#475569] mt-1">
                Lignes : Catégorie suggérée par l'IA • Colonnes : Catégorie confirmée par l'agent municipal.
              </p>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse text-xs">
              <thead>
                <tr>
                  <th className="p-3 text-left font-bold text-[#475569] border-b border-[#e2e8f0]">
                    Prédit \ Réel
                  </th>
                  {CATEGORIES.map((cat) => (
                    <th key={cat} className="p-3 font-semibold text-[#0f172a] border-b border-[#e2e8f0] min-w-[90px]">
                      {CATEGORY_LABELS[cat]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CATEGORIES.map((pred) => (
                  <tr key={pred} className="border-b border-[#e2e8f0]/60 hover:bg-slate-50">
                    <td className="p-3 text-left font-bold text-[#0f172a] bg-slate-50">
                      {CATEGORY_LABELS[pred]}
                    </td>
                    {CATEGORIES.map((act) => {
                      const count = matrix[pred][act];
                      return (
                        <td
                          key={act}
                          className={`p-3 font-mono transition-colors ${getCellBg(pred, act, count)}`}
                        >
                          {count}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 pt-2 text-[11px] text-[#475569] border-t border-[#e2e8f0]">
            <span className="font-semibold text-[#0f172a]">Légende :</span>
            <div className="flex items-center gap-1.5">
              <span className="size-3 rounded bg-emerald-600" />
              <span>Concordance (Accord IA/Humain)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-3 rounded bg-rose-500" />
              <span>Divergence majeure (≥ 10 cas)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-3 rounded bg-slate-200" />
              <span>Aucune erreur (0 cas)</span>
            </div>
          </div>
        </div>

        {/* Top Confusions & Active Learning Strategy */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Confusions */}
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#0f172a] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-600" />
              <span>Top 5 des Confusions Récurrentes</span>
            </h3>
            <p className="text-xs text-[#475569]">
              Couples de catégories à cibler prioritairement lors de la prochaine campagne d'annotation.
            </p>

            <div className="space-y-2 pt-1">
              {topConfusions.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-[#e2e8f0] text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-600 font-mono">#{idx + 1}</span>
                    <span className="font-semibold text-[#0f172a]">{CATEGORY_LABELS[item.predicted]}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#94a3b8]" />
                    <span className="font-semibold text-[#475569]">{CATEGORY_LABELS[item.actual]}</span>
                  </div>
                  <span className="font-bold font-mono px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                    {item.count} cas
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Active Learning Protocol */}
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#0f172a] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#7c3aed]" />
              <span>Stratégie d'Apprentissage Continu (Active Learning)</span>
            </h3>
            <p className="text-xs text-[#475569] leading-relaxed">
              Le protocole MLOps d'EcoTrack intègre une boucle d'amélioration continue sans intervention manuelle lourde :
            </p>
            <ul className="text-xs text-[#475569] space-y-2.5 list-disc pl-5">
              <li>
                <strong className="text-[#0f172a]">Capture automatique :</strong> Chaque correction apportée par l'agent de mairie lors de la qualification split-screen marque l'échantillon avec <code className="text-[#7c3aed] bg-purple-50 px-1 py-0.5 rounded border border-purple-200">aiOverridden: true</code>.
              </li>
              <li>
                <strong className="text-[#0f172a]">Filtrage des ambiguïtés :</strong> Les cas où l'IA avait une confiance élevée (&gt; 80%) mais s'est trompée sont étiquetés en priorité <em>HIGH</em>.
              </li>
              <li>
                <strong className="text-[#0f172a]">Réentraînement périodique :</strong> Le script <code className="text-[#7c3aed] bg-purple-50 px-1 py-0.5 rounded border border-purple-200">agreement_tracker.py</code> exporte ces données pour le fine-tuning hebdomadaire.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </FigmaLayout>
  );
};

export default AiGovernancePage;
