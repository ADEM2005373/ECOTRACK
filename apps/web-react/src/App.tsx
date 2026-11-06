import React, { useState } from 'react';
import { Button } from './components/ui/Button';
import { 
  ShieldCheck, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Sparkles, 
  Layers,
  MapPin,
  Clock
} from 'lucide-react';

export default function App() {
  const [loading, setLoading] = useState(false);

  const simulateAction = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1200);
  };

  return (
    <div className="min-h-screen bg-dark-bg text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-dark-border bg-dark-bg/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-sapphire-900 flex items-center justify-center text-white shadow-lg shadow-brand-600/30">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">ECOTRACK V2</h1>
            <p className="text-xs text-slate-400">Supervision Web — React 18 + Vite + Tailwind</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-600/20 text-brand-400 border border-brand-600/30">
            Sprint 0 — Socles Prêts
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-6 space-y-8">
        {/* Hero Section */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-sapphire-900/30 border border-sapphire-900/50 text-xs text-blue-300">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Palette HEX CDCF V2 & Design Tokens Intégrés</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
              Socle Frontend React + Tailwind CSS
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl">
              Ce composant valide le ticket <strong>SCRUM-41 (ECO-04)</strong> avec la palette officielle :
              vert primaire <code className="text-brand-400 bg-slate-900 px-1.5 py-0.5 rounded">#059669</code> et
              bleu saphir secondaire <code className="text-blue-400 bg-slate-900 px-1.5 py-0.5 rounded">#1E3A8A</code>.
            </p>
          </div>
        </div>

        {/* Atomic Button Component Showcase */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-400" />
              <span>Composant Atomique &lt;Button /&gt; (Variants & États)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Conformité stricte aux exigences de la charte CDCF V2.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {/* Primary Variant */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-400">Variant: Primary</span>
                <span className="text-[11px] font-mono text-slate-500">#059669</span>
              </div>
              <p className="text-xs text-slate-300">Action principale, validation de signalement, soumission.</p>
              <Button 
                variant="primary" 
                size="md" 
                className="w-full"
                icon={<CheckCircle2 className="w-4 h-4" />}
                onClick={simulateAction}
                isLoading={loading}
              >
                Valider Signalement (T1)
              </Button>
            </div>

            {/* Secondary Variant */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Variant: Secondary</span>
                <span className="text-[11px] font-mono text-slate-500">#1E3A8A</span>
              </div>
              <p className="text-xs text-slate-300">Action institutionnelle, assignation d'équipe de voirie.</p>
              <Button 
                variant="secondary" 
                size="md" 
                className="w-full"
                icon={<ArrowRight className="w-4 h-4" />}
                onClick={simulateAction}
                isLoading={loading}
              >
                Assigner Équipe (T2)
              </Button>
            </div>

            {/* Destructive Variant */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-red-400">Variant: Destructive</span>
                <span className="text-[11px] font-mono text-slate-500">#DC2626</span>
              </div>
              <p className="text-xs text-slate-300">Rejet d'un signalement non conforme ou doublon.</p>
              <Button 
                variant="destructive" 
                size="md" 
                className="w-full"
                icon={<Trash2 className="w-4 h-4" />}
                onClick={simulateAction}
                isLoading={loading}
              >
                Rejeter Signalement (T5)
              </Button>
            </div>
          </div>

          {/* Button Sizes Showcase */}
          <div className="pt-4 border-t border-dark-border flex flex-wrap items-center gap-3">
            <span className="text-xs text-slate-400 mr-2">Tailles atomiques :</span>
            <Button variant="primary" size="sm">Small (sm)</Button>
            <Button variant="primary" size="md">Medium (md)</Button>
            <Button variant="primary" size="lg">Large (lg)</Button>
            <Button variant="outline" size="sm">Outline</Button>
            <Button variant="ghost" size="sm">Ghost</Button>
          </div>
        </div>

        {/* Feature Cards Showcase */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-dark-card border border-dark-border rounded-xl p-4 flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-brand-600/10 text-brand-400 border border-brand-600/20">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Cartographie 2dsphere</h4>
              <p className="text-xs text-slate-400 mt-1">Prête pour l'intégration de Leaflet et du split-screen d'agent.</p>
            </div>
          </div>

          <div className="bg-dark-card border border-dark-border rounded-xl p-4 flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-sapphire-900/20 text-blue-400 border border-sapphire-900/30">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">SLA & Lead Time</h4>
              <p className="text-xs text-slate-400 mt-1">Calculs d'indicateurs MTTR connectés à l'entrepôt décisionnel.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-dark-border py-4 px-6 text-center text-xs text-slate-500">
        EcoTrack V2 • Architecture Monorepo Nx • Tous droits réservés
      </footer>
    </div>
  );
}
