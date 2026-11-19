import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, User, Phone, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { registerUser } from '../services/authApi';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successName, setSuccessName] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!fullName.trim()) {
      setErrorMessage('Le nom complet est obligatoire.');
      return;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setErrorMessage('Veuillez saisir une adresse e-mail valide.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Le mot de passe doit comporter au moins 8 caractères.');
      return;
    }

    setIsLoading(true);
    const result = await registerUser(fullName.trim(), email.trim(), password, phoneNumber.trim() || undefined);
    setIsLoading(false);

    switch (result.kind) {
      case 'success':
        setSuccessName(result.user?.fullName ?? fullName.trim());
        setTimeout(() => navigate('/login'), 2000);
        break;
      case 'emailTaken':
        setErrorMessage('Un compte existe déjà avec cette adresse e-mail.');
        break;
      case 'validationError':
        setErrorMessage(result.message);
        break;
      case 'networkError':
        setErrorMessage('Erreur réseau. Vérifiez votre connexion et réessayez.');
        break;
      case 'serverError':
        setErrorMessage("Erreur serveur. Veuillez réessayer ultérieurement.");
        break;
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-slate-100 flex flex-col items-center justify-center px-4 py-10">
      {/* Logo + Title */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-600 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-4">
          <ShieldCheck className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight font-heading">ECOTRACK V2</h1>
        <p className="text-sm text-slate-400 mt-1">Direction Générale de la Salubrité Urbaine &amp; Voirie</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-dark-card border border-dark-border rounded-2xl shadow-2xl shadow-black/40 p-8">
        {successName ? (
          <div className="flex flex-col items-center text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Compte créé !</h3>
              <p className="text-sm text-slate-300 mt-1">
                Bienvenue, <span className="font-semibold text-white">{successName}</span>.<br />
                Redirection vers la connexion…
              </p>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-bold text-white mb-1">Inscription</h2>
            <p className="text-xs text-slate-400 mb-6">Créez votre compte citoyen EcoTrack.</p>

            {errorMessage && (
              <div className="mb-4 p-3 text-xs rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Nom complet *</label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Karim Ben Salah"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 pl-10 text-white focus:border-emerald-500 focus:outline-none w-full text-sm placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Adresse e-mail *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="karim@ville.tn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 pl-10 text-white focus:border-emerald-500 focus:outline-none w-full text-sm placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Mot de passe * (≥ 8 car.)</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 pl-10 pr-11 text-white focus:border-emerald-500 focus:outline-none w-full text-sm placeholder-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-200 transition"
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Phone (optional) */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Téléphone (optionnel)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type="tel"
                    placeholder="+216 20 123 456"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 pl-10 text-white focus:border-emerald-500 focus:outline-none w-full text-sm placeholder-slate-500"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                icon={<ShieldCheck className="w-4 h-4" />}
                className="w-full mt-2"
              >
                Créer mon compte
              </Button>
            </form>

            <p className="text-center text-xs text-slate-500 mt-6">
              Déjà un compte ?{' '}
              <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-semibold transition">
                Se connecter
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
