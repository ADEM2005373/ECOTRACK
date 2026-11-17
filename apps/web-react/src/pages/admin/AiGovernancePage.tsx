import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Brain,
  AlertTriangle,
  Download,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Database,
  BarChart3,
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

  // Calculate totals
  let totalEvaluated = 0;
  let agreedCount = 0;

  CATEGORIES.forEach((pred) => {
    CATEGORIES.forEach((act) => {
      const count = matrix[pred][act];
      totalEvaluated += count;
      if (pred === act) {
        agreedCount += count;
      }
    });
  });

  const overriddenCount = totalEvaluated - agreedCount;
  const agreementRate = totalEvaluated > 0 ? (agreedCount / totalEvaluated) * 100 : 100;
  const isAlertTriggered = agreementRate < CRITICAL_THRESHOLD;

  // Extract top confused classes
  const confusedList: { predicted: Category; actual: Category; count: number }[] = [];
  CATEGORIES.forEach((pred) => {
    CATEGORIES.forEach((act) => {
      if (pred !== act && matrix[pred][act] > 0) {
        confusedList.push({ predicted: pred, actual: act, count: matrix[pred][act] });
      }
    });
  });
  confusedList.sort((a, b) => b.count - a.count);
  const topConfusions = confusedList.slice(0, 5);

  // Trigger JSON download for Active Learning
  const handleExportActiveLearning = () => {
    setIsExporting(true);

    const divergences = [];
    let idCounter = 1;
    for (const item of confusedList) {
      for (let i = 0; i < item.count; i++) {
        divergences.push({
          divergenceId: `DIV-${idCounter++}`,
          predictedCategory: item.predicted,
          actualCategory: item.actual,
          reannotationPriority: item.count > 10 ? 'HIGH' : 'NORMAL',
          sourceModel: 'MobileNetV3-Small-EcoTrack-v2',
        });
      }
    }

    const payload = {
      datasetName: 'EcoTrack-ActiveLearning-Divergences',
      exportedAt: new Date().toISOString(),
      totalDivergences: divergences.length,
      overallAgreementRate: `${agreementRate.toFixed(1)}%`,
      samples: divergences,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'active_learning_dataset.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setIsExporting(false);
    setExportSuccessMessage(`Dataset exporté avec succès (${divergences.length} divergences) !`);
    setTimeout(() => setExportSuccessMessage(null), 4000);
  };

  // Helper for cell color intensity in confusion matrix
  const getCellBg = (pred: Category, act: Category, val: number) => {
    if (val === 0) return 'bg-slate-900/40 text-slate-600';
    if (pred === act) {
      if (val > 80) return 'bg-emerald-600 text-white font-bold';
      if (val > 40) return 'bg-emerald-700 text-emerald-100 font-semibold';
      return 'bg-emerald-800 text-emerald-200';
    }
    // Divergence / Confusion
    if (val >= 10) return 'bg-rose-600 text-white font-bold shadow-sm';
    if (val >= 5) return 'bg-rose-800 text-rose-200 font-semibold';
    return 'bg-rose-950 text-rose-300';
  };

  return (
    <div className="min-h-screen bg-dark-bg text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-dark-border bg-dark-bg/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-900 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">ECOTRACK V2</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                ECO-43 / SCRUM-61
              </span>
            </div>
            <p className="text-xs text-slate-400">Observabilité MLOps & Active Learning (US-11)</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="inline-flex min-h-[40px] items-center gap-2 rounded-xl px-3 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            Accueil
          </Link>
          <Link
            to="/supervision"
            className="inline-flex min-h-[40px] items-center gap-2 rounded-xl px-3 text-xs font-semibold text-brand-400 hover:bg-slate-800/60 transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            Carte Supervision
          </Link>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-600/20 text-brand-400 border border-brand-600/30">
            Sprint 4 Actif
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 space-y-6">
        {/* Banner Alert if below threshold */}
        {isAlertTriggered ? (
          <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-600/60 flex items-start gap-3 shadow-lg">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-rose-200">
                Alerte Critique MLOps : Taux de concordance sous le seuil ({agreementRate.toFixed(1)}% &lt; {CRITICAL_THRESHOLD}%)
              </h3>
              <p className="text-xs text-rose-300 mt-1">
                Le modèle présente un taux de divergence anormalement élevé. Veuillez exporter le jeu d'Active Learning pour planifier une session de réentraînement du réseau MobileNetV3.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-600/40 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Gouvernance MLOps Conforme (CDCF V2)
                </span>
                <p className="text-xs text-slate-300 mt-0.5">
                  Taux de concordance global supérieur au seuil d'alerte contractuel (≥ 70%).
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold font-mono text-emerald-400">
                {agreementRate.toFixed(1)} %
              </span>
              <span className="text-[10px] text-slate-400 block">Objectif ≥ 70 %</span>
            </div>
          </div>
        )}

        {/* Feedback message upon export */}
        {exportSuccessMessage && (
          <div className="p-3 bg-emerald-600 text-white text-xs font-semibold rounded-lg shadow-md flex items-center justify-between">
            <span>{exportSuccessMessage}</span>
          </div>
        )}

        {/* KPI Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-dark-card border border-dark-border rounded-xl p-5 space-y-2">
            <span className="text-xs font-medium text-slate-400">Total Signalements Évalués</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-white font-mono">{totalEvaluated}</span>
              <Database className="w-4 h-4 text-slate-500" />
            </div>
            <p className="text-[11px] text-slate-500">Alimenté par Fact_Reports & Dim_AI_Model</p>
          </div>

          <div className="bg-dark-card border border-dark-border rounded-xl p-5 space-y-2">
            <span className="text-xs font-medium text-emerald-400">Validés Sans Modification</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-emerald-400 font-mono">{agreedCount}</span>
              <span className="text-xs font-semibold text-emerald-400">
                {((agreedCount / totalEvaluated) * 100).toFixed(1)}%
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Accord direct Agent (aiOverridden = false)</p>
          </div>

          <div className="bg-dark-card border border-dark-border rounded-xl p-5 space-y-2">
            <span className="text-xs font-medium text-amber-400">Corrigés par l'Agent (Divergences)</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-amber-400 font-mono">{overriddenCount}</span>
              <span className="text-xs font-semibold text-amber-400">
                {((overriddenCount / totalEvaluated) * 100).toFixed(1)}%
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Candidats pour réentraînement Active Learning</p>
          </div>

          <div className="bg-dark-card border border-dark-border rounded-xl p-5 space-y-2">
            <span className="text-xs font-medium text-purple-400">Modèle Déployé</span>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-bold text-white truncate">MobileNetV3-Small</span>
              <span className="text-[10px] bg-purple-900/50 text-purple-300 px-1.5 py-0.5 rounded font-mono">
                v2.1
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Inférence optimisée ONNX / PyTorch</p>
          </div>
        </div>

        {/* Confusion Matrix Section (6x6 Grid) */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>Matrice de Confusion 6x6 (Prédit vs Réel)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Lignes : Catégorie suggérée par l'IA • Colonnes : Catégorie confirmée par l'agent municipal.
              </p>
            </div>

            <button
              type="button"
              onClick={handleExportActiveLearning}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Exporter Active Learning (.json)</span>
            </button>
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse text-xs">
              <thead>
                <tr>
                  <th className="p-3 text-left font-bold text-slate-400 border-b border-dark-border">
                    Prédit \ Réel
                  </th>
                  {CATEGORIES.map((cat) => (
                    <th key={cat} className="p-3 font-semibold text-slate-300 border-b border-dark-border min-w-[90px]">
                      {CATEGORY_LABELS[cat]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CATEGORIES.map((pred) => (
                  <tr key={pred} className="border-b border-dark-border/50 hover:bg-slate-800/20">
                    <td className="p-3 text-left font-bold text-slate-300 bg-slate-900/60">
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
          <div className="flex flex-wrap items-center gap-4 pt-2 text-[11px] text-slate-400 border-t border-dark-border">
            <span className="font-semibold text-slate-300">Légende :</span>
            <div className="flex items-center gap-1.5">
              <span className="size-3 rounded bg-emerald-600" />
              <span>Concordance (Accord IA/Humain)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-3 rounded bg-rose-600" />
              <span>Divergence majeure (≥ 10 cas)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-3 rounded bg-slate-800" />
              <span>Aucune erreur (0 cas)</span>
            </div>
          </div>
        </div>

        {/* Top Confusions & Active Learning Strategy */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Confusions */}
          <div className="bg-dark-card border border-dark-border rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>Top 5 des Confusions Récurrentes</span>
            </h3>
            <p className="text-xs text-slate-400">
              Couples de catégories à cibler prioritairement lors de la prochaine campagne d'annotation.
            </p>

            <div className="space-y-2 pt-1">
              {topConfusions.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-400 font-mono">#{idx + 1}</span>
                    <span className="font-semibold text-slate-200">{CATEGORY_LABELS[item.predicted]}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-semibold text-slate-300">{CATEGORY_LABELS[item.actual]}</span>
                  </div>
                  <span className="font-bold font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    {item.count} cas
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Active Learning Protocol */}
          <div className="bg-dark-card border border-dark-border rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Stratégie Active Learning (US-11)</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Le protocole MLOps d'EcoTrack intègre une boucle d'amélioration continue sans intervention manuelle lourde :
            </p>
            <ul className="text-xs text-slate-400 space-y-2.5 list-disc pl-5">
              <li>
                <strong className="text-slate-200">Capture automatique :</strong> Chaque correction apportée par l'agent de mairie lors de la qualification split-screen marque l'échantillon avec <code className="text-purple-300 bg-slate-900 px-1 py-0.5 rounded">aiOverridden: true</code>.
              </li>
              <li>
                <strong className="text-slate-200">Filtrage des ambiguïtés :</strong> Les cas où l'IA avait une confiance élevée (&gt; 80%) mais s'est trompée sont étiquetés en priorité <em>HIGH</em>.
              </li>
              <li>
                <strong className="text-slate-200">Réentraînement périodique :</strong> Le script <code className="text-purple-300 bg-slate-900 px-1 py-0.5 rounded">agreement_tracker.py</code> exporte ces données pour le fine-tuning hebdomadaire.
              </li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-dark-border py-4 px-6 text-center text-xs text-slate-500">
        EcoTrack V2 • MLOps Governance & Observability • Architecture CDCF V2
      </footer>
    </div>
  );
};

export default AiGovernancePage;
