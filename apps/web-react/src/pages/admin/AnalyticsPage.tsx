import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  ShieldCheck, 
  Filter, 
  RefreshCw, 
  PieChart, 
  TrendingUp, 
  CheckCircle2, 
  Lock, 
  Sparkles,
  ArrowLeft,
  Layers,
  Clock
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface ReportOption {
  id: string;
  name: string;
  category: string;
  description: string;
  dataset: string;
}

const REPORTS: ReportOption[] = [
  {
    id: 'rpt_op_001',
    name: 'Opérationnel Municipal',
    category: 'Salubrité Urbaine',
    description: 'Cartographie des anomalies, volumétrie par statut et charge des équipes communales.',
    dataset: 'Fact_Reports & Dim_Quartier',
  },
  {
    id: 'rpt_mlops_002',
    name: 'Gouvernance IA & Concordance',
    category: 'MLOps',
    description: 'Matrice de confusion 6x6, suivi de la concordance agent/IA et détection de drift.',
    dataset: 'Fact_Reports (AI vs Human)',
  },
  {
    id: 'rpt_teams_003',
    name: 'Performance des Équipes',
    category: 'Ressources Humaines',
    description: 'Lead time moyen par ouvrier, interventions clôturées avec photo après travaux (T4).',
    dataset: 'Fact_Interventions & Dim_Ouvrier',
  },
  {
    id: 'rpt_sla_004',
    name: 'Respect des Engagements (SLA)',
    category: 'Qualité de Service',
    description: 'Taux de dépassement SLA, MTTR historique et comparatif par zone municipale.',
    dataset: 'Fact_Reports & SLA_Measures',
  },
];

const DISTRICTS = [
  'Tous Quartiers (Vue Globale)',
  'Centre-Ville',
  'El Menzah',
  'Ariana',
  'La Marsa',
  'Les Berges du Lac',
  'Carthage',
];

export default function AnalyticsPage() {
  const [selectedReportId, setSelectedReportId] = useState<string>('rpt_op_001');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Tous Quartiers (Vue Globale)');
  const [tokenStatus, setTokenStatus] = useState<'GENERATING' | 'READY' | 'REFRESHED'>('READY');
  const [tokenExpiresIn, setTokenExpiresIn] = useState<number>(3600);

  const selectedReport = REPORTS.find((r) => r.id === selectedReportId) || REPORTS[0];

  useEffect(() => {
    const timer = setInterval(() => {
      setTokenExpiresIn((prev) => (prev > 1 ? prev - 1 : 3600));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = () => {
    setTokenStatus('GENERATING');
    setTimeout(() => {
      setTokenStatus('REFRESHED');
      setTokenExpiresIn(3600);
    }, 600);
  };

  const formatMinutes = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            title="Retour à l'accueil"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-brand-600/30">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">
                Tableaux de Bord Décisionnels Power BI
              </h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ECO-42 / US-10
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Intégration Sécurisée Azure AD & Row-Level Security (RLS)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-300">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>RLS Actif : <strong>{selectedDistrict}</strong></span>
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className={`w-3.5 h-3.5 ${tokenStatus === 'GENERATING' ? 'animate-spin' : ''}`} />}
            onClick={handleRefresh}
          >
            Actualiser le Token
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 space-y-6">
        {/* Controls Bar: Report Selector & RLS District Filter */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Report Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {REPORTS.map((rpt) => (
              <button
                key={rpt.id}
                onClick={() => setSelectedReportId(rpt.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
                  selectedReportId === rpt.id
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white'
                }`}
              >
                <PieChart className="w-3.5 h-3.5" />
                {rpt.name}
              </button>
            ))}
          </div>

          {/* District RLS Selector */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs text-slate-400 whitespace-nowrap flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-brand-400" />
              Secteur RLS :
            </span>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full md:w-56"
            >
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              Total Signalements
            </span>
            <div className="text-2xl font-bold text-white mt-1">500</div>
            <span className="text-[11px] text-emerald-400">Dataset historique consolidé</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              MTTR Moyen
            </span>
            <div className="text-2xl font-bold text-white mt-1">28.4 h</div>
            <span className="text-[11px] text-slate-400">Objectif SLA &lt; 48.0 h</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Conformité SLA
            </span>
            <div className="text-2xl font-bold text-white mt-1">94.2%</div>
            <span className="text-[11px] text-emerald-400">+3.1% vs mois précédent</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Concordance IA / Humain
            </span>
            <div className="text-2xl font-bold text-white mt-1">91.8%</div>
            <span className="text-[11px] text-purple-400">F1-score 90.2% validé</span>
          </div>
        </div>

        {/* Embedded Report Container */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
          {/* Subheader with Report Info & Security State */}
          <div className="px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/50">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                {selectedReport.name}
                <span className="text-xs font-normal text-slate-400">
                  (Modèle : {selectedReport.dataset})
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">{selectedReport.description}</p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Embed Token Valide ({formatMinutes(tokenExpiresIn)})</span>
              </div>
            </div>
          </div>

          {/* Interactive Report Canvas / Iframe Simulation Container */}
          <div className="p-6 bg-slate-950/70 min-h-[520px] flex flex-col justify-between">
            {/* Visual Header of Embed */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/60">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-mono text-slate-300">
                  PowerBI Workspace: <strong>ecotrack_production</strong>
                </span>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                RLS Filter: {selectedDistrict === 'Tous Quartiers (Vue Globale)' ? 'No restriction (Admin)' : `Quartier = '${selectedDistrict}'`}
              </span>
            </div>

            {/* Dashboard Visual Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
              {/* Card 1: Breakdown by Category */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Répartition par Type</span>
                  <PieChart className="w-4 h-4 text-brand-400" />
                </h3>
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">Décharge Sauvage</span>
                    <span className="font-bold text-white">42%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[42%]"></div>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">Encombrant</span>
                    <span className="font-bold text-white">28%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full w-[28%]"></div>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">Graffiti / Végétation</span>
                    <span className="font-bold text-white">18%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full w-[18%]"></div>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">Autre / Dépôt</span>
                    <span className="font-bold text-white">12%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full w-[12%]"></div>
                  </div>
                </div>
              </div>

              {/* Card 2: Resolution Funnel */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Statuts des 500 Signalements</span>
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                </h3>
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs">
                    <span className="text-emerald-400 font-semibold">Résolus (T4 avec Photo)</span>
                    <span className="text-white font-bold">300 (60%)</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs">
                    <span className="text-blue-400 font-semibold">En Traitement / Chantier</span>
                    <span className="text-white font-bold">100 (20%)</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs">
                    <span className="text-amber-400 font-semibold">Nouveaux / À Qualifier</span>
                    <span className="text-white font-bold">75 (15%)</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs">
                    <span className="text-red-400 font-semibold">Rejetés (Doublons/Flous)</span>
                    <span className="text-white font-bold">25 (5%)</span>
                  </div>
                </div>
              </div>

              {/* Card 3: District Performance Matrix */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Indice de Salubrité par Secteur</span>
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                </h3>
                <div className="space-y-2.5 pt-2 text-xs">
                  {['Centre-Ville', 'El Menzah', 'Ariana', 'La Marsa'].map((d) => (
                    <div key={d} className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <span className="text-slate-300">{d}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400 font-bold">92/100</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                          Optimal
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Embed Footer Info */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <span className="font-mono">
                API Endpoint: <code>POST /api/bi/embed-token</code> â€¢ Azure AD Tenant: <code>msal-ecotrack-auth</code>
              </span>
              <span>PropulsÃ© par Power BI Embedded & Star Schema PostgreSQL</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
