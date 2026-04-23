"use client";

import { useState, useEffect, useCallback } from "react";
import { useMarketplaceClient } from "@/hooks/useMarketplaceClient";
import { useTranslation } from "@/context/LanguageContext";
import { isConnected } from "@/lib/session";
import { listWebhooks, createWebhook } from "@/lib/api";
import { SettingsPanel } from "@/components/webhooks/SettingsPanel";
import { WebhookList } from "@/components/webhooks/WebhookList";
import { WebhookForm } from "@/components/webhooks/WebhookForm";
import { ExecutionLog } from "@/components/webhooks/ExecutionLog";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import type { Webhook, WebhookEdit } from "@/types/webhook";

type Tab = "webhooks" | "log" | "create" | "settings";

export default function WebhookAdminPage() {
  const { currentUser, isInitialized } = useMarketplaceClient();
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("webhooks");
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [creating, setCreating] = useState(false);

  // Sync connection state on mount
  useEffect(() => {
    setConnected(isConnected());
  }, []);

  const fetchWebhooks = useCallback(async () => {
    if (!isConnected()) return;
    setLoading(true);
    setFetchError(null);
    try {
      const data = await listWebhooks();
      setWebhooks(data);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : t.failedToLoad);
    } finally {
      setLoading(false);
    }
  }, [t.failedToLoad]);

  // Fetch when connected and on the webhooks/log tab
  useEffect(() => {
    if (connected && (tab === "webhooks" || tab === "log")) {
      fetchWebhooks();
    }
  }, [connected, tab, fetchWebhooks]);

  async function handleCreate(data: WebhookEdit) {
    setCreating(true);
    try {
      await createWebhook(data);
      setTab("webhooks");
      await fetchWebhooks();
    } catch (err) {
      throw err; // Let WebhookForm surface it
    } finally {
      setCreating(false);
    }
  }

  const username = currentUser?.nickname ?? currentUser?.name ?? (isInitialized ? "unknown" : "loading…");

  // Summary counts
  const total = webhooks.length;
  const active = webhooks.filter((w) => !w.disabled).length;
  const disabled = webhooks.filter((w) => w.disabled).length;
  const recentFails = webhooks.filter((w) =>
    w.lastRuns?.some((r) => !r.success)
  ).length;

  const TAB_LABELS: Record<Tab, string> = {
    webhooks: t.tabWebhooks,
    log: t.tabLog,
    create: t.tabCreate,
    settings: t.tabSettings,
  };

  return (
    <div className="flex flex-col min-h-full text-sm font-sans">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#EEEDFE] border-b border-gray-200">
        <div className="flex items-center gap-2.5">
         
        </div>
        <div className="flex items-center gap-2">
          {/* Session status pill */}
          <button
            onClick={() => setTab("settings")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              connected
                ? "bg-[#E1F5EE] border-[#1D9E75] text-[#085041]"
                : "bg-[#FAEEDA] border-[#BA7517] text-[#633806]"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                connected ? "bg-[#1D9E75]" : "bg-[#BA7517]"
              }`}
            />
            {connected ? t.sessionActive : t.notConnected}
          </button>
          <button
            onClick={() => setTab("create")}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#534AB7] text-white hover:bg-[#3C3489] transition-colors"
          >
            <span className="text-base leading-none">+</span>
            {t.newWebhook}
          </button>
          <LanguageSwitcher />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white px-6">
        {(["webhooks", "log", "create", "settings"] as Tab[]).map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
              tab === tabKey
                ? "border-[#534AB7] text-[#534AB7]"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            {TAB_LABELS[tabKey]}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 bg-white">

        {/* Webhooks tab */}
        {tab === "webhooks" && (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-4 gap-3 p-6 bg-gray-50 border-b border-gray-100">
              {[
                { label: t.statTotal,        value: total,       color: "text-gray-800" },
                { label: t.statActive,       value: active,      color: "text-[#1D9E75]" },
                { label: t.statDisabled,     value: disabled,    color: "text-[#E24B4A]" },
                { label: t.statFailedRecent, value: recentFails, color: "text-[#BA7517]" },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="bg-white rounded-lg border border-gray-100 px-4 py-3"
                >
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className={`text-2xl font-medium ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Filter toolbar */}
            <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-100">
              <input
                type="text"
                placeholder={t.searchWebhooks}
                className="flex-1 max-w-xs px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#7F77DD]"
              />
              <button className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50">{t.filterAll}</button>
              <button className="px-3 py-1.5 text-xs border border-[#1D9E75] text-[#1D9E75] rounded-lg hover:bg-[#E1F5EE]">{t.filterActive}</button>
              <button className="px-3 py-1.5 text-xs border border-[#E24B4A] text-[#E24B4A] rounded-lg hover:bg-[#FCEBEB]">{t.filterDisabled}</button>
              <button
                onClick={fetchWebhooks}
                disabled={loading}
                className="ml-auto flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshIcon spinning={loading} />
                {t.refresh}
              </button>
            </div>

            {loading && (
              <div className="py-12 text-center text-xs text-gray-400">{t.loadingWebhooks}</div>
            )}
            {fetchError && (
              <div className="m-6 px-4 py-3 text-xs text-[#791F1F] bg-[#FCEBEB] border border-[#E24B4A] rounded-lg">
                {fetchError}
              </div>
            )}
            {!loading && !fetchError && (
              <WebhookList
                webhooks={webhooks}
                currentUser={username}
                onRefresh={fetchWebhooks}
              />
            )}
          </>
        )}

        {/* Execution log tab */}
        {tab === "log" && (
          <ExecutionLog webhooks={webhooks} onRefresh={fetchWebhooks} loading={loading} />
        )}

        {/* Create tab */}
        {tab === "create" && (
          <div className="p-6 max-w-2xl">
            <WebhookForm
              currentUser={username}
              onSubmit={handleCreate}
              onCancel={() => setTab("webhooks")}
              isSubmitting={creating}
            />
          </div>
        )}

        {/* Settings tab */}
        {tab === "settings" && (
          <div className="max-w-2xl">
            <SettingsPanel
              onConnected={() => {
                setConnected(true);
                setTab("webhooks");
              }}
              onDisconnected={() => {
                setConnected(false);
                setWebhooks([]);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      width="12" height="12" viewBox="0 0 12 12" fill="none"
      className={spinning ? "animate-spin" : undefined}
    >
      <path d="M10 6A4 4 0 112 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M10 3v3h-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WebhookIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
      <circle cx="6" cy="6" r="2.5" fill="white" />
      <path d="M6 1v2M6 9v2M1 6h2M9 6h2" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
