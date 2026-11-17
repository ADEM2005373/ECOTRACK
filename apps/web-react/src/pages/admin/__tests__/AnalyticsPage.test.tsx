import { useEffect, type ReactNode } from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { models } from 'powerbi-client';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import AnalyticsPage from '../AnalyticsPage';

interface FakeEmbedProps {
  embedConfig: { type: string; id: string; embedUrl: string; accessToken: string; tokenType: number };
  cssClassName?: string;
  getEmbeddedComponent?: (embedded: unknown) => void;
}

const mocks = vi.hoisted(() => ({
  embedProps: [] as unknown[],
  setAccessToken: null as unknown as ReturnType<typeof vi.fn>,
  iframe: null as HTMLIFrameElement | null
}));

// The real component talks to app.powerbi.com: replaced by a container that hands back a fake report.
vi.mock('powerbi-client-react', () => ({
  PowerBIEmbed: (props: FakeEmbedProps) => {
    mocks.embedProps.push(props);
    useEffect(() => {
      mocks.iframe = document.createElement('iframe');
      props.getEmbeddedComponent?.({ iframe: mocks.iframe, setAccessToken: mocks.setAccessToken });
    }, []); // embedded once per mount, like the real component
    return <div data-testid="powerbi-embed" className={props.cssClassName} />;
  }
}));

// Same convention as QualificationPage.test.tsx: the router is not under test.
vi.mock('react-router-dom', () => ({
  Link: ({ to, children, ...rest }: { to: string; children: ReactNode }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  )
}));

const USER_TOKEN ='header.user-jwt-payload.signature';
const EMBED_TOKEN = 'H4sIAAAA-embed-token-1';
const EMBED_TOKEN_2 = 'H4sIAAAA-embed-token-2';
const EMBED_URL = 'https://app.powerbi.com/reportEmbed?reportId=r-op&groupId=g1';
const MINUTE = 60_000;

type EmbedReply = { status: number; body: unknown } | 'network';

let fetchSpy: MockInstance<typeof fetch>;
let embedReplies: EmbedReply[];
let consoleSpies: MockInstance[];
let loginExpiresIn: number;
/** When set, embed-token replies wait for it: lets a test observe the loading state. */
let embedGate: Promise<void> | null;

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function embedOk(token = EMBED_TOKEN, lifetimeMs = 60 * MINUTE): EmbedReply {
  return {
    status: 200,
    body: { reportId: 'r-op', embedUrl: EMBED_URL, accessToken: token, expiresAt: new Date(Date.now() + lifetimeMs).toISOString() }
  };
}

function embedCalls(): string[] {
  return fetchSpy.mock.calls.map(([url]) => String(url)).filter((url) => url.includes('/bi/embed-token'));
}

function renderPage() {
  return render(<AnalyticsPage />);
}

async function signIn() {
  fireEvent.change(screen.getByLabelText('Adresse e-mail'), { target: { value: 'admin@ecotrack.test' } });
  fireEvent.change(screen.getByLabelText('Mot de passe'), { target: { value: 'correct-password' } });
  fireEvent.click(screen.getByRole('button', { name: 'Se connecter' }));
  await screen.findByRole('tablist', { name: 'Rapports décisionnels' });
}

beforeEach(() => {
  vi.stubEnv('VITE_API_BASE_URL', '/api/v1');
  mocks.embedProps.length = 0;
  mocks.setAccessToken = vi.fn().mockResolvedValue(undefined);
  mocks.iframe = null;
  embedReplies = [];
  loginExpiresIn = 900;
  embedGate = null;
  consoleSpies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((method) => vi.spyOn(console, method));
  fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = String(input);
    if (url === '/api/v1/auth/login') {
      const { password } = JSON.parse(String(init?.body));
      return password === 'correct-password'
        ? json(200, {
            accessToken: USER_TOKEN,
            refreshToken: 'refresh-token-never-kept',
            expiresIn: loginExpiresIn,
            tokenType: 'Bearer',
            user: { id: 'u1', email: 'admin@ecotrack.test', fullName: 'Admin Test', role: 'ADMIN' }
          })
        : json(401, { error: 'UNAUTHORIZED' });
    }
    if (url.startsWith('/api/v1/bi/embed-token')) {
      await embedGate;
      const reply = embedReplies.shift() ?? embedOk();
      if (reply === 'network') {
        throw new TypeError('Failed to fetch');
      }
      return json(reply.status, reply.body);
    }
    throw new Error(`unexpected fetch ${url}`);
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('AnalyticsPage — login', () => {
  it('shows the admin login first and requests no report', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Connexion administrateur' })).toBeTruthy();
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(embedCalls()).toHaveLength(0);
  });

  it('shows an error for invalid credentials', async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText('Adresse e-mail'), { target: { value: 'admin@ecotrack.test' } });
    fireEvent.change(screen.getByLabelText('Mot de passe'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: 'Se connecter' }));
    expect((await screen.findByRole('alert')).textContent).toBe('Identifiants invalides.');
    expect((screen.getByLabelText('Mot de passe') as HTMLInputElement).value).toBe('');
  });

  it('requires both fields before calling the API', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Se connecter' }));
    expect(screen.getByRole('alert').textContent).toBe('L’adresse e-mail et le mot de passe sont obligatoires.');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns to the login with a message when the 15-minute session expires', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderPage();
    await signIn();
    await screen.findByTestId('powerbi-embed');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15 * MINUTE);
    });
    expect(screen.getByRole('heading', { name: 'Connexion administrateur' })).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe('Votre session a expiré (15 minutes). Veuillez vous reconnecter.');
    expect(screen.queryByTestId('powerbi-embed')).toBeNull();
  });

  it('signs out on demand', async () => {
    renderPage();
    await signIn();
    fireEvent.click(screen.getByRole('button', { name: 'Se déconnecter' }));
    expect(screen.getByRole('heading', { name: 'Connexion administrateur' })).toBeTruthy();
  });
});

