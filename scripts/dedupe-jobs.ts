import 'dotenv/config';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

type JobRow = {
  id: string;
  title: string | null;
  company: string | null;
  location: string | null;
  created_at: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY) as string;
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

const clean = (s?: string | null) => (typeof s === 'string' ? s.replace(/\s+/g, ' ').trim() : '');

function computeHash(title: string, company: string, location: string): string {
  const base = `${title.toLowerCase()}|${company.toLowerCase()}|${location.toLowerCase()}`;
  return crypto.createHash('sha256').update(base).digest('hex');
}

async function run() {
  const pageSize = Number(process.env.DEDUPE_PAGE_SIZE || 10000);
  let offset = 0;
  let total = 0;
  let deleted = 0;

  // determine total
  {
    const { count, error } = await supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true });
    if (error) {
      console.error('Count error:', error);
      process.exit(1);
    }
    total = count || 0;
  }

  // We will iterate by created_at ascending so that when we find a duplicate, we prefer the newer row
  // by replacing the currently kept id for that hash.
  const keptByHash = new Map<string, string>();
  const idsToDelete: string[] = [];

  while (offset < total) {
    const { data: rows, error } = await supabase
      .from('jobs')
      .select('id,title,company,location,created_at')
      .order('created_at', { ascending: true })
      .range(offset, Math.min(offset + pageSize - 1, Math.max(total - 1, 0)));

    if (error) {
      console.error('Fetch error:', error);
      break;
    }
    if (!rows || rows.length === 0) break;

    for (const r of rows as JobRow[]) {
      const title = clean(r.title);
      const company = clean(r.company);
      const location = clean(r.location);
      if (!title || !company || !location) continue;
      const h = computeHash(title, company, location);
      const prev = keptByHash.get(h);
      if (!prev) {
        keptByHash.set(h, r.id);
      } else {
        // prefer newer (we iterate ascending, so current r is newer)
        idsToDelete.push(prev);
        keptByHash.set(h, r.id);
      }
    }

    offset += rows.length;
    console.log(`Scanned ${Math.min(offset, total)}/${total} | Marked dupes so far: ${idsToDelete.length}`);
  }

  if (idsToDelete.length === 0) {
    console.log('No duplicates found.');
    return;
  }

  // Batch delete in chunks
  const batch = Number(process.env.DEDUPE_DELETE_BATCH_SIZE || 5000);
  for (let i = 0; i < idsToDelete.length; i += batch) {
    const chunk = idsToDelete.slice(i, i + batch);
    const { error } = await supabase.from('jobs').delete().in('id', chunk);
    if (error) {
      console.error('Delete error (continuing):', error);
      continue;
    }
    deleted += chunk.length;
    console.log(`Deleted ${deleted}/${idsToDelete.length}`);
  }

  console.log(`Done. Deleted ${deleted} duplicates.`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});


