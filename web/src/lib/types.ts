
export interface Victim {
  victim_id: string;
  sex_code?: string;
  age_num?: number;
  race_code?: string;

  victim_injury?: string;
  victim_relationship?: string;
  injury_type?: string;
}
export interface Offender {
  offender_id: string;
  sex_code: string;
  age_num?: number;
  race_code: string;
}
export interface Arrest {
  arrest_transaction_number?: string;
  arrest_date?: string;
  arrest_type?: string;
  statute?: string;

  arrest_offense?: string;
  arrest_age?: number;
  arrest_sex?: string;
  arrest_race?: string;
}
export interface Offense {
  offense_id?: string;
  offense_code?: string;
  offense_name?: string;

  // old fields (keep if some endpoints still send these)
  location_type?: string;
  weapon_type?: string;

  // new fields you are rendering
  offense_attempt?: string;
  offense_location?: string;
  offence_weapon?: string; // NOTE spelling
}
export interface Incident {
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
export interface QueryChip {
  key: string;
  label: string;
  value: string;
}
export type CitationFormat = "APA" | "MLA" | "Chicago" | "BibTeX";
export type ExpandedTab = "victims" | "offenders" | "arrests" | "offenses";