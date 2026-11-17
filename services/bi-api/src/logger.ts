/**
 * Structured logger that accepts only event names and short codes or numbers:
 * it has no way to log a token, a secret, a user or a Microsoft response body.
 */
export type LogFields = Readonly<Record<string, string | number | null>>;

export interface Logger {
  info(event: string, fields?: LogFields): void;
  warn(event: string, fields?: LogFields): void;
}

export function createConsoleLogger(service: string): Logger {
  const write = (level: 'info' | 'warn', event: string, fields: LogFields = {}) => {
    const line = JSON.stringify({ level, service, event, ...fields, time: new Date().toISOString() });
    if (level === 'warn') {
      console.warn(line);
    } else {
      console.info(line);
    }
  };
  return {
    info: (event, fields) => write('info', event, fields),
    warn: (event, fields) => write('warn', event, fields)
  };
}
