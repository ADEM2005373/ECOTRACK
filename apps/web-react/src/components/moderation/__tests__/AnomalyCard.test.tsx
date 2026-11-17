import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AnomalyCard, AnomalyReportData } from '../AnomalyCard';

const mockReport: AnomalyReportData = {
  id: '672f10a8b9e1a2001c45a789',
  reference: 'ECO-2026-0842',
  title: 'Dépôt sur le trottoir, passage réduit',
  description: '« Des sacs et des cartons ont été déposés contre le mur. »',
  photoUrl: '/assets/signalement-trottoir.png',
  photoDate: '02/11/2026, 09:40',
  location: {
    address: '18 rue de Marseille · Lyon 7e',
    coordinates: [45.7506, 4.8391],
    district: 'Guillotière',
  },
  source: 'Application citoyenne',
  duplicatesText: 'Aucun doublon détecté',
  hasDuplicate: false,
  receivedAt: '2 novembre 2026 à 09:42',
  status: 'NOUVEAU',
};

describe('AnomalyCard (ECO-31 / SCRUM-51)', () => {
  it('renders anomaly title, description, location and reference', () => {
    render(
      <AnomalyCard
        report={mockReport}
        zoomScale={100}
        onZoomIn={vi.fn()}
        onZoomOut={vi.fn()}
        onMaximize={vi.fn()}
      />
    );

    expect(screen.getByText('Dépôt sur le trottoir, passage réduit')).toBeDefined();
    expect(screen.getByText('« Des sacs et des cartons ont été déposés contre le mur. »')).toBeDefined();
    expect(screen.getByText('18 rue de Marseille · Lyon 7e')).toBeDefined();
    expect(screen.getByText('ECO-2026-0842')).toBeDefined();
    expect(screen.getByText('100 %')).toBeDefined();
  });

  it('triggers onZoomIn and onZoomOut callbacks', () => {
    const onZoomIn = vi.fn();
    const onZoomOut = vi.fn();
    const onMaximize = vi.fn();

    render(
      <AnomalyCard
        report={mockReport}
        zoomScale={120}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onMaximize={onMaximize}
      />
    );

    const zoomInBtn = screen.getByTitle('Zoom avant');
    fireEvent.click(zoomInBtn);
    expect(onZoomIn).toHaveBeenCalledTimes(1);

    const zoomOutBtn = screen.getByTitle('Zoom arrière');
    fireEvent.click(zoomOutBtn);
    expect(onZoomOut).toHaveBeenCalledTimes(1);

    const maxBtn = screen.getByTitle('Plein écran');
    fireEvent.click(maxBtn);
    expect(onMaximize).toHaveBeenCalledTimes(1);
  });
});
