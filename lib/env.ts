import { z } from "zod";

const schema = z.object({
  SUPABASE_PROJECT_REF_DEV: z.string().min(4),
  SUPABASE_PAT_DEV_RW: z.string().min(10),
  SUPABASE_PROJECT_REF_PROD: z.string().min(4),
  SUPABASE_PAT_PROD_RO: z.string().min(10),
  SYSTEM_API_KEY: z.string().min(10),
  RESEND_API_KEY: z.string().min(10),
});

export const ENV = schema.parse({
  SUPABASE_PROJECT_REF_DEV: process.env.SUPABASE_PROJECT_REF_DEV,
  SUPABASE_PAT_DEV_RW: process.env.SUPABASE_PAT_DEV_RW,
  SUPABASE_PROJECT_REF_PROD: process.env.SUPABASE_PROJECT_REF_PROD,
  SUPABASE_PAT_PROD_RO: process.env.SUPABASE_PAT_PROD_RO,
  SYSTEM_API_KEY: process.env.SYSTEM_API_KEY,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
});

