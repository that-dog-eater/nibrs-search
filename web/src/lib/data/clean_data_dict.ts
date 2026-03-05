
export function month3ToNum(mmm: string): string | null {
  const key = mmm.toUpperCase();
  const map: Record<string, string> = {
    JAN: "01", FEB: "02", MAR: "03", APR: "04", MAY: "05", JUN: "06",
    JUL: "07", AUG: "08", SEP: "09", OCT: "10", NOV: "11", DEC: "12",
  };
  return map[key] ?? null;
}

export function toStateAbbr(stateNum: string): string | null {
  const raw = stateNum.trim();
  if (!raw) return null;

  const n = raw.padStart(2, "0");
  const map: Record<string, string> = {
    "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO",
    "09": "CT", "10": "DE", "11": "DC", "12": "FL", "13": "GA", "15": "HI",
    "16": "ID", "17": "IL", "18": "IN", "19": "IA", "20": "KS", "21": "KY",
    "22": "LA", "23": "ME", "24": "MD", "25": "MA", "26": "MI", "27": "MN",
    "28": "MS", "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
    "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND", "39": "OH",
    "40": "OK", "41": "OR", "42": "PA", "44": "RI", "45": "SC", "46": "SD",
    "47": "TN", "48": "TX", "49": "UT", "50": "VT", "51": "VA", "53": "WA",
    "54": "WV", "55": "WI", "56": "WY",
  };

  return map[n] ?? null;
}

export const SEX_CODE_MAP: Record<string, string> = {
  "1": "Male",
  "2": "Female",
  "3": "Unknown",
  "U": "Unknown",
};

export const RACE_CODE_MAP: Record<string, string> = {
  "1": "White",
  "2": "Black or African American",
  "3": "American Indian or Alaska Native",
  "4": "Asian",
  "5": "Native Hawaiian or Other Pacific Islander",
  "6": "Multiple races",
  "7": "Unknown",
  "U": "Unknown",
};

export const INJURY_CODE_MAP: Record<string, string> = {
  "1": "None",
  "2": "Minor injury",
  "3": "Severe injury",
  "4": "Apparent broken bones",
  "5": "Loss of teeth",
  "6": "Unconsciousness",
  "7": "Possible internal injury",
  "U": "Unknown",
};

export const RELATIONSHIP_CODE_MAP: Record<string, string> = {
  "1": "Spouse",
  "2": "Common-law spouse",
  "3": "Parent",
  "4": "Sibling",
  "5": "Child",
  "6": "Boyfriend/Girlfriend",
  "7": "Ex-spouse",
  "8": "Friend",
  "9": "Neighbor",
  "10": "Acquaintance",
  "11": "Stranger",
  "12": "Employee",
  "13": "Employer",
  "U": "Unknown",
};

export const OFFENSE_ATTEMPT_MAP: Record<string, string> = {
  "1": "Completed",
  "2": "Attempted",
};

export const LOCATION_TYPE_MAP: Record<string, string> = {
  "1": "Air/Bus/Train Terminal",
  "2": "Bank/Savings & Loan",
  "3": "Bar/Nightclub",
  "4": "Church/Synagogue/Temple",
  "5": "Commercial Office Building",
  "6": "Construction Site",
  "7": "Convenience Store",
  "8": "Department/Discount Store",
  "9": "Drug Store/Doctor’s Office/Hospital",
  "10": "Field/Woods",
  "11": "Grocery/Supermarket",
  "12": "Highway/Road/Alley/Sidewalk",
  "13": "Hotel/Motel",
  "14": "Industrial Site",
  "15": "Lake/Waterway/Beach",
  "16": "Liquor Store",
  "17": "Parking Lot/Garage",
  "18": "Residence/Home",
  "19": "Restaurant",
  "20": "School/College",
  "21": "Service/Gas Station",
  "22": "Specialty Store",
  "23": "Other/Unknown",
};

export const WEAPON_CODE_MAP: Record<string, string> = {
  "1": "Firearm",
  "2": "Handgun",
  "3": "Rifle",
  "4": "Shotgun",
  "5": "Other firearm",
  "6": "Knife/Cutting instrument",
  "7": "Blunt object",
  "8": "Personal weapons (hands, feet)",
  "9": "Poison",
  "10": "Explosives",
  "11": "Fire",
  "12": "Narcotics/Drugs",
  "13": "Asphyxiation",
  "14": "Other",
  "U": "Unknown",
};

export const OFFENSE_CODE_MAP: Record<string, string> = {
  // Crimes Against Persons
  "09A": "Murder and Nonnegligent Manslaughter",
  "09B": "Negligent Manslaughter",
  "09C": "Justifiable Homicide",
  "100": "Kidnapping/Abduction",
  "11A": "Forcible Rape",
  "11B": "Forcible Sodomy",
  "11C": "Sexual Assault With an Object",
  "11D": "Forcible Fondling",
  "120": "Robbery",
  "13A": "Aggravated Assault",
  "13B": "Simple Assault",
  "13C": "Intimidation",
  "14A": "Incest",
  "14B": "Statutory Rape",

  // Crimes Against Property
  "200": "Arson",
  "210": "Extortion/Blackmail",
  "220": "Burglary/Breaking and Entering",
  "23A": "Pocket-picking",
  "23B": "Purse-snatching",
  "23C": "Shoplifting",
  "23D": "Theft From Building",
  "23E": "Theft From Coin-Operated Machine",
  "23F": "Theft From Motor Vehicle",
  "23G": "Theft of Motor Vehicle Parts or Accessories",
  "23H": "All Other Larceny",
  "240": "Motor Vehicle Theft",
  "250": "Counterfeiting/Forgery",
  "26A": "False Pretenses/Swindle/Confidence Game",
  "26B": "Credit Card/ATM Fraud",
  "26C": "Impersonation",
  "26D": "Welfare Fraud",
  "26E": "Wire Fraud",
  "270": "Embezzlement",
  "280": "Stolen Property Offenses",
  "290": "Destruction/Damage/Vandalism of Property",

  // Crimes Against Society
  "35A": "Drug/Narcotic Violations",
  "35B": "Drug Equipment Violations",
  "36A": "Incest (Crimes Against Society)",
  "36B": "Statutory Rape (Crimes Against Society)",
  "370": "Pornography/Obscene Material",
  "39A": "Betting/Wagering",
  "39B": "Operating/Promoting Gambling",
  "39C": "Gambling Equipment Violations",
  "39D": "Sports Tampering",
  "40A": "Prostitution",
  "40B": "Assisting or Promoting Prostitution",
  "40C": "Purchasing Prostitution",
  "510": "Bribery",
  "520": "Weapon Law Violations",
};

export const ARREST_TYPE_MAP: Record<string, string> = {
  "1": "On-View Arrest",
  "2": "Summoned/Cited",
  "3": "Taken into Custody",
};

export function decode(map: Record<string, string>, code: any): string {
  const key = String(code ?? "").trim();
  if (!key) return "N/A";
  return map[key] ?? "N/A";
}