
// lib/FiltersSidebar.ts
import { LOCATION_TYPE_MAP, OFFENSE_CODE_MAP } from "@/lib/data/clean_data_dict";

export const FILTERS = {
  Offense: Object.keys(OFFENSE_CODE_MAP),   // all offense codes
  Location: Object.keys(LOCATION_TYPE_MAP), // all location codes
} as const;