import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ReportPopupContent } from '../ReportPopupContent';
import { makeReport } from './reportBuilders';

describe('ReportPopupContent', () => {
  it('shows the photo, category, French status and creation date', () => {
    render(<ReportPopupContent report={makeReport({ status: 'EN_TRAITEMENT' })} />);
    const photo = screen.getByRole('img', { name: 'Photo du signalement : Dépôt sauvage' });
    expect(photo.getAttribute('src')).toBe('https://storage.example.test/reports/thumb-1.webp');
    expect(photo.getAttribute('loading')).toBe('lazy');
    expect(screen.getByRole('heading', { name: 'Dépôt sauvage' })).toBeTruthy();
    expect(screen.getByText('En traitement')).toBeTruthy();
    expect(screen.getByText('10 novembre 2026 à 10:30')).toBeTruthy(); // Africa/Tunis = UTC+1
  });

  it('renders the description as plain text, never as HTML', () => {
    const description = '<img src=x onerror="alert(1)"><b>gras</b>';
    const { container } = render(<ReportPopupContent report={makeReport({ description })} />);
    expect(screen.getByText(description)).toBeTruthy();
    expect(container.querySelector('b')).toBeNull();
    expect(container.querySelectorAll('img')).toHaveLength(1);
  });

  it('falls back to a placeholder when the photo fails to load', () => {
    render(<ReportPopupContent report={makeReport()} />);
    fireEvent.error(screen.getByRole('img'));
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText('Photo indisponible')).toBeTruthy();
  });

  it('shows the placeholder when there is no photo and hides an empty description', () => {
    const { container } = render(<ReportPopupContent report={makeReport({ photoUrl: null, description: null })} />);
    expect(screen.getByText('Photo indisponible')).toBeTruthy();
    expect(container.querySelectorAll('p')).toHaveLength(2); // status + date only
  });

  it('never displays reporter data', () => {
    const { container } = render(<ReportPopupContent report={makeReport()} />);
    expect(container.textContent).not.toMatch(/reporter|citoyen|@|\+216/i);
  });
});
