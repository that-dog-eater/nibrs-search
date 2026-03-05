// src/app/incident/[year]/[incidentId]/route.ts

import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ year: string; incidentId: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { year, incidentId } = await ctx.params;

  // validate year
  if (!year || !/^\d{4}$/.test(year)) {
    return NextResponse.json(
      { error: "Invalid year", year },
      { status: 400 }
    );
  }

  // validate incident id
  if (!incidentId) {
    return NextResponse.json(
      { error: "Missing incidentId" },
      { status: 400 }
    );
  }

  const url = new URL("http://127.0.0.1:8000/v1/incidents");
  url.searchParams.set("year", year);
  url.searchParams.set("incident_id", incidentId);
  url.searchParams.set("bundle", "true");

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "Incident not found", upstream_status: res.status },
      { status: res.status }
    );
  }

  const data = await res.json();

  // optional sanity check
  if (Array.isArray(data) && data.length === 0) {
    return NextResponse.json({ error: "Incident not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}