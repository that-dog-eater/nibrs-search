"use client";

import { useMemo, useState } from "react";
import { getVisibleOptions } from "@/lib/filter/visibleOptions";
import { displayFilterLabel } from "@/lib/filter/labels";

export function FiltersSidebar(props: {
  filters: Record<string, string[]>;
  activeFilters: Record<string, string[]>;
  onToggle: (group: string, val: string) => void;
}) {
  const { filters, activeFilters, onToggle } = props;

  const [showMore, setShowMore] = useState<Record<string, boolean>>({});

  return (
    <aside style={{ width: 210, flexShrink: 0, paddingTop: 2 }}>
      <div style={{ position: "sticky", top: 20, background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 14px" }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid #f1f5f9" }}>
          Filters
        </div>

        {Object.entries(filters).map(([group, options]) => {
          const expanded = !!showMore[group];
          const selected = activeFilters[group] ?? [];

          const visible = getVisibleOptions({
            group,
            allOptions: options,
            selected,
            expanded,
          });

          return (
            <div key={group} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {group}
                </div>

                <button
                  onClick={() => setShowMore((p) => ({ ...p, [group]: !p[group] }))}
                  style={{ background: "transparent", border: "none", color: "#2563eb", fontSize: 11, cursor: "pointer", padding: 0 }}
                >
                  {expanded ? "Show less" : "Show more"}
                </button>
              </div>

              <div style={{ maxHeight: expanded ? 260 : "unset", overflowY: expanded ? "auto" : "visible", paddingRight: expanded ? 6 : 0 }}>
                {visible.map((opt) => (
                  <label key={opt} style={{ display: "flex", alignItems: "center", gap: 7, padding: "4px 0", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={selected.includes(opt)}
                      onChange={() => onToggle(group, opt)}
                      style={{ accentColor: "#2563eb", width: 13, height: 13, cursor: "pointer" }}
                    />
                    <span style={{ fontSize: 12.5, color: "#475569" }}>
                      {displayFilterLabel(group, opt)}
                    </span>
                  </label>
                ))}
              </div>

              {!expanded && options.length > visible.length && (
                <div style={{ marginTop: 6, fontSize: 11, color: "#94a3b8" }}>
                  Showing {visible.length} of {options.length}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}