
import { OFFENSE_CODE_MAP, LOCATION_TYPE_MAP, decode } from "@/lib/data/clean_data_dict";
import { FILTER_KEY_BY_GROUP } from "./config";

// show label but keep code
export function displayFilterLabel(group: string, code: string) {
  if (FILTER_KEY_BY_GROUP[group] === "offense_code") return decode(OFFENSE_CODE_MAP, code);
  if (FILTER_KEY_BY_GROUP[group] === "location_code") return decode(LOCATION_TYPE_MAP, code);
  return code;
}