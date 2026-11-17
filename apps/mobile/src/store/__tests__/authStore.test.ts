import { useAuthStore } from '../authStore';
import { registerUser, type RegisterResult } from '../../services/authApi';

jest.mock('../../services/authApi', () => ({ registerUser: jest.fn() }));

const registerUserMock = jest.mocked(registerUser);

const payload = {
  fullName: 'Karim Ben Salah',
  email: 'karim@example.com',
  password: 'Password123!',
  phoneNumber: '+21620123456',
};

beforeEach(() => {
  registerUserMock.mockReset();
  useAuthStore.getState().reset();
});

describe('authStore.register', () => {
  it('stores the user returned by the API on success, never the password', async () => {
    registerUserMock.mockResolvedValueOnce({
      kind: 'success',
      user: { id: 'u1', email: payload.email, fullName: payload.fullName, phoneNumber: payload.phoneNumber, role: 'CITOYEN' },
    });

    const result = await useAuthStore.getState().register(payload);

    expect(result.kind).toBe('success');
    const state = useAuthStore.getState();
    expect(state.status).toBe('success');
    expect(state.error).toBeNull();
    expect(state.user).toEqual({
      id: 'u1',
      fullName: payload.fullName,
      email: payload.email,
      phoneNumber: payload.phoneNumber,
      role: 'CITOYEN',
    });
    expect(JSON.stringify(state)).not.toContain(payload.password);
  });

  it('falls back to the submitted data when the API returns no user', async () => {
    registerUserMock.mockResolvedValueOnce({ kind: 'success', user: null });
    await useAuthStore.getState().register(payload);
    expect(useAuthStore.getState().user).toEqual({
      id: null,
      fullName: payload.fullName,
      email: payload.email,
      phoneNumber: payload.phoneNumber,
      role: null,
    });
  });

  it.each<RegisterResult>([
    { kind: 'emailAlreadyUsed' },
    { kind: 'validationError', message: null },
    { kind: 'networkError', reason: 'timeout' },
    { kind: 'serverError', status: 500 },
  ])('records the $kind error', async (failure) => {
    registerUserMock.mockResolvedValueOnce(failure);
    await useAuthStore.getState().register(payload);
    const state = useAuthStore.getState();
    expect(state.status).toBe('error');
    expect(state.error).toEqual(failure);
    expect(state.user).toBeNull();
  });

  it('is loading during the request and ignores a double submit', async () => {
    let resolve: (value: RegisterResult) => void = () => undefined;
    registerUserMock.mockReturnValueOnce(new Promise((r) => (resolve = r)));

    const first = useAuthStore.getState().register(payload);
    const second = useAuthStore.getState().register(payload);
    expect(useAuthStore.getState().status).toBe('loading');
    expect(second).toBe(first);

    resolve({ kind: 'success', user: null });
    await first;
    expect(registerUserMock).toHaveBeenCalledTimes(1);
  });

  it('reset() returns to the initial state', async () => {
    registerUserMock.mockResolvedValueOnce({ kind: 'emailAlreadyUsed' });
    await useAuthStore.getState().register(payload);
    useAuthStore.getState().reset();
    expect(useAuthStore.getState()).toMatchObject({ status: 'idle', error: null, user: null });
  });
});
