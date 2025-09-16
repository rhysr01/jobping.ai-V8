import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import PQueue from "p-queue";
import { targetCities } from "../lib/config";
import { resolveLocationId } from "../lib/locations";
import { discoverCompanies } from "../lib/discover";
import { fetchCompanyJobs } from "../lib/fetchCompanyJobs";
import { normalize } from "../lib/normalize";
import { upsertRaw, upsertNorm } from "../lib/persistence";

async function main() {
  const cityIds = (await Promise.all(targetCities.map(c => resolveLocationId(c)))).filter(Boolean) as number[];
  const langsByCity: Record<string, ("es"|"fr"|"de"|"it"|"en")[]> = {
    Madrid: ["es","en"], Barcelona: ["es","en"], Paris: ["fr","en"], Berlin: ["de","en"],
    Milan: ["it","en"], Dublin: ["en"], London: ["en"],
  };

  const langs = Array.from(new Set(Object.values(langsByCity).flat()));

  const discovery = await discoverCompanies({ locationIds: cityIds, langs });
  const companies: Array<{ domain?: string; name?: string; jobs_count?: number }> = discovery?.companies ?? [];

  const hot = companies.filter(c => (c.jobs_count ?? 0) >= 3 && c.domain);
  const warm = companies.filter(c => (c.jobs_count ?? 0) > 0 && (c.jobs_count ?? 0) < 3 && c.domain);

  const queue = new PQueue({ concurrency: 5 });
  const allJobs: any[] = [];

  for (const bucket of [hot, warm]) {
    await Promise.all(bucket.map(c => queue.add(async () => {
      const jobs = await fetchCompanyJobs(c.domain as string, langs);
      if (jobs?.length) {
        allJobs.push(...jobs);
      }
    })));
  }

  await upsertRaw(allJobs);
  const normalized = allJobs.map(normalize);
  await upsertNorm(normalized);

  console.log(`Mantiks ingest complete: raw=${allJobs.length} norm=${normalized.length}`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});


