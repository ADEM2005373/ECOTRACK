import { createApp } from './app';
import { BiApiConfig, ConfigError, loadConfig } from './config';
import { createConsoleLogger } from './logger';
import { createAzureTokenProvider } from './powerbi/azure-token';
import { createPowerBiClient } from './powerbi/powerbi-client';

const UPSTREAM_TIMEOUT_MS = 10_000;

function start(): void {
  const logger = createConsoleLogger('bi-api');
  let config: BiApiConfig;
  try {
    config = loadConfig(process.env);
  } catch (error) {
    if (error instanceof ConfigError) {
      // Variable names only: values are never printed.
      console.error(`[bi-api] Refusing to start. ${error.message}`);
      process.exit(1);
    }
    throw error;
  }

  const powerBi = createPowerBiClient({
    tokenProvider: createAzureTokenProvider(config.azure, UPSTREAM_TIMEOUT_MS),
    fetchFn: (input, init) => fetch(input, init),
    timeoutMs: UPSTREAM_TIMEOUT_MS
  });
  const app = createApp({ config, powerBi, logger, now: Date.now });

  app.listen(config.port, () => {
    logger.info('listening', { port: config.port });
  });
}

start();
