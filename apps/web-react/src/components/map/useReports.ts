import { useCallback, useEffect, useState } from 'react';
import { fetchReports, ReportsApiError, type ReportsPayload } from './reportsApi';

export type ReportsState =
  | { status: 'loading' }
  | { status: 'error'; error: ReportsApiError }
  | { status: 'ready'; data: ReportsPayload };

/** Loads the reports; the request is cancelled on unmount or when a retry starts. */
export function useReports(apiBaseUrl: string): { state: ReportsState; retry: () => void } {
  const [state, setState] = useState<ReportsState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });
    fetchReports(apiBaseUrl, controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) {
          setState({ status: 'ready', data });
        }
      },
      (error: unknown) => {
        if (!controller.signal.aborted) {
          setState({
            status: 'error',
            error: error instanceof ReportsApiError ? error : new ReportsApiError('network'),
          });
        }
      },
    );
    return () => controller.abort();
  }, [apiBaseUrl, attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  return { state, retry };
}
