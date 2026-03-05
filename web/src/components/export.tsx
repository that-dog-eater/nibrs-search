// src/components/export.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { Incident } from "@/lib/types";

function csvEscape(v: unknown) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadBlob(content: string, mime: string, filename: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportModal({
  open,
  onClose,
  fetchIncidents,
}: {
  open: boolean;
  onClose: () => void;
  fetchIncidents: (limit: number) => Promise<Incident[]>;
}) {
  const MAX_EXPORT = 5000;

  const [count, setCount] = useState<number>(100);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setErr(null);
    setBusy(false);
    setCount(100);
  }, [open]);

  const canDownload = useMemo(
    () => !busy && count > 0 && count <= MAX_EXPORT,
    [busy, count]
  );

  const exportSome = async (fmt: "csv" | "json") => {
    const take = Math.max(1, Math.min(count, MAX_EXPORT));

    setBusy(true);
    setErr(null);
    try {
      // ✅ fetch fresh from API (not from loaded list)
      const rows = await fetchIncidents(take);

      const content =
        fmt === "json"
          ? JSON.stringify(rows, null, 2)
          : [
              ["incident_id","incident_date","data_year","state_abbr","agency_name","offense_name"].join(","),
              ...rows.map((i) =>
                [
                  csvEscape(i.incident_id),
                  csvEscape(i.incident_date),
                  csvEscape(i.data_year),
                  csvEscape(i.state_abbr),
                  csvEscape(i.agency_name),
                  csvEscape(i.offense_name),
                ].join(",")
              ),
            ].join("\n");

      downloadBlob(
        content,
        fmt === "json" ? "application/json" : "text/csv",
        `nibrs_results_${rows.length}.${fmt}`
      );

      onClose();
    } catch (e: any) {
      setErr(e?.message ?? "Export failed");
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div
      onClick={busy ? undefined : onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.35)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 420,
          background: "white",
          borderRadius: 14,
          border: "1px solid #e2e8f0",
          boxShadow: "0 20px 60px rgba(2,6,23,0.18)",
          padding: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Export results</div>
          <button
            onClick={onClose}
            disabled={busy}
            style={{
              background: "transparent",
              border: "none",
              cursor: busy ? "not-allowed" : "pointer",
              fontSize: 18,
              lineHeight: 1,
              color: "#64748b",
              opacity: busy ? 0.6 : 1,
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div style={{ fontSize: 12.5, color: "#475569", marginBottom: 12 }}>
          This will fetch a fresh export from the API. Max export: <strong>{MAX_EXPORT}</strong>
        </div>

        <label style={{ display: "block", fontSize: 12, color: "#64748b", marginBottom: 6 }}>
          How many incidents do you want to download?
        </label>

        <input
          type="number"
          min={1}
          max={MAX_EXPORT}
          value={count}
          onChange={(e) => setCount(parseInt(e.target.value || "1", 10))}
          disabled={busy}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #e2e8f0",
            outline: "none",
            fontSize: 13,
            fontFamily: "inherit",
            color: "#0f172a",
            marginBottom: 10,
          }}
        />

        {err && (
          <div style={{ fontSize: 12.5, color: "#b91c1c", marginBottom: 10 }}>
            {err}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            disabled={busy}
            style={{
              padding: "8px 12px",
              background: "white",
              color: "#0f172a",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              fontSize: 12.5,
              cursor: busy ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              opacity: busy ? 0.7 : 1,
            }}
          >
            Cancel
          </button>

          <button
            onClick={() => exportSome("csv")}
            disabled={!canDownload}
            style={{
              padding: "8px 12px",
              background: !canDownload ? "#93c5fd" : "#2563eb",
              color: "white",
              border: "none",
              borderRadius: 10,
              fontSize: 12.5,
              cursor: !canDownload ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              opacity: !canDownload ? 0.85 : 1,
            }}
          >
            {busy ? "Fetching…" : "Download CSV"}
          </button>

          <button
            onClick={() => exportSome("json")}
            disabled={!canDownload}
            style={{
              padding: "8px 12px",
              background: !canDownload ? "#93c5fd" : "#2563eb",
              color: "white",
              border: "none",
              borderRadius: 10,
              fontSize: 12.5,
              cursor: !canDownload ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              opacity: !canDownload ? 0.85 : 1,
            }}
          >
            {busy ? "Fetching…" : "Download JSON"}
          </button>
        </div>
      </div>
    </div>
  );
}