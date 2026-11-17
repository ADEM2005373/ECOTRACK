import React from 'react';
import '@testing-library/react-native/extend-expect';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import RegisterScreen from '../RegisterScreen';
import { apiErrorStrings, registerStrings as t, validationStrings as msg } from '../../../constants/strings';
import { useAuthStore } from '../../../store/authStore';
import { colors, contrastRatio } from '../../../theme';

const mockReplace = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
jest.mock('../../../config/env', () => ({ env: { apiUrl: 'http://api.test' } }));

const fetchMock = jest.fn<Promise<Response>, Parameters<typeof fetch>>();

function fillValidForm() {
  fireEvent.changeText(screen.getByLabelText(t.fields.fullName.label), 'Karim Ben Salah');
  fireEvent.changeText(screen.getByLabelText(t.fields.email.label), 'Karim@Example.com');
  fireEvent.changeText(screen.getByLabelText(t.fields.password.label), 'Password123!');
  fireEvent.changeText(screen.getByLabelText(t.fields.phoneNumber.label), '20 123 456');
}

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock;
  mockReplace.mockReset();
  mockPush.mockReset();
  useAuthStore.getState().reset();
});

describe('RegisterScreen', () => {
  it('renders the 4 fields with the right keyboards and a masked password', () => {
    render(<RegisterScreen />);
    expect(screen.getByLabelText(t.fields.email.label)).toHaveProp('keyboardType', 'email-address');
    expect(screen.getByLabelText(t.fields.phoneNumber.label)).toHaveProp('keyboardType', 'phone-pad');
    expect(screen.getByLabelText(t.fields.password.label)).toHaveProp('secureTextEntry', true);
    expect(screen.getByLabelText(t.fields.fullName.label)).toBeOnTheScreen();
  });

  it('toggles password visibility', () => {
    render(<RegisterScreen />);
    fireEvent.press(screen.getByRole('button', { name: t.showPassword }));
    expect(screen.getByLabelText(t.fields.password.label)).toHaveProp('secureTextEntry', false);
  });

  it('shows required errors and a summary above the button without calling the API', async () => {
    render(<RegisterScreen />);
    fireEvent.press(screen.getByRole('button', { name: t.submit }));

    expect(await screen.findByText(msg.fullNameRequired)).toBeOnTheScreen();
    expect(screen.getByText(msg.emailRequired)).toBeOnTheScreen();
    expect(screen.getByText(msg.passwordRequired)).toBeOnTheScreen();
    expect(screen.getByText(msg.phoneRequired)).toBeOnTheScreen();
    expect(screen.getByText(t.formHasErrors)).toBeOnTheScreen();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends the normalized payload, shows "Compte créé !" and redirects to login', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ message: 'ok', user: null }), { status: 201 }));
    render(<RegisterScreen />);
    fillValidForm();
    fireEvent.press(screen.getByRole('button', { name: t.submit }));

    expect(await screen.findByText(t.success)).toBeOnTheScreen();
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      fullName: 'Karim Ben Salah',
      email: 'karim@example.com',
      password: 'Password123!',
      phoneNumber: '+21620123456',
    });
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/login'), { timeout: 3000 });
  });

  it('shows the ticket message when the email is already used (409)', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 409 }));
    render(<RegisterScreen />);
    fillValidForm();
    fireEvent.press(screen.getByRole('button', { name: t.submit }));

    expect(await screen.findAllByText(apiErrorStrings.emailAlreadyUsed)).toHaveLength(2);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('shows a network error when the server is unreachable', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));
    render(<RegisterScreen />);
    fillValidForm();
    fireEvent.press(screen.getByRole('button', { name: t.submit }));

    expect(await screen.findByText(apiErrorStrings.offline)).toBeOnTheScreen();
  });

  it('navigates to login from the link', () => {
    render(<RegisterScreen />);
    fireEvent.press(screen.getByRole('link', { name: t.loginLink }));
    expect(mockPush).toHaveBeenCalledWith('/login');
  });
});

describe('register screen colors (WCAG AA)', () => {
  it.each([
    ['success text on success banner', colors.feedbackText.success, colors.primarySubtle, 4.5],
    ['error text on surface', colors.feedbackText.error, colors.surface, 4.5],
    ['link text on background', colors.secondary, colors.background, 4.5],
    ['input border on surface (non-text)', colors.neutral[500], colors.surface, 3],
    ['error border on surface (non-text)', colors.danger, colors.surface, 3],
  ])('%s', (_name, fg, bg, min) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(min);
  });
});
