import { registerUser, REGISTER_PATH } from '../authApi';
import { env } from '../../config/env';

jest.mock('../../config/env', () => ({ env: { apiUrl: 'http://api.test/' } }));

const payload = {
  fullName: 'Karim Ben Salah',
  email: 'karim@example.com',
  password: 'Password123!',
  phoneNumber: '+21620123456',
};

const fetchMock = jest.fn<Promise<Response>, Parameters<typeof fetch>>();

function reply(status: number, body?: unknown) {
  const text = body === undefined ? '' : typeof body === 'string' ? body : JSON.stringify(body);
  fetchMock.mockResolvedValueOnce(new Response(text, { status }));
}

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock;
  (env as { apiUrl: string }).apiUrl = 'http://api.test/';
});

describe('registerUser', () => {
  it('POSTs the exact JSON body to the register route', async () => {
    reply(201, { message: 'Compte créé avec succès', user: { id: 'u1', ...payload, password: undefined } });
    await registerUser(payload);

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(`http://api.test${REGISTER_PATH}`);
    expect(init?.method).toBe('POST');
    expect(init?.headers).toMatchObject({ 'Content-Type': 'application/json' });
    expect(JSON.parse(String(init?.body))).toEqual(payload);
    expect(Object.keys(JSON.parse(String(init?.body)))).toEqual([
      'fullName',
      'email',
      'password',
      'phoneNumber',
    ]);
  });

  it('maps 201 with the identity-api body to success with the user', async () => {
    reply(201, {
      message: 'Compte créé avec succès',
      user: { id: 'u1', email: payload.email, fullName: payload.fullName, phoneNumber: payload.phoneNumber, role: 'CITOYEN' },
    });
    await expect(registerUser(payload)).resolves.toEqual({
      kind: 'success',
      user: { id: 'u1', email: payload.email, fullName: payload.fullName, phoneNumber: payload.phoneNumber, role: 'CITOYEN' },
    });
  });

  it('maps 201 with an empty or unexpected body to success without user', async () => {
    reply(201);
    await expect(registerUser(payload)).resolves.toEqual({ kind: 'success', user: null });
    reply(201, 'not json');
    await expect(registerUser(payload)).resolves.toEqual({ kind: 'success', user: null });
  });

  it('maps 409 to emailAlreadyUsed', async () => {
    reply(409, { error: 'EMAIL_ALREADY_EXISTS', message: 'Un compte existe déjà avec cette adresse e-mail.' });
    await expect(registerUser(payload)).resolves.toEqual({ kind: 'emailAlreadyUsed' });
  });

  it('keeps server VALIDATION_ERROR messages and hides other 400 messages', async () => {
    reply(400, { error: 'VALIDATION_ERROR', message: 'Une adresse e-mail valide est obligatoire.' });
    await expect(registerUser(payload)).resolves.toEqual({
      kind: 'validationError',
      message: 'Une adresse e-mail valide est obligatoire.',
    });
    reply(400, { error: 'BAD_REQUEST', message: 'User validation failed: internal detail' });
    await expect(registerUser(payload)).resolves.toEqual({ kind: 'validationError', message: null });
  });

  it('maps 422 with an empty body to validationError', async () => {
    reply(422);
    await expect(registerUser(payload)).resolves.toEqual({ kind: 'validationError', message: null });
  });

  it('maps 5xx and unexpected statuses to serverError', async () => {
    reply(503);
    await expect(registerUser(payload)).resolves.toEqual({ kind: 'serverError', status: 503 });
    reply(404, '<html>Not found</html>');
    await expect(registerUser(payload)).resolves.toEqual({ kind: 'serverError', status: 404 });
  });

  it('maps a fetch failure to networkError offline', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));
    await expect(registerUser(payload)).resolves.toEqual({ kind: 'networkError', reason: 'offline' });
  });

  it('aborts after the timeout and maps it to networkError timeout', async () => {
    fetchMock.mockImplementationOnce(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new Error('Aborted')));
        }),
    );
    await expect(registerUser(payload, { timeoutMs: 20 })).resolves.toEqual({
      kind: 'networkError',
      reason: 'timeout',
    });
  });

  it('does not call fetch when EXPO_PUBLIC_API_URL is missing', async () => {
    (env as { apiUrl: string }).apiUrl = '';
    await expect(registerUser(payload)).resolves.toEqual({ kind: 'networkError', reason: 'notConfigured' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
