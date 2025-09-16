import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabase: SupabaseClient | null = null;
function getClient(): SupabaseClient {
  if (!supabase) {
    const url = process.env.SUPABASE_URL as string;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
    if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    supabase = createClient(url, key);
  }
  return supabase;
}

export async function upsertRaw(jobs: any[]) {
  if (!jobs?.length) return;
  const payload = jobs.map(j => ({
    external_id: j.external_id ?? j.id ?? null,
    company: j.company_name ?? j.company ?? null,
    company_domain: j.company_domain ?? null,
    title: j.title ?? null,
    description: j.description ?? null,
    location_name: j.location?.name ?? j.location_name ?? null,
    location_id: j.location?.id ?? j.location_id ?? null,
    seniority: j.seniority ?? null,
    posted_at: j.posted_at ?? j.publication_date ?? null,
    source: j.source ?? j.job_board ?? "mantiks",
    url: j.url ?? j.job_url ?? null
  }));

  const { error } = await getClient().from("jobs_raw_mantiks")
    .upsert(payload, { onConflict: "company_domain,external_id" });
  if (error) throw error;
}

export async function upsertNorm(items: any[]) {
  if (!items?.length) return;
  const { error } = await getClient().from("jobs_norm").upsert(items);
  if (error) throw error;
}


