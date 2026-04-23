/**
 * Session storage utilities for connection settings.
 *
 * Why sessionStorage?
 * - Cleared automatically when the tab is closed — no long-lived token exposure
 * - Never sent to a server, stays in the browser only
 * - Still vulnerable to XSS while the session is active, so we never store
 *   anything beyond what's needed to make API calls
 *
 * Keys are prefixed to avoid collisions with other apps on the same origin.
 */

import type { ConnectionSettings } from "@/types/webhook";

const KEYS = {
  apiBaseUrl: "sc_wh_url",
  apiToken: "sc_wh_token",
} as const;

export function saveConnectionSettings(settings: ConnectionSettings): void {
  sessionStorage.setItem(KEYS.apiBaseUrl, settings.apiBaseUrl);
  sessionStorage.setItem(KEYS.apiToken, settings.apiToken);
}

export function loadConnectionSettings(): ConnectionSettings | null {
  const apiBaseUrl = sessionStorage.getItem(KEYS.apiBaseUrl);
  const apiToken = sessionStorage.getItem(KEYS.apiToken);

  if (!apiBaseUrl || !apiToken) return null;

  return { apiBaseUrl, apiToken };
}

export function clearConnectionSettings(): void {
  Object.values(KEYS).forEach((key) => sessionStorage.removeItem(key));
}

export function isConnected(): boolean {
  return !!sessionStorage.getItem(KEYS.apiToken);
}