describe('AnalyticsPage — embed', () => {
  it('shows loading, then embeds the report with an Embed token', async () => {
    let release = () => undefined as void;
    embedGate = new Promise<void>((resolve) => {
      release = resolve;
    });
    renderPage();
    await signIn();
    expect((await screen.findByRole('status')).textContent).toBe('Chargement du rapport…');
    expect(screen.queryByTestId('powerbi-embed')).toBeNull();
    release();
    await screen.findByTestId('powerbi-embed');

    expect(embedCalls()).toEqual(['/api/v1/bi/embed-token?report=operationnel']);
    const [, init] = fetchSpy.mock.calls.find(([url]) => String(url).includes('/bi/'))!;
    expect((init?.headers as Record<string, string>).Authorization).toBe(`Bearer ${USER_TOKEN}`);
    expect(mocks.embedProps.at(-1)).toMatchObject({
      cssClassName: 'analytics-embed',
      embedConfig: {
        type: 'report',
        id: 'r-op',
        embedUrl: EMBED_URL,
        accessToken: EMBED_TOKEN,
        tokenType: models.TokenType.Embed
      }
    });
    expect(mocks.iframe?.title).toBe('Rapport Power BI : Opérationnel');
    const panel = screen.getByRole('tabpanel');
    expect(panel.getAttribute('aria-labelledby')).toBe('analytics-tab-operationnel');
  });

  it('never shows or logs a token and stores nothing in the browser', async () => {
    renderPage();
    await signIn();
    await screen.findByTestId('powerbi-embed');
    const text = document.body.textContent ?? '';
    const html = document.body.innerHTML;
    for (const secret of [USER_TOKEN, EMBED_TOKEN, 'refresh-token-never-kept', 'correct-password']) {
      expect(text).not.toContain(secret);
      expect(html).not.toContain(secret);
    }
    const logged = JSON.stringify(consoleSpies.map((spy) => spy.mock.calls));
    expect(logged).not.toContain(USER_TOKEN);
    expect(logged).not.toContain(EMBED_TOKEN);
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
    expect(window.location.href).not.toContain(USER_TOKEN);
  });
});

describe('AnalyticsPage — tabs', () => {
  it('shows the 4 official reports with French labels', async () => {
    renderPage();
    await signIn();
    const tabs = within(screen.getByRole('tablist')).getAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent)).toEqual(['Opérationnel', 'MLOps', 'Performance Équipes', 'SLA']);
    expect(tabs.map((tab) => tab.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false', 'false']);
    expect(tabs.map((tab) => tab.tabIndex)).toEqual([0, -1, -1, -1]);
  });

  it('requests the matching report key when a tab is clicked', async () => {
    renderPage();
    await signIn();
    await screen.findByTestId('powerbi-embed');
    fireEvent.click(screen.getByRole('tab', { name: 'SLA' }));
    await waitFor(() => expect(embedCalls()).toContain('/api/v1/bi/embed-token?report=sla'));
    expect(screen.getByRole('tab', { name: 'SLA' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tabpanel').getAttribute('aria-labelledby')).toBe('analytics-tab-sla');
  });

  it('moves between tabs with the keyboard', async () => {
    renderPage();
    await signIn();
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Opérationnel' }), { key: 'ArrowRight' });
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'MLOps' }));
    await waitFor(() => expect(embedCalls()).toContain('/api/v1/bi/embed-token?report=mlops'));
    fireEvent.keyDown(screen.getByRole('tab', { name: 'MLOps' }), { key: 'End' });
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'SLA' }));
    fireEvent.keyDown(screen.getByRole('tab', { name: 'SLA' }), { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: 'Opérationnel' }).getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Opérationnel' }), { key: 'ArrowLeft' });
    expect(screen.getByRole('tab', { name: 'SLA' }).getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(screen.getByRole('tab', { name: 'SLA' }), { key: 'Home' });
    expect(screen.getByRole('tab', { name: 'Opérationnel' }).getAttribute('aria-selected')).toBe('true');
  });
});

