import { ConfidentialClientApplication } from '@azure/msal-node';
import { BiApiConfig } from '../config';
import { UpstreamError } from './errors';

export const POWERBI_SCOPE = 'https://analysis.windows.net/powerbi/api/.default';

export interface AzureAccessTokenProvider {
  getAccessToken(): Promise<string>;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new UpstreamError('UPSTREAM_TIMEOUT')), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Service Principal (client credentials) token for the Power BI REST API.
 * MSAL keeps the token in its in-memory cache and only calls Azure AD again
 * when it is about to expire.
 */
export function createAzureTokenProvider(
  azure: BiApiConfig['azure'],
  timeoutMs: number
): AzureAccessTokenProvider {
  const client = new ConfidentialClientApplication({
    auth: {
      clientId: azure.clientId,
      authority: `https://login.microsoftonline.com/${azure.tenantId}`,
      clientSecret: azure.clientSecret
    },
    system: {
      loggerOptions: { piiLoggingEnabled: false }
    }
  });

  return {
    async getAccessToken(): Promise<string> {
      let result: Awaited<ReturnType<ConfidentialClientApplication['acquireTokenByClientCredential']>>;
      try {
        result = await withTimeout(
          client.acquireTokenByClientCredential({ scopes: [POWERBI_SCOPE] }),
          timeoutMs
        );
      } catch (error) {
        if (error instanceof UpstreamError) {
          throw error;
        }
        throw new UpstreamError('AZURE_AUTH_FAILED');
      }
      if (!result || typeof result.accessToken !== 'string' || result.accessToken === '') {
        throw new UpstreamError('AZURE_AUTH_FAILED');
      }
      return result.accessToken;
    }
  };
}
