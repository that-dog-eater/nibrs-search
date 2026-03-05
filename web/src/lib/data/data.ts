// lib/data/getIncidents.ts
import type { Incident, QueryChip } from "@/lib/types";


import { OFFENSE_CODE_MAP } from "./offense_code_map";
import { month3ToNum, toStateAbbr } from "./clean_data_dict";
import { SEX_CODE_MAP, RACE_CODE_MAP, INJURY_CODE_MAP, RELATIONSHIP_CODE_MAP, OFFENSE_ATTEMPT_MAP, LOCATION_TYPE_MAP, WEAPON_CODE_MAP, ARREST_TYPE_MAP } from "./clean_data_dict";
import { decode } from "./clean_data_dict";

export async function getIncidents(opts: {
  chips: QueryChip[];
  q?: string;
  signal?: AbortSignal;
  bundle?: boolean; // ✅ add
}): Promise<Incident[]> {
  const params = new URLSearchParams();

  // chips -> params
  // chips -> params
  const hasValues: string[] = [];
  const MULTI_KEYS = new Set(["offense_code", "location_code"]); // add any others you want multi

  for (const c of opts.chips) {
    const key = c.key?.trim();
    const val = String(c.value ?? "").trim();
    if (!key) continue;

    if (key === "has") {
      if (val) hasValues.push(val);
      continue;
    }

    if (!val.length) continue;

    // IMPORTANT: allow repeated query params for multi-select keys
    if (MULTI_KEYS.has(key)) params.append(key, val);
    else params.set(key, val);
  }

  if (opts.q?.trim()) params.set("q", opts.q.trim());

  // defaults (keep UI behavior stable)
  if (!params.get("year")) params.set("year", "2024");
  if (!params.get("state")) params.set("state", "NJ");
  if (!params.get("limit")) params.set("limit", "50");
  if (!params.get("offset")) params.set("offset", "0");

  // bundle for victims/offenses/arrests
// bundle for victims/offenses/arrests (default ON)
  if (opts.bundle !== false) params.set("bundle", "true");
  for (const hv of hasValues) params.append("has", hv);

  //const base = "http://127.0.0.1:8000";
  //const url = `${base}/v1/incidents?${params.toString()}`;
  const url = `/api/v1/incidents?${params.toString()}`; // use this for server

  const res = await fetch(url, {
    method: "GET",
    signal: opts.signal,
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`getIncidents failed (${res.status}): ${txt.slice(0, 200)}`);
  }

  const raw = await res.json();
  const rows: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : [];

  // Map each bundled incident -> UI Incident
  return rows.map(mapBundledIncidentToUi);
}

/* -------------------- mapping -------------------- */

function mapBundledIncidentToUi(x: any): Incident {
  const inc = x;

  const incident_id = cleanStr(inc.INCIDENT_ID ?? inc.incident_id);
  const data_year = num(inc.YEAR ?? inc.data_year);
  const incident_date =
    normalizeNibrsDate(inc.INCDATE ?? inc.incident_date) || `${data_year}-01-01`;

  // Prefer FIPS_STATE if present (your bundles have this and it’s more reliable)
  const state_abbr =
    toStateAbbr(cleanStr(inc.FIPS_STATE ?? inc.fips_state ?? inc.STATE ?? inc.state)) ?? "N/A";

  const agency_name = cleanStr(inc.AGENCY_NAME ?? inc.agency_name ?? inc.ORI ?? "N/A");

  // Base offense info (top-level row may have OFFENSE_CODE but we’ll also map offenses table below)
  const top_offense_code = cleanStr(inc.OFFENSE_CODE ?? inc.offense_code);
  const top_offense_name =
    cleanStr(inc.offense_name) ||
    (top_offense_code ? (decode(OFFENSE_CODE_MAP, top_offense_code) || `UCR ${top_offense_code}`) : "N/A");

  const cleared_exceptionally = emptyToUndef(inc.CLEARED_EXCEPTIONALLY ?? inc.cleared_exceptionally);

  const bundle = inc.bundle ?? {};
  const victimsRows = arr(bundle.victims);
  const offendersRows = arr(bundle.offenders);
  const arrestsRows = arr(bundle.arrests);
  const offensesRows = arr(bundle.offenses);

  const offenses = offensesRows.length
    ? offensesRows.map(mapOffenseFromOffensesTable)
    : [{
        offense_id: incident_id ? `OFF-${incident_id}-1` : "OFF-NA",
        offense_code: top_offense_code,
        offense_attempt: undefined,
        offense_location: "N/A",
        offence_weapon: undefined,
        offense_name: top_offense_code ? (decode(OFFENSE_CODE_MAP, top_offense_code) || `UCR ${top_offense_code}`) : "N/A",
        location_type: "N/A",
        weapon_type: emptyToUndef(inc.WEAPON_CODE ?? inc.weapon_type),
      }];

  const headline_offense_name = offenses[0]?.offense_name ?? top_offense_name;

  return {
    incident_id,
    incident_date,
    data_year,
    state_abbr,
    agency_name,
    offense_name: headline_offense_name,
    cleared_exceptionally,

    victims: victimsRows.map(mapVictim),
    offenders: offendersRows.map(mapOffender),
    arrests: arrestsRows.map(mapArrest),
    offenses,
  };
}

