"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────
import type {
  Incident,
  QueryChip,
  CitationFormat,
  ExpandedTab,
} from "@/lib/types";

// ─── Citation ────────────────────────────────────────────────────────────────
import { buildCitation } from "@/lib/citations";

// ─── Exports ────────────────────────────────────────────────────────────────
import { ExportModal } from "@/components/export";

// ─── Wave Canvas ─────────────────────────────────────────────────────────────
import { WaveCanvas } from "@/components/WaveCanvas";

// ─── Incident Card ───────────────────────────────────────────────────────────
import { IncidentCard } from "@/components/IncidentCard";

// ─── Mock / Data Fetching ────────────────────────────────────────────────────
import { getIncidents } from "@/lib/data/data";

// ─── Filter Options ──────────────────────────────────────────────────────────
import { FILTERS } from "@/lib/filter/FiltersSidebar";
import { FiltersSidebar } from "@/components/FiltersSidebar";
import { FILTER_KEY_BY_GROUP } from "@/lib/filter/config";

// ─── Search ──────────────────────────────────────────────────────────────────
import { parseQueryToChips } from "@/lib/search/chips";
import { splitBaseChips, filtersToChips } from "@/lib/search/buildChips";

// ─── Main Page UI ────────────────────────────────────────────────────────────
import { SmallBtn } from "@/components/ui";



const FILTER_KEYS = new Set(["offense_code", "location_code"]);


