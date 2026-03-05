
import { STATE_NAME_TO_ABBR } from "./state_abbr";
import type { QueryChip } from "@/lib/types";

const MULTI_KEYS = new Set(["offense_code", "location_code", "has"]);

function addParam(params: URLSearchParams, key: string, value: string) {
  if (MULTI_KEYS.has(key)) params.append(key, value);
  else params.set(key, value);
}

function normalizeSpaces(s: string) {
  return s.trim().replace(/\s+/g, " ");
}

function upsertChip(existing: QueryChip[], chip: QueryChip) {
  const idx = existing.findIndex(c => c.key === chip.key);
  if (idx >= 0) {
    const copy = [...existing];
    copy[idx] = chip;
    return copy;
  }
  return [...existing, chip];
}

export function parseQueryToChips(
  query: string,
  chips: QueryChip[]
): { mergedChips: QueryChip[]; cleanQuery: string } {
  let merged = [...chips];
  let working = query;

  // 1) keep your key:value behavior
  const chipRegex = /(\w+):(\S+)/g;
  const extracted: QueryChip[] = [];
  let m: RegExpExecArray | null;

  while ((m = chipRegex.exec(query)) !== null) {
    extracted.push({ key: m[1], label: m[0], value: m[2] });
    working = working.replace(m[0], " ");
  }
  working = normalizeSpaces(working);

  for (const c of extracted) merged = upsertChip(merged, c);

  // 2) detect standalone YEAR like 2022
  //    only if year wasn't already provided as key:value
  if (!extracted.some(c => c.key === "year")) {
    const yearMatch = working.match(/\b(19\d{2}|20\d{2})\b/);
    if (yearMatch) {
      const year = yearMatch[1];
      merged = upsertChip(merged, { key: "year", label: `year:${year}`, value: year });
      working = normalizeSpaces(working.replace(yearMatch[0], " "));
    }
  }

  // 3) detect STATE as:
  //    - 2-letter token (nj, ca, etc)
  //    - full state name (new jersey, california, etc)
  if (!extracted.some(c => c.key === "state")) {
    const lower = ` ${working.toLowerCase()} `;

    // full names first (handles "new jersey")
    let foundState: string | null = null;
    for (const [name, abbr] of Object.entries(STATE_NAME_TO_ABBR)) {
      if (lower.includes(` ${name} `)) {
        foundState = abbr;
        working = normalizeSpaces(
          working.replace(new RegExp(`\\b${name.replace(/ /g, "\\s+")}\\b`, "i"), " ")
        );
        break;
      }
    }

    // then 2-letter abbreviations
    if (!foundState) {
      const abbrMatch = working.match(/\b([A-Za-z]{2})\b/);
      if (abbrMatch) {
        const abbr = abbrMatch[1].toUpperCase();
        // only accept if it's a real state abbr
        const valid = new Set(Object.values(STATE_NAME_TO_ABBR));
        if (valid.has(abbr)) {
          foundState = abbr;
          working = normalizeSpaces(working.replace(abbrMatch[0], " "));
        }
      }
    }

    if (foundState) {
      merged = upsertChip(merged, { key: "state", label: `state:${foundState}`, value: foundState });
    }
  }

  return { mergedChips: merged, cleanQuery: working };
}