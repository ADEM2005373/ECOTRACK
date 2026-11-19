import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../services/authApi';
import { useAuth } from '../store/authStore';
import { Leaf, Lock, Mail } from 'lucide-react';

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
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center items-center p-6 antialiased">
      <div className="bg-white border border-[#e2e8f0] p-8 rounded-[16px] w-full max-w-md shadow-xl">
        {/* Figma Brand Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-12 h-12 rounded-[10px] bg-[#059669] flex items-center justify-center text-white shadow-md shadow-emerald-600/20 mb-3">
            <Leaf className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-[#0f172a] font-heading tracking-tight">ECOTRACK</h1>
          <p className="text-[11px] font-semibold tracking-[2px] text-[#059669] uppercase mt-0.5">CONSOLE V2</p>
          <p className="text-xs text-[#64748b] mt-2">Portail métropolitain de salubrité & gestion urbaine</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#0f172a] mb-1">Adresse E-mail</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="email" 
                placeholder="nom@ecotrack.tn" 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-white border border-[#cbd5e1] rounded-[8px] pl-9 pr-3.5 py-2.5 text-[#0f172a] focus:border-[#059669] focus:outline-none text-sm transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0f172a] mb-1">Mot de passe</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white border border-[#cbd5e1] rounded-[8px] pl-9 pr-3.5 py-2.5 text-[#0f172a] focus:border-[#059669] focus:outline-none text-sm transition"
              />
            </div>
          </div>

          {error && (
            <p className="text-rose-600 text-xs bg-rose-50 border border-rose-200 p-2.5 rounded-[8px] leading-snug">
              {error}
            </p>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#059669] hover:bg-[#047857] disabled:opacity-50 text-white font-semibold py-2.5 rounded-[8px] transition shadow-sm text-sm"
          >
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>

        {/* Compte racine officiel Admin SaaS */}
        <div className="mt-6 pt-5 border-t border-[#e2e8f0]">
          <p className="text-[11px] font-semibold text-[#64748b] mb-2 uppercase tracking-wider text-center">
            Compte Administrateur SaaS Racine
          </p>
          <div>
            <button
              type="button"
              onClick={() => { setEmail('admin@ecotrack.tn'); setPassword('Admin2026!'); }}
              className="w-full text-left p-3 rounded-[8px] bg-emerald-50/60 border border-emerald-200 hover:bg-emerald-100/60 transition text-[#0f172a] flex items-center justify-between"
            >
              <div>
                <span className="font-bold text-emerald-800 text-xs block">👑 Administrateur SaaS Global</span>
                <span className="text-[11px] text-emerald-600">admin@ecotrack.tn (Superviseur racine)</span>
              </div>
              <span className="text-[10px] font-semibold bg-[#059669] text-white px-2 py-0.5 rounded">Remplir</span>
            </button>
          </div>
          <p className="text-[11px] text-[#64748b] mt-2.5 text-center leading-tight">
            Base épurée : L'administrateur SaaS dispose des droits complets pour créer les nouvelles municipalités et leurs équipes.
          </p>
        </div>

        <p className="text-center text-xs text-[#64748b] mt-5">
          Nouveau citoyen ou agent ?{' '}
          <Link to="/register" className="text-[#059669] hover:text-[#047857] font-semibold transition">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
