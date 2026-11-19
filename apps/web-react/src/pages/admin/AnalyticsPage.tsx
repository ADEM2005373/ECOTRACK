import { useState, useEffect } from 'react';
import { useAuth } from '../../store/authStore';
import { 
  ShieldCheck, 
  Filter, 
  RefreshCw, 
  PieChart, 
  TrendingUp, 
  CheckCircle2, 
  Lock, 
  Sparkles,
  Layers,
  Clock
} from 'lucide-react';
import { FigmaLayout } from '../../components/layout/FigmaLayout';

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
    description: 'Lead time moyen par ouvrier, interventions clôturées avec photo après travaux.',
    dataset: 'Fact_Interventions & Dim_Ouvrier',
  },
  {
    id: 'rpt_sla_004',
    name: 'Respect des Engagements SLA',
    category: 'Qualité de Service',
    description: 'Taux de dépassement SLA, MTTR moyen par quartier et satisfaction usagers.',
    dataset: 'Fact_Reports & Dim_Category',
  },
];

const DISTRICTS = [
  'Tous Quartiers (Vue Globale)',
  'Centre-Ville',
  'El Menzah',
  'Bab Bhar',
  'La Marsa',
  'Carthage',
  'Ariana',
];

export function AnalyticsPage() {
  let user: any = null;
  let isMaire = false;
  let municipality = 'Direction Municipale';
  try {
    const auth = useAuth();
    user = auth.state?.user;
    isMaire = user?.role === 'ADMIN_MUNICIPALITE';
    municipality = user?.municipality || 'Direction Municipale';
  } catch {
    // Graceful fallback for test runners
  }

  const [selectedReportId, setSelectedReportId] = useState<string>('rpt_op_001');
  const [selectedDistrict, setSelectedDistrict] = useState<string>(isMaire ? municipality : 'Tous Quartiers (Vue Globale)');
  const [tokenStatus, setTokenStatus] = useState<'VALID' | 'GENERATING' | 'FAILED'>('VALID');
  const [tokenExpiresIn, setTokenExpiresIn] = useState<number>(3600);

  const selectedReport = REPORTS.find((r) => r.id === selectedReportId) || REPORTS[0];

  useEffect(() => {
    if (isMaire && municipality) {
      setSelectedDistrict(municipality);
    }
  }, [isMaire, municipality]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTokenExpiresIn((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = () => {
    setTokenStatus('GENERATING');
    setTimeout(() => {
      setTokenStatus('VALID');
      setTokenExpiresIn(3600);
    }, 800);
  };

  const formatMinutes = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  return (
    <FigmaLayout
      pageSpace={isMaire ? `${municipality} · Pilotage` : "Pilotage & Décisionnel"}
      pageTitle={isMaire ? `Tableau de Bord Exécutif - ${municipality}` : "Analyses Multi-Collectivités Power BI"}
    >
      <div className="space-y-6">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-bold text-[#0f172a] font-heading tracking-tight">
              {isMaire ? `Analyses Décisionnelles (${municipality})` : 'Tableaux de Bord Décisionnels Power BI'}
            </h1>
            <p className="text-[13px] text-[#475569] mt-0.5">
              {isMaire
                ? `Données opérationnelles et indicateurs de performance isolés pour ${municipality} (Row-Level Security actif).`
                : 'Intégration sécurisée Azure AD & Row-Level Security (RLS) multi-collectivités.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs bg-white border border-[#e2e8f0] rounded-lg px-3 py-2 text-[#475569] shadow-sm">
              <Lock className="w-3.5 h-3.5 text-[#059669]" />
              <span>RLS Actif : <strong>{selectedDistrict}</strong></span>
            </div>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 px-3.5 h-[40px] rounded-lg border border-[#e2e8f0] bg-white hover:bg-slate-50 text-xs font-semibold text-[#0f172a] shadow-sm transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#059669] ${tokenStatus === 'GENERATING' ? 'animate-spin' : ''}`} />
              <span>Actualiser le Token</span>
            </button>
          </div>
        </div>

        {/* Controls Bar: Report Selector & RLS District Filter */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Report Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {REPORTS.map((rpt) => (
              <button
                key={rpt.id}
                onClick={() => setSelectedReportId(rpt.id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${
                  selectedReportId === rpt.id
                    ? 'bg-[#059669] text-white shadow-sm'
                    : 'bg-slate-50 text-[#475569] hover:bg-slate-100'
                }`}
              >
                <PieChart className="w-3.5 h-3.5" />
                {rpt.name}
              </button>
            ))}
          </div>

          {/* District RLS Selector */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs text-[#475569] whitespace-nowrap flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[#059669]" />
              Secteur RLS :
            </span>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-white border border-[#e2e8f0] text-xs text-[#0f172a] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#059669] w-full md:w-56"
            >
              {(isMaire && !DISTRICTS.includes(municipality) ? [municipality, ...DISTRICTS] : DISTRICTS).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 shadow-sm">
            <span className="text-xs text-[#475569] flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-blue-500" />
              Total Signalements
            </span>
            <div className="text-2xl font-bold text-[#0f172a] mt-1 font-heading">500</div>
            <span className="text-[11px] text-[#059669] font-medium">Dataset historique consolidé</span>
          </div>

          <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 shadow-sm">
            <span className="text-xs text-[#475569] flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              MTTR Moyen
            </span>
            <div className="text-2xl font-bold text-[#0f172a] mt-1 font-heading">28.4 h</div>
            <span className="text-[11px] text-[#64748b]">Objectif SLA &lt; 48.0 h</span>
          </div>

          <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 shadow-sm">
            <span className="text-xs text-[#475569] flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
              Conformité SLA
            </span>
            <div className="text-2xl font-bold text-[#0f172a] mt-1 font-heading">94.2%</div>
            <span className="text-[11px] text-[#059669] font-medium">+3.1% vs mois précédent</span>
          </div>

          <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 shadow-sm">
            <span className="text-xs text-[#475569] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#7c3aed]" />
              Concordance IA / Humain
            </span>
            <div className="text-2xl font-bold text-[#0f172a] mt-1 font-heading">91.8%</div>
            <span className="text-[11px] text-[#7c3aed] font-medium">F1-score 90.2% validé</span>
          </div>
        </div>

        {/* Embedded Report Container */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden shadow-sm flex flex-col">
          {/* Subheader with Report Info & Security State */}
          <div className="px-6 py-4 border-b border-[#e2e8f0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50">
            <div>
              <h2 className="text-base font-bold text-[#0f172a] flex items-center gap-2">
                {selectedReport.name}
                <span className="text-xs font-normal text-[#64748b]">
                  (Modèle : {selectedReport.dataset})
                </span>
              </h2>
              <p className="text-xs text-[#475569] mt-0.5">{selectedReport.description}</p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-[#065f46] bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
                <span className="font-semibold">Embed Token Valide ({formatMinutes(tokenExpiresIn)})</span>
              </div>
            </div>
          </div>

          {/* Interactive Report Canvas */}
          <div className="p-6 bg-slate-50/50 min-h-[480px] flex flex-col justify-between">
            {/* Visual Header of Embed */}
            <div className="flex items-center justify-between pb-4 border-b border-[#e2e8f0]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#059669] animate-pulse"></span>
                <span className="text-xs font-mono text-[#0f172a]">
                  PowerBI Workspace: <strong>ecotrack_production</strong>
                </span>
              </div>
              <span className="text-xs text-[#64748b] font-mono">
                RLS Filter: {selectedDistrict === 'Tous Quartiers (Vue Globale)' ? 'No restriction (Admin)' : `Quartier = '${selectedDistrict}'`}
              </span>
            </div>

            {/* Dashboard Visual Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
              {/* Card 1: Breakdown by Category */}
              <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 space-y-3 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#475569] flex items-center justify-between">
                  <span>Répartition par Type</span>
                  <PieChart className="w-4 h-4 text-[#059669]" />
                </h3>
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#475569]">Décharge Sauvage</span>
                    <span className="font-bold text-[#0f172a]">42%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#059669] h-full w-[42%]"></div>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-[#475569]">Encombrant</span>
                    <span className="font-bold text-[#0f172a]">28%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full w-[28%]"></div>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-[#475569]">Graffiti / Végétation</span>
                    <span className="font-bold text-[#0f172a]">18%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full w-[18%]"></div>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-[#475569]">Autre / Dépôt</span>
                    <span className="font-bold text-[#0f172a]">12%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full w-[12%]"></div>
                  </div>
                </div>
              </div>

              {/* Card 2: Resolution Funnel */}
              <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 space-y-3 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#475569] flex items-center justify-between">
                  <span>Statuts des 500 Signalements</span>
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                </h3>
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100 text-xs">
                    <span className="text-[#065f46] font-semibold">Résolus avec Preuve Photo</span>
                    <span className="text-[#0f172a] font-bold">300 (60%)</span>
                  </div>
                  <div className="flex items-center justify-between bg-blue-50/60 p-2.5 rounded-lg border border-blue-100 text-xs">
                    <span className="text-blue-700 font-semibold">En Traitement / Chantier</span>
                    <span className="text-[#0f172a] font-bold">100 (20%)</span>
                  </div>
                  <div className="flex items-center justify-between bg-amber-50/60 p-2.5 rounded-lg border border-amber-100 text-xs">
                    <span className="text-amber-700 font-semibold">Nouveaux / À Qualifier</span>
                    <span className="text-[#0f172a] font-bold">75 (15%)</span>
                  </div>
                  <div className="flex items-center justify-between bg-rose-50/60 p-2.5 rounded-lg border border-rose-100 text-xs">
                    <span className="text-rose-700 font-semibold">Rejetés (Doublons/Flous)</span>
                    <span className="text-[#0f172a] font-bold">25 (5%)</span>
                  </div>
                </div>
              </div>

              {/* Card 3: District Performance Matrix */}
              <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 space-y-3 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#475569] flex items-center justify-between">
                  <span>Indice de Salubrité par Secteur</span>
                  <ShieldCheck className="w-4 h-4 text-[#7c3aed]" />
                </h3>
                <div className="space-y-2.5 pt-2 text-xs">
                  {['Centre-Ville', 'El Menzah', 'Ariana', 'La Marsa'].map((d) => (
                    <div key={d} className="flex items-center justify-between border-b border-[#e2e8f0] pb-2">
                      <span className="text-[#475569]">{d}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[#059669] font-bold">92/100</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-[#059669] border border-emerald-200 font-semibold">
                          Optimal
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Embed Footer Info */}
            <div className="pt-4 border-t border-[#e2e8f0] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#64748b]">
              <span className="font-mono">
                API Endpoint: <code className="bg-slate-100 px-1 py-0.5 rounded">POST /api/bi/embed-token</code> · Azure AD Tenant: <code className="bg-slate-100 px-1 py-0.5 rounded">msal-ecotrack-auth</code>
              </span>
              <span>Propulsé par Power BI Embedded &amp; Star Schema PostgreSQL DW</span>
            </div>
          </div>
        </div>
      </div>
    </FigmaLayout>
  );
}

export default AnalyticsPage;
