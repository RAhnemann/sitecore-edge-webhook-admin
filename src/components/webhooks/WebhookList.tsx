"use client";

import { useState, Fragment } from "react";
import type { Webhook, WebhookEdit } from "@/types/webhook";
import { WebhookForm } from "./WebhookForm";
import { updateWebhook, enableWebhook, disableWebhook, deleteWebhook } from "@/lib/api";
import { useTranslation } from "@/context/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Webhook | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmToggle, setConfirmToggle] = useState<Webhook | null>(null);
  const [toggling, setToggling] = useState(false);
  const [runsId, setRunsId] = useState<string | null>(null);

  function toggleRuns(id: string) {
    setRunsId((prev) => (prev === id ? null : id));
  }

  function toggleEdit(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
    setError(null);
  }

  async function handleUpdate(webhook: Webhook, data: WebhookEdit) {
    setSubmitting(true);
    setError(null);
    try {
      await updateWebhook(webhook.id, data);
      setExpandedId(null);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
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
      setError(err instanceof Error ? err.message : "Could not update webhook.");
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
      setError(err instanceof Error ? err.message : "Delete failed.");
      setConfirmDelete(null);
    } finally {
      setDeleting(false);
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
                      <WebhookForm
                        initial={webhook}
                        currentUser={currentUser}
                        onSubmit={(data) => handleUpdate(webhook, data)}
                        onCancel={() => setExpandedId(null)}
                        isSubmitting={submitting}
                      />
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
