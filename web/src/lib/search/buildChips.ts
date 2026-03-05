// src/lib/search/buildChips.ts
import type { QueryChip } from "@/lib/types";
import { FILTER_KEY_BY_GROUP } from "@/lib/filter/config";

export function splitBaseChips(chips: QueryChip[]): QueryChip[] {
  return chips.filter(
    (c) => c.key !== "offense_code" && c.key !== "location_code"
  );
}

export function filtersToChips(
  activeFilters: Record<string, string[]>
): QueryChip[] {
  return Object.entries(activeFilters).flatMap(([group, vals]) => {
    const key = FILTER_KEY_BY_GROUP[group];
    if (!key) return [];
    return (vals ?? []).map((code) => ({
      key,
      value: code,
      label: `${key}:${code}`,
    }));
  });
}