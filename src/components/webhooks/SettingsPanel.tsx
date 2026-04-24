"use client";

import { useState, useEffect } from "react";
import {
  saveConnectionSettings,
  loadConnectionSettings,
  clearConnectionSettings,
} from "@/lib/session";
import { useTranslation } from "@/context/LanguageContext";

interface SettingsPanelProps {
  onConnected: () => void;
  onDisconnected: () => void;
}

const API_BASE_URL = "https://edge.sitecorecloud.io/api/admin/v1";

export function SettingsPanel({
  onConnected,
  onDisconnected,
}: SettingsPanelProps) {
  const { t } = useTranslation();

  // Credentials — local state only, never persisted
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);

  const [isConnected, setIsConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hydrate connection state on mount (JWT may already be stored)
  useEffect(() => {
    const saved = loadConnectionSettings();
    if (saved) {
      setIsConnected(true);
    }
  }, []);

  async function handleConnect() {
    setError(null);

    if (!clientId.trim()) {
      setError(t.errorClientIdRequired);
      return;
    }
    if (!clientSecret.trim()) {
      setError(t.errorClientSecretRequired);
      return;
    }

    setConnecting(true);
    try {
      const res = await fetch("/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId.trim(),
          client_secret: clientSecret.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? `${res.status}: ${res.statusText}`);
      }

      const token: string = json.access_token;
      if (!token) throw new Error("No access_token in response.");

      saveConnectionSettings({ apiBaseUrl: API_BASE_URL, apiToken: token });
      // Clear credentials from memory — the JWT is all we keep
      setClientId("");
      setClientSecret("");
      setIsConnected(true);
      onConnected();
    } catch (err) {
      console.log(err);
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
    <div className="p-4 space-y-4">
      {/* Session notice */}
      <div
        className={`flex items-start gap-2 p-3 rounded-lg border text-sm ${
          isConnected
            ? "bg-[#E1F5EE] border-[#1D9E75] text-[#085041]"
            : "bg-[#FAEEDA] border-[#BA7517] text-[#633806]"
        }`}
      >
        <LockIcon className="mt-0.5 shrink-0 w-4 h-4" />
        <span>{isConnected ? t.sessionStoredNotice : t.noSessionNotice}</span>
      </div>

      {/* API Base URL (read-only) */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-500">
          {t.edgeAdminApiUrl}
        </label>
        <div className="px-3 py-1.5 text-sm border border-gray-100 rounded-lg bg-gray-50 text-gray-400 select-all">
          {API_BASE_URL}
        </div>
      </div>

      {/* Client ID */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-500">
          {t.clientId}
        </label>
        <input
          type="text"
          value={clientId}
          onChange={(e) => {
            setClientId(e.target.value);
            setError(null);
          }}
          autoComplete="username"
          className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#7F77DD] focus:ring-2 focus:ring-[#534AB7]/15"
        />
        <p className="text-xs text-gray-400">{t.clientIdHint}</p>
      </div>

      {/* Client Secret */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-500">
          {t.clientSecret}
        </label>
        <div className="relative">
          <input
            type={showSecret ? "text" : "password"}
            value={clientSecret}
            onChange={(e) => {
              setClientSecret(e.target.value);
              setError(null);
            }}
            autoComplete="current-password"
            className="w-full px-3 py-1.5 pr-10 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#7F77DD] focus:ring-2 focus:ring-[#534AB7]/15"
          />
          <button
            type="button"
            onClick={() => setShowSecret((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label={showSecret ? "Hide secret" : "Show secret"}
          >
            {showSecret ? (
              <EyeOffIcon className="w-4 h-4" />
            ) : (
              <EyeIcon className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400">{t.clientSecretHint}</p>
      </div>

      {error && (
        <p className="text-xs text-[#E24B4A] bg-[#FCEBEB] border border-[#E24B4A] rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
        <button
          onClick={handleClear}
          disabled={!isConnected}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E24B4A] bg-[#FCEBEB] text-[#791F1F] hover:bg-[#E24B4A] hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <TrashIcon className="w-3 h-3" />
          {t.clearSession}
        </button>
        <button
          onClick={handleConnect}
          disabled={connecting}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#534AB7] text-white hover:bg-[#3C3489] transition-colors disabled:opacity-50"
        >
          {connecting && (
            <span className="inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          )}
          {connecting ? t.connecting : t.saveAndConnect}
        </button>
      </div>
    </div>
  );
}

// Inline SVG icons
function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="2"
        y="7"
        width="12"
        height="8"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M5 7V5.5a3 3 0 016 0V7"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse
        cx="8"
        cy="8"
        rx="6"
        ry="4"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <circle cx="8" cy="8" r="1.8" fill="currentColor" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2 2l12 12M6.5 6.6A2 2 0 0010 10"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M4 4.9C2.8 5.8 2 7 2 8c0 2.2 2.7 4 6 4 1.1 0 2.2-.2 3.1-.6M12.5 11.5C13.4 10.5 14 9.3 14 8c0-2.2-2.7-4-6-4-.5 0-1 .05-1.5.13"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.5 4h11M5.5 4V3a.5.5 0 01.5-.5h4a.5.5 0 01.5.5v1M6.5 7v5M9.5 7v5M3.5 4l.7 8.5A1 1 0 005.2 13.5h5.6a1 1 0 001-.95L12.5 4"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
