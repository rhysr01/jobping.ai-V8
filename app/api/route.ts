import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL! as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY! as string
);
    // Get the data from Tally
    const tallyData = await req.json();

    // Parse the data based on your Tally form fields
    const {
      data: {
        fields: formFields
    } = tallyData;

    // Map the Tally fields to your Supabase table columns
    const userEntry = {
      email: formFields.find((f: any) => f.label === 'Email')?.value,
      full_name: formFields.find((f: any) => f.label === 'Whats your name?')?.value,
      target_cities: formFields.find((f: any) => f.label.includes('target cities'))?.value,
      professional_experience: formFields.find((f: any) => f.label.includes('professional experience'))?.value,
      employment_start_date: formFields.find((f: any) => f.label.includes('employment start date'))?.value,
      work_environment: formFields.find((f: any) => f.label.includes('preferred work enviornment'))?.value,
      visa_status: formFields.find((f: any) => f.label.includes('visa requirements'))?.value,
      entry_level_preference: formFields.find((f: any) => f.label.includes('entry level'))?.value,
      languages_spoken: formFields.find((f: any) => f.label.includes('languages'))?.value,
      company_types: formFields.find((f: any) => f.label.includes('company types'))?.value,
      career_path: formFields.find((f: any) => f.label.includes('career path'))?.value,
      roles_selected: formFields.find((f: any) => f.label.includes('Role(s)'))?.value,
      cv_url: formFields.find((f: any) => f.label.includes('CV'))?.value,
      linkedin_url: formFields.find((f: any) => f.label.includes('LinkedIn'))?.value,
    };

    // Insert into Supabase
    const { data, error } = await supabase
      .from('users')
      .insert([userEntry]);

    if (error) {
      console.error('Supabase Error:', error);
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
    
  } catch (error) {
    console.error('Error handling webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
