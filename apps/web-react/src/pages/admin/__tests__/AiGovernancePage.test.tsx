import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AiGovernancePage } from '../AiGovernancePage';

vi.mock('react-router-dom', () => ({
  Link: ({ to, children, className }: { to: string; children: React.ReactNode; className?: string }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/admin/ai-governance' }),
}));

describe('AiGovernancePage (ECO-43 / SCRUM-61)', () => {
  it('renders MLOps governance KPIs and 6x6 confusion matrix', () => {
    render(<AiGovernancePage />);

    // Header & Subtitle
    expect(screen.getByText('Observabilité MLOps & Active Learning (US-11)')).toBeDefined();
    expect(screen.getByText('ECO-43 / SCRUM-61')).toBeDefined();

    // KPIs
    expect(screen.getByText('Total Signalements Évalués')).toBeDefined();
    expect(screen.getByText('450')).toBeDefined();
    expect(screen.getByText('Validés Sans Modification')).toBeDefined();
    expect(screen.getByText('394')).toBeDefined();
    expect(screen.getByText('Corrigés par l\'Agent (Divergences)')).toBeDefined();
    expect(screen.getByText('56')).toBeDefined();

    // Rate & Threshold
    expect(screen.getAllByText('87.6 %').length).toBeGreaterThan(0);
    expect(screen.getByText('Gouvernance MLOps Conforme (CDCF V2)')).toBeDefined();

    // 6x6 Matrix Header & Categories
    expect(screen.getByText('Matrice de Confusion 6x6 (Prédit vs Réel)')).toBeDefined();
    expect(screen.getAllByText('Dépôt sauvage').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Encombrants').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Déchets verts').length).toBeGreaterThan(0);
  });

  it('displays Top 5 recurring confusions', () => {
    render(<AiGovernancePage />);

    expect(screen.getByText('Top 5 des Confusions Récurrentes')).toBeDefined();
    expect(screen.getByText('15 cas')).toBeDefined();
    expect(screen.getAllByText('11 cas').length).toBeGreaterThan(0);
    expect(screen.getAllByText('7 cas').length).toBeGreaterThan(0);
  });

  it('triggers active learning dataset export download', () => {
    render(<AiGovernancePage />);

    const exportBtn = screen.getByText('Exporter Active Learning (.json)');
    expect(exportBtn).toBeDefined();

    // Mock click
    fireEvent.click(exportBtn);

    expect(screen.getByText(/Dataset exporté avec succès/)).toBeDefined();
  });
});
