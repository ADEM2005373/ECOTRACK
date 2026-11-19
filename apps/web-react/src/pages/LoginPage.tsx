import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../services/authApi';
import { useAuth } from '../store/authStore';
import { ShieldCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginSuccess } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Veuillez renseigner tous les champs.');
      return;
    }
    setLoading(true);
    const result = await loginUser(email, password);
    setLoading(false);
    if (result.kind === 'success') {
      loginSuccess(result.user, result.accessToken);
      navigate('/');
    } else if (result.kind === 'invalidCredentials') {
      setError('Adresse e-mail ou mot de passe incorrect.');
    } else {
      setError('Impossible de joindre le service d\'authentification.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white font-heading">ECOTRACK V2</h1>
        </div>

        <h2 className="text-lg font-bold text-white mb-1 text-center">Connexion</h2>
        <p className="text-xs text-slate-400 mb-6 text-center">Portail de supervision & gestion urbaine</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">E-mail</label>
            <input 
              type="email" 
              placeholder="agent@ecotrack.tn" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Mot de passe</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:outline-none text-sm"
            />
          </div>

          {error && <p className="text-rose-400 text-xs bg-rose-950/40 border border-rose-800/60 p-2.5 rounded-lg">{error}</p>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-emerald-600/20 text-sm"
          >
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>

        {/* Sélecteur rapide de profil démo (5 rôles officiels) */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <p className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wider text-center">
            Comptes démo préconfigurés (5 Rôles)
          </p>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => { setEmail('admin@ecotrack.tn'); setPassword('Admin2026!'); }}
              className="text-left px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-purple-500/50 hover:bg-purple-950/20 transition text-slate-300"
            >
              <span className="font-bold text-purple-400 block">👑 Admin SaaS</span>
              <span className="text-[10px] text-slate-500">Supervision Globale</span>
            </button>
            <button
              type="button"
              onClick={() => { setEmail('mairie.tunis@ecotrack.tn'); setPassword('Mairie2026!'); }}
              className="text-left px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-blue-500/50 hover:bg-blue-950/20 transition text-slate-300"
            >
              <span className="font-bold text-blue-400 block">🏛️ Admin Mairie</span>
              <span className="text-[10px] text-slate-500">Mairie de Tunis</span>
            </button>
            <button
              type="button"
              onClick={() => { setEmail('agent.tunis@ecotrack.tn'); setPassword('Agent2026!'); }}
              className="text-left px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-950/20 transition text-slate-300"
            >
              <span className="font-bold text-emerald-400 block">📋 Agent Mairie</span>
              <span className="text-[10px] text-slate-500">Qualification & Alertes</span>
            </button>
            <button
              type="button"
              onClick={() => { setEmail('chef.ouvrier@ecotrack.tn'); setPassword('Ouvrier2026!'); }}
              className="text-left px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-amber-500/50 hover:bg-amber-950/20 transition text-slate-300"
            >
              <span className="font-bold text-amber-400 block">👷 Chef Ouvrier</span>
              <span className="text-[10px] text-slate-500">Terrain & Preuve Photo</span>
            </button>
            <button
              type="button"
              onClick={() => { setEmail('citoyen@ecotrack.tn'); setPassword('Citoyen2026!'); }}
              className="col-span-2 text-left px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-teal-500/50 hover:bg-teal-950/20 transition text-slate-300"
            >
              <span className="font-bold text-teal-400 block">📱 Citoyen (Mobile / Web)</span>
              <span className="text-[10px] text-slate-500">Signalements & Réclamations</span>
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-5">
          Nouveau citoyen ou agent ?{' '}
          <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-semibold transition">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
