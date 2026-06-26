"use client";

import { useState, Fragment } from "react";
import type { Webhook, WebhookEdit, TestWebhookResult } from "@/types/webhook";
import { WebhookForm } from "./WebhookForm";
import { updateWebhook, enableWebhook, disableWebhook, deleteWebhook, testWebhook, getWebhook, SessionExpiredError } from "@/lib/api";
import { useTranslation } from "@/context/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

interface WebhookListProps {
  webhooks: Webhook[];
  currentUser: string;
  onRefresh: () => void;
}

export function WebhookList({ webhooks, currentUser, onRefresh }: WebhookListProps) {
  const { t, meta } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editWebhook, setEditWebhook] = useState<Webhook | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editIsDirty, setEditIsDirty] = useState(false);
  const [discardPending, setDiscardPending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Webhook | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmToggle, setConfirmToggle] = useState<Webhook | null>(null);
  const [toggling, setToggling] = useState(false);
  const [runsId, setRunsId] = useState<string | null>(null);
  const [testTarget, setTestTarget] = useState<Webhook | null>(null);
  const [testBody, setTestBody] = useState("");
  const [testResult, setTestResult] = useState<TestWebhookResult | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [testSending, setTestSending] = useState(false);
  const [testLoading, setTestLoading] = useState(false);

  function toggleRuns(id: string) {
    setRunsId((prev) => (prev === id ? null : id));
  }

  /** Friendly message for an error — session expiry gets the reconnect hint. */
  function describeError(err: unknown, fallback: string): string {
    if (err instanceof SessionExpiredError) return t.sessionExpired;
    return err instanceof Error ? err.message : fallback;
  }

  function closeEditForm() {
    setExpandedId(null);
    setEditWebhook(null);
    setEditIsDirty(false);
    setError(null);
  }

  /** If the edit form is dirty, open the discard prompt and return true (intercepted). */
  function guardClose(): boolean {
    if (editIsDirty) { setDiscardPending(true); return true; }
    return false;
  }

  async function toggleEdit(id: string) {
    if (expandedId === id) {
      if (guardClose()) return;
      closeEditForm();
      return;
    }
    if (guardClose()) return;
    setError(null);
    setExpandedId(id);
    setEditWebhook(null);
    setEditIsDirty(false);
    setEditLoading(true);
    try {
      const full = await getWebhook(id);
      setEditWebhook(full);
    } catch (err) {
      setError(describeError(err, "Failed to load webhook."));
      setExpandedId(null);
    } finally {
      setEditLoading(false);
    }
  }

  async function handleUpdate(webhook: Webhook, data: WebhookEdit) {
    setSubmitting(true);
    setError(null);
    try {
      await updateWebhook(webhook.id, data);
      closeEditForm();
      onRefresh();
    } catch (err) {
      setError(describeError(err, "Update failed."));
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmAndToggle() {
    if (!confirmToggle) return;
    setToggling(true);
    setError(null);
    try {
      if (confirmToggle.disabled) {
        await enableWebhook(confirmToggle);
      } else {
        await disableWebhook(confirmToggle);
      }
      setConfirmToggle(null);
      onRefresh();
    } catch (err) {
      setError(describeError(err, "Could not update webhook."));
      setConfirmToggle(null);
    } finally {
      setToggling(false);
    }
  }

  async function confirmAndDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteWebhook(confirmDelete.id);
      setConfirmDelete(null);
      onRefresh();
    } catch (err) {
      setError(describeError(err, "Delete failed."));
      setConfirmDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  function buildTestBody(wh: Webhook, extra: Record<string, unknown> = {}): string {
    if (wh.method !== "POST") return "";
    if (wh.executionMode === "OnEnd") return wh.body ?? "";
    return JSON.stringify(
      {
        invocation_id: "6a271d7b-92de-4d14-8002-8fc97a46c290",
        updates: [
          {
            identifier: "B43D07BD61D5448F93238B6ACAD4F3C4",
            entity_definition: "Item",
            operation: "Update",
            entity_culture: "en",
          },
        ],
        continues: false,
        ...extra,
      },
      null,
      2
    );
  }

  async function openTest(webhook: Webhook) {
    // Set body from list-webhook data immediately so the dialog is usable right away
    setTestTarget(webhook);
    setTestBody(buildTestBody(webhook));
    setTestResult(null);
    setTestError(null);
    setTestLoading(true);
    try {
      const full = await getWebhook(webhook.id);
      // Merge bodyInclude into the sample body if present
      let extra: Record<string, unknown> = {};
      if (full.executionMode !== "OnEnd" && full.bodyInclude) {
        try {
          const parsed =
            typeof full.bodyInclude === "string"
              ? JSON.parse(full.bodyInclude)
              : full.bodyInclude;
          if (parsed !== null && typeof parsed === "object") {
            extra = parsed as Record<string, unknown>;
          }
        } catch { /* leave extra empty */ }
      }
      setTestTarget(full);
      setTestBody(buildTestBody(full, extra));
    } catch (err) {
      setTestError(describeError(err, "Failed to load webhook details."));
      // testTarget and testBody already have usable list-webhook values
    } finally {
      setTestLoading(false);
    }
  }

  function closeTest() {
    setTestTarget(null);
    setTestResult(null);
    setTestError(null);
    setTestSending(false);
    setTestLoading(false);
  }

  async function handleSendTest() {
    if (!testTarget) return;
    setTestSending(true);
    setTestResult(null);
    setTestError(null);
    try {
      const result = await testWebhook(testTarget, testBody);
      setTestResult(result);
    } catch (err) {
      setTestError(err instanceof Error ? err.message : "Test failed.");
    } finally {
      setTestSending(false);
    }
  }

  if (webhooks.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        {t.noWebhooksFound}
      </div>
    );
  }

  return (
    <div>
      {error && (
        <Alert variant="danger" className="mx-4 mb-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Table size="sm" stickyHeader={false}>
        <TableHeader>
          <TableRow>
            <TableHead className="w-2 px-4" />
            <TableHead>{t.colName}</TableHead>
            <TableHead className="hidden sm:table-cell w-24 text-center">{t.colRuns}</TableHead>
            <TableHead className="hidden sm:table-cell w-20 text-center">{t.colMode}</TableHead>
            <TableHead className="w-20 text-center">{t.colStatus}</TableHead>
            <TableHead className="w-28 text-right">{t.colActions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {webhooks.map((webhook) => {
            const isEditing = expandedId === webhook.id;
            const recentFailure = webhook.lastRuns?.some((r) => !r.success) && !webhook.disabled;
            const successCount = webhook.lastRuns?.filter((r) => r.success).length ?? 0;
            const failCount = webhook.lastRuns?.filter((r) => !r.success).length ?? 0;
            const hasRuns = (webhook.lastRuns?.length ?? 0) > 0;

            const statusDotColor = webhook.disabled
              ? "bg-danger-500"
              : recentFailure
              ? "bg-warning-500"
              : "bg-success-500";

            return (
              <Fragment key={webhook.id}>
                <TableRow className="hover:bg-muted/50">
                  <TableCell className="px-4">
                    <span className={`block w-2 h-2 rounded-full ${statusDotColor}`} />
                  </TableCell>

                  <TableCell>
                    <p className="text-sm font-medium text-foreground truncate max-w-xs">{webhook.label}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-xs">{webhook.uri}</p>
                  </TableCell>

                  <TableCell className="hidden sm:table-cell text-center">
                    {hasRuns && (
                      <button
                        type="button"
                        onClick={() => toggleRuns(webhook.id)}
                        className="inline-flex items-center gap-1 hover:bg-muted rounded px-1 py-0.5 transition-colors"
                        title={t.showLastRuns}
                      >
                        <Badge colorScheme="success" size="sm">✓ {successCount}</Badge>
                        <Badge colorScheme="danger" size="sm">✕ {failCount}</Badge>
                      </button>
                    )}
                  </TableCell>

                  <TableCell className="hidden sm:table-cell text-center">
                    <Badge colorScheme="primary" size="sm">{webhook.executionMode}</Badge>
                  </TableCell>

                  <TableCell className="text-center">
                    <Badge
                      colorScheme={webhook.disabled ? "danger" : "success"}
                      size="sm"
                    >
                      {webhook.disabled ? t.statDisabled : t.statActive}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        colorScheme={isEditing ? "primary" : "neutral"}
                        title={isEditing ? t.closeEdit : t.edit}
                        onClick={() => toggleEdit(webhook.id)}
                      >
                        <EditIcon />
                      </Button>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        colorScheme="neutral"
                        title={t.testWebhook}
                        onClick={() => openTest(webhook)}
                      >
                        <FlaskIcon />
                      </Button>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        colorScheme={webhook.disabled ? "success" : "neutral"}
                        title={webhook.disabled ? t.enable : t.disable}
                        onClick={() => setConfirmToggle(webhook)}
                      >
                        {webhook.disabled ? <PlayIcon /> : <PauseIcon />}
                      </Button>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        colorScheme="danger"
                        title={t.delete}
                        onClick={() => setConfirmDelete(webhook)}
                      >
                        <TrashIcon />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>

                {/* Inline edit form */}
                {isEditing && (
                  <TableRow key={`${webhook.id}-edit`}>
                    <TableCell colSpan={6} className="bg-muted p-4">
                      {editLoading ? (
                        <p className="text-sm text-center text-muted-foreground py-2">{t.loadingWebhooks}</p>
                      ) : editWebhook ? (
                        <WebhookForm
                          initial={editWebhook}
                          currentUser={currentUser}
                          onSubmit={(data) => handleUpdate(editWebhook, data)}
                          onCancel={() => { if (!guardClose()) closeEditForm(); }}
                          onDirtyChange={setEditIsDirty}
                          isSubmitting={submitting}
                        />
                      ) : null}
                    </TableCell>
                  </TableRow>
                )}

                {/* Inline last runs */}
                {runsId === webhook.id && (
                  <TableRow key={`${webhook.id}-runs`}>
                    <TableCell colSpan={6} className="bg-muted px-4 pb-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide pt-3 pb-2">
                        {t.lastRuns}
                      </p>
                      <ul className="space-y-1">
                        {(webhook.lastRuns ?? []).map((run, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs">
                            <Badge
                              colorScheme={run.success ? "success" : "danger"}
                              size="sm"
                              className="mt-0.5 shrink-0"
                            >
                              {run.success ? t.runOk : t.runFail}
                            </Badge>
                            <span className="text-muted-foreground">{formatTimestamp(run.timestamp, meta.locale, meta.hour12)}</span>
                            {run.message && (
                              <span className="text-danger-500 truncate" title={run.message}>
                                {run.message}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>

      {/* Discard changes confirmation */}
      <Dialog open={discardPending} onOpenChange={(open) => !open && setDiscardPending(false)}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>{t.unsavedChanges}</DialogTitle>
            <DialogDescription>{t.unsavedChangesMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" colorScheme="neutral" onClick={() => setDiscardPending(false)}>
              {t.cancel}
            </Button>
            <Button colorScheme="danger" onClick={() => { setDiscardPending(false); closeEditForm(); }}>
              {t.discardChanges}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test webhook dialog */}
      <Dialog open={!!testTarget} onOpenChange={(open) => !open && closeTest()}>
        <DialogContent size="md" className="flex flex-col max-h-[85vh]">
          {testTarget && (
            <>
              <DialogHeader>
                <DialogTitle>{t.testWebhook}</DialogTitle>
                <DialogDescription>{testTarget.label}</DialogDescription>
              </DialogHeader>

              <div className="space-y-3 overflow-y-auto min-h-0 flex-1">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    {t.requestPreview}
                  </p>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge colorScheme="primary" size="sm">{testTarget.method}</Badge>
                    <code className="text-xs text-muted-foreground truncate flex-1">{testTarget.uri}</code>
                  </div>
                  {Object.keys(testTarget.headers ?? {}).length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        {t.customHeaders}
                      </p>
                      <div className="space-y-0.5">
                        {Object.entries(testTarget.headers ?? {}).map(([k, v]) => (
                          <div key={k} className="text-xs font-mono text-muted-foreground">
                            {k}: {v}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {testTarget.method === "POST" ? (
                    <Textarea
                      value={testBody}
                      onChange={(e) => setTestBody(e.target.value)}
                      className="text-xs font-mono min-h-0 h-32 resize-none"
                      placeholder={t.testNoBody}
                    />
                  ) : (
                    <p className="text-xs text-muted-foreground italic">{t.testNoBody}</p>
                  )}
                </div>

                {testError && (
                  <Alert variant="danger">
                    <AlertDescription>{testError}</AlertDescription>
                  </Alert>
                )}

                {testResult && (() => {
                  const ok = testResult.status >= 200 && testResult.status < 300;
                  const content = ok ? testResult.body : extractMessage(testResult.body);
                  return (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                        {t.testResponse}
                      </p>
                      <div className="flex items-center gap-3 mb-2">
                        <Badge colorScheme={ok ? "success" : "danger"} size="sm">
                          {testResult.status || "—"} {testResult.statusText}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{testResult.durationMs}ms</span>
                      </div>
                      {content && (
                        <pre className="text-xs bg-muted p-2 rounded border border-border overflow-auto max-h-32 font-mono whitespace-pre-wrap break-all">
                          {content}
                        </pre>
                      )}
                    </div>
                  );
                })()}
              </div>

              <DialogFooter>
                <Button variant="outline" colorScheme="neutral" onClick={closeTest} disabled={testSending}>
                  {t.cancel}
                </Button>
                <Button colorScheme="primary" onClick={handleSendTest} disabled={testSending || testLoading}>
                  {testSending && (
                    <span aria-hidden="true" className="inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  )}
                  {testSending ? t.testSending : t.sendTest}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Enable/Disable confirmation dialog */}
      <Dialog open={!!confirmToggle} onOpenChange={(open) => !open && setConfirmToggle(null)}>
        <DialogContent size="sm">
          {confirmToggle && (() => {
            const isDisabling = !confirmToggle.disabled;
            const title = isDisabling ? t.disableWebhookTitle : t.enableWebhookTitle;
            const message = isDisabling ? t.confirmDisableMessage : t.confirmEnableMessage;
            const effect = isDisabling ? t.disableWebhookEffect : t.enableWebhookEffect;
            const actionLabel = isDisabling ? t.disable : t.enable;
            const loadingLabel = isDisabling ? t.disabling : t.enabling;
            const [before, after] = message.split("{label}");
            return (
              <>
                <DialogHeader>
                  <DialogTitle>{title}</DialogTitle>
                  <DialogDescription>
                    {before}<span className="font-medium text-foreground">{confirmToggle.label}</span>{after}
                    <br />
                    <span className="text-muted-foreground">{effect}</span>
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" colorScheme="neutral" onClick={() => setConfirmToggle(null)} disabled={toggling}>
                    {t.cancel}
                  </Button>
                  <Button
                    colorScheme={isDisabling ? "neutral" : "success"}
                    onClick={confirmAndToggle}
                    disabled={toggling}
                  >
                    {toggling ? loadingLabel : actionLabel}
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <DialogContent size="sm">
          {confirmDelete && (() => {
            const [before, after] = t.confirmDeleteMessage.split("{label}");
            return (
              <>
                <DialogHeader>
                  <DialogTitle>{t.deleteWebhookTitle}</DialogTitle>
                  <DialogDescription>
                    {before}<span className="font-medium text-foreground">{confirmDelete.label}</span>{after}
                    <br />
                    <span className="text-danger-fg">{t.cannotBeUndone}</span>
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" colorScheme="neutral" onClick={() => setConfirmDelete(null)} disabled={deleting}>
                    {t.cancel}
                  </Button>
                  <Button colorScheme="danger" onClick={confirmAndDelete} disabled={deleting}>
                    {deleting ? t.deleting : t.delete}
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Pull the error message out of a JSON error body; fall back to the raw body. */
function extractMessage(body: string): string {
  try {
    const parsed = JSON.parse(body);
    // Handles { error: { message } } and top-level { message }
    const message = parsed?.error?.message ?? parsed?.message;
    if (typeof message === "string" && message) return message;
  } catch {
    /* not JSON — show as-is */
  }
  return body;
}

function formatTimestamp(ts: string, locale: string, hour12: boolean): string {
  try {
    return new Date(ts).toLocaleString(locale, {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12,
    });
  } catch {
    return ts;
  }
}

function FlaskIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
      <path d="M4.5 1v3.5L2 9c-.3.6 0 1.5 1 1.5h6c1 0 1.3-.9 1-1.5L7.5 4.5V1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="3.5" y1="3" x2="8.5" y2="3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
      <path d="M8.5 1.5l2 2-7 7H1.5v-2l7-7z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
      <path d="M2 3h8M4 3V2h4v1M5 5.5v3M7 5.5v3M3 3l.5 7h5L9 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
      <rect x="2.5" y="2" width="2.5" height="8" rx="0.75" fill="currentColor" />
      <rect x="7" y="2" width="2.5" height="8" rx="0.75" fill="currentColor" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
      <path d="M3 2.5l7 3.5-7 3.5V2.5z" fill="currentColor" />
    </svg>
  );
}
