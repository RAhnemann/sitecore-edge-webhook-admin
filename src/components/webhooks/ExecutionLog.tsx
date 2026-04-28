"use client";

import type { Webhook } from "@/types/webhook";
import { useTranslation } from "@/context/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

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
      <div className="flex items-center justify-between px-6 py-3 border-b border-border">
        <span className="text-xs text-muted-foreground">
          {rows.length > 0
            ? t.showingLastRuns.replace("{count}", String(rows.length))
            : t.noExecutionHistory}
        </span>
        <Button
          size="xs"
          variant="outline"
          colorScheme="neutral"
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshIcon spinning={loading} />
          {t.refresh}
        </Button>
      </div>

      {rows.length === 0 && !loading && (
        <div className="py-10 text-center text-sm text-muted-foreground">{t.noExecutionHistory}</div>
      )}

      {rows.length > 0 && (
        <Table size="sm" stickyHeader={false}>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">{t.logColResult}</TableHead>
              <TableHead className="w-36">{t.logColTime}</TableHead>
              <TableHead>{t.logColWebhook}</TableHead>
              <TableHead className="w-1/2">{t.logColMessage}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={i} className="hover:bg-muted/50">
                <TableCell>
                  <Badge colorScheme={row.success ? "success" : "danger"} size="sm">
                    {row.success ? t.runOk : t.runFail}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {formatTimestamp(row.timestamp, meta.locale, meta.hour12)}
                </TableCell>
                <TableCell className="text-foreground text-xs truncate max-w-0">
                  <span className="block truncate">{row.webhookLabel}</span>
                </TableCell>
                <TableCell className="text-xs truncate max-w-0">
                  {row.message
                    ? <span className="block truncate text-danger-fg">{row.message}</span>
                    : <span className="text-muted-foreground/50">—</span>
                  }
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={spinning ? "animate-spin" : undefined}>
      <path d="M10 6A4 4 0 112 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M10 3v3h-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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
