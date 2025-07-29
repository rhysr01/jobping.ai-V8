import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL! as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY! as string
);

export async function POST(req: NextRequest) {
  try {
    // Get the Tally webhook payload
    const tallyData = await req.json();

    // Destructure the form fields from the payload
    const {
      data: { fields: formFields }
    } = tallyData;

    // Type-safe field shape for each form input
    type FormField = { label: string; value: any };

    // Helper function to get value by label match
    const getField = (label: string) =>
      formFields.find((f: FormField) => f.label.includes(label))?.value;

    // Map fields to your Supabase `users` table structure
    const userEntry = {
      email: getField('Email'),
      full_name: getField('Whats your name?'),
      target_cities: getField('target cities'),
      professional_experience: getField('professional experience'),
      employment_start_date: getField('employment start date'),
      work_environment: getField('preferred work enviornment'),
      visa_status: getField('visa requirements'),
      entry_level_preference: getField('entry level'),
      languages_spoken: getField('languages'),
      company_types: getField('company types'),
      career_path: getField('career path'),
      roles_selected: getField('Role(s)'),
      cv_url: getField('CV'),
      linkedin_url: getField('LinkedIn'),
    };

    // Insert user into Supabase
    const { error } = await supabase.from('users').insert([userEntry]);

    if (error) {
      console.error('Supabase Insert Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
