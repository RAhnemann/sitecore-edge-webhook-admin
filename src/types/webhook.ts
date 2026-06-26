// Matches the Edge Admin API webhook objects exactly
// Ref: https://doc.sitecore.com/sai/en/developers/sitecoreai/sitecore-experience-manager/webhook-objects.html

export type ExecutionMode = "OnEnd" | "OnUpdate";
export type HttpMethod = "GET" | "POST";

export interface LastRun {
  timestamp: string;
  success: boolean;
  message?: string;
}

/** Used when creating or updating a webhook (POST / PUT) */
export interface WebhookEdit {
  label: string;
  uri: string;
  method: HttpMethod;
  headers?: Record<string, string>;
  /** Only populated when executionMode is OnEnd */
  body?: string;
  /** Only populated when executionMode is OnUpdate. Must be valid JSON. */
  bodyInclude?: string;
  createdBy: string;
  executionMode: ExecutionMode;
  disabled?: boolean;
}

/** Full webhook object returned by the API */
export interface Webhook extends WebhookEdit {
  id: string;
  tenantId: string;
  created: string;
  lastRuns?: LastRun[];
  disabled: boolean;
}

/** Describes a single entity update that triggered a webhook (OnUpdate mode) */
export interface EntityUpdate {
  identifier: string;
  entity_definition:
    | "Item"
    | "MediaItem"
    | "ItemTemplate"
    | "ItemTemplateField"
    | "LayoutData"
    | "SiteInfo"
    | "DictionaryEntry";
  operation: "Update" | "Delete";
  entity_culture: string;
}

/** Body sent to your endpoint when using OnUpdate mode */
export interface WebHookRequest {
  invocation_id: string;
  updates: EntityUpdate[];
  continues: boolean;
}

/** Result returned by the test-webhook proxy route */
export interface TestWebhookResult {
  status: number;
  statusText: string;
  durationMs: number;
  body: string;
}

/** Session-stored connection settings */
export interface ConnectionSettings {
  apiBaseUrl: string;
  apiToken: string;
}
