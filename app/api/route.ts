import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client using environment variables
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL! as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY! as string
);

// Define Tally field type
type TallyField = {
  label: string;
  value: string | string[] | null;
};

// Define expected Tally webhook payload shape
type TallyWebhookPayload = {
  data: {
    fields: TallyField[];
  };
};

// POST handler for incoming Tally webhook
export async function POST(req: NextRequest) {
  try {
    const tallyData: TallyWebhookPayload = await req.json();
    const formFields = tallyData.data.fields;

    // Helper to safely extract values
    const getField = (label: string) =>
      formFields.find((f) => f.label.toLowerCase().includes(label.toLowerCase()))?.value;

    // Map Tally form fields to Supabase columns
    const userEntry = {
      email: getField('email'),
      full_name: getField('name'),
      target_cities: getField('target cities'),
      professional_experience: getField('professional experience'),
      employment_start_date: getField('employment start date'),
      work_environment: getField('work enviornment'),
      visa_status: getField('visa requirements'),
      entry_level_preference: getField('entry level'),
      languages_spoken: getField('languages'),
      company_types: getField('company types'),
      career_path: getField('career path'),
      roles_selected: getField('role'), // matches 'Role(s)' or any variant
      cv_url: getField('cv'),
      linkedin_url: getField('linkedin'),
    };

    const { error } = await supabase.from('users').insert([userEntry]);

    if (error) {
      console.error('Supabase Insert Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    console.error('Webhook Handler Error:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: 'Unknown server error' }, { status: 500 });
  }
}

}
