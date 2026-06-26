/**
 * Edge Admin API client.
 *
 * All methods read connection settings from sessionStorage at call time,
 * so they always use the current session without needing to be re-instantiated.
 *
 * The token is attached as a Bearer header. It is never logged or persisted
 * beyond sessionStorage.
 */

import { loadConnectionSettings } from "@/lib/session";
import type { Webhook, WebhookEdit, TestWebhookResult } from "@/types/webhook";

function getSettings() {
  const settings = loadConnectionSettings();
  if (!settings) throw new Error("No active session. Please configure your connection settings.");
  return settings;
}

function headers(token: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API error ${res.status}: ${text}`);
  }
  // 204 No Content — return empty object cast to T
  if (res.status === 204) return {} as T;
  return res.json() as Promise<T>;
}

/** List all webhooks for the tenant */
export async function listWebhooks(): Promise<Webhook[]> {
  const { apiBaseUrl, apiToken } = getSettings();
  const res = await fetch(`${apiBaseUrl}/webhooks`, {
    headers: headers(apiToken),
  });
  return handleResponse<Webhook[]>(res);
}

/** Get a single webhook by ID */
export async function getWebhook(id: string): Promise<Webhook> {
  const { apiBaseUrl, apiToken } = getSettings();
  const res = await fetch(`${apiBaseUrl}/webhooks/${id}`, {
    headers: headers(apiToken),
  });
  return handleResponse<Webhook>(res);
}

/** Create a new webhook */
export async function createWebhook(data: WebhookEdit): Promise<Webhook> {
  const { apiBaseUrl, apiToken } = getSettings();
  const res = await fetch(`${apiBaseUrl}/webhooks`, {
    method: "POST",
    headers: headers(apiToken),
    body: JSON.stringify(data),
  });
  return handleResponse<Webhook>(res);
}

/** Update an existing webhook (full replacement via PUT) */
export async function updateWebhook(id: string, data: WebhookEdit): Promise<Webhook> {
  const { apiBaseUrl, apiToken } = getSettings();
  const res = await fetch(`${apiBaseUrl}/webhooks/${id}`, {
    method: "PUT",
    headers: headers(apiToken),
    body: JSON.stringify(data),
  });
  return handleResponse<Webhook>(res);
}

function togglePayload(webhook: Webhook, disabled: boolean): WebhookEdit {
  const base = {
    label: webhook.label,
    uri: webhook.uri,
    method: webhook.method,
    headers: webhook.headers,
    createdBy: webhook.createdBy,
    executionMode: webhook.executionMode,
    disabled,
  };
  return webhook.executionMode === "OnUpdate"
    ? { ...base, bodyInclude: webhook.bodyInclude }
    : { ...base, body: webhook.body };
}

/** Re-enable a disabled webhook — sends PUT with disabled: false */
export async function enableWebhook(webhook: Webhook): Promise<Webhook> {
  return updateWebhook(webhook.id, togglePayload(webhook, false));
}

/** Disable an active webhook — sends PUT with disabled: true */
export async function disableWebhook(webhook: Webhook): Promise<Webhook> {
  return updateWebhook(webhook.id, togglePayload(webhook, true));
}

/** Send a test request to a webhook's URI via the server-side proxy */
export async function testWebhook(webhook: Webhook, body: string): Promise<TestWebhookResult> {
  const res = await fetch("/api/test-webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      uri: webhook.uri,
      method: webhook.method,
      headers: webhook.headers ?? {},
      ...(webhook.method === "POST" ? { body } : {}),
    }),
  });
  return handleResponse<TestWebhookResult>(res);
}

/** Delete a webhook */
export async function deleteWebhook(id: string): Promise<void> {
  const { apiBaseUrl, apiToken } = getSettings();
  const res = await fetch(`${apiBaseUrl}/webhooks/${id}`, {
    method: "DELETE",
    headers: headers(apiToken),
  });
  await handleResponse<void>(res);
}