function mapVictim(v: any) {
  const seq = cleanStr(v.VICTIM_SEQ_NUM ?? "1");

  const sex_code = decode(SEX_CODE_MAP, cleanStr(v.VICTIM_SEX) || "U");
  const race_code = decode(RACE_CODE_MAP, cleanStr(v.VICTIM_RACE) || "U");

  const age_num = blankNumToUndef(v.VICTIM_AGE);

  const injury_type_raw = cleanStr(v.VICTIM_INJURY) || "U";
  const injury_type = decode(INJURY_CODE_MAP, injury_type_raw);

  const rel_raw = cleanStr(v.RELATIONSHIP_TO_OFFENDER) || "U";
  const victim_relationship = decode(RELATIONSHIP_CODE_MAP, rel_raw);

  return {
    victim_id: `V${seq}`,

    victim_injury: injury_type,
    victim_relationship,
    sex_code,
    age_num,
    race_code,
    injury_type,
  };
}

function mapOffender(o: any) {
  const seq = cleanStr(o.OFFENDER_SEQ_NUM ?? "1");

  const sex_code = decode(SEX_CODE_MAP, cleanStr(o.OFFENDER_SEX) || "U");
  const race_code = decode(RACE_CODE_MAP, cleanStr(o.OFFENDER_RACE) || "U");
  const age_num = blankNumToUndef(o.OFFENDER_AGE);

  return {
    offender_id: `OF${seq}`,
    sex_code,
    age_num,
    race_code,
  };
}

function mapOffenseFromOffensesTable(o: any) {
  const incidentId = cleanStr(o.INCIDENT_ID ?? "OFF");
  const seq = cleanStr(o.OFFENSE_SEQ_NUM ?? "1");

  const offense_code = cleanStr(o.OFFENSE_CODE);
  const offense_name = offense_code
    ? (decode(OFFENSE_CODE_MAP, offense_code) || `UCR ${offense_code}`)
    : "N/A";

  const attempt_raw = cleanStr(o.ATTEMPTED_COMPLETED);
  const offense_attempt = attempt_raw ? decode(OFFENSE_ATTEMPT_MAP, attempt_raw) : undefined;

  const loc_raw = cleanStr(o.LOCATION_TYPE);
  const offense_location = loc_raw ? decode(LOCATION_TYPE_MAP, loc_raw) : "N/A";

  const weap_raw = cleanStr(o.WEAPON_CODE);
  const offence_weapon = weap_raw ? decode(WEAPON_CODE_MAP, weap_raw) : undefined;

  return {
    offense_id: cleanStr(o.OFFENSE_ID ?? `${incidentId}-${seq}`),

    offense_code,
    offense_attempt,
    offense_location,
    offence_weapon,

    offense_name,
    location_type: offense_location ?? "N/A",
    weapon_type: offence_weapon,
  };
}

function mapArrest(a: any) {
  const arrest_offense_code = cleanStr(a.ARREST_OFFENSE_CODE);
  const arrest_offense = arrest_offense_code
    ? (decode(OFFENSE_CODE_MAP, arrest_offense_code) || `UCR ${arrest_offense_code}`)
    : undefined;

  const arrest_age = blankNumToUndef(a.ARRESTEE_AGE);

  const arrest_sex = decode(SEX_CODE_MAP, cleanStr(a.ARRESTEE_SEX) || "U");
  const arrest_race = decode(RACE_CODE_MAP, cleanStr(a.ARRESTEE_RACE) || "U");

  const arrest_type = decode(ARREST_TYPE_MAP, cleanStr(a.ARREST_TYPE) || "U");

  return {
    arrest_transaction_number: cleanStr(a.ARREST_SEQ_NUM ?? a.id ?? "ARR-NA"),
    arrest_date: normalizeNibrsDate(a.ARREST_DATE) || "",

    arrest_offense,
    arrest_age,
    arrest_sex,
    arrest_race,
    arrest_type,

    statute: emptyToUndef(a.STATUTE ?? a.statute),
  };
}

/* -------------------- helpers -------------------- */

function arr(x: any): any[] {
  return Array.isArray(x) ? x : [];
}
function num(x: any): number {
  const n = Number(String(x).trim());
  return Number.isFinite(n) ? n : 0;
}
function cleanStr(x: any): string {
  if (x === null || x === undefined) return "";
  const s = String(x);
  // NIBRS blanks are often " " (single space)
  const t = s.trim();
  return t.length ? t : "";
}
function emptyToUndef(x: any): string | undefined {
  const s = cleanStr(x);
  return s.length ? s : undefined;
}
function blankNumToUndef(x: any): number | undefined {
  const s = cleanStr(x);
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * "26-DEC-2022" -> "2022-12-26"
 * Passes through ISO "YYYY-MM-DD".
 */
function normalizeNibrsDate(x: any): string {
  const s = cleanStr(x);
  if (!s) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  const m = s.match(/^(\d{1,2})-([A-Z]{3})-(\d{4})$/i);
  if (!m) return s;

  const day = m[1].padStart(2, "0");
  const mon = month3ToNum(m[2]);
  const year = m[3];
  return mon ? `${year}-${mon}-${day}` : s;
}