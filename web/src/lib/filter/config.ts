
export const FILTER_KEY_BY_GROUP: Record<string, "offense_code" | "location_code" | null> = {
  "Offense": "offense_code",
  "Location": "location_code",
};

export const TOP_FILTERS: Record<string, string[]> = {
    Offense: ["13A", "13B", "120", "220", "23H", "240", "35A"],
    Location: ["18", "20", "12", "17", "19", "11", "3"],
};