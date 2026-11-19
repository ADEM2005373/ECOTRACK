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

        <p className="text-center text-xs text-slate-500 mt-6">
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
