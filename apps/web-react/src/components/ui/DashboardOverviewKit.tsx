import React, { useState } from 'react';
import { Calendar, RefreshCw, HelpCircle, X, CheckCircle2 } from 'lucide-react';

export interface KpiCardItem {
  id: string;
  label: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  tone: 'emerald' | 'blue' | 'amber' | 'rose' | 'indigo' | 'teal';
  sparkColor?: string;
}

const TONE_MAP: Record<KpiCardItem['tone'], { bg: string; text: string; stroke: string }> = {
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', stroke: '#10b981' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', stroke: '#3b82f6' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', stroke: '#f59e0b' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-600', stroke: '#f43f5e' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', stroke: '#6366f1' },
  teal: { bg: 'bg-teal-50', text: 'text-teal-600', stroke: '#14b8a6' },
};

export const WelcomeBanner: React.FC<{
  name: string;
  subtitle: string;
  badge?: string;
}> = ({ name, subtitle, badge }) => (
  <div className="bg-gradient-to-r from-[#eef6f4] via-[#f3f9f7] to-white border border-emerald-100 rounded-2xl px-6 py-5 flex items-center justify-between gap-4 shadow-xs">
    <div>
      {badge && (
        <span className="inline-block text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full mb-2">
          {badge}
        </span>
      )}
      <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
        Bonjour, {name} 👋
      </h1>
      <p className="text-sm text-slate-600 mt-1">{subtitle}</p>
    </div>
    <div className="hidden sm:flex items-center justify-center w-16 h-16 rounded-2xl bg-white border border-emerald-100 shadow-xs shrink-0">
      <CheckCircle2 className="w-8 h-8 text-emerald-600" />
    </div>
  </div>
);

export type PeriodPreset = '7d' | '30d' | '3m' | '1y';

export const PeriodFilterBar: React.FC<{
  preset: PeriodPreset;
  onPresetChange: (p: PeriodPreset) => void;
  onRefresh: () => void;
  loading?: boolean;
}> = ({ preset, onPresetChange, onRefresh, loading }) => {
  const presets: { id: PeriodPreset; label: string }[] = [
    { id: '7d', label: '7 jours' },
    { id: '30d', label: '30 jours' },
    { id: '3m', label: '3 mois' },
    { id: '1y', label: '1 an' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
        <Calendar className="w-4 h-4 text-emerald-600" />
        <span>Période analysée</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPresetChange(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                preset === p.id
                  ? 'bg-[#059669] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold transition shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>
    </div>
  );
};

export const CalmKpiGrid: React.FC<{ items: KpiCardItem[] }> = ({ items }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {items.map((item) => {
      const t = TONE_MAP[item.tone];
      return (
        <div
          key={item.id}
          className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between gap-3 shadow-xs hover:border-emerald-200 transition"
        >
          <div className="flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-full ${t.bg} ${t.text} flex items-center justify-center shrink-0`}>
              {item.icon}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">{item.label}</p>
              <p className="text-2xl font-bold text-slate-900 leading-tight mt-0.5">{item.value}</p>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">{item.subtitle}</p>
            </div>
          </div>
          <svg viewBox="0 0 180 20" className="w-full h-4 overflow-visible" aria-hidden="true">
            <path
              d="M0,15 L55,15 L68,5 L80,15 L180,15"
              fill="none"
              stroke={t.stroke}
              strokeOpacity="0.45"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      );
    })}
  </div>
);

export const FloatingHelpButton: React.FC<{ role?: string }> = ({ role }) => {
  const [open, setOpen] = useState(false);

  const tips =
    role === 'ADMIN_SAAS'
      ? [
          '1. Consultez les indicateurs nationaux dès l’accueil.',
          '2. Ouvrez « Mairies inscrites » pour créer ou suivre une commune.',
          '3. Utilisez « Historique des actions » pour vérifier la conformité RGPD.',
        ]
      : role === 'ADMIN_MUNICIPALITE'
      ? [
          '1. Suivez les 6 indicateurs de votre commune dès l’accueil.',
          '2. Gérez vos agents et chefs d’équipe dans « Mes équipes ».',
          '3. Consultez « Signalements & Carte » pour valider ou affecter un dossier.',
        ]
      : [
          '1. Ouvrez un nouveau signalement pour voir la photo et la localisation GPS.',
          '2. Vérifiez la proposition de l’IA (catégorie, brigade et délai).',
          '3. Cliquez sur « Valider » puis « Affecter » (ou faites-le directement sur la carte).',
        ];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold shadow-lg transition"
      >
        <HelpCircle className="w-4 h-4" />
        Besoin d&apos;aide ?
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900">Guide rapide d&apos;utilisation</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              Suivez ces 3 étapes simples pour traiter les demandes citoyennes efficacement :
            </p>
            <ul className="space-y-2 text-xs text-slate-700 bg-slate-50 rounded-xl p-3.5 border border-slate-100">
              {tips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#059669] text-white text-xs font-semibold hover:bg-[#047857]"
              >
                J&apos;ai compris
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
