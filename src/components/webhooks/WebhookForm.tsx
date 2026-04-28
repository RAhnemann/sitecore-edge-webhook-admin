"use client";

import { useState, useEffect, useId, Children, isValidElement, cloneElement, type ReactNode, type ReactElement, type HTMLAttributes } from "react";
import type { Webhook, WebhookEdit, ExecutionMode, HttpMethod } from "@/types/webhook";
import { useTranslation } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WebhookFormProps {
  initial?: Webhook;
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

  useEffect(() => {
    if (!initial) {
      setForm((prev) => ({ ...prev, createdBy: currentUser }));
    }
  }, [currentUser, initial]);

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
    else if (!/^https:\/\/.+/.test(form.uri)) errs.uri = t.errorUriFormat;
    if (form.executionMode === "OnUpdate" && form.bodyInclude) {
      try { JSON.parse(form.bodyInclude); }
      catch { errs.bodyInclude = t.errorBodyIncludeJson; }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!validate()) return;
    const payload: WebhookEdit = {
      label: form.label.trim(),
      uri: form.uri.trim(),
      method: form.method,
      executionMode: form.executionMode,
      headers: form.headers,
      createdBy: form.createdBy,
      ...(form.executionMode === "OnEnd"
        ? { body: form.body }
        : { bodyInclude: form.bodyInclude }),
    };
    await onSubmit(payload);
  }

  const isEdit = !!initial;

  return (
    <form onSubmit={handleSubmit} noValidate aria-busy={isSubmitting} className="space-y-3">
      {/* Basic details */}
      <section aria-labelledby="section-basic" className="p-3 rounded-lg border border-border bg-muted space-y-3">
        <p id="section-basic" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t.basicDetails}</p>

        <Field label={t.labelField} error={errors.label}>
          <Input
            type="text"
            value={form.label}
            onChange={(e) => set("label", e.target.value)}
            placeholder="e.g. Production rebuild"
            aria-invalid={!!errors.label}
            className="h-8 text-sm"
          />
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label={t.uri} error={errors.uri}>
            <Input
              type="text"
              value={form.uri}
              onChange={(e) => set("uri", e.target.value)}
              placeholder="https://..."
              aria-invalid={!!errors.uri}
              className="h-8 text-sm"
            />
          </Field>
          <Field label={t.httpMethod}>
            <Select value={form.method} onValueChange={(v) => set("method", v as HttpMethod)}>
              <SelectTrigger size="sm" className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="GET">GET</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </section>

      {/* Execution */}
      <section aria-labelledby="section-execution" className="p-3 rounded-lg border border-border bg-muted space-y-3">
        <p id="section-execution" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t.execution}</p>

        <div className="grid grid-cols-2 gap-2">
          <Field label={t.executionMode}>
            <Select value={form.executionMode} onValueChange={(v) => set("executionMode", v as ExecutionMode)}>
              <SelectTrigger size="sm" className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OnEnd">OnEnd</SelectItem>
                <SelectItem value="OnUpdate">OnUpdate</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label={t.createdBy}>
            <Input
              type="text"
              value={form.createdBy || "—"}
              disabled
              className="h-8 text-sm opacity-60 cursor-not-allowed"
            />
          </Field>
        </div>

        {form.executionMode === "OnEnd" ? (
          <Field label={t.bodyJson} error={errors.body}>
            <Textarea
              value={form.body}
              onChange={(e) => set("body", e.target.value)}
              placeholder='{"rebuild": "true"}'
              aria-invalid={!!errors.body}
              className="min-h-0 h-16 text-sm resize-none"
            />
          </Field>
        ) : (
          <Field label={t.bodyIncludeField} error={errors.bodyInclude}>
            <Textarea
              value={form.bodyInclude}
              onChange={(e) => set("bodyInclude", e.target.value)}
              placeholder='{"key": "value"}'
              aria-invalid={!!errors.bodyInclude}
              className="min-h-0 h-16 text-sm resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">{t.bodyIncludeHint}</p>
          </Field>
        )}
      </section>

      {/* Custom headers */}
      <section aria-labelledby="section-headers" className="p-3 rounded-lg border border-border bg-muted space-y-2">
        <p id="section-headers" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t.customHeaders}</p>

        {Object.entries(form.headers ?? {}).map(([k, v]) => (
          <div key={k} className="flex items-center gap-2 text-xs">
            <code className="flex-1 px-2 py-1 bg-background border border-border rounded font-mono truncate">
              {k}: {v}
            </code>
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              colorScheme="danger"
              onClick={() => removeHeader(k)}
              aria-label={`Remove header ${k}`}
            >
              ✕
            </Button>
          </div>
        ))}

        <div className="flex gap-2">
          <Input
            type="text"
            value={headerKey}
            onChange={(e) => setHeaderKey(e.target.value)}
            placeholder="x-api-key"
            aria-label={t.headerName}
            className="flex-1 h-8 text-sm"
          />
          <Input
            type="text"
            value={headerVal}
            onChange={(e) => setHeaderVal(e.target.value)}
            placeholder="value"
            aria-label={t.headerValue}
            className="flex-1 h-8 text-sm"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            colorScheme="neutral"
            onClick={addHeader}
          >
            {t.addHeader}
          </Button>
        </div>
      </section>

      {/* Footer */}
      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <Button
          type="button"
          size="sm"
          variant="outline"
          colorScheme="neutral"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {t.cancel}
        </Button>
        <Button
          type="submit"
          size="sm"
          colorScheme="primary"
          disabled={isSubmitting}
        >
          {isSubmitting && (
            <span aria-hidden="true" className="inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          )}
          {isEdit ? t.saveChanges : t.createWebhook}
          {isSubmitting && <span className="sr-only">{t.saving}</span>}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  const id = useId();
  const errorId = `${id}-error`;

  const enhanced = Children.map(children, (child, i) => {
    if (i === 0 && isValidElement(child)) {
      return cloneElement(child as ReactElement<HTMLAttributes<HTMLElement>>, {
        id,
        ...(error ? { "aria-describedby": errorId, "aria-invalid": true as const } : {}),
      });
    }
    return child;
  });

  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">{label}</Label>
      {enhanced}
      {error && <p id={errorId} role="alert" className="text-xs text-danger-fg">{error}</p>}
    </div>
  );
}
