import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FilterBar } from '../FilterBar';
import { NO_FILTERS } from '../filters';

function renderBar(filters = NO_FILTERS) {
  const onChange = vi.fn();
  const onReset = vi.fn();
  render(
    <FilterBar categories={['DEPOT_SAUVAGE', 'ENCOMBRANTS']} filters={filters} onChange={onChange} onReset={onReset} />,
  );
  return { onChange, onReset };
}

describe('FilterBar', () => {
  it('has labelled category, status and urgency controls', () => {
    renderBar();
    expect(screen.getByLabelText('Catégorie')).toBeTruthy();
    expect(screen.getByLabelText('Statut de traitement')).toBeTruthy();
    expect(screen.getByLabelText('Niveau d’urgence')).toBeTruthy();
  });

  it('builds category options from the data with French labels', () => {
    renderBar();
    const options = Array.from(screen.getByLabelText<HTMLSelectElement>('Catégorie').options).map((o) => o.text);
    expect(options).toEqual(['Toutes', 'Dépôt sauvage', 'Encombrants']);
  });

  it('lists the 7 statuses with French labels', () => {
    renderBar();
    expect(screen.getByLabelText<HTMLSelectElement>('Statut de traitement').options).toHaveLength(8);
    expect(screen.getByRole('option', { name: 'Rejeté' })).toBeTruthy();
  });

  it('emits the new filters on change', () => {
    const { onChange } = renderBar();
    fireEvent.change(screen.getByLabelText('Catégorie'), { target: { value: 'ENCOMBRANTS' } });
    expect(onChange).toHaveBeenLastCalledWith({ category: 'ENCOMBRANTS', status: null });
    fireEvent.change(screen.getByLabelText('Statut de traitement'), { target: { value: 'RESOLU' } });
    expect(onChange).toHaveBeenLastCalledWith({ category: null, status: 'RESOLU' });
  });

  it('keeps the urgency filter disabled and explains why', () => {
    renderBar();
    const urgency = screen.getByLabelText<HTMLSelectElement>('Niveau d’urgence');
    expect(urgency.disabled).toBe(true);
    expect(urgency.getAttribute('aria-describedby')).toBeTruthy();
    expect(screen.getByText(/ne fournit pas encore de niveau d’urgence/)).toBeTruthy();
  });

  it('enables reset only when a filter is active', () => {
    renderBar();
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Réinitialiser les filtres' }).disabled).toBe(true);
  });

  it('calls onReset', () => {
    const { onReset } = renderBar({ category: 'ENCOMBRANTS', status: null });
    fireEvent.click(screen.getByRole('button', { name: 'Réinitialiser les filtres' }));
    expect(onReset).toHaveBeenCalledOnce();
  });
});
