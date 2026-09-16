import { DRIVE_SCOPE, GOOGLE_CLIENT_ID } from './config';

const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client';
const TOKEN_KEY = 'drive.accessToken';
const EXPIRES_AT_KEY = 'drive.expiresAt';

/** Refresh slightly early so a token can't expire mid-request. */
const EXPIRY_MARGIN_MS = 60_000;

let gisScriptPromise: Promise<void> | null = null;
let tokenClient: google.accounts.oauth2.TokenClient | null = null;
let pendingRequest: { resolve: () => void; reject: (error: Error) => void } | null = null;

function loadGoogleIdentityScript(): Promise<void> {
  gisScriptPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GIS_SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      resolve();
    };
    script.onerror = () => {
      gisScriptPromise = null;
      reject(new Error('Could not load Google sign-in. Check your internet connection.'));
    };
    document.head.append(script);
  });
  return gisScriptPromise;
}

function storeToken(response: google.accounts.oauth2.TokenResponse): void {
  const lifetimeMs = Number(response.expires_in) * 1000;
  localStorage.setItem(TOKEN_KEY, response.access_token);
  localStorage.setItem(EXPIRES_AT_KEY, String(Date.now() + lifetimeMs));
}

function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRES_AT_KEY);
}

/** The stored access token, or null when there is none or it has (nearly) expired. */
export function getStoredAccessToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiresAt = Number(localStorage.getItem(EXPIRES_AT_KEY) ?? 0);
  if (!token || Date.now() + EXPIRY_MARGIN_MS >= expiresAt) {
    return null;
  }
  return token;
}

async function getTokenClient(): Promise<google.accounts.oauth2.TokenClient> {
  await loadGoogleIdentityScript();
  tokenClient ??= google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: DRIVE_SCOPE,
    callback: (response) => {
      storeToken(response);
      pendingRequest?.resolve();
      pendingRequest = null;
    },
    error_callback: (error) => {
      pendingRequest?.reject(new Error(error.message || 'Google sign-in was cancelled.'));
      pendingRequest = null;
    },
  });
  return tokenClient;
}

/**
 * Asks Google for an access token, showing the consent popup. Must be called
 * from a user gesture (a click), or the browser blocks the popup.
 */
export async function connectDrive(): Promise<void> {
  const client = await getTokenClient();
  return new Promise<void>((resolve, reject) => {
    pendingRequest = { resolve, reject };
    client.requestAccessToken();
  });
}

/** Forgets the stored token. Does not revoke access on Google's side. */
export function disconnectDrive(): void {
  clearToken();
}

/**
 * The access token to use for a Drive request. Throws when the app is not
 * connected, so callers can ask the user to press "Connect".
 */
export function requireAccessToken(): string {
  const token = getStoredAccessToken();
  if (!token) {
    clearToken();
    throw new Error('Not connected to Google Drive.');
  }
  return token;
}
