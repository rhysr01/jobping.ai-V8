import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import axios from "axios";

const client = axios.create({ baseURL: "https://api.mantiks.io", timeout: 15000 });
client.interceptors.request.use((c) => {
  const key = process.env.MANTIKS_API_KEY;
  if (!key) throw new Error("Missing MANTIKS_API_KEY");
  (c.headers as any)["x-api-key"] = key;
  return c;
});

async function tryGet(path: string, params: any) {
  try {
    const r = await client.get(path, { params });
    console.log("OK", path, r.status, Array.isArray(r.data) ? r.data.length : Object.keys(r.data||{}).join(",").slice(0,80));
    return { ok: true, data: r.data };
  } catch (e: any) {
    const status = e?.response?.status;
    console.log("FAIL", path, status ?? e?.code ?? e?.message);
    return { ok: false };
  }
}

async function main() {
  console.log("Testing Mantiks endpoints with provided API key...");
  const locationParamsVariants = [{ q: "Madrid" }, { query: "Madrid" }, { name: "Madrid" }];
  const locationPaths = ["/v1/locations/search", "/locations/search", "/location/search", "/v1/location/search"];
  for (const p of locationPaths) {
    for (const params of locationParamsVariants) {
      await tryGet(p, params);
    }
  }

  const include = ["graduate","internship","trainee","junior","entry level"];
  const discoveryPaths = ["/v1/companies/jobs", "/companies/jobs", "/v1/companies", "/companies"];
  for (const p of discoveryPaths) {
    await tryGet(p, { include_title: include, job_age_in_days: 14, job_seniority: "Entry level" });
  }
}

main().catch(e => { console.error(e); process.exit(1); });


