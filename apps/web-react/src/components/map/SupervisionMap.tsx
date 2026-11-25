import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { MapContainer, Marker, Polygon, Popup, Rectangle, TileLayer, useMap } from 'react-leaflet';
import { AlertTriangle, CheckCircle2, MapPin, RefreshCw, ShieldCheck, UserCheck, X, XCircle } from 'lucide-react';
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
  const [selectedReport, setSelectedReport] = useState<MapReport | null>(null);
  const [staffList, setStaffList] = useState<Array<{ id: string; fullName: string; role: string }>>([]);
  const [selectedCategory, setSelectedCategory] = useState('DEPOT_SAUVAGE');
  const [selectedBrigade, setSelectedBrigade] = useState('Brigade Voirie & Salubrité');
  const [selectedWorker, setSelectedWorker] = useState('');
  const [rejectReason, setRejectReason] = useState('Photo non conforme / Aucun déchet détecté');
  const [actionBusy, setActionBusy] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  let currentUser: ReturnType<typeof useAuth>['state']['user'] = null;
  let accessToken: string | null = null;
  try {
    const auth = useAuth();
    currentUser = auth.state.user;
    accessToken = auth.state.accessToken;
  } catch {
    // Isolated unit tests without AuthProvider
  }

  const isGlobalAdmin = currentUser?.role === 'ADMIN_SAAS' || currentUser?.role === 'ADMIN';
  const canManageReports =
    currentUser?.role === 'ADMIN_MUNICIPALITE' ||
    currentUser?.role === 'AGENT_MAIRIE' ||
    currentUser?.role === 'AGENT' ||
    isGlobalAdmin;

  useEffect(() => {
    if (!canManageReports) return;
    let cancelled = false;
    fetch('/api/v1/auth/users')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && Array.isArray(data?.users)) {
          const targetMairie = currentUser?.municipality?.toLowerCase();
          const staff = data.users
            .filter((u: any) => {
              const isFieldRole = u.role === 'CHEF_OUVRIER' || u.role === 'AGENT_MAIRIE' || u.role === 'OUVRIER';
              if (!isFieldRole) return false;
              if (!targetMairie || isGlobalAdmin) return true;
              return !u.municipality || u.municipality.toLowerCase() === targetMairie;
            })
            .map((u: any) => ({
              id: String(u.id || u._id),
              fullName: u.fullName || u.email,
              role: u.role,
            }));
          setStaffList(staff);
          if (staff.length > 0) setSelectedWorker(staff[0].fullName);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [canManageReports, currentUser?.municipality, isGlobalAdmin]);

  const openReportPanel = (report: MapReport) => {
    setSelectedReport(report);
    setSelectedCategory(report.category || 'DEPOT_SAUVAGE');
    setSelectedBrigade(report.assignedTeamId || 'Brigade Voirie & Salubrité');
    if (report.assignedWorkerId) {
      setSelectedWorker(report.assignedWorkerId);
    }
    setActionFeedback(null);
  };

  const runTransition = async (transition: 'T1' | 'T2' | 'T_REJECT', extra: Record<string, unknown> = {}) => {
    if (!selectedReport) return;
    setActionBusy(true);
    setActionFeedback(null);
    try {
      const token = accessToken || localStorage.getItem('ecotrack_access_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/v1/interventions/transition', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          reportId: selectedReport.id,
          transition,
          actorRole: currentUser?.role || 'ADMIN_MUNICIPALITE',
          actorId: currentUser?.email || currentUser?.id,
          ...extra,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setActionFeedback(err?.message || `Erreur (${res.status})`);
        return;
      }
      setActionFeedback(
        transition === 'T1'
          ? 'Signalement validé !'
          : transition === 'T2'
          ? 'Signalement affecté à la brigade !'
          : 'Signalement rejeté.'
      );
      retry();
      setTimeout(() => setSelectedReport(null), 900);
    } catch {
      setActionFeedback('Impossible de joindre le serveur.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleAssignFromMap = async () => {
    if (!selectedReport) return;
    if (selectedReport.status === 'NOUVEAU' || selectedReport.status === 'EN_COURS_DE_VALIDATION') {
      const token = accessToken || localStorage.getItem('ecotrack_access_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch('/api/v1/interventions/transition', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          reportId: selectedReport.id,
          transition: 'T1',
          actorRole: currentUser?.role || 'ADMIN_MUNICIPALITE',
          actorId: currentUser?.email || currentUser?.id,
          categoryValidated: selectedCategory,
          reviewValidated: true,
        }),
      }).catch(() => {});
    }
    await runTransition('T2', {
      teamId: selectedBrigade,
      assigneeId: selectedWorker || 'Chef de Brigade',
      categoryValidated: selectedCategory,
      reviewValidated: true,
    });
  };
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
    }

    // Toujours synchroniser le territoire depuis le backend pour corriger un éventuel cache obsolète
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
  }, [isGlobalAdmin, currentUser?.municipality, currentUser?.governorate, currentUser?.territory]);

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
                <ReportPopupContent
                  report={report}
                  onSelect={canManageReports ? openReportPanel : undefined}
                />
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

        {selectedReport && (
          <div className="absolute inset-y-0 right-0 z-[1100] w-full max-w-md overflow-y-auto border-l border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  Inspection Territoriale
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {categoryLabel(selectedReport.category)}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedReport.district || 'Zone GPS'} · {selectedReport.municipality || 'Commune'} (
                  {selectedReport.position[0].toFixed(4)}, {selectedReport.position[1].toFixed(4)})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {selectedReport.photoUrl && (
                <img
                  src={selectedReport.photoUrl}
                  alt="Photo signalement"
                  className="h-44 w-full rounded-xl border border-slate-200 object-cover"
                />
              )}

              {selectedReport.description && (
                <div className="rounded-lg bg-slate-50 p-3 text-slate-700">
                  <p className="font-semibold text-slate-900 mb-1">Description citoyenne</p>
                  <p>{selectedReport.description}</p>
                </div>
              )}

              <div className="rounded-lg border border-slate-200 p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <ShieldCheck className="h-4 w-4 text-purple-600" />
                    Analyse IA Vision
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {typeof selectedReport.aiConfidenceScore === 'number'
                      ? `${Math.round(
                          selectedReport.aiConfidenceScore > 1
                            ? selectedReport.aiConfidenceScore
                            : selectedReport.aiConfidenceScore * 100
                        )} %`
                      : 'Non analysé'}
                  </span>
                </div>
                <p className="text-slate-600">
                  {selectedReport.aiJustification || 'Aucune justification IA enregistrée.'}
                </p>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-3">
                <label className="block font-semibold text-slate-700">Catégorie validée</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
                >
                  <option value="DEPOT_SAUVAGE">Dépôt sauvage</option>
                  <option value="ENCOMBRANTS">Encombrants</option>
                  <option value="DECHETS_DANGEREUX">Déchets dangereux</option>
                  <option value="VEGETAUX">Déchets verts</option>
                  <option value="GRAFFITI">Graffiti / Dégradation</option>
                  <option value="DEBORDEMENT_BAC">Débordement de bac</option>
                  <option value="AUTRE">Autre anomalie</option>
                </select>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-3">
                <label className="block font-semibold text-slate-700">Brigade & Agent d’affectation</label>
                <select
                  value={selectedBrigade}
                  onChange={(e) => setSelectedBrigade(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
                >
                  <option value="Brigade Voirie & Salubrité">Brigade Voirie & Salubrité</option>
                  <option value="Brigade Ramassage Poids Lourd">Brigade Ramassage Poids Lourd</option>
                  <option value="Brigade Espaces Verts">Brigade Espaces Verts</option>
                  <option value="Brigade Intervention Spéciale">Brigade Intervention Spéciale</option>
                  <option value="Brigade Collecte Express">Brigade Collecte Express</option>
                </select>
                <select
                  value={selectedWorker}
                  onChange={(e) => setSelectedWorker(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
                >
                  {staffList.length === 0 ? (
                    <option value="Chef de Brigade">Chef de Brigade (par défaut)</option>
                  ) : (
                    staffList.map((s) => (
                      <option key={s.id} value={s.fullName}>
                        {s.fullName} ({s.role})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {actionFeedback && (
                <p className="rounded-lg bg-slate-100 px-3 py-2 font-semibold text-slate-800">
                  {actionFeedback}
                </p>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={() =>
                    void runTransition('T1', {
                      categoryValidated: selectedCategory,
                      reviewValidated: true,
                    })
                  }
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Valider
                </button>
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={() => void handleAssignFromMap()}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <UserCheck className="h-4 w-4" />
                  Valider & Affecter
                </button>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-2">
                <input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Motif du rejet..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900"
                />
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={() => void runTransition('T_REJECT', { reason: rejectReason })}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" />
                  Rejeter le signalement
                </button>
              </div>
            </div>
          </div>
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
