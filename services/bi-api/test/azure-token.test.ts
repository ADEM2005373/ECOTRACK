import { ConfidentialClientApplication } from '@azure/msal-node';
import { createAzureTokenProvider, POWERBI_SCOPE } from '../src/powerbi/azure-token';
import { UpstreamError } from '../src/powerbi/errors';

jest.mock('@azure/msal-node', () => ({
  ConfidentialClientApplication: jest.fn()
}));

const MockedClient = ConfidentialClientApplication as unknown as jest.Mock;
const AZURE = {
  tenantId: '44444444-4444-4444-8444-444444444444',
  clientId: '55555555-5555-4555-8555-555555555555',
  clientSecret: 'placeholder-secret-for-tests'
};

function mockAcquire(implementation: () => Promise<unknown>): jest.Mock {
  const acquireTokenByClientCredential = jest.fn(implementation);
  MockedClient.mockImplementation(() => ({ acquireTokenByClientCredential }));
  return acquireTokenByClientCredential;
}

async function codeOf(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (error) {
    return error instanceof UpstreamError ? error.code : 'not-upstream';
  }
  return 'resolved';
}

describe('createAzureTokenProvider (MSAL client credentials)', () => {
  beforeEach(() => MockedClient.mockReset());

  it('uses the tenant authority, the Service Principal and the Power BI .default scope', async () => {
    const acquire = mockAcquire(() => Promise.resolve({ accessToken: 'aad-token' }));
    const provider = createAzureTokenProvider(AZURE, 10_000);

    await expect(provider.getAccessToken()).resolves.toBe('aad-token');
    expect(MockedClient).toHaveBeenCalledWith({
      auth: {
        clientId: AZURE.clientId,
        authority: `https://login.microsoftonline.com/${AZURE.tenantId}`,
        clientSecret: AZURE.clientSecret
      },
      system: { loggerOptions: { piiLoggingEnabled: false } }
    });
    expect(acquire).toHaveBeenCalledWith({ scopes: [POWERBI_SCOPE] });
    expect(POWERBI_SCOPE).toBe('https://analysis.windows.net/powerbi/api/.default');
  });

  it('builds the MSAL client once so its token cache is reused', async () => {
    mockAcquire(() => Promise.resolve({ accessToken: 'aad-token' }));
    const provider = createAzureTokenProvider(AZURE, 10_000);
    await provider.getAccessToken();
    await provider.getAccessToken();
    expect(MockedClient).toHaveBeenCalledTimes(1);
  });

  it('maps an MSAL error to AZURE_AUTH_FAILED without its message', async () => {
    mockAcquire(() => Promise.reject(new Error('AADSTS7000215: Invalid client secret provided')));
    expect(await codeOf(createAzureTokenProvider(AZURE, 10_000).getAccessToken())).toBe('AZURE_AUTH_FAILED');
  });

  it('maps a null result to AZURE_AUTH_FAILED', async () => {
    mockAcquire(() => Promise.resolve(null));
    expect(await codeOf(createAzureTokenProvider(AZURE, 10_000).getAccessToken())).toBe('AZURE_AUTH_FAILED');
  });

  it('times out a hanging Azure AD call', async () => {
    mockAcquire(() => new Promise(() => undefined));
    expect(await codeOf(createAzureTokenProvider(AZURE, 20).getAccessToken())).toBe('UPSTREAM_TIMEOUT');
  });
});
