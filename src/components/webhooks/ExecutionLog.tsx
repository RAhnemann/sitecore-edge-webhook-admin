"use client";

import type { Webhook } from "@/types/webhook";
import { useTranslation } from "@/context/LanguageContext";

interface ExecutionLogProps {
  webhooks: Webhook[];
  onRefresh: () => void;
  loading: boolean;
}

interface RunRow {
  webhookLabel: string;
  timestamp: string;
  success: boolean;
  message?: string;
}

export function ExecutionLog({ webhooks, onRefresh, loading }: ExecutionLogProps) {
  const { t, meta } = useTranslation();

  // Flatten all lastRuns across webhooks and sort newest first
  const rows: RunRow[] = webhooks
    .flatMap((w) =>
      (w.lastRuns ?? []).map((r) => ({
        webhookLabel: w.label,
        timestamp: r.timestamp,
        success: r.success,
        message: r.message,
      }))
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 50);

  return (
    <div>
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
        <span className="text-xs text-gray-400">
          {rows.length > 0
            ? t.showingLastRuns.replace("{count}", String(rows.length))
            : t.noExecutionHistory}
        </span>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshIcon spinning={loading} />
          {t.refresh}
        </button>
      </div>
      {rows.length === 0 && !loading && (
        <div className="py-10 text-center text-sm text-gray-400">{t.noExecutionHistory}</div>
      )}

      {/* Column headers */}
      {rows.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100 bg-gray-50">
          <span className="w-14 shrink-0 text-xs font-medium text-gray-400 uppercase tracking-wide">{t.logColResult}</span>
          <span className="w-36 shrink-0 text-xs font-medium text-gray-400 uppercase tracking-wide">{t.logColTime}</span>
          <span className="flex-1 min-w-0 text-xs font-medium text-gray-400 uppercase tracking-wide">{t.logColWebhook}</span>
          <span className="w-1/2 shrink-0 text-xs font-medium text-gray-400 uppercase tracking-wide">{t.logColMessage}</span>
        </div>
      )}

      <ul className="divide-y divide-gray-100">
        {rows.map((row, i) => (
          <li key={i} className="flex items-center gap-3 px-4 py-2.5 text-xs">
            {/* Pass / Fail badge */}
            <div className="w-14 shrink-0">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${
                  row.success
                    ? "bg-[#E1F5EE] text-[#085041]"
                    : "bg-[#FCEBEB] text-[#791F1F]"
                }`}
              >
                {row.success ? t.runOk : t.runFail}
              </span>
            </div>

            {/* Timestamp */}
            <span className="text-gray-600 shrink-0 w-36">
              {formatTimestamp(row.timestamp, meta.locale, meta.hour12)}
            </span>

            {/* Webhook name */}
            <span className="flex-1 min-w-0 text-gray-600 truncate">{row.webhookLabel}</span>

            {/* Error message or empty placeholder */}
            <span className="w-1/2 shrink-0 truncate">
              {row.message
                ? <span className="text-[#E24B4A]">{row.message}</span>
                : <span className="text-gray-300">—</span>
              }
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      className={spinning ? "animate-spin" : undefined}
    >
      <path d="M10 6A4 4 0 112 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M10 3v3h-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function formatTimestamp(ts: string, locale: string, hour12: boolean): string {
  try {
    return new Date(ts).toLocaleString(locale, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12,
    });
  } catch {
    return ts;
  }
}
