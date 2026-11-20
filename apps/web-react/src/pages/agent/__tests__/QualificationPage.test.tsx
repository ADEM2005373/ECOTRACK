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

describe('QualificationPage (ECO-31 / SCRUM-51 - Dual Mode Table & AI Consultation)', () => {
  it('renders by default the list of reclamations with 4 actions and "En attente de validation" status', () => {
    render(<QualificationPage />);

    // Header & List Title
    expect(screen.getByText('Liste des Réclamations')).toBeDefined();
    expect(screen.getAllByText('Vision IA').length).toBeGreaterThan(0);

    // KPI Cards
    expect(screen.getByText('Total Réclamations')).toBeDefined();
    expect(screen.getAllByText('En attente de validation').length).toBeGreaterThan(0);

    // Initial item in list
    expect(screen.getByText('ECO-2026-0842')).toBeDefined();
    expect(screen.getByText('Dépôt sur le trottoir, passage réduit')).toBeDefined();

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

  it('switches to AI Consultation view when clicking "Consulter", validates and returns to list with "Validé" status', () => {
    render(<QualificationPage />);

    // Click "Consulter" on the first item
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
    // Item ECO-2026-0842 now shows "Validé" badge
    expect(screen.getAllByText('Validé').length).toBeGreaterThan(0);
  });

  it('opens category override modal from the list view and confirms modification', () => {
    render(<QualificationPage />);

    const editBtns = screen.getAllByText('Modifier');
    fireEvent.click(editBtns[0]);

    expect(screen.getByText('Modifier la catégorie')).toBeDefined();
    const confirmBtn = screen.getByText('Confirmer le changement');
    fireEvent.click(confirmBtn);

    // Toast or updated list
    expect(screen.queryByText('Modifier la catégorie')).toBeNull();
  });

  it('opens brigade assignment modal from the list view and dispatches intervention', () => {
    render(<QualificationPage />);

    const assignBtns = screen.getAllByText('Assigner');
    fireEvent.click(assignBtns[0]);

    expect(screen.getByText('Affectation à une Brigade Technique')).toBeDefined();
    expect(screen.getByText('Brigade Spécialisée Cible')).toBeDefined();

    const confirmAssignBtn = screen.getByText("Confirmer l'Affectation");
    fireEvent.click(confirmAssignBtn);

    // Status updates to "Assigné"
    expect(screen.getAllByText('Assigné').length).toBeGreaterThan(0);
  });

  it('opens suppression / rejection modal and marks report as rejected', () => {
    render(<QualificationPage />);

    const deleteBtns = screen.getAllByText('Supprimer');
    fireEvent.click(deleteBtns[0]);

    expect(screen.getByText('Supprimer / Rejeter le signalement')).toBeDefined();
    const confirmRejectBtn = screen.getByText('Confirmer le Rejet');
    fireEvent.click(confirmRejectBtn);

    // Status badge becomes Rejeté
    expect(screen.getAllByText('Rejeté').length).toBeGreaterThan(0);
  });

  it('filters reclamations by status when clicking KPI cards', () => {
    render(<QualificationPage />);

    // Click "En attente de validation" filter
    const pendingKpi = screen.getByText('À vérifier par l\'agent');
    fireEvent.click(pendingKpi);

    expect(screen.getByText('ECO-2026-0842')).toBeDefined();
  });
});
