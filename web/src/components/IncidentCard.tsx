"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import type {
  Incident,
  ExpandedTab,
  CitationFormat,
} from "@/lib/types";

import { buildCitation } from "@/lib/citations";
import { SmallBtn } from "./ui";

function Tag({ children, color }: { children: React.ReactNode; color?: "blue" | "green" | "orange" }) {
  const bg = color === "blue" ? "#eff6ff" : color === "green" ? "#f0fdf4" : color === "orange" ? "#fff7ed" : "#f8fafc";
  const border = color === "blue" ? "#bfdbfe" : color === "green" ? "#bbf7d0" : color === "orange" ? "#fed7aa" : "#e2e8f0";
  const text = color === "blue" ? "#1d4ed8" : color === "green" ? "#166534" : color === "orange" ? "#c2410c" : "#475569";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 500, background: bg, border: `1px solid ${border}`, color: text }}>
      {children}
    </span>
  );
}

function DetailField({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 12px" }}>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 500, color: "#0f172a" }}>{value ?? "—"}</div>
    </div>
  );
}

export function IncidentCard({ incident }: { incident: Incident }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<ExpandedTab>("victims");
  const [citeFmt, setCiteFmt] = useState<CitationFormat>("APA");
  const [showCite, setShowCite] = useState(false);
  const [copied, setCopied] = useState(false);

  const tabs: { key: ExpandedTab; label: string; count: number }[] = [
    { key: "victims",   label: "Victims",   count: incident.victims?.length ?? 0 },
    { key: "arrests",   label: "Arrests",   count: incident.arrests?.length ?? 0 },
    { key: "offenses",  label: "Offenses",  count: incident.offenses?.length ?? 0 },
  ];

  const citationText = buildCitation(incident, citeFmt);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(citationText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const exportFile = (format: "csv" | "json") => {
    let content: string, type: string, ext: string;
    if (format === "json") {
      content = JSON.stringify(incident, null, 2); type = "application/json"; ext = "json";
    } else {
      const keys: (keyof Incident)[] = ["incident_id", "incident_date", "data_year", "state_abbr", "agency_name", "offense_name"];
      content = [keys.join(","), keys.map(k => String(incident[k] ?? "")).join(",")].join("\n");
      type = "text/csv"; ext = "csv";
    }
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([content], { type })),
      download: `nibrs_${incident.incident_id}.${ext}`,
    });
    a.click();
  };

  return (
    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, marginBottom: 8, boxShadow: "0 1px 3px rgba(37,99,235,0.06)", overflow: "hidden", transition: "box-shadow 0.2s" }}>
      {/* Header — always visible */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", cursor: "pointer", userSelect: "none" }}
      >
        {/* Left: text info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.08em", color: "#94a3b8", marginBottom: 3 }}>
            {incident.incident_id}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 7, lineHeight: 1.3 }}>
            {incident.offense_name}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            <Tag color="blue">{incident.state_abbr}</Tag>
            <Tag color="green">{incident.incident_date}</Tag>
            
            {(() => {
              const hasArrest = (incident.arrests?.length ?? 0) > 0;
              const exceptionally = Boolean(incident.cleared_exceptionally);

              if (hasArrest) return <Tag color="green">Cleared by Arrest</Tag>;
              if (exceptionally) return <Tag color="orange">Exceptionally Cleared</Tag>;
              return <Tag>Not Cleared</Tag>;
            })()}
          </div>
        </div>

        {/* Right: buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          <SmallBtn onClick={() => exportFile("csv")}>CSV</SmallBtn>
          <SmallBtn onClick={() => exportFile("json")}>JSON</SmallBtn>
          <SmallBtn onClick={() => setOpen(o => !o)}>
            {open ? "▲" : "▼"}
          </SmallBtn>
        </div>
      </div>

      {/* Expanded body */}
      {open && (
        <div style={{ borderTop: "1px solid #f1f5f9", background: "#f8faff" }}>
          <div style={{ padding: "14px 16px" }}>
            {/* Tab bar */}
            <div style={{ display: "flex", gap: 2, background: "#e2e8f0", borderRadius: 8, padding: 2, width: "fit-content", marginBottom: 14 }}>
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  style={{
                    padding: "5px 13px",
                    fontSize: 12,
                    fontWeight: 500,
                    borderRadius: 6,
                    border: "none",
                    cursor: "pointer",
                    background: tab === t.key ? "white" : "transparent",
                    color: tab === t.key ? "#0f172a" : "#64748b",
                    boxShadow: tab === t.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                    transition: "all 0.15s",
                    fontFamily: "inherit",
                  }}
                >
                  {t.label} <span style={{ opacity: 0.6, fontSize: 10 }}>({t.count})</span>
                </button>
              ))}
            </div>

            {/* Tab content */}

            {tab === "victims" && (
              (incident.victims ?? []).length === 0
                ? <EmptyTab>No victim data</EmptyTab>
                : incident.victims!.map((v, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8, marginBottom: 8 }}>
                    <DetailField label="Sex" value={v.sex_code ?? "—"} />
                    <DetailField label="Age" value={v.age_num ?? "—"} />
                    <DetailField label="Race" value={v.race_code ?? "—"} />
                    <DetailField label="Injury Type" value={v.injury_type ?? "—"} />
                  </div>
                ))
            )}

            {tab === "offenses" && (
              (incident.offenses ?? []).length === 0
                ? <EmptyTab>No offense data</EmptyTab>
                : incident.offenses!.map((o, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8, marginBottom: 8 }}>
                    <DetailField label="Offense Code" value={o.offense_code ?? "—"} />
                    <DetailField label="Attempt" value={o.offense_attempt ?? "—"} />
                    <DetailField label="Location" value={o.offense_location ?? "—"} />
                    <DetailField label="Weapon" value={o.offence_weapon ?? "—"} />
                  </div>
                ))
            )}

            {tab === "arrests" && (
              (incident.arrests ?? []).length === 0
                ? <EmptyTab>No arrest data</EmptyTab>
                : incident.arrests!.map((a, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8, marginBottom: 8 }}>
                    <DetailField label="Offense" value={a.arrest_offense ?? "—"} />
                    <DetailField label="Age" value={a.arrest_age ?? "—"} />
                    <DetailField label="Sex" value={a.arrest_sex ?? "—"} />
                    <DetailField label="Race" value={a.arrest_race ?? "—"} />
                    <DetailField label="Type" value={a.arrest_type ?? "—"} />
                  </div>
                ))
            )}

            {/* Citation */}
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: showCite ? 10 : 0 }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94a3b8" }}>
                  Cite This Incident
                </span>
                <SmallBtn onClick={() => setShowCite(s => !s)}>
                  {showCite ? "Hide" : "Cite"}
                </SmallBtn>
              </div>
              {showCite && (
                <div>
                  <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                    {(["APA", "MLA", "Chicago", "BibTeX"] as CitationFormat[]).map(f => (
                      <button
                        key={f}
                        onClick={() => setCiteFmt(f)}
                        style={{
                          padding: "3px 10px",
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 10.5,
                          letterSpacing: "0.03em",
                          border: "1px solid",
                          borderRadius: 6,
                          cursor: "pointer",
                          borderColor: citeFmt === f ? "#93c5fd" : "#e2e8f0",
                          background: citeFmt === f ? "#eff6ff" : "white",
                          color: citeFmt === f ? "#1d4ed8" : "#64748b",
                        }}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                  <div style={{ position: "relative", background: "white", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px" }}>
                    <pre style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, lineHeight: 1.6, color: "#475569", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0, paddingRight: 52 }}>
                      {citationText}
                    </pre>
                    <button
                      onClick={handleCopy}
                      style={{
                        position: "absolute", top: 8, right: 8,
                        padding: "4px 9px",
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 10,
                        background: copied ? "#f0fdf4" : "#eff6ff",
                        border: `1px solid ${copied ? "#bbf7d0" : "#bfdbfe"}`,
                        borderRadius: 5,
                        color: copied ? "#166534" : "#1d4ed8",
                        cursor: "pointer",
                      }}
                    >
                      {copied ? "✓ Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyTab({ children }: { children: string }) {
  return <p style={{ fontSize: 13, color: "#94a3b8", padding: "4px 0" }}>{children}</p>;
}