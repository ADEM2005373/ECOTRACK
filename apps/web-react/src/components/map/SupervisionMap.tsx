import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { MapContainer, Marker, Polygon, Popup, Rectangle, TileLayer, useMap } from 'react-leaflet';
import { AlertTriangle, MapPin, RefreshCw } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import './supervisionMap.css';
import { useAuth, type MunicipalityTerritory } from '../../store/authStore';
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

function TerritoryViewport({ territory }: { territory: MunicipalityTerritory }) {
  const map = useMap();

  useEffect(() => {
    if (territory.bbox && territory.bbox.length === 4) {
      const [south, north, west, east] = territory.bbox;
      const bounds: [[number, number], [number, number]] = [
        [south, west],
        [north, east],
      ];
      map.fitBounds(bounds, { padding: [24, 24], maxZoom: 15 });
      const padLat = Math.max(0.02, (north - south) * 0.45);
      const padLng = Math.max(0.02, (east - west) * 0.45);
      map.setMaxBounds([
        [south - padLat, west - padLng],
        [north + padLat, east + padLng],
      ]);
      map.setMinZoom(11);
    } else if (territory.center && territory.center.length === 2) {
      map.setView(territory.center, 14);
      map.setMinZoom(11);
    }
  }, [map, territory]);

  return null;
}

function isInsideTerritory(position: [number, number], territory?: MunicipalityTerritory): boolean {
  if (!territory?.bbox || territory.bbox.length !== 4) return true;
  const [south, north, west, east] = territory.bbox;
  const [lat, lng] = position;
  const tol = 0.015; // slight tolerance for border anomalies
  return lat >= south - tol && lat <= north + tol && lng >= west - tol && lng <= east + tol;
}

function SupervisionMapView({ config }: { config: MapConfig }) {
  const { state, retry } = useReports(config.apiBaseUrl);
  const [filters, setFilters] = useState<ReportFilters>(NO_FILTERS);

  let currentUser: ReturnType<typeof useAuth>['state']['user'] = null;
  try {
    currentUser = useAuth().state.user;
  } catch {
    // Isolated unit tests without AuthProvider
  }

  const isGlobalAdmin = currentUser?.role === 'ADMIN_SAAS' || currentUser?.role === 'ADMIN';
  const [resolvedTerritory, setResolvedTerritory] = useState<MunicipalityTerritory | undefined>(
    !isGlobalAdmin && currentUser?.territory?.center?.length === 2 ? currentUser.territory : undefined
  );

  useEffect(() => {
    if (isGlobalAdmin || !currentUser?.municipality) {
      setResolvedTerritory(undefined);
      return;
    }
    if (currentUser.territory?.center?.length === 2) {
      setResolvedTerritory(currentUser.territory);
      return;
    }

    let cancelled = false;
    const govParam = currentUser.governorate ? `&governorate=${encodeURIComponent(currentUser.governorate)}` : '';
    fetch(`/api/v1/auth/territory?name=${encodeURIComponent(currentUser.municipality)}${govParam}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.territory?.center?.length === 2) {
          setResolvedTerritory(data.territory);
          try {
            const raw = localStorage.getItem('ecotrack_user');
            if (raw) {
              const parsed = JSON.parse(raw);
              localStorage.setItem('ecotrack_user', JSON.stringify({ ...parsed, territory: data.territory }));
            }
          } catch {
            // ignore storage errors
          }
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [isGlobalAdmin, currentUser?.municipality, currentUser?.territory]);

  const scopedTerritory = resolvedTerritory;

  const reports = state.status === 'ready' ? state.data.reports : NO_REPORTS;
  const territorialReports = useMemo(
    () => (scopedTerritory ? reports.filter((r) => isInsideTerritory(r.position, scopedTerritory)) : reports),
    [reports, scopedTerritory]
  );
  const categories = useMemo(() => categoryOptions(territorialReports), [territorialReports]);
  const visibleReports = useMemo(() => filterReports(territorialReports, filters), [territorialReports, filters]);

  const initialCenter = scopedTerritory?.center ?? CITY_CENTER;
  const initialZoom = scopedTerritory ? 13 : INITIAL_ZOOM;

  return (
    <div className="space-y-4">
      {scopedTerritory && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-2.5 text-xs text-emerald-900">
          <div className="flex items-center gap-2 font-semibold">
            <MapPin className="h-4 w-4 text-emerald-600" />
            <span>Territoire ciblé : {currentUser?.municipality || scopedTerritory.displayName}</span>
          </div>
          <span className="text-[11px] text-emerald-700">{scopedTerritory.displayName}</span>
        </div>
      )}

      <FilterBar
        categories={categories}
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(NO_FILTERS)}
        disabled={state.status !== 'ready'}
      />
      <MapLegend />

      {state.status === 'ready' && (
        <p aria-live="polite" className="text-xs text-[#475569] font-medium">
          {MAP_STRINGS.shownCount(visibleReports.length, territorialReports.length)}
          {state.data.skipped > 0 && ` · ${MAP_STRINGS.skippedCount(state.data.skipped)}`}
        </p>
      )}

      <section
        aria-label={MAP_STRINGS.mapRegionLabel}
        className="relative h-[70vh] min-h-[420px] overflow-hidden rounded-xl border border-[#e2e8f0] shadow-sm"
      >
        <MapContainer center={initialCenter} zoom={initialZoom} className="h-full w-full">
          <TileLayer url={config.tileUrl} attribution={OSM_ATTRIBUTION} />
          {scopedTerritory && <TerritoryViewport territory={scopedTerritory} />}
          {scopedTerritory?.polygon && scopedTerritory.polygon.length >= 3 && (
            <Polygon
              positions={scopedTerritory.polygon}
              pathOptions={{ color: '#059669', weight: 2.5, fillColor: '#10b981', fillOpacity: 0.08, dashArray: '6 4' }}
            />
          )}
          {!scopedTerritory?.polygon && scopedTerritory?.bbox && scopedTerritory.bbox.length === 4 && (
            <Rectangle
              bounds={[
                [scopedTerritory.bbox[0], scopedTerritory.bbox[2]],
                [scopedTerritory.bbox[1], scopedTerritory.bbox[3]],
              ]}
              pathOptions={{ color: '#059669', weight: 2.5, fillColor: '#10b981', fillOpacity: 0.08, dashArray: '6 4' }}
            />
          )}
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
      <div className="pointer-events-auto max-w-md rounded-xl border border-[#e2e8f0] bg-white/95 px-5 py-4 text-xs text-[#0f172a] shadow-xl">
        {children}
      </div>
    </div>
  );
}
