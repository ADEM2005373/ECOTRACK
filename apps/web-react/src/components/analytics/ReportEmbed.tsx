import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PowerBIEmbed } from 'powerbi-client-react';
import { models, type Embed, type IReportEmbedConfiguration } from 'powerbi-client';
import { Button } from '../ui/Button';
import { EmbedApiError, fetchEmbedInfo, type EmbedApiErrorKind, type EmbedInfo } from './embedApi';
import { refreshAt, REFRESH_RETRY_MS } from './refreshSchedule';
import { reportLabel, type ReportKey } from './reports';
import { ANALYTICS_STRINGS } from './strings.fr';
import './analytics.css';

type ViewState =
  | { status: 'loading' }
  | { status: 'ready'; embed: EmbedInfo }
  | { status: 'error'; kind: EmbedApiErrorKind };

const ERROR_MESSAGES: Record<EmbedApiErrorKind, string> = {
  unauthorized: ANALYTICS_STRINGS.errors.unauthorized,
  forbidden: ANALYTICS_STRINGS.errors.forbidden,
  not_configured: ANALYTICS_STRINGS.errors.notConfigured,
  unavailable: ANALYTICS_STRINGS.errors.unavailable,
  network: ANALYTICS_STRINGS.errors.network,
  invalid_payload: ANALYTICS_STRINGS.errors.invalidPayload
};

function errorKind(error: unknown): EmbedApiErrorKind {
  return error instanceof EmbedApiError ? error.kind : 'unavailable';
}

interface ReportEmbedProps {
  apiBaseUrl: string;
  reportKey: ReportKey;
  userToken: string;
  onUnauthorized(): void;
}

/**
 * Loads the embed token of one report from bi-api, embeds it with TokenType.Embed and
 * refreshes the token in place (report.setAccessToken) before it expires and when the
 * browser tab becomes visible again. Tokens live in memory only.
 */
export function ReportEmbed({ apiBaseUrl, reportKey, userToken, onUnauthorized }: ReportEmbedProps) {
  const [view, setView] = useState<ViewState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const embeddedRef = useRef<Embed | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setView({ status: 'loading' });
    embeddedRef.current = null;
    fetchEmbedInfo(apiBaseUrl, reportKey, userToken, controller.signal).then(
      (embed) => {
        if (!controller.signal.aborted) {
          setView({ status: 'ready', embed });
        }
      },
      (error: unknown) => {
        if (!controller.signal.aborted) {
          setView({ status: 'error', kind: errorKind(error) });
        }
      }
    );
    return () => controller.abort();
  }, [apiBaseUrl, reportKey, userToken, attempt]);

  const readyEmbed = view.status === 'ready' ? view.embed : null;

  useEffect(() => {
    if (readyEmbed === null) {
      return undefined;
    }
    let disposed = false;
    let timer: number | undefined;
    let controller: AbortController | null = null;
    let expiresAt = readyEmbed.expiresAt;
    let nextRefreshAt = 0;

    const schedule = (atMs: number) => {
      window.clearTimeout(timer);
      nextRefreshAt = atMs;
      timer = window.setTimeout(() => void refresh(), Math.max(0, atMs - Date.now()));
    };

    const refresh = async () => {
      window.clearTimeout(timer);
      controller?.abort();
      const current = new AbortController();
      controller = current;
      try {
        const next = await fetchEmbedInfo(apiBaseUrl, reportKey, userToken, current.signal);
        if (disposed) {
          return;
        }
        await embeddedRef.current?.setAccessToken(next.embedToken);
        expiresAt = next.expiresAt;
        schedule(refreshAt(expiresAt, Date.now()));
      } catch (error) {
        if (disposed || current.signal.aborted) {
          return;
        }
        const kind = errorKind(error);
        if (kind === 'unauthorized' || kind === 'forbidden' || Date.now() >= expiresAt) {
          setView({ status: 'error', kind });
          return;
        }
        schedule(Math.min(Date.now() + REFRESH_RETRY_MS, expiresAt));
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && Date.now() >= nextRefreshAt) {
        void refresh();
      }
    };

    schedule(refreshAt(expiresAt, Date.now()));
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      disposed = true;
      window.clearTimeout(timer);
      controller?.abort();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [readyEmbed, apiBaseUrl, reportKey, userToken]);

  // Built once per loaded report: later tokens go through setAccessToken, not a re-embed.
  const embedConfig = useMemo<IReportEmbedConfiguration | null>(
    () =>
      readyEmbed && {
        type: 'report',
        id: readyEmbed.reportId,
        embedUrl: readyEmbed.embedUrl,
        accessToken: readyEmbed.embedToken,
        tokenType: models.TokenType.Embed
      },
    [readyEmbed]
  );

  const label = reportLabel(reportKey);
  const onEmbedded = useCallback(
    (embedded: Embed) => {
      embeddedRef.current = embedded;
      if (embedded.iframe) {
        embedded.iframe.title = ANALYTICS_STRINGS.iframeTitle(label);
      }
    },
    [label]
  );

  if (view.status === 'loading') {
    return (
      <div role="status" className="flex h-full items-center justify-center text-sm text-slate-400">
        {ANALYTICS_STRINGS.loading}
      </div>
    );
  }

  if (view.status === 'error') {
    const isNotConfigured = view.kind === 'not_configured';
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <p role={isNotConfigured ? 'status' : 'alert'} className="max-w-md text-sm text-slate-200">
          {ERROR_MESSAGES[view.kind]}
        </p>
        {view.kind === 'unauthorized' ? (
          <Button variant="primary" size="md" onClick={onUnauthorized}>
            {ANALYTICS_STRINGS.reconnect}
          </Button>
        ) : (
          !isNotConfigured && (
            <Button variant="outline" size="md" onClick={() => setAttempt((value) => value + 1)}>
              {ANALYTICS_STRINGS.retry}
            </Button>
          )
        )}
      </div>
    );
  }

  return embedConfig && (
    <PowerBIEmbed embedConfig={embedConfig} cssClassName="analytics-embed" getEmbeddedComponent={onEmbedded} />
  );
}
