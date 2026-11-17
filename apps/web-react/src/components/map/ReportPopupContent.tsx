import { useState } from 'react';
import { STATUS_STYLES } from './markerStyle';
import { categoryLabel, formatReportDate, MAP_STRINGS, STATUS_LABELS } from './strings.fr';
import type { MapReport } from './types';

/**
 * Popup of a marker. Everything is rendered as React text (escaped): the
 * description is never injected as HTML. No reporter data exists in MapReport.
 */
export function ReportPopupContent({ report }: { report: MapReport }) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const label = categoryLabel(report.category);
  const { fill, text, glyph } = STATUS_STYLES[report.status];

  return (
    <article className="w-60 space-y-2 font-sans text-slate-900">
      {report.photoUrl && !photoFailed ? (
        <img
          src={report.photoUrl}
          alt={MAP_STRINGS.popupPhotoAlt(label)}
          loading="lazy"
          className="h-32 w-full rounded-md bg-slate-200 object-cover"
          onError={() => setPhotoFailed(true)}
        />
      ) : (
        <div className="flex h-20 w-full items-center justify-center rounded-md bg-slate-200 text-xs text-slate-700">
          {MAP_STRINGS.popupNoPhoto}
        </div>
      )}
      <h3 className="text-sm font-bold">{label}</h3>
      <p className="flex items-center gap-2 text-xs">
        <span className="font-semibold">{MAP_STRINGS.popupStatus} :</span>
        <span className="eco-marker eco-marker--legend" aria-hidden="true" style={{ backgroundColor: fill, color: text }}>
          {glyph}
        </span>
        <span>{STATUS_LABELS[report.status]}</span>
      </p>
      {report.description && (
        <p className="whitespace-pre-line break-words text-xs text-slate-700">{report.description}</p>
      )}
      <p className="text-xs text-slate-700">
        {MAP_STRINGS.popupCreatedAt}{' '}
        <time dateTime={report.createdAt.toISOString()}>{formatReportDate(report.createdAt)}</time>
      </p>
    </article>
  );
}
