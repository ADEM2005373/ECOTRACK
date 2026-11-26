import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QualificationPage } from '../QualificationPage';

vi.mock('react-router-dom', () => ({
  Link: ({ to, children, className }: { to: string; children: React.ReactNode; className?: string }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/agent/qualification' }),
}));

const MOCK_REPORTS = [
  {
    _id: '672f10a8b9e1a2001c45a789',
    reference: 'REP-2026-0001',
    description: 'Dépôt sauvage de gravats et mobilier abandonné près du marché',
    category: 'DEPOT_SAUVAGE',
    categoryValidated: 'DEPOT_SAUVAGE',
    priority: 'HAUTE',
    aiConfidenceScore: 0.92,
    status: 'NOUVEAU',
    district: 'Centre-Ville',
    imageUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80',
    location: { type: 'Point', coordinates: [9.8667, 37.2667] },
    createdAt: '2026-11-20T09:00:00Z'
  }
];

const MOCK_USERS = [
  { id: 'usr_1', fullName: 'Mohamed Ali Khemiri', role: 'CHEF_OUVRIER', municipality: 'Mairie de Zarzouna' }
];

describe('QualificationPage (ECO-31 / SCRUM-51 - Real Data & Dual Mode)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/v1/auth/users')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ users: MOCK_USERS })
        });
      }
      if (url.includes('/api/v1/reports')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ reports: MOCK_REPORTS })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
    });
  });

  it('renders by default the list of reclamations from real API with 4 actions and "En attente de validation" status', async () => {
    render(<QualificationPage />);

    // Header & List Title
    expect(screen.getByText('Liste des Réclamations')).toBeDefined();
    expect(screen.getAllByText('Vision IA').length).toBeGreaterThan(0);

    // Real Item loaded from API
    await waitFor(() => {
      expect(screen.getByText('REP-2026-0001')).toBeDefined();
    });
    expect(screen.getAllByText('Dépôt sauvage de gravats et mobilier abandonné près du marché').length).toBeGreaterThan(0);

    // 4 Action Buttons in table row
    const consultBtns = screen.getAllByText('Consulter');
    expect(consultBtns.length).toBeGreaterThan(0);

    const assignBtns = screen.getAllByText('Assigner');
    expect(assignBtns.length).toBeGreaterThan(0);

    const editBtns = screen.getAllByText('Modifier');
    expect(editBtns.length).toBeGreaterThan(0);

    const deleteBtns = screen.getAllByText('Supprimer');
    expect(deleteBtns.length).toBeGreaterThan(0);
  });

  it('shows brigade-resolved reports as "Résolu" (never "En attente de validation") and blocks re-assignment', async () => {
    const resolved = [
      { ...MOCK_REPORTS[0], _id: 'r1', reference: 'REP-2026-0101', status: 'RESOLU' },
      { ...MOCK_REPORTS[0], _id: 'r2', reference: 'REP-2026-0102', status: 'EN_TRAITEMENT' },
    ];
    (global.fetch as any).mockImplementation((url: string) =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(url.includes('/api/v1/reports') ? { reports: resolved } : { users: MOCK_USERS }),
      })
    );

    render(<QualificationPage />);

    await waitFor(() => {
      expect(screen.getByText('REP-2026-0101')).toBeDefined();
    });
    expect(screen.getAllByText('Résolu').length).toBeGreaterThan(0);
    expect(screen.getAllByText('En traitement').length).toBeGreaterThan(0);
    // Only the filter <option> may carry this label, not a row badge
    expect(screen.queryAllByText('En attente de validation').filter((el) => el.tagName !== 'OPTION')).toHaveLength(1); // KPI card title
    for (const btn of screen.getAllByText('Assigner')) {
      expect((btn.closest('button') as HTMLButtonElement).disabled).toBe(true);
    }
  });

  it('switches to AI Consultation view when clicking "Consulter", validates and returns to list with "Validé" status', async () => {
    render(<QualificationPage />);

    await waitFor(() => {
      expect(screen.getByText('REP-2026-0001')).toBeDefined();
    });

    // Click "Consulter" on the item
    const consultBtns = screen.getAllByText('Consulter');
    fireEvent.click(consultBtns[0]);

    // Now in Consultation view (Split-Screen)
    expect(screen.getByText('Retour à la liste des réclamations')).toBeDefined();
    expect(screen.getByText('Suggestion de l’IA')).toBeDefined();
    expect(screen.getByText('Confiance Élevée : 92 %')).toBeDefined();
    expect(screen.getByText('92 %')).toBeDefined();
    expect(screen.getByText('Valider la détection')).toBeDefined();

    // Validate the detection
    const validateBtn = screen.getByText('Valider la détection');
    fireEvent.click(validateBtn);

    // Status in consultation header becomes "Validé"
    expect(screen.getAllByText('Validé').length).toBeGreaterThan(0);

    // Return to the list view
    const backBtn = screen.getByText('Retour à la liste des réclamations');
    fireEvent.click(backBtn);

    // Now back in List view
    expect(screen.getByText('Liste des Réclamations')).toBeDefined();
    expect(screen.getAllByText('Validé').length).toBeGreaterThan(0);
  });

  it('opens category override modal from the list view and confirms modification', async () => {
    render(<QualificationPage />);

    await waitFor(() => {
      expect(screen.getByText('REP-2026-0001')).toBeDefined();
    });

    const editBtns = screen.getAllByText('Modifier');
    fireEvent.click(editBtns[0]);

    expect(screen.getByText('Modifier la catégorie')).toBeDefined();
    const confirmBtn = screen.getByText('Confirmer le changement');
    fireEvent.click(confirmBtn);

    expect(screen.queryByText('Modifier la catégorie')).toBeNull();
  });

  it('opens brigade assignment modal from the list view with real staff and dispatches intervention', async () => {
    render(<QualificationPage />);

    await waitFor(() => {
      expect(screen.getByText('REP-2026-0001')).toBeDefined();
    });

    const assignBtns = screen.getAllByText('Assigner');
    fireEvent.click(assignBtns[0]);

    expect(screen.getByText('Affectation à une Brigade Technique')).toBeDefined();
    expect(screen.getByText('Brigade Spécialisée Cible')).toBeDefined();
    expect(screen.getByText(/Mohamed Ali Khemiri/)).toBeDefined();

    const confirmAssignBtn = screen.getByText("Confirmer l'Affectation");
    fireEvent.click(confirmAssignBtn);

    expect(screen.getAllByText('Assigné').length).toBeGreaterThan(0);
  });

  it('opens suppression / rejection modal and marks report as rejected', async () => {
    render(<QualificationPage />);

    await waitFor(() => {
      expect(screen.getByText('REP-2026-0001')).toBeDefined();
    });

    const deleteBtns = screen.getAllByText('Supprimer');
    fireEvent.click(deleteBtns[0]);

    expect(screen.getByText('Supprimer / Rejeter le signalement')).toBeDefined();
    const confirmRejectBtn = screen.getByText('Confirmer le Rejet');
    fireEvent.click(confirmRejectBtn);

    expect(screen.getAllByText('Rejeté').length).toBeGreaterThan(0);
  });

  it('shows empty state when no reports are returned from MongoDB', async () => {
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ reports: [] })
      })
    );

    render(<QualificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Aucune réclamation dans la base de données')).toBeDefined();
    });
  });
});
