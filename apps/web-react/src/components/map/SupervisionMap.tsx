import { useMemo, useState, type ReactNode } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import './supervisionMap.css';
import { Button } from '../ui/Button';
import { readMapConfig, type MapConfig } from './config';
import { FilterBar } from './FilterBar';
import { categoryOptions, filterReports, NO_FILTERS, type ReportFilters } from './filters';
import { CITY_CENTER, INITIAL_ZOOM } from './geo';
import { MapLegend } from './MapLegend';
import { statusIcon } from './markerStyle';
import { ReportPopupContent } from './ReportPopupContent';
import type { ReportsApiError } from './reportsApi';
import { categoryLabel, MAP_STRINGS, OSM_ATTRIBUTION, STATUS_LABELS } from './strings.fr';
import type { MapReport } from './types';
import { useReports } from './useReports';

const NO_REPORTS: MapReport[] = [];

function errorMessage(error: ReportsApiError): string {
  switch (error.kind) {
    case 'unauthorized':
      return MAP_STRINGS.errorUnauthorized;
    case 'unavailable':
      return MAP_STRINGS.errorUnavailable(error.httpStatus);
    case 'network':
      return MAP_STRINGS.errorNetwork;
    case 'invalid_payload':
      return MAP_STRINGS.errorInvalidPayload;
  }
}

/** Supervision map of all urban reports (SCRUM-59 / US-07). */
export function SupervisionMap() {
  const configResult = useMemo(() => readMapConfig(import.meta.env), []);
  if (!configResult.ok) {
    return (
      <div role="alert" className="rounded-2xl border border-red-500/40 bg-red-950/40 p-6 text-sm text-red-100">
        <p className="font-semibold">{MAP_STRINGS.configErrorTitle}</p>
        <p className="mt-1">{MAP_STRINGS.configErrorBody(configResult.missing)}</p>
      </div>
    );
  }
  return <SupervisionMapView config={configResult.config} />;
}

function SupervisionMapView({ config }: { config: MapConfig }) {
  const { state, retry } = useReports(config.apiBaseUrl);
  const [filters, setFilters] = useState<ReportFilters>(NO_FILTERS);

  const reports = state.status === 'ready' ? state.data.reports : NO_REPORTS;
  const categories = useMemo(() => categoryOptions(reports), [reports]);
  const visibleReports = useMemo(() => filterReports(reports, filters), [reports, filters]);

  return (
    <div className="space-y-4">
      <FilterBar
        categories={categories}
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(NO_FILTERS)}
        disabled={state.status !== 'ready'}
      />
      <MapLegend />

      {state.status === 'ready' && (
        <p aria-live="polite" className="text-sm text-slate-300">
          {MAP_STRINGS.shownCount(visibleReports.length, reports.length)}
          {state.data.skipped > 0 && ` · ${MAP_STRINGS.skippedCount(state.data.skipped)}`}
        </p>
      )}

      <section
        aria-label={MAP_STRINGS.mapRegionLabel}
        className="relative h-[70vh] min-h-[420px] overflow-hidden rounded-2xl border border-dark-border"
      >
        <MapContainer center={CITY_CENTER} zoom={INITIAL_ZOOM} className="h-full w-full">
          <TileLayer url={config.tileUrl} attribution={OSM_ATTRIBUTION} />
          {visibleReports.map((report) => (
            <Marker
              key={report.id}
              position={report.position}
              icon={statusIcon(report.status)}
              title={MAP_STRINGS.markerTitle(categoryLabel(report.category), STATUS_LABELS[report.status])}
            >
              <Popup>
                <ReportPopupContent report={report} />
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {state.status === 'loading' && (
          <MapOverlay>
            <p role="status">{MAP_STRINGS.loading}</p>
          </MapOverlay>
        )}

        {state.status === 'error' && (
          <MapOverlay>
            <div role="alert" className="space-y-3">
              <p className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4 text-red-400" aria-hidden="true" />
                {MAP_STRINGS.errorTitle}
              </p>
              <p>{errorMessage(state.error)}</p>
              <Button
                type="button"
                variant="primary"
                className="min-h-[44px]"
                icon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
                onClick={retry}
              >
                {MAP_STRINGS.retry}
              </Button>
            </div>
          </MapOverlay>
        )}

        {state.status === 'ready' && visibleReports.length === 0 && (
          <MapOverlay>
            <p role="status">{reports.length === 0 ? MAP_STRINGS.emptyNoData : MAP_STRINGS.emptyNoMatch}</p>
          </MapOverlay>
        )}
      </section>
    </div>
  );
}

/** Message panel above the Leaflet panes (z-index 1000), the map stays usable around it. */
function MapOverlay({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-4 z-[1000] flex justify-center px-4">
      <div className="pointer-events-auto max-w-md rounded-xl border border-dark-borderLight bg-dark-card/95 px-5 py-4 text-sm text-slate-100 shadow-xl">
        {children}
      </div>
    </div>
  );
}
