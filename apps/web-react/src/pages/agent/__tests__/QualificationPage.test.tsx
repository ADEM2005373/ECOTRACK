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
    expect(screen.getByText('Valider (T1)')).toBeDefined();
    expect(screen.getByText('Modifier')).toBeDefined();
    expect(screen.getByText('Rejeter (T5)')).toBeDefined();

    // Dispatch button is initially locked
    expect(screen.getByText('Valider pour affecter')).toBeDefined();
  });

  it('validates the report (T1) and unlocks the dispatch button', () => {
    render(<QualificationPage />);

    const validateBtn = screen.getByText('Valider (T1)');
    fireEvent.click(validateBtn);

    // Status updates to Validé (T1)
    expect(screen.getByText('Validé (T1)')).toBeDefined();

    // Dispatch button unlocks to "Affecter à une équipe (T2)"
    expect(screen.getByText('Affecter à une équipe (T2)')).toBeDefined();
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

  it('opens rejection modal (T5) and allows rejecting with a reason', () => {
    render(<QualificationPage />);

    const rejectBtn = screen.getByText('Rejeter (T5)');
    fireEvent.click(rejectBtn);

    expect(screen.getByText('Rejeter le signalement (T5)')).toBeDefined();
    expect(screen.getByText('Confirmer le Rejet (T5)')).toBeDefined();

    const confirmRejectBtn = screen.getByText('Confirmer le Rejet (T5)');
    fireEvent.click(confirmRejectBtn);

    // Status badge becomes Rejeté (T5)
    expect(screen.getByText('Rejeté (T5)')).toBeDefined();
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