export default function HomePage() {
  const [query, setQuery] = useState("");
  const [chips, setChips] = useState<QueryChip[]>([
    { key: "year", label: "year:2022", value: "2022" },
    { key: "state", label: "state:NJ",  value: "NJ" },
  ]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});

  const [exportOpen, setExportOpen] = useState(false);

  const baseChips = splitBaseChips(chips);
  const filterChips = filtersToChips(activeFilters);
  const chipsToRender = [...baseChips, ...filterChips];

  // ---- Sidebar "Top + Show more" state ----
  const [showMore, setShowMore] = useState<Record<string, boolean>>({});

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const PAGE_SIZE = 50;

  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const doSearch = useCallback(
    async (
      currentChips: QueryChip[],
      qOverride?: string,
      mode: "replace" | "append" = "replace",
      offsetOverride?: number
    ) => {
      const useOffset = offsetOverride ?? (mode === "append" ? offset + PAGE_SIZE : 0);

      // prevent double fetch storms
      if (mode === "append") {
        if (loading || loadingMore || !hasMore) return;
        setLoadingMore(true);
      } else {
        setLoading(true);
        setSearched(true);
        setOffset(0);
        setHasMore(true);
      }

      try {
        const pagingChips: QueryChip[] = [
          { key: "limit", label: `limit:${PAGE_SIZE}`, value: String(PAGE_SIZE) },
          { key: "offset", label: `offset:${useOffset}`, value: String(useOffset) },
        ];

        const data = await getIncidents({
          chips: [...currentChips, ...pagingChips],
          q: qOverride ?? query,
        });

        if (mode === "append") {
          setIncidents((prev) => [...prev, ...data]);
          setOffset(useOffset);
        } else {
          setIncidents(data);
          setOffset(0);
        }

        setHasMore(data.length === PAGE_SIZE);
      } catch (err) {
        console.error(err);
        if (mode === "replace") setIncidents([]);
        setHasMore(false);
      } finally {
        if (mode === "append") setLoadingMore(false);
        else setLoading(false);
      }
    },
    [query, offset, PAGE_SIZE, loading, loadingMore, hasMore]
  );

  const loadMore = useCallback(() => {
    if (!searched) return;
    const merged = [...baseChips, ...filterChips];
    doSearch(merged, undefined, "append");
  }, [searched, baseChips, filterChips, doSearch]);

  useEffect(() => {
    if (!searched) return;
    const el = loadMoreRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { root: null, rootMargin: "600px", threshold: 0 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [searched, loadMore]);

  const runSearchFromInput = useCallback(() => {
    const { mergedChips, cleanQuery } = parseQueryToChips(query, chips);

    const nextBase = mergedChips.filter(
      c => c.key !== "offense_code" && c.key !== "location_code"
    );

    setChips(nextBase);
    setQuery(cleanQuery);

    // first page: offset 0
    doSearch([...nextBase, ...filterChips], cleanQuery, "replace", 0);
  }, [query, chips, doSearch, filterChips]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") runSearchFromInput();
  };

  const removeChip = (chip: QueryChip) => {
    // base chips (year/state) are removed from chips state
    if (chip.key !== "offense_code" && chip.key !== "location_code") {
      setChips(p => p.filter(c => !(c.key === chip.key && String(c.value) === String(chip.value))));
      return;
    }

    // filter chips remove from activeFilters so they don't come back
    const group = chip.key === "offense_code" ? "Offense" : "Location";
    setActiveFilters(p => {
      const cur = p[group] ?? [];
      const next = cur.filter(v => String(v) !== String(chip.value));
      const out = { ...p, [group]: next };

      const nextFilterChips: QueryChip[] = Object.entries(out).flatMap(([g, vals]) => {
        const k = FILTER_KEY_BY_GROUP[g];
        if (!k) return [];
        return (vals ?? []).map(code => ({ key: k, value: code, label: `${k}:${code}` }));
      });

      const nextMerged = [...baseChips, ...nextFilterChips];
      if (searched) doSearch(nextMerged);

      return out;
    });
  };

  const toggleFilter = (group: string, val: string) =>
    setActiveFilters(prev => {
      const cur = prev[group] ?? [];
      const next = cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val];
      const out = { ...prev, [group]: next };

      // run search using baseChips + NEW filters
      const nextFilterChips: QueryChip[] = Object.entries(out).flatMap(([g, vals]) => {
        const k = FILTER_KEY_BY_GROUP[g];
        if (!k) return [];
        return (vals ?? []).map(code => ({ key: k, value: code, label: `${k}:${code}` }));
      });

      const nextMerged = [...baseChips, ...nextFilterChips];
      if (searched) doSearch(nextMerged);

      return out;
    });

  const fetchIncidentsForExport = useCallback(
    async (limit: number) => {
      // ✅ same params as current search, but REMOVE bundle for export
      const merged = [...baseChips, ...filterChips].filter(c => c.key !== "bundle");

      const pagingChips: QueryChip[] = [
        { key: "limit", label: `limit:${limit}`, value: String(limit) },
        { key: "offset", label: "offset:0", value: "0" },
      ];

      return await getIncidents({
        chips: [...merged, ...pagingChips],
        q: query,
        bundle: false,
      });
    },
    [baseChips, filterChips, query]
  );

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
        {/* Search bar */}
        <div style={{ width: "100%", maxWidth: 660, position: "relative" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "white",
              border: "1.5px solid #e2e8f0",
              borderRadius: 13,
              boxShadow: "0 2px 12px rgba(37,99,235,0.07)",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <svg
              style={{
                position: "absolute",
                left: 17,
                color: "#94a3b8",
                pointerEvents: "none",
                flexShrink: 0,
              }}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='Try year 2021-2023 state NY and press Enter'
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
              onClick={runSearchFromInput}
              style={{
                position: "absolute",
                right: 7,
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
          {chipsToRender.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
              {chipsToRender.map((chip) => (
                <div
                  key={`${chip.key}:${String(chip.value ?? "")}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "4px 10px 4px 12px",
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    borderRadius: 99,
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 11.5,
                    fontWeight: 500,
                    color: "#1d4ed8",
                  }}
                >
                  {chip.label}
                  <button
                    onClick={() => removeChip(chip)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#1d4ed8",
                      opacity: 0.6,
                      fontSize: 14,
                      lineHeight: 1,
                      padding: "0 1px",
                      display: "flex",
                      alignItems: "center",
                    }}
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
          <FiltersSidebar
            filters={FILTERS}
            activeFilters={activeFilters}
            onToggle={toggleFilter}
          />

          {/* Results */}
          <main style={{ flex: 1, minWidth: 0 }}>
            {/* Meta bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ fontSize: 13, color: "#94a3b8" }}>
                {loading ? "Searching…" : <><strong style={{ color: "#0f172a" }}>{incidents.length}</strong> incidents found</>}
              </div>
              
              <button
                onClick={() => setExportOpen(true)}
                disabled={incidents.length === 0}
                style={{
                  padding: "6px 12px",
                  background: incidents.length === 0 ? "#93c5fd" : "#2563eb",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: incidents.length === 0 ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  opacity: incidents.length === 0 ? 0.8 : 1,
                }}
              >
                Export
              </button>

              <ExportModal
                open={exportOpen}
                onClose={() => setExportOpen(false)}
                fetchIncidents={fetchIncidentsForExport}
              />
        
            </div>

            {/* Cards */}
            {loading && incidents.length === 0 ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ /* ... */ }}>
                  {/* shimmer */}
                </div>
              ))
            ) : (
              <>
                {incidents.map((inc) => (
                  <IncidentCard key={inc.incident_id} incident={inc} />
                ))}

                {/* Infinite scroll sentinel */}
                {hasMore && <div ref={loadMoreRef} style={{ height: 1 }} />}

                {/* Status */}
                <div style={{ padding: "14px 0", color: "#94a3b8", fontSize: 12 }}>
                  {loadingMore ? "Loading more…" : hasMore ? "" : "No more results."}
                </div>
              </>
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