"use client";

import { useState, useEffect, type FormEvent } from "react";
import {
  saveConnectionSettings,
  loadConnectionSettings,
  clearConnectionSettings,
} from "@/lib/session";
import { useTranslation } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SettingsPanelProps {
  onConnected: () => void;
  onDisconnected: () => void;
}

const API_BASE_URL = "https://edge.sitecorecloud.io/api/admin/v1";

export function SettingsPanel({ onConnected, onDisconnected }: SettingsPanelProps) {
  const { t } = useTranslation();

  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = loadConnectionSettings();
    if (saved) setIsConnected(true);
  }, []);

  async function handleConnect(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!clientId.trim()) { setError(t.errorClientIdRequired); return; }
    if (!clientSecret.trim()) { setError(t.errorClientSecretRequired); return; }

    setConnecting(true);
    try {
      const res = await fetch("/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId.trim(), client_secret: clientSecret.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `${res.status}: ${res.statusText}`);
      const token: string = json.access_token;
      if (!token) throw new Error("No access_token in response.");
      saveConnectionSettings({ apiBaseUrl: API_BASE_URL, apiToken: token });
      setClientId("");
      setClientSecret("");
      setIsConnected(true);
      onConnected();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch JWT.");
    } finally {
      setConnecting(false);
    }
  }

  function handleClear() {
    clearConnectionSettings();
    setClientId("");
    setClientSecret("");
    setIsConnected(false);
    setError(null);
    onDisconnected();
  }

  return (
    <form onSubmit={handleConnect} className="p-6 space-y-5">
      {/* Session notice */}
      <Alert variant={isConnected ? "success" : "warning"}>
        <AlertDescription>
          {isConnected ? t.sessionStoredNotice : t.noSessionNotice}
        </AlertDescription>
      </Alert>

      {/* API Base URL (read-only) */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{t.edgeAdminApiUrl}</Label>
        <div className="px-3 py-2 text-sm border border-border rounded-lg bg-muted text-muted-foreground select-all font-mono">
          {API_BASE_URL}
        </div>
      </div>

      {/* Client ID */}
      <div className="space-y-1.5">
        <Label htmlFor="client-id" className="text-xs text-muted-foreground">{t.clientId}</Label>
        <Input
          id="client-id"
          type="text"
          value={clientId}
          onChange={(e) => { setClientId(e.target.value); setError(null); }}
          autoComplete="username"
          className="text-sm"
        />
        <p className="text-xs text-muted-foreground">{t.clientIdHint}</p>
      </div>

      {/* Client Secret */}
      <div className="space-y-1.5">
        <Label htmlFor="client-secret" className="text-xs text-muted-foreground">{t.clientSecret}</Label>
        <div className="relative">
          <Input
            id="client-secret"
            type={showSecret ? "text" : "password"}
            value={clientSecret}
            onChange={(e) => { setClientSecret(e.target.value); setError(null); }}
            autoComplete="current-password"
            className="text-sm pr-10"
          />
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            colorScheme="neutral"
            onClick={() => setShowSecret((v) => !v)}
            aria-label={showSecret ? "Hide secret" : "Show secret"}
            className="absolute right-2 top-1/2 -translate-y-1/2"
          >
            {showSecret ? <EyeOffIcon /> : <EyeIcon />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{t.clientSecretHint}</p>
      </div>

      {error && (
        <Alert variant="danger">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center pt-3 border-t border-border">
        <Button
          type="button"
          size="sm"
          variant="outline"
          colorScheme="danger"
          onClick={handleClear}
          disabled={!isConnected}
        >
          <TrashIcon />
          {t.clearSession}
        </Button>
        <Button
          type="submit"
          size="sm"
          colorScheme="primary"
          disabled={connecting}
        >
          {connecting && (
            <span className="inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          )}
          {connecting ? t.connecting : t.saveAndConnect}
        </Button>
      </div>
    </form>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
      <ellipse cx="8" cy="8" rx="6" ry="4" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="8" cy="8" r="1.8" fill="currentColor" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
      <path d="M2 2l12 12M6.5 6.6A2 2 0 0010 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M4 4.9C2.8 5.8 2 7 2 8c0 2.2 2.7 4 6 4 1.1 0 2.2-.2 3.1-.6M12.5 11.5C13.4 10.5 14 9.3 14 8c0-2.2-2.7-4-6-4-.5 0-1 .05-1.5.13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3">
      <path d="M2.5 4h11M5.5 4V3a.5.5 0 01.5-.5h4a.5.5 0 01.5.5v1M6.5 7v5M9.5 7v5M3.5 4l.7 8.5A1 1 0 005.2 13.5h5.6a1 1 0 001-.95L12.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
