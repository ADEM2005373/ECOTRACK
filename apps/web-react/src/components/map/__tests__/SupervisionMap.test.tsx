import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SupervisionMap } from '../SupervisionMap';
import { makeApiReport } from './reportBuilders';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const API_REPORTS = [
  makeApiReport({ id: 'r1', category: 'DEPOT_SAUVAGE', status: 'NOUVEAU' }),
  makeApiReport({ id: 'r2', category: 'ENCOMBRANTS', status: 'RESOLU', location: { type: 'Point', coordinates: [10.76, 34.7406] } }),
  makeApiReport({ id: 'r3', category: 'DEPOT_SAUVAGE', status: 'EN_TRAITEMENT', location: { type: 'Point', coordinates: [10.8575, 33.8076] } }),
  makeApiReport({ id: 'r4', location: { type: 'Point', coordinates: [] } }),
];

const markers = (container: HTMLElement) => container.querySelectorAll('.leaflet-marker-icon');

beforeEach(() => {
  vi.stubEnv('VITE_API_BASE_URL', '/api/v1');
  vi.stubEnv('VITE_MAP_TILE_URL', 'https://tiles.example.test/{z}/{x}/{y}.png');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('SupervisionMap', () => {
  it('shows a configuration error when the environment is missing', () => {
    vi.stubEnv('VITE_API_BASE_URL', '');
    render(<SupervisionMap />);
    expect(screen.getByRole('alert').textContent).toContain('VITE_API_BASE_URL');
  });

  it('shows markers and the count, then filters instantly without a new request', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(API_REPORTS));
    vi.stubGlobal('fetch', fetchMock);
    const { container } = render(<SupervisionMap />);

    expect(screen.getByText('Chargement des signalements…')).toBeTruthy();
    await screen.findByText(/3 signalements affichés sur 3/);
    expect(screen.getByText(/1 signalement ignoré/)).toBeTruthy();
    expect(markers(container)).toHaveLength(3);
    expect(container.querySelector('.leaflet-marker-icon[title="Dépôt sauvage — En traitement"]')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Catégorie'), { target: { value: 'DEPOT_SAUVAGE' } });
    expect(markers(container)).toHaveLength(2);
    expect(screen.getByText(/2 signalements affichés sur 3/)).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Statut de traitement'), { target: { value: 'RESOLU' } });
    expect(markers(container)).toHaveLength(0);
    expect(screen.getByText('Aucun signalement ne correspond aux filtres sélectionnés.')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Réinitialiser les filtres' }));
    expect(markers(container)).toHaveLength(3);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('shows the empty state when the API returns no report', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse([])));
    render(<SupervisionMap />);
    expect(await screen.findByText('Aucun signalement à afficher pour le moment.')).toBeTruthy();
  });

  it('shows the error state (e.g. HTTP 501) and retries on demand', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: 'NOT_IMPLEMENTED' }, 501))
      .mockResolvedValueOnce(jsonResponse(API_REPORTS));
    vi.stubGlobal('fetch', fetchMock);
    const { container } = render(<SupervisionMap />);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('HTTP 501');
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));

    await waitFor(() => expect(markers(container)).toHaveLength(3));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('explains a 401/403 response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, 401)));
    render(<SupervisionMap />);
    expect((await screen.findByRole('alert')).textContent).toContain('connexion');
  });

  it('cancels the request on unmount', () => {
    let signal: AbortSignal | undefined;
    vi.stubGlobal('fetch', vi.fn().mockImplementation((_url: string, init: RequestInit) => {
      signal = init.signal ?? undefined;
      return new Promise(() => undefined);
    }));
    const { unmount } = render(<SupervisionMap />);
    unmount();
    expect(signal?.aborted).toBe(true);
  });
});
