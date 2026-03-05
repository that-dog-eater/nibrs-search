"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Victim {
  victim_id: string;
  sex_code: string;
  age_num?: number;
  race_code: string;
  injury_type?: string;
}
interface Offender {
  offender_id: string;
  sex_code: string;
  age_num?: number;
  race_code: string;
}
interface Arrest {
  arrest_transaction_number: string;
  arrest_date: string;
  arrest_type: string;
  statute?: string;
}
interface Offense {
  offense_id: string;
  offense_code: string;
  offense_name: string;
  location_type?: string;
  weapon_type?: string;
}
interface Incident {
  incident_id: string;
  incident_date: string;
  data_year: number;
  state_abbr: string;
  agency_name: string;
  offense_name: string;
  cleared_exceptionally?: string;
  victims?: Victim[];
  offenders?: Offender[];
  arrests?: Arrest[];
  offenses?: Offense[];
}
interface QueryChip {
  key: string;
  label: string;
  value: string;
}
type CitationFormat = "APA" | "MLA" | "Chicago" | "BibTeX";
type ExpandedTab = "victims" | "offenders" | "arrests" | "offenses";

// ─── Citation ─────────────────────────────────────────────────────────────────

function buildCitation(incident: Incident, format: CitationFormat): string {
  const { data_year: year, agency_name: agency, state_abbr: state, incident_id: id } = incident;
  const accessed = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const url = typeof window !== "undefined" ? `${window.location.origin}?incident=${id}` : `https://nibrs.example.gov?incident=${id}`;
  switch (format) {
    case "APA":
      return `Federal Bureau of Investigation. (${year}). Incident ${id} [NIBRS data]. ${agency}, ${state}. Retrieved ${accessed}, from ${url}`;
    case "MLA":
      return `Federal Bureau of Investigation. "Incident ${id}." National Incident-Based Reporting System, ${agency}, ${state}, ${year}. Web. ${accessed}. <${url}>.`;
    case "Chicago":
      return `Federal Bureau of Investigation. "${agency}, ${state} — Incident ${id}." National Incident-Based Reporting System, ${year}. Accessed ${accessed}. ${url}.`;
    case "BibTeX":
      return `@misc{nibrs_${id.replace(/\W/g, "_")},\n  title  = {Incident ${id}},\n  author = {{Federal Bureau of Investigation}},\n  year   = {${year}},\n  note   = {${agency}, ${state}; NIBRS},\n  url    = {${url}}\n}`;
  }
}

// ─── Wave Canvas ──────────────────────────────────────────────────────────────

function WaveCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let frame = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Three waves, each drawn as a simple sine wave along a diagonal band
    const WAVES = [
      { yFrac: 0.38, amp: 55, freq: 0.012, speed: 0.004, lw: 2.0, alpha: 0.22, r: 37,  g: 99,  b: 235 },
      { yFrac: 0.52, amp: 40, freq: 0.009, speed: 0.003, lw: 1.4, alpha: 0.13, r: 96,  g: 165, b: 250 },
      { yFrac: 0.64, amp: 65, freq: 0.015, speed: 0.005, lw: 3.0, alpha: 0.08, r: 147, g: 197, b: 253 },
    ];

    function draw() {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      for (const w of WAVES) {
        ctx.beginPath();
        ctx.lineWidth = w.lw;
        ctx.strokeStyle = `rgba(${w.r},${w.g},${w.b},${w.alpha})`;
        ctx.lineJoin = "round";

        for (let px = 0; px <= W; px += 3) {
          // Base Y: a diagonal line going from top-right to bottom-left
          const baseY = H * w.yFrac + (px / W) * H * 0.35 - H * 0.17;
          const y = baseY + Math.sin(px * w.freq + frame * w.speed) * w.amp
                          + Math.sin(px * w.freq * 0.5 - frame * w.speed * 0.7) * w.amp * 0.4;
          if (px === 0) ctx.moveTo(px, y);
          else ctx.lineTo(px, y);
        }
        ctx.stroke();
      }

      frame++;
      raf = requestAnimationFrame(draw);
    }

    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <canvas
      ref={ref}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}

// ─── Incident Card ────────────────────────────────────────────────────────────

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

function DetailField({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 12px" }}>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 500, color: "#0f172a" }}>{value}</div>
    </div>
  );
}

