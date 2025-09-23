import 'dotenv/config';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

type JobRow = {
  id: string;
  title: string | null;
  description: string | null;
  location: string | null;
  company: string | null;
  job_url: string | null;
  created_at: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = (
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY
) as string;
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

const clean = (s?: string | null) => (typeof s === 'string' ? s.replace(/\s+/g, ' ').trim() : '');

function normalizeUrl(url?: string | null): string {
  const u = clean(url);
  if (!u) return '';
  try {
    const parsed = new URL(u.startsWith('http') ? u : `https://${u}`);
    // strip tracking
    parsed.hash = '';
    const params = parsed.searchParams;
    const toDelete: string[] = [];
    params.forEach((_, k) => {
      if (/^utm_|^gclid$|^fbclid$|^ref$|^trk/.test(k)) toDelete.push(k);
    });
    toDelete.forEach((k) => params.delete(k));
    parsed.search = params.toString();
    return parsed.toString();
  } catch {
    return '';
  }
}

const titleSignals: RegExp[] = [
  /\bgraduate\b/i,
  /\bjunior\b/i,
  /\bentry[- ]?level\b/i,
  /\bintern(ship)?\b/i,
  /\btrainee\b/i,
  /\bassistan(t|ce)\b/i,
];

function inferTitleFromDescription(desc: string): string {
  const d = desc.toLowerCase();
  const lines = d.split(/[\n\.]/).map((l) => l.trim()).filter(Boolean);
  const first = lines.slice(0, 3).join(' ');
  const roles = [
    'consultant',
    'analyst',
    'engineer',
    'developer',
    'product manager',
    'data analyst',
    'marketing',
    'operations',
    'sales',
    'designer',
  ];
  const role = roles.find((r) => first.includes(r));
  const seniority = titleSignals.some((r) => r.test(first)) ? 'Graduate' : 'Junior';
  const nice = role
    ? `${seniority} ${role}`
        .split(' ')
        .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
        .join(' ')
    : 'Graduate Role';
  return nice;
}

function ensureEarlyCareerTitle(title: string, description: string): string {
  if (!title || !titleSignals.some((r) => r.test(title))) {
    if (description && description.length >= 60) return inferTitleFromDescription(description);
  }
  return title;
}

function computeHash(title: string, company: string, location: string): string {
  const base = `${title.toLowerCase()}|${company.toLowerCase()}|${location.toLowerCase()}`;
  return crypto.createHash('sha256').update(base).digest('hex');
}

function parseLocationQuick(input?: string) {
  const text = clean(input).toLowerCase();
  const isRemote = /\bremote\b|work\s*from\s*home|anywhere/i.test(text);
  // normalize common generic regions to blank
  const generic = /^(europe|eu|united kingdom|uk|european union)$/i.test(clean(input));
  return {
    isRemote,
    normalizedLocation: isRemote || generic ? '' : clean(input),
  };
}

async function run() {
  const pageSize = Number(process.env.NORMALIZE_PAGE_SIZE || 5000);
  let offset = 0;
  let total = 0;
  let updated = 0;

  // determine total (jobspy only)
  {
    const { count, error } = await supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('source', 'jobspy');
    if (error) {
      console.error('Count error:', error);
      process.exit(1);
    }
    total = count || 0;
  }

  while (offset < total) {
    const { data: rows, error } = await supabase
      .from('jobs')
      .select('id,title,description,location,company,job_url,created_at,source')
      .eq('source', 'jobspy')
      .order('created_at', { ascending: true })
      .range(offset, Math.min(offset + pageSize - 1, Math.max(total - 1, 0)));

    if (error) {
      console.error('Fetch error:', error);
      break;
    }
    if (!rows || rows.length === 0) break;

    for (const r of rows as JobRow[]) {
      const before: Partial<JobRow> = {};
      const after: Partial<JobRow> = {};

      const title0 = clean(r.title);
      const desc0 = clean(r.description);
      const loc0 = clean(r.location);
      const comp0 = clean(r.company);
      const url0 = normalizeUrl(r.job_url);

      let description = desc0;
      if (description.length < 120 && title0.length > 50) description = title0;

      let title = ensureEarlyCareerTitle(title0, description);

      let location = loc0;
      const parsed = parseLocationQuick(location || description || title);
      if ((!location || /^(europe|united kingdom)$/i.test(location)) && parsed.normalizedLocation) {
        location = parsed.normalizedLocation;
      }
      if (!location && description) {
        // fallback: simple city capture like "City, Country"
        const m = description.match(/([A-Z][A-Za-zÀ-ÿ'’\-\.\s]{2,}),(\s*[A-Z][A-Za-zÀ-ÿ'’\-\s]{2,})/);
        if (m) location = clean(m[0]);
      }
      if (location && /remote/i.test(location)) location = '';

      const company = comp0;
      const job_url = url0;

      // Prepare changes
      if (title !== r.title) {
        before.title = r.title;
        after.title = title;
      }
      if (description !== r.description) {
        before.description = r.description;
        after.description = description;
      }
      if (location !== r.location) {
        before.location = r.location;
        after.location = location;
      }
      if (company !== r.company) {
        before.company = r.company;
        after.company = company;
      }
      if (job_url !== r.job_url) {
        before.job_url = r.job_url;
        after.job_url = job_url;
      }

      const changed = Object.keys(after).length > 0;
      if (!changed) continue;

      const { error: upErr } = await supabase.from('jobs').update(after).eq('id', r.id);
      if (upErr) {
        // continue on error
        continue;
      }
      updated++;
    }

    offset += rows.length;
    console.log(`Normalized: ${updated} | Progress ${Math.min(offset, total)}/${total}`);
  }

  console.log(`Done. Updated ${updated} rows.`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});


