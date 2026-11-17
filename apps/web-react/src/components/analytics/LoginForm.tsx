import { useState, type FormEvent } from 'react';
import { Button } from '../ui/Button';
import { login, LoginError, type LoginErrorKind } from './authApi';
import { useAuth } from './AuthContext';
import { ANALYTICS_STRINGS } from './strings.fr';

const S = ANALYTICS_STRINGS.login;

const ERROR_MESSAGES: Record<LoginErrorKind, string> = {
  invalid_credentials: S.errors.invalidCredentials,
  validation: S.errors.validation,
  rate_limited: S.errors.rateLimited,
  unavailable: S.errors.unavailable,
  network: S.errors.network,
  invalid_payload: S.errors.invalidPayload
};

export function LoginForm({ apiBaseUrl }: { apiBaseUrl: string }) {
  const { signIn, signOutReason } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<LoginErrorKind | null>(null);

  const reasonMessage =
    signOutReason === 'expired' ? S.sessionExpired : signOutReason === 'invalid' ? S.sessionInvalid : null;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (email.trim() === '' || password === '') {
      setError('validation');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      signIn(await login(apiBaseUrl, email.trim(), password));
    } catch (caught) {
      setError(caught instanceof LoginError ? caught.kind : 'unavailable');
      setPassword('');
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center overflow-auto p-4">
      <form
        onSubmit={onSubmit}
        noValidate
        aria-labelledby="analytics-login-title"
        className="w-full max-w-sm space-y-4 rounded-2xl border border-dark-border bg-dark-card p-6"
      >
        <div>
          <h2 id="analytics-login-title" className="text-lg font-bold text-white">
            {S.title}
          </h2>
          <p className="mt-1 text-sm text-slate-400">{S.subtitle}</p>
        </div>

        {reasonMessage && (
          <p role="status" className="rounded-lg border border-amber-600/40 bg-amber-900/20 p-3 text-sm text-amber-200">
            {reasonMessage}
          </p>
        )}

        <label className="block text-sm font-medium text-slate-200">
          {S.email}
          <input
            type="email"
            name="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 block min-h-[44px] w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </label>

        <label className="block text-sm font-medium text-slate-200">
          {S.password}
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 block min-h-[44px] w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </label>

        {error && (
          <p role="alert" className="text-sm text-red-400">
            {ERROR_MESSAGES[error]}
          </p>
        )}

        <Button type="submit" variant="primary" size="md" className="w-full" isLoading={submitting}>
          {submitting ? S.submitting : S.submit}
        </Button>
      </form>
    </div>
  );
}