function IncidentCard({ incident }: { incident: Incident }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<ExpandedTab>("victims");
  const [citeFmt, setCiteFmt] = useState<CitationFormat>("APA");
  const [showCite, setShowCite] = useState(false);
  const [copied, setCopied] = useState(false);

  const tabs: { key: ExpandedTab; label: string; count: number }[] = [
    { key: "victims",   label: "Victims",   count: incident.victims?.length ?? 0 },
    { key: "offenders", label: "Offenders", count: incident.offenders?.length ?? 0 },
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
            <Tag>{incident.agency_name}</Tag>
            {incident.cleared_exceptionally && <Tag color="orange">Cleared</Tag>}
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
                    <DetailField label="Victim ID" value={v.victim_id} />
                    <DetailField label="Sex" value={v.sex_code} />
                    <DetailField label="Age" value={v.age_num ?? "Unknown"} />
                    <DetailField label="Race" value={v.race_code} />
                    {v.injury_type && <DetailField label="Injury" value={v.injury_type} />}
                  </div>
                ))
            )}

            {tab === "offenders" && (
              (incident.offenders ?? []).length === 0
                ? <EmptyTab>No offender data</EmptyTab>
                : incident.offenders!.map((o, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8, marginBottom: 8 }}>
                    <DetailField label="Offender ID" value={o.offender_id} />
                    <DetailField label="Sex" value={o.sex_code} />
                    <DetailField label="Age" value={o.age_num ?? "Unknown"} />
                    <DetailField label="Race" value={o.race_code} />
                  </div>
                ))
            )}

            {tab === "arrests" && (
              (incident.arrests ?? []).length === 0
                ? <EmptyTab>No arrest data</EmptyTab>
                : incident.arrests!.map((a, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8, marginBottom: 8 }}>
                    <DetailField label="Transaction #" value={a.arrest_transaction_number} />
                    <DetailField label="Date" value={a.arrest_date} />
                    <DetailField label="Type" value={a.arrest_type} />
                    {a.statute && <DetailField label="Statute" value={a.statute} />}
                  </div>
                ))
            )}

            {tab === "offenses" && (
              (incident.offenses ?? []).length === 0
                ? <EmptyTab>No offense data</EmptyTab>
                : incident.offenses!.map((o, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8, marginBottom: 8 }}>
                    <DetailField label="Code" value={o.offense_code} />
                    <DetailField label="Offense" value={o.offense_name} />
                    {o.location_type && <DetailField label="Location" value={o.location_type} />}
                    {o.weapon_type && <DetailField label="Weapon" value={o.weapon_type} />}
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

function SmallBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "5px 11px",
        fontSize: 11.5,
        fontWeight: 500,
        fontFamily: "inherit",
        border: "1px solid #e2e8f0",
        borderRadius: 7,
        background: "white",
        color: "#64748b",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function EmptyTab({ children }: { children: string }) {
  return <p style={{ fontSize: 13, color: "#94a3b8", padding: "4px 0" }}>{children}</p>;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

function mockIncidents(chips: QueryChip[]): Incident[] {
  const stateVal = chips.find(c => c.key === "state")?.value ?? "NJ";
  const yearVal = Number(chips.find(c => c.key === "year")?.value ?? 2024);
  const OFFENSES = ["Simple Assault", "Aggravated Assault", "Burglary", "Drug/Narcotic Violations",
    "Theft From Motor Vehicle", "Robbery", "Larceny/Theft", "Motor Vehicle Theft", "Fraud", "Destruction of Property"];
  const AGENCIES = ["Newark PD", "Jersey City PD", "Trenton PD", "Camden County SO", "Paterson PD"];
  return Array.from({ length: 14 }, (_, i) => ({
    incident_id: `NIB-${yearVal}-${String(100000 + i * 1337).padStart(6, "0")}`,
    incident_date: `${yearVal}-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`,
    data_year: yearVal,
    state_abbr: stateVal,
    agency_name: AGENCIES[i % AGENCIES.length],
    offense_name: OFFENSES[i % OFFENSES.length],
    cleared_exceptionally: i % 5 === 0 ? "Death of Offender" : undefined,
    victims: Array.from({ length: (i % 3) + 1 }, (_, j) => ({
      victim_id: `V${j + 1}`, sex_code: ["M", "F", "U"][j % 3],
      age_num: 18 + (i + j) * 3, race_code: ["W", "B", "A", "U"][j % 4],
      injury_type: j === 0 ? ["Minor Injury", "Serious Injury", "None"][i % 3] : undefined,
    })),
    offenders: Array.from({ length: (i % 2) + 1 }, (_, j) => ({
      offender_id: `OF${j + 1}`, sex_code: ["M", "F", "U"][j % 3],
      age_num: 20 + (i + j) * 4, race_code: ["W", "B", "A", "U"][j % 4],
    })),
    arrests: i % 3 === 0 ? [{
      arrest_transaction_number: `ARR-${1000 + i}`,
      arrest_date: `${yearVal}-${String((i % 12) + 1).padStart(2, "0")}-20`,
      arrest_type: "On-View",
      statute: `NJSA 2C:${12 + i}-${1 + (i % 5)}`,
    }] : [],
    offenses: [{
      offense_id: `OFF${i + 1}`,
      offense_code: String(200 + i * 13),
      offense_name: OFFENSES[i % OFFENSES.length],
      location_type: ["Residence/Home", "Highway/Road", "Commercial Building", "Parking Lot"][i % 4],
      weapon_type: i % 2 === 0 ? ["Firearm", "Knife/Cutting Instrument", "Personal Weapons", "None"][i % 4] : undefined,
    }],
  }));
}

// ─── Filter Options ───────────────────────────────────────────────────────────

const FILTERS: Record<string, string[]> = {
  "Offense Type":  ["Assault", "Burglary", "Drug", "Fraud", "Robbery", "Theft"],
  "Clearance":     ["Cleared by Arrest", "Exceptionally Cleared", "Not Cleared"],
  "Location":      ["Residence", "Highway", "Commercial", "Parking Lot"],
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [chips, setChips] = useState<QueryChip[]>([
    { key: "year", label: "year:2024", value: "2024" },
    { key: "state", label: "state:NJ",  value: "NJ" },
  ]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});

  const doSearch = useCallback((currentChips: QueryChip[]) => {
    setLoading(true);
    setSearched(true);
    // 👉 Replace with: fetch(`/api/incidents?q=${query}&year=...&state=...`)
    setTimeout(() => {
      setIncidents(mockIncidents(currentChips));
      setLoading(false);
    }, 600);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const chipRegex = /(\w+):(\S+)/g;
    const newChips: QueryChip[] = [];
    let clean = query;
    let m;
    while ((m = chipRegex.exec(query)) !== null) {
      newChips.push({ key: m[1], label: m[0], value: m[2] });
      clean = clean.replace(m[0], "").trim();
    }
    const merged = [...chips];
    for (const nc of newChips) {
      const idx = merged.findIndex(c => c.key === nc.key);
      if (idx >= 0) merged[idx] = nc; else merged.push(nc);
    }
    setChips(merged);
    if (newChips.length > 0) setQuery(clean);
    doSearch(merged);
  };

  const removeChip = (key: string) => setChips(p => p.filter(c => c.key !== key));

  const toggleFilter = (group: string, val: string) =>
    setActiveFilters(p => {
      const cur = p[group] ?? [];
      return { ...p, [group]: cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val] };
    });

  const exportAll = (fmt: "csv" | "json") => {
    const content = fmt === "json"
      ? JSON.stringify(incidents, null, 2)
      : [["incident_id","incident_date","data_year","state_abbr","agency_name","offense_name"].join(","),
         ...incidents.map(i => [i.incident_id, i.incident_date, i.data_year, i.state_abbr, i.agency_name, i.offense_name].join(","))
        ].join("\n");
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([content], { type: fmt === "json" ? "application/json" : "text/csv" })),
      download: `nibrs_results.${fmt}`,
    });
    a.click();
  };

  return (
    <div style={{ minHeight: "100vh", background: "white", fontFamily: "'Geist', 'Inter', sans-serif", position: "relative" }}>
      <WaveCanvas />

      {/* ── Search Hero ── */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "68px 24px 28px" }}>
        {/* Wordmark */}
        <div style={{ fontFamily: "'Georgia', serif", fontSize: "clamp(30px, 4vw, 46px)", letterSpacing: "-0.04em", color: "#0f172a", marginBottom: 6, fontWeight: 700 }}>
          NIBRS<span style={{ color: "#2563eb" }}>search</span>
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 28 }}>
          National Incident-Based Reporting System · Data Explorer
        </div>

        {/* Search bar */}
        <div style={{ width: "100%", maxWidth: 660, position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", background: "white", border: "1.5px solid #e2e8f0", borderRadius: 13, boxShadow: "0 2px 12px rgba(37,99,235,0.07)", overflow: "hidden" }}>
            <svg style={{ position: "absolute", left: 17, color: "#94a3b8", pointerEvents: "none", flexShrink: 0 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='Try "assault" or type year:2024 state:CA robbery and press Enter'
              autoFocus
              style={{
                flex: 1,
                padding: "16px 110px 16px 48px",
                fontSize: 14.5,
                border: "none",
                outline: "none",
                fontFamily: "inherit",
                color: "#0f172a",
                background: "transparent",
              }}
            />
            <button
              onClick={() => doSearch(chips)}
              style={{
                position: "absolute", right: 7,
                padding: "8px 20px",
                background: "#2563eb",
                color: "white",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Search
            </button>
          </div>

          {/* Chips */}
          {chips.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
              {chips.map(chip => (
                <div
                  key={chip.key}
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px 4px 12px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 99, fontFamily: "'DM Mono', monospace", fontSize: 11.5, fontWeight: 500, color: "#1d4ed8" }}
                >
                  {chip.label}
                  <button
                    onClick={() => removeChip(chip.key)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#1d4ed8", opacity: 0.6, fontSize: 14, lineHeight: 1, padding: "0 1px", display: "flex", alignItems: "center" }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Pre-search state ── */}
      {!searched && (
        <div style={{ position: "relative", zIndex: 1, textAlign: "center", paddingTop: 24, color: "#94a3b8" }}>
          <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 18, fontStyle: "italic", color: "#475569", marginBottom: 6 }}>
            Search the NIBRS database
          </div>
          <div style={{ fontSize: 13 }}>
            Type <code style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, background: "#eff6ff", padding: "2px 7px", borderRadius: 5, color: "#1d4ed8" }}>year:2024 state:NJ assault</code> to get started
          </div>
        </div>
      )}

      {/* ── Results layout ── */}
      {searched && (
        <div style={{ position: "relative", zIndex: 1, display: "flex", maxWidth: 1280, margin: "0 auto", padding: "0 24px 80px", gap: 24 }}>

          {/* Filter sidebar */}
          <aside style={{ width: 210, flexShrink: 0, paddingTop: 2 }}>
            <div style={{ position: "sticky", top: 20, background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 14px" }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid #f1f5f9" }}>
                Filters
              </div>
              {Object.entries(FILTERS).map(([group, options]) => (
                <div key={group} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.06em" }}>{group}</div>
                  {options.map(opt => (
                    <label key={opt} style={{ display: "flex", alignItems: "center", gap: 7, padding: "4px 0", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={(activeFilters[group] ?? []).includes(opt)}
                        onChange={() => toggleFilter(group, opt)}
                        style={{ accentColor: "#2563eb", width: 13, height: 13, cursor: "pointer" }}
                      />
                      <span style={{ fontSize: 12.5, color: "#475569" }}>{opt}</span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </aside>

          {/* Results */}
          <main style={{ flex: 1, minWidth: 0 }}>
            {/* Meta bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ fontSize: 13, color: "#94a3b8" }}>
                {loading ? "Searching…" : <><strong style={{ color: "#0f172a" }}>{incidents.length}</strong> incidents found</>}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <SmallBtn onClick={() => exportAll("csv")}>↓ CSV</SmallBtn>
                <SmallBtn onClick={() => exportAll("json")}>↓ JSON</SmallBtn>
              </div>
            </div>

            {/* Cards */}
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, marginBottom: 8 }}>
                  <div style={{ height: 11, width: "25%", borderRadius: 5, background: "linear-gradient(90deg,#f0f5ff 25%,#e8f0fe 50%,#f0f5ff 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite", marginBottom: 8 }} />
                  <div style={{ height: 15, width: "65%", borderRadius: 5, background: "linear-gradient(90deg,#f0f5ff 25%,#e8f0fe 50%,#f0f5ff 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite", marginBottom: 10 }} />
                  <div style={{ height: 10, width: "45%", borderRadius: 5, background: "linear-gradient(90deg,#f0f5ff 25%,#e8f0fe 50%,#f0f5ff 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
                </div>
              ))
            ) : (
              incidents.map(inc => <IncidentCard key={inc.incident_id} incident={inc} />)
            )}
          </main>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@1&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        button:hover { opacity: 0.85; }
        input::placeholder { color: #94a3b8; }
      `}</style>
    </div>
  );
}
