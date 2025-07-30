import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Helper: Trigger AI matching for new users
async function triggerUserMatching(userEmail: string): Promise<void> {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/api/match-users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userEmail,
        limit: 30, // Fewer jobs for new users
      }),
    });

    if (!response.ok) {
      throw new Error(`Matching API returned ${response.status}`);
    }

    const result = await response.json();
    console.log(`✅ Triggered matching for ${userEmail}: ${result.matches?.length || 0} matches found`);
  } catch (error) {
    console.error('❌ Error triggering user matching:', error);
    throw error;
  }
}

// Supabase client setup
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL! as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY! as string
);

// Webhook field types
type TallyField = {
  label: string;
  value: string | string[] | null;
};

type TallyWebhookPayload = {
  data: {
    fields: TallyField[];
  };
};

export async function POST(req: NextRequest) {
  try {
    console.log('✅ Webhook received');

    const tallyData: Record<string, unknown> = await req.json();
    const fields = (tallyData as TallyWebhookPayload)?.data?.fields;

    if (!Array.isArray(fields)) {
      return NextResponse.json({ error: 'Invalid form data structure' }, { status: 400 });
    }

    function getField(label: string): string | string[] | null {
      return (
        fields.find((f) =>
          f.label.toLowerCase().includes(label.toLowerCase())
        )?.value ?? null
      );
    }

    const userEntry = {
      email: getField('email'),
      full_name: getField('name'),
      target_cities: getField('target cities'),
      professional_experience: getField('professional experience'),
      start_date: getField('employment start date'),
      work_environment: getField('work enviornment'),
      visa_status: getField('visa requirements'),
      entry_level_preference: getField('entry level'),
      languages_spoken: getField('languages'),
      company_types: getField('company types'),
      career_path: getField('career path'),
      roles_selected: getField('role'),
      cv_url: getField('cv'),
      linkedin_url: getField('linkedin'),
    };

    const { error } = await supabase.from('users').insert([userEntry]);

    if (error) {
      console.error('❌ Supabase Insert Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (typeof userEntry.email === 'string') {
      triggerUserMatching(userEntry.email).catch((err) => {
        console.error('❌ Failed to trigger matching for new user:', err);
      });
    } else {
      console.warn('⚠️ Skipped matching: email not valid string:', userEntry.email);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    console.error('❌ Webhook Handler Error:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Unknown server error' }, { status: 500 });
  }
}
