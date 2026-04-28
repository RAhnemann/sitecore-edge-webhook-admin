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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { Webhook, WebhookEdit } from "@/types/webhook";

export default function WebhookAdminPage() {
  const { currentUser, isInitialized } = useMarketplaceClient();
  const { t } = useTranslation();
  const [tab, setTab] = useState("webhooks");
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "disabled">("all");

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
      throw err;
    } finally {
      setCreating(false);
    }
  }

  const username = currentUser?.nickname ?? currentUser?.name ?? (isInitialized ? "unknown" : "loading…");

  const total = webhooks.length;
  const active = webhooks.filter((w) => !w.disabled).length;
  const disabled = webhooks.filter((w) => w.disabled).length;
  const recentFails = webhooks.filter((w) =>
    w.lastRuns?.some((r) => !r.success)
  ).length;

  const visibleWebhooks = webhooks.filter((w) => {
    if (filter === "active" && w.disabled) return false;
    if (filter === "disabled" && !w.disabled) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return w.label.toLowerCase().includes(q) || w.uri.toLowerCase().includes(q);
    }
    return true;
  });

  const availableTabs = ["webhooks", "log", ...(connected ? ["create"] : []), "settings"];

  const TAB_LABELS: Record<string, string> = {
    webhooks: t.tabWebhooks,
    log: t.tabLog,
    create: t.tabCreate,
    settings: t.tabSettings,
  };

  return (
    <div className="flex flex-col min-h-full font-sans max-w-[1280px] mx-auto w-full">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-primary-bg border-b border-border">
        <div />
        <div className="flex items-center gap-2">
          <Badge
            asChild
            colorScheme={connected ? "success" : "warning"}
            className="cursor-pointer gap-1.5"
          >
            <button onClick={() => setTab("settings")} type="button">
              <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-success-500" : "bg-warning-500"}`} />
              {connected ? t.sessionActive : t.notConnected}
            </button>
          </Badge>
          {connected && (
            <Button size="sm" colorScheme="primary" onClick={() => setTab("create")}>
              <span className="text-base leading-none">+</span>
              {t.newWebhook}
            </Button>
          )}
          <LanguageSwitcher />
        </div>
      </div>

      {/* Tabs + Content */}
      <Tabs value={tab} onValueChange={setTab} className="flex flex-col flex-1 bg-background">
        <TabsList className="justify-start rounded-none border-b border-border bg-background px-6 h-auto py-0">
          {availableTabs.map((tabKey) => (
            <TabsTrigger
              key={tabKey}
              value={tabKey}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 text-xs font-medium text-muted-foreground data-[state=active]:text-primary"
            >
              {TAB_LABELS[tabKey]}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Webhooks tab */}
        <TabsContent value="webhooks" className="mt-0 flex-1">
          {/* Summary stats */}
          <div className="grid grid-cols-4 gap-3 p-6 bg-muted border-b border-border">
            {[
              { label: t.statTotal,        value: total,       colorScheme: "neutral" as const },
              { label: t.statActive,       value: active,      colorScheme: "success" as const },
              { label: t.statDisabled,     value: disabled,    colorScheme: "danger" as const },
              { label: t.statFailedRecent, value: recentFails, colorScheme: "warning" as const },
            ].map(({ label, value, colorScheme }) => (
              <Card key={label} style="outline" padding="md">
                <CardContent className="p-0">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <Badge colorScheme={colorScheme} size="lg" className="mt-1 text-xl font-medium h-auto py-0.5 px-0 bg-transparent">
                    {value}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filter toolbar */}
          <div className="flex items-center gap-2 px-6 py-3 border-b border-border">
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchWebhooks}
              className="flex-1 max-w-xs h-8 text-xs"
            />
            <Button
              size="xs"
              variant={filter === "all" ? "default" : "outline"}
              colorScheme={filter === "all" ? "neutral" : "neutral"}
              onClick={() => setFilter("all")}
            >{t.filterAll}</Button>
            <Button
              size="xs"
              variant={filter === "active" ? "default" : "outline"}
              colorScheme="success"
              onClick={() => setFilter("active")}
            >{t.filterActive}</Button>
            <Button
              size="xs"
              variant={filter === "disabled" ? "default" : "outline"}
              colorScheme="danger"
              onClick={() => setFilter("disabled")}
            >{t.filterDisabled}</Button>
            <Button
              size="xs"
              variant="outline"
              colorScheme="neutral"
              onClick={fetchWebhooks}
              disabled={loading}
              className="ml-auto"
            >
              <RefreshIcon spinning={loading} />
              {t.refresh}
            </Button>
          </div>

          {loading && (
            <div className="py-12 text-center text-xs text-muted-foreground">{t.loadingWebhooks}</div>
          )}
          {fetchError && (
            <Alert variant="danger" className="m-6">
              <AlertDescription>{fetchError}</AlertDescription>
            </Alert>
          )}
          {!loading && !fetchError && (
            <WebhookList
              webhooks={visibleWebhooks}
              currentUser={username}
              onRefresh={fetchWebhooks}
            />
          )}
        </TabsContent>

        {/* Execution log tab */}
        <TabsContent value="log" className="mt-0 flex-1">
          <ExecutionLog webhooks={webhooks} onRefresh={fetchWebhooks} loading={loading} />
        </TabsContent>

        {/* Create tab */}
        <TabsContent value="create" className="mt-0 p-6 max-w-2xl">
          <WebhookForm
            currentUser={username}
            onSubmit={handleCreate}
            onCancel={() => setTab("webhooks")}
            isSubmitting={creating}
          />
        </TabsContent>

        {/* Settings tab */}
        <TabsContent value="settings" className="mt-0 max-w-2xl">
          <SettingsPanel
            onConnected={() => {
              setConnected(true);
              setTab("webhooks");
            }}
            onDisconnected={() => {
              setConnected(false);
              setWebhooks([]);
              setTab((prev) => (prev === "create" ? "webhooks" : prev));
            }}
          />
        </TabsContent>
      </Tabs>
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
