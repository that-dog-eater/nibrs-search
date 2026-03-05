import type { Incident, CitationFormat } from "@/lib/types";

export function buildCitation(
  incident: Incident,
  format: CitationFormat
): string {
  const {
    data_year: year,
    agency_name: agency,
    state_abbr: state,
    incident_id: id,
  } = incident;

  const accessed = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // canonical incident URL
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://nibrs.example.gov";

  const url = `${base}/incident/${year}/${id}`;

  switch (format) {
    case "APA":
      return `Federal Bureau of Investigation. (${year}). Incident ${id} [NIBRS data]. ${agency}, ${state}. Retrieved ${accessed}, from ${url}`;

    case "MLA":
      return `Federal Bureau of Investigation. "Incident ${id}." National Incident-Based Reporting System, ${agency}, ${state}, ${year}. Web. ${accessed}. <${url}>.`;

    case "Chicago":
      return `Federal Bureau of Investigation. "${agency}, ${state} — Incident ${id}." National Incident-Based Reporting System, ${year}. Accessed ${accessed}. ${url}.`;

    case "BibTeX":
      return `@misc{nibrs_${id.replace(/\W/g, "_")},
  title  = {Incident ${id}},
  author = {{Federal Bureau of Investigation}},
  year   = {${year}},
  note   = {${agency}, ${state}; NIBRS},
  url    = {${url}}
}`;
  }
}