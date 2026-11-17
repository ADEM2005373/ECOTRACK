import React from 'react';
import { ZoomIn, ZoomOut, Maximize2, MapPin, Calendar, Smartphone, CheckCircle, AlertTriangle } from 'lucide-react';

export interface AnomalyReportData {
  id: string;
  reference: string;
  title: string;
  description: string;
  photoUrl: string;
  photoDate: string;
  location: {
    address: string;
    coordinates: [number, number];
    district: string;
  };
  source: string;
  duplicatesText: string;
  hasDuplicate: boolean;
  receivedAt: string;
  status: 'NOUVEAU' | 'VALIDE' | 'REJETE' | 'ASSIGNE' | 'EN_TRAITEMENT' | 'RESOLU';
}

interface AnomalyCardProps {
  report: AnomalyReportData;
  zoomScale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onMaximize: () => void;
}

export const AnomalyCard: React.FC<AnomalyCardProps> = ({
  report,
  zoomScale,
  onZoomIn,
  onZoomOut,
  onMaximize,
}) => {
  return (
    <div className="flex flex-col gap-4 w-full" data-testid="anomaly-card">
      {/* 1. Visionneuse de preuve (Image Viewer + Zoom Controls) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm transition-all duration-200">
        <div className="relative h-72 sm:h-80 md:h-96 w-full bg-slate-950 flex items-center justify-center overflow-hidden group">
          <img
            src={report.photoUrl}
            alt={report.title}
            className="w-full h-full object-cover transition-transform duration-300 ease-out cursor-zoom-in"
            style={{ transform: `scale(${zoomScale / 100})` }}
            onClick={onMaximize}
          />

          {/* Quick Overlay Actions */}
          <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              type="button"
              onClick={onMaximize}
              title="Agrandir en plein écran"
              className="p-2 rounded-lg bg-slate-900/80 backdrop-blur-md text-white hover:bg-slate-900 border border-slate-700/60 shadow-lg text-xs flex items-center gap-1.5"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Plein écran</span>
            </button>
          </div>

          <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-white text-[11px] font-mono">
            {report.reference}
          </div>
        </div>

        {/* Outils photo (Figma: Outils photo) */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Calendar className="w-3.5 h-3.5" />
            <span>Photo citoyenne · {report.photoDate}</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onZoomOut}
              disabled={zoomScale <= 80}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Zoom arrière"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <span className="font-semibold text-slate-700 dark:text-slate-200 min-w-[45px] text-center font-mono">
              {zoomScale} %
            </span>

            <button
              type="button"
              onClick={onZoomIn}
              disabled={zoomScale >= 200}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Zoom avant"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />

            <button
              type="button"
              onClick={onMaximize}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              title="Plein écran"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Fiche descriptive de l'anomalie (Figma: Dépôt sur le trottoir...) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-heading">
            {report.title}
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
            {report.description}
          </p>
        </div>

        {/* Métadonnées de localisation & Source */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Localisation */}
          <div className="space-y-1">
            <span className="font-bold text-[10px] tracking-wider uppercase text-slate-400">
              Localisation
            </span>
            <div className="flex items-start gap-1.5 text-slate-800 dark:text-slate-200 font-medium">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
              <span>{report.location.address}</span>
            </div>
            <p className="text-slate-500 text-[11px] font-mono pl-5">
              {report.location.coordinates[0].toFixed(4)}, {report.location.coordinates[1].toFixed(4)} · {report.location.district}
            </p>
          </div>

          {/* Source & Doublons */}
          <div className="space-y-1">
            <span className="font-bold text-[10px] tracking-wider uppercase text-slate-400">
              Source & Détection
            </span>
            <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-medium">
              <Smartphone className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>{report.source}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              {report.hasDuplicate ? (
                <span className="text-amber-500 flex items-center gap-1 font-medium">
                  <AlertTriangle className="w-3 h-3" />
                  {report.duplicatesText}
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle className="w-3 h-3" />
                  {report.duplicatesText}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
