import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../store/authStore';
import {
  Building2,
  Users,
  Tags,
  BarChart3,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  TrendingUp
} from 'lucide-react';

export const AdminMairieDashboard: React.FC = () => {
  const { state: authState } = useAuth();
  const municipality = authState.user?.municipality || 'Municipalité de Tunis';

  // Liste locale des agents & brigades (Figma: WEB_ADM_01_USERS)
  const [agents] = useState([
    { id: '1', name: 'Agent Modérateur Mairie Tunis', email: 'agent.tunis@ecotrack.tn', role: 'AGENT_MAIRIE', active: true, assignedQueue: 14 },
    { id: '2', name: 'Karim Ben Salem', email: 'chef.ouvrier@ecotrack.tn', role: 'CHEF_OUVRIER', active: true, brigade: 'Voirie Centre' },
    { id: '3', name: 'Tarek Jouini', email: 'tarek.jouini@ecotrack.tn', role: 'CHEF_OUVRIER', active: true, brigade: 'Salubrité Menzah' },
    { id: '4', name: 'Youssef Trabelsi', email: 'youssef.t@ecotrack.tn', role: 'OUVRIER', active: true, brigade: 'Espaces Publics' },
  ]);

  // Types et Seuils SLA locaux (Figma: WEB_ADM_02_CATEGORIES)
  const [categories] = useState([
    { slug: 'DEPOT_SAUVAGE', label: 'Dépôts sauvages', defaultSeverity: 'Élevée', slaHours: 24, brigade: 'Voirie & Salubrité' },
    { slug: 'ENCOMBRANTS', label: 'Objets encombrants', defaultSeverity: 'Moyenne', slaHours: 48, brigade: 'Ramassage Poids Lourd' },
    { slug: 'DECHETS_DANGEREUX', label: 'Déchets dangereux', defaultSeverity: 'Critique', slaHours: 12, brigade: 'Intervention Spéciale' },
    { slug: 'GRAFFITI', label: 'Dégradations & Graffitis', defaultSeverity: 'Faible', slaHours: 72, brigade: 'Peinture & Nettoyage' },
  ]);

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'categories'>('overview');

  return (
    <div className="space-y-6">
      {/* Header Admin Municipalité */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-white font-heading">Direction Municipale</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {municipality}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Pilotage stratégique des services urbains de la commune, suivi des délais d'intervention (SLA) et gestion des équipes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/analytics"
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-2.5 rounded-xl text-xs transition shadow-lg shadow-blue-600/30"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Power BI Local (ECO-42)</span>
          </Link>
          <Link
            to="/supervision"
            className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3.5 py-2.5 rounded-xl text-xs transition border border-slate-700"
          >
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>Carte Territoriale</span>
          </Link>
        </div>
      </div>

      {/* KPIs Stratégiques Mairie */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Taux de Résolution Municipal</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">94.2%</div>
          <div className="flex items-center gap-1 text-[10px] text-emerald-400 mt-1">
            <TrendingUp className="w-3 h-3" />
            <span>+3.8% ce mois</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Délai Moyen (Lead Time)</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">26.4 h</div>
          <p className="text-[10px] text-slate-500 mt-1">Objectif SLA &lt; 48 h respecté</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Agents & Brigades</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{agents.length} Actifs</div>
          <p className="text-[10px] text-purple-400 mt-1">1 modérateur • 3 équipes terrain</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Dépassements SLA</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">2 Alertes</div>
          <p className="text-[10px] text-amber-400 mt-1">Relances automatiques envoyées</p>
        </div>
      </div>

      {/* Tabs de Navigation Mairie */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-2 rounded-xl font-bold transition ${
            activeTab === 'overview' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          Vue Générale des Réclamations
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-3 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
            activeTab === 'users' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Agents & Brigades Municipales ({agents.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-3 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
            activeTab === 'categories' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Tags className="w-3.5 h-3.5" />
          <span>Types d'Anomalies & Seuils SLA</span>
        </button>
      </div>

      {/* Contenu selon l'onglet actif */}
      {activeTab === 'users' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">Personnel affecté à la {municipality}</h2>
              <p className="text-xs text-slate-400">Gestion des accès RBAC et composition des brigades de salubrité.</p>
            </div>
            <button className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition">
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter un Agent / Ouvrier</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Nom & Identifiant</th>
                  <th className="py-3 px-4">Rôle</th>
                  <th className="py-3 px-4">Brigade / Affectation</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {agents.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-850/40 transition">
                    <td className="py-3 px-4">
                      <p className="font-bold text-white">{a.name}</p>
                      <p className="text-[10px] text-slate-400">{a.email}</p>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-blue-400">{a.role}</td>
                    <td className="py-3 px-4 text-slate-300">{a.brigade || 'Modération Centrale Mairie'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        Actif
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button className="text-xs text-blue-400 hover:text-blue-300 font-semibold">Modifier</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">Types de Nuisances & Contrats de Service (SLA)</h2>
              <p className="text-xs text-slate-400">Délai d'intervention maximal imparti aux brigades avant déclenchement d'alerte.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Type d'Anomalie</th>
                  <th className="py-3 px-4">Sévérité Par Défaut</th>
                  <th className="py-3 px-4">Délai SLA Garanti</th>
                  <th className="py-3 px-4">Brigade Référente</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {categories.map((c) => (
                  <tr key={c.slug} className="hover:bg-slate-850/40 transition">
                    <td className="py-3 px-4 font-bold text-white">{c.label}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        {c.defaultSeverity}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">{c.slaHours} heures</td>
                    <td className="py-3 px-4 text-slate-300">{c.brigade}</td>
                    <td className="py-3 px-4 text-right">
                      <button className="text-xs text-blue-400 hover:text-blue-300 font-semibold">Ajuster SLA</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-400" />
            <span>Synthèse Opérationnelle Municipale — {municipality}</span>
          </h2>
          <p className="text-xs text-slate-400">
            Toutes les interventions de salubrité publique sur le périmètre communal sont monitorées en temps réel.
            L'algorithme MLOps catégorise automatiquement les réclamations citoyennes dès réception et alerte le chef de voirie si le délai approche 80% du SLA légal.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <h3 className="text-xs font-bold text-white mb-2">Répartition territoriale des signalements</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Centre-Ville (Avenue Bourguiba & Médina)</span>
                  <span className="font-bold text-emerald-400">42% (Résolution 96%)</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[42%]" />
                </div>

                <div className="flex justify-between text-slate-300 pt-2">
                  <span>El Menzah & Ennasr</span>
                  <span className="font-bold text-blue-400">28% (Résolution 93%)</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full w-[28%]" />
                </div>

                <div className="flex justify-between text-slate-300 pt-2">
                  <span>Les Berges du Lac</span>
                  <span className="font-bold text-purple-400">18% (Résolution 98%)</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full w-[18%]" />
                </div>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-white mb-2">Conformité RGPD & Audits</h3>
                <p className="text-[11px] text-slate-400">
                  Les données de géolocalisation citoyennes sont stockées au format RFC 7946 sans persistance des adresses IP complètes (masquage conforme ADR-05).
                </p>
              </div>
              <div className="pt-4 flex items-center justify-between text-xs">
                <span className="text-emerald-400 font-bold">✓ Audit Sécurité Validé</span>
                <Link to="/admin/analytics" className="text-blue-400 hover:text-blue-300 font-semibold">
                  Accéder aux Rapports DAX &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
