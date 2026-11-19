import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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

describe('QualificationPage (ECO-31 / SCRUM-51)', () => {
  it('renders the split-screen view with title, AI suggestion and confidence badge', () => {
    render(<QualificationPage />);

    // Header & Title
    expect(screen.getByText('Qualification du signalement')).toBeDefined();
    expect(screen.getByText('Suggestion de l’IA')).toBeDefined();

    // AI Confidence badge (92% => Confiance Élevée)
    expect(screen.getByText('Confiance Élevée : 92 %')).toBeDefined();
    expect(screen.getByText('92 %')).toBeDefined();

    // Suggested category
    expect(screen.getByText('Dépôt sauvage')).toBeDefined();

    // 3 Action Buttons
    expect(screen.getByText('Valider la détection')).toBeDefined();
    expect(screen.getByText('Modifier')).toBeDefined();
    expect(screen.getByText('Rejeter l\'anomalie')).toBeDefined();

    // Dispatch button is initially locked
    expect(screen.getByText('Valider pour affecter')).toBeDefined();
  });

  it('validates the report and unlocks the dispatch button', () => {
    render(<QualificationPage />);

    const validateBtn = screen.getByText('Valider la détection');
    fireEvent.click(validateBtn);

    // Status updates to Validé
    expect(screen.getByText('Validé')).toBeDefined();

    // Dispatch button unlocks to "Affecter à une brigade"
    expect(screen.getByText('Affecter à une brigade')).toBeDefined();
  });

  it('opens category override modal and allows changing the category', () => {
    render(<QualificationPage />);

    const overrideBtn = screen.getByText('Modifier');
    fireEvent.click(overrideBtn);

    expect(screen.getByText('Modifier la catégorie')).toBeDefined();
    const confirmBtn = screen.getByText('Confirmer le changement');
    fireEvent.click(confirmBtn);

    // Badge showing it was overridden by agent
    expect(screen.getByText('Corrigé par l’agent')).toBeDefined();
  });

  it('opens rejection modal and allows rejecting with a reason', () => {
    render(<QualificationPage />);

    const rejectBtn = screen.getByText('Rejeter l\'anomalie');
    fireEvent.click(rejectBtn);

    expect(screen.getByText('Rejeter le signalement')).toBeDefined();
    expect(screen.getByText('Confirmer le Rejet')).toBeDefined();

    const confirmRejectBtn = screen.getByText('Confirmer le Rejet');
    fireEvent.click(confirmRejectBtn);

    // Status badge becomes Rejeté
    expect(screen.getByText('Rejeté')).toBeDefined();
  });

  it('navigates through queue items with Next and Previous buttons', () => {
    render(<QualificationPage />);

    expect(screen.getAllByText('ECO-2026-0842').length).toBeGreaterThan(0);

    const nextBtn = screen.getByTitle('Signalement suivant');
    fireEvent.click(nextBtn);

    // Next item in queue (ECO-2026-0843 with confidence 74% => À vérifier)
    expect(screen.getAllByText('ECO-2026-0843').length).toBeGreaterThan(0);
    expect(screen.getByText('À vérifier : 74 %')).toBeDefined();
  });
});
