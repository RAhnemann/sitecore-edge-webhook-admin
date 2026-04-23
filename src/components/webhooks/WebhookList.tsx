"use client";

import { useState } from "react";
import type { Webhook, WebhookEdit } from "@/types/webhook";
import { WebhookForm } from "./WebhookForm";
import { updateWebhook, enableWebhook, disableWebhook, deleteWebhook } from "@/lib/api";
import { useTranslation } from "@/context/LanguageContext";

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
      <div className="py-10 text-center text-sm text-gray-400">
        {t.noWebhooksFound}
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mx-4 mb-2 px-3 py-2 text-xs text-[#791F1F] bg-[#FCEBEB] border border-[#E24B4A] rounded-lg">
          {error}
        </div>
      )}

      <ul className="divide-y divide-gray-100">
        {webhooks.map((webhook) => {
          const isEditing = expandedId === webhook.id;
          const recentFailure =
            webhook.lastRuns?.some((r) => !r.success) && !webhook.disabled;

          const successCount = webhook.lastRuns?.filter((r) => r.success).length ?? 0;
          const failCount = webhook.lastRuns?.filter((r) => !r.success).length ?? 0;
          const hasRuns = (webhook.lastRuns?.length ?? 0) > 0;

          return (
            <li key={webhook.id} className="relative">
              {/* Row */}
              <div className="flex items-center gap-3 px-4 py-3">
                {/* Status dot */}
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    webhook.disabled
                      ? "bg-[#E24B4A]"
                      : recentFailure
                      ? "bg-[#BA7517]"
                      : "bg-[#1D9E75]"
                  }`}
                />

                {/* Label + URI */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{webhook.label}</p>
                  <p className="text-xs text-gray-400 truncate">{webhook.uri}</p>
                </div>

                {/* Run counts — clickable to expand */}
                {hasRuns && (
                  <button
                    type="button"
                    onClick={() => toggleRuns(webhook.id)}
                    className="hidden sm:flex items-center gap-1.5 shrink-0 rounded px-1 py-0.5 hover:bg-gray-100 transition-colors"
                    title={t.showLastRuns}
                  >
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-[#E1F5EE] text-[#085041]">
                      ✓ {successCount}
                    </span>
                    {failCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-[#FCEBEB] text-[#791F1F]">
                        ✕ {failCount}
                      </span>
                    )}
                  </button>
                )}

                {/* Badges */}
                <span className="hidden sm:inline-flex px-2 py-0.5 text-xs font-medium rounded bg-[#EEEDFE] text-[#26215C]">
                  {webhook.executionMode}
                </span>
                <span
                  className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                    webhook.disabled
                      ? "bg-[#FCEBEB] text-[#791F1F]"
                      : "bg-[#E1F5EE] text-[#085041]"
                  }`}
                >
                  {webhook.disabled ? t.statDisabled : t.statActive}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <IconButton
                    title={isEditing ? t.closeEdit : t.edit}
                    onClick={() => toggleEdit(webhook.id)}
                    hoverClass={
                      isEditing
                        ? "bg-[#EEEDFE] text-[#534AB7] border-[#7F77DD]"
                        : "hover:bg-[#EEEDFE] hover:text-[#534AB7] hover:border-[#7F77DD]"
                    }
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    title={webhook.disabled ? t.enable : t.disable}
                    onClick={() => setConfirmToggle(webhook)}
                    hoverClass={
                      webhook.disabled
                        ? "hover:bg-[#E1F5EE] hover:text-[#085041] hover:border-[#1D9E75]"
                        : "hover:bg-[#FAEEDA] hover:text-[#633806] hover:border-[#BA7517]"
                    }
                  >
                    {webhook.disabled ? <PlayIcon /> : <PauseIcon />}
                  </IconButton>
                  <IconButton
                    title={t.delete}
                    onClick={() => setConfirmDelete(webhook)}
                    hoverClass="hover:bg-[#FCEBEB] hover:text-[#E24B4A] hover:border-[#E24B4A]"
                  >
                    <TrashIcon />
                  </IconButton>
                </div>
              </div>

              {/* Inline edit form */}
              {isEditing && (
                <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
                  <div className="pt-3">
                    <WebhookForm
                      initial={webhook}
                      currentUser={currentUser}
                      onSubmit={(data) => handleUpdate(webhook, data)}
                      onCancel={() => setExpandedId(null)}
                      isSubmitting={submitting}
                    />
                  </div>
                </div>
              )}

              {/* Inline last runs */}
              {runsId === webhook.id && (
                <div className="px-4 pb-3 bg-gray-50 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide pt-3 pb-2">
                    {t.lastRuns}
                  </p>
                  <ul className="space-y-1">
                    {(webhook.lastRuns ?? []).map((run, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs">
                        <span
                          className={`mt-0.5 shrink-0 px-1.5 py-0.5 rounded font-medium ${
                            run.success ? "bg-[#E1F5EE] text-[#085041]" : "bg-[#FCEBEB] text-[#791F1F]"
                          }`}
                        >
                          {run.success ? t.runOk : t.runFail}
                        </span>
                        <span className="text-gray-500">{formatTimestamp(run.timestamp, meta.locale, meta.hour12)}</span>
                        {run.message && (
                          <span className="text-[#E24B4A] truncate" title={run.message}>
                            {run.message}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Disable / Enable confirmation dialog */}
      {confirmToggle && (() => {
        const isDisabling = !confirmToggle.disabled;
        const title = isDisabling ? t.disableWebhookTitle : t.enableWebhookTitle;
        const message = isDisabling ? t.confirmDisableMessage : t.confirmEnableMessage;
        const effect = isDisabling ? t.disableWebhookEffect : t.enableWebhookEffect;
        const actionLabel = isDisabling ? t.disable : t.enable;
        const loadingLabel = isDisabling ? t.disabling : t.enabling;
        const [before, after] = message.split("{label}");
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-sm mx-4 p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-1">{title}</h2>
              <p className="text-xs text-gray-500 mb-1">
                {before}<span className="font-medium text-gray-800">{confirmToggle.label}</span>{after}
              </p>
              <p className="text-xs text-gray-400 mb-5">{effect}</p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setConfirmToggle(null)}
                  disabled={toggling}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={confirmAndToggle}
                  disabled={toggling}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg text-white transition-colors disabled:opacity-50 ${
                    isDisabling
                      ? "bg-[#BA7517] hover:bg-[#996010]"
                      : "bg-[#1D9E75] hover:bg-[#157a5a]"
                  }`}
                >
                  {toggling ? loadingLabel : actionLabel}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Delete confirmation dialog */}
      {confirmDelete && (() => {
        const [before, after] = t.confirmDeleteMessage.split("{label}");
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-sm mx-4 p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-1">{t.deleteWebhookTitle}</h2>
              <p className="text-xs text-gray-500 mb-1">
                {before}
                <span className="font-medium text-gray-800">{confirmDelete.label}</span>
                {after}
              </p>
              <p className="text-xs text-[#791F1F] mb-5">{t.cannotBeUndone}</p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setConfirmDelete(null)}
                  disabled={deleting}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={confirmAndDelete}
                  disabled={deleting}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#E24B4A] text-white hover:bg-[#c03a39] transition-colors disabled:opacity-50"
                >
                  {deleting ? t.deleting : t.delete}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
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

function IconButton({
  title,
  onClick,
  hoverClass,
  children,
}: {
  title: string;
  onClick: () => void;
  hoverClass: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`flex items-center justify-center w-7 h-7 rounded-lg border border-gray-200 text-gray-400 transition-colors ${hoverClass}`}
    >
      {children}
    </button>
  );
}

function EditIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M8.5 1.5l2 2-7 7H1.5v-2l7-7z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M2 3h8M4 3V2h4v1M5 5.5v3M7 5.5v3M3 3l.5 7h5L9 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect x="2.5" y="2" width="2.5" height="8" rx="0.75" fill="currentColor" />
      <rect x="7" y="2" width="2.5" height="8" rx="0.75" fill="currentColor" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M3 2.5l7 3.5-7 3.5V2.5z" fill="currentColor" />
    </svg>
  );
}
