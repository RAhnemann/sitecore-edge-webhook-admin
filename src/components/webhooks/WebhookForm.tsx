"use client";

import { useState, useEffect } from "react";
import type { Webhook, WebhookEdit, ExecutionMode, HttpMethod } from "@/types/webhook";
import { useTranslation } from "@/context/LanguageContext";

interface WebhookFormProps {
  /** Pre-populated when editing; undefined for create */
  initial?: Webhook;
  /** Username resolved from host.user — read-only, injected by the SDK */
  currentUser: string;
  onSubmit: (data: WebhookEdit) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function WebhookForm({
  initial,
  currentUser,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: WebhookFormProps) {
  const { t } = useTranslation();

  const [form, setForm] = useState<Omit<WebhookEdit, never>>({
    label: "",
    uri: "",
    method: "POST",
    executionMode: "OnEnd",
    body: "",
    bodyInclude: "",
    headers: {},
    createdBy: currentUser,
  });
  const [headerKey, setHeaderKey] = useState("");
  const [headerVal, setHeaderVal] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Keep createdBy in sync with the resolved user for new webhooks
  useEffect(() => {
    if (!initial) {
      setForm((prev) => ({ ...prev, createdBy: currentUser }));
    }
  }, [currentUser, initial]);

  // Populate form when editing
  useEffect(() => {
    if (initial) {
      setForm({
        label: initial.label,
        uri: initial.uri,
        method: initial.method,
        executionMode: initial.executionMode,
        body: initial.body ?? "",
        bodyInclude: initial.bodyInclude ?? "",
        headers: initial.headers ?? {},
        createdBy: initial.createdBy,
      });
    }
  }, [initial]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function addHeader() {
    if (!headerKey.trim()) return;
    set("headers", { ...form.headers, [headerKey.trim()]: headerVal.trim() });
    setHeaderKey("");
    setHeaderVal("");
  }

  function removeHeader(key: string) {
    const next = { ...form.headers };
    delete next[key];
    set("headers", next);
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.label.trim()) errs.label = t.errorLabelRequired;
    if (!form.uri.trim()) errs.uri = t.errorUriRequired;
    else if (!/^https?:\/\/.+/.test(form.uri)) errs.uri = t.errorUriFormat;
    if (form.executionMode === "OnUpdate" && form.bodyInclude) {
      try { JSON.parse(form.bodyInclude); }
      catch { errs.bodyInclude = t.errorBodyIncludeJson; }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    const payload: WebhookEdit = {
      label: form.label.trim(),
      uri: form.uri.trim(),
      method: form.method,
      executionMode: form.executionMode,
      headers: form.headers,
      createdBy: form.createdBy,
      // Only include the body field relevant to the chosen mode
      ...(form.executionMode === "OnEnd"
        ? { body: form.body }
        : { bodyInclude: form.bodyInclude }),
    };
    await onSubmit(payload);
  }

  const isEdit = !!initial;

  return (
    <div className="space-y-3">
      {/* Basic details */}
      <div className="p-3 rounded-lg border border-gray-100 bg-gray-50 space-y-3">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{t.basicDetails}</p>

        <Field label={t.labelField} error={errors.label}>
          <input
            type="text"
            value={form.label}
            onChange={(e) => set("label", e.target.value)}
            placeholder="e.g. Production rebuild"
            className={input(errors.label)}
          />
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label={t.uri} error={errors.uri}>
            <input
              type="text"
              value={form.uri}
              onChange={(e) => set("uri", e.target.value)}
              placeholder="https://..."
              className={input(errors.uri)}
            />
          </Field>
          <Field label={t.httpMethod}>
            <select
              value={form.method}
              onChange={(e) => set("method", e.target.value as HttpMethod)}
              className={input()}
            >
              <option>POST</option>
              <option>GET</option>
            </select>
          </Field>
        </div>
      </div>

      {/* Execution */}
      <div className="p-3 rounded-lg border border-gray-100 bg-gray-50 space-y-3">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{t.execution}</p>

        <div className="grid grid-cols-2 gap-2">
          <Field label={t.executionMode}>
            <select
              value={form.executionMode}
              onChange={(e) => set("executionMode", e.target.value as ExecutionMode)}
              className={input()}
            >
              <option value="OnEnd">OnEnd</option>
              <option value="OnUpdate">OnUpdate</option>
            </select>
          </Field>

          <Field label={t.createdBy}>
            <div className="px-2.5 py-1.5 text-sm border border-gray-100 rounded-lg bg-gray-50 text-gray-400 select-all">
              {form.createdBy || "—"}
            </div>
          </Field>
        </div>

        {/* Body — label changes based on mode */}
        {form.executionMode === "OnEnd" ? (
          <Field label={t.bodyJson} error={errors.body}>
            <textarea
              rows={2}
              value={form.body}
              onChange={(e) => set("body", e.target.value)}
              placeholder='{"rebuild": "true"}'
              className={input(errors.body) + " resize-none"}
            />
          </Field>
        ) : (
          <Field label={t.bodyIncludeField} error={errors.bodyInclude}>
            <textarea
              rows={2}
              value={form.bodyInclude}
              onChange={(e) => set("bodyInclude", e.target.value)}
              placeholder='{"key": "value"}'
              className={input(errors.bodyInclude) + " resize-none"}
            />
            <p className="text-xs text-gray-400 mt-1">{t.bodyIncludeHint}</p>
          </Field>
        )}
      </div>

      {/* Custom headers */}
      <div className="p-3 rounded-lg border border-gray-100 bg-gray-50 space-y-2">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{t.customHeaders}</p>

        {/* Existing headers */}
        {Object.entries(form.headers ?? {}).map(([k, v]) => (
          <div key={k} className="flex items-center gap-2 text-xs">
            <code className="flex-1 px-2 py-1 bg-white border border-gray-100 rounded font-mono truncate">
              {k}: {v}
            </code>
            <button
              type="button"
              onClick={() => removeHeader(k)}
              className="text-gray-400 hover:text-[#E24B4A] transition-colors"
              aria-label={`Remove header ${k}`}
            >
              ✕
            </button>
          </div>
        ))}

        {/* Add header row */}
        <div className="flex gap-2">
          <input
            type="text"
            value={headerKey}
            onChange={(e) => setHeaderKey(e.target.value)}
            placeholder="x-api-key"
            className={input() + " flex-1"}
          />
          <input
            type="text"
            value={headerVal}
            onChange={(e) => setHeaderVal(e.target.value)}
            placeholder="value"
            className={input() + " flex-1"}
          />
          <button
            type="button"
            onClick={addHeader}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
          >
            {t.addHeader}
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {t.cancel}
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#534AB7] text-white hover:bg-[#3C3489] disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? (
            <span className="inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : null}
          {isEdit ? t.saveChanges : t.createWebhook}
        </button>
      </div>
    </div>
  );
}

// Helper: Tailwind class string for inputs
function input(error?: string) {
  return [
    "w-full px-2.5 py-1.5 text-sm rounded-lg border bg-white",
    "focus:outline-none focus:ring-2 focus:ring-[#534AB7]/15 focus:border-[#7F77DD]",
    error ? "border-[#E24B4A]" : "border-gray-200",
  ].join(" ");
}

// Helper: labelled field wrapper
function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      {children}
      {error && <p className="text-xs text-[#E24B4A]">{error}</p>}
    </div>
  );
}