describe('AnalyticsPage — states', () => {
  it.each([
    [{ status: 403, body: { error: 'FORBIDDEN' } }, 'Accès refusé : votre rôle ne permet pas de consulter ce rapport.'],
    [{ status: 502, body: { error: 'POWERBI_UNAVAILABLE' } }, 'Le service Power BI est momentanément indisponible. Réessayez dans quelques instants.'],
    [{ status: 504, body: { error: 'UPSTREAM_TIMEOUT' } }, 'Le service Power BI est momentanément indisponible. Réessayez dans quelques instants.'],
    ['network' as const, 'Impossible de joindre le serveur. Vérifiez votre connexion réseau.']
  ])('shows an error with Retry for %j, and Retry reloads the report', async (reply, message) => {
    embedReplies = [reply];
    renderPage();
    await signIn();
    expect((await screen.findByRole('alert')).textContent).toBe(message);
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    await screen.findByTestId('powerbi-embed');
    expect(embedCalls()).toHaveLength(2);
  });

  it('shows "rapport non configuré" without a Retry button', async () => {
    embedReplies = [{ status: 503, body: { error: 'REPORT_NOT_CONFIGURED' } }];
    renderPage();
    await signIn();
    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toBe(
        'Rapport non configuré : il n’est pas encore publié pour ce portail.'
      )
    );
    expect(screen.queryByRole('button', { name: 'Réessayer' })).toBeNull();
  });

  it('asks to sign in again on 401 and goes back to the login', async () => {
    embedReplies = [{ status: 401, body: { error: 'UNAUTHORIZED' } }];
    renderPage();
    await signIn();
    expect((await screen.findByRole('alert')).textContent).toBe('Connexion requise : votre session n’est plus valide.');
    fireEvent.click(screen.getByRole('button', { name: 'Se reconnecter' }));
    expect(screen.getByRole('heading', { name: 'Connexion administrateur' })).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe('Votre session n’est plus valide. Veuillez vous reconnecter.');
  });
});

describe('AnalyticsPage — embed token refresh', () => {
  beforeEach(() => {
    loginExpiresIn = 4 * 60 * 60;
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  it('refreshes the token in place 10 minutes before expiry, without re-embedding', async () => {
    embedReplies = [embedOk(EMBED_TOKEN, 60 * MINUTE), embedOk(EMBED_TOKEN_2, 60 * MINUTE)];
    renderPage();
    await signIn();
    await screen.findByTestId('powerbi-embed');
    const embedsBefore = mocks.embedProps.length;

    await act(async () => {
      await vi.advanceTimersByTimeAsync(49 * MINUTE);
    });
    expect(embedCalls()).toHaveLength(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2 * MINUTE);
    });
    expect(embedCalls()).toHaveLength(2);
    expect(mocks.setAccessToken).toHaveBeenCalledWith(EMBED_TOKEN_2);
    expect(mocks.embedProps.slice(embedsBefore).every((props) => (props as FakeEmbedProps).embedConfig.accessToken === EMBED_TOKEN)).toBe(true);
  });

  it('refreshes when the browser tab becomes visible again after the refresh time', async () => {
    renderPage();
    await signIn();
    await screen.findByTestId('powerbi-embed');
    vi.setSystemTime(Date.now() + 55 * MINUTE);
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
      await Promise.resolve();
    });
    await waitFor(() => expect(embedCalls()).toHaveLength(2));
  });

  it('does not refresh on visibility before the refresh time', async () => {
    renderPage();
    await signIn();
    await screen.findByTestId('powerbi-embed');
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
      await Promise.resolve();
    });
    expect(embedCalls()).toHaveLength(1);
  });

  it('clears the refresh timer and the listener on unmount', async () => {
    const view = renderPage();
    await signIn();
    await screen.findByTestId('powerbi-embed');
    view.unmount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(120 * MINUTE);
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(embedCalls()).toHaveLength(1);
    expect(mocks.setAccessToken).not.toHaveBeenCalled();
  });

  it('retries a failed refresh while the token is still valid', async () => {
    embedReplies = [embedOk(EMBED_TOKEN, 60 * MINUTE), { status: 502, body: { error: 'POWERBI_UNAVAILABLE' } }, embedOk(EMBED_TOKEN_2)];
    renderPage();
    await signIn();
    await screen.findByTestId('powerbi-embed');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50 * MINUTE + 1_000);
    });
    expect(embedCalls()).toHaveLength(2);
    expect(screen.getByTestId('powerbi-embed')).toBeTruthy();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(embedCalls()).toHaveLength(3);
    expect(mocks.setAccessToken).toHaveBeenCalledWith(EMBED_TOKEN_2);
  });
});
