import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function multilingualJobDeletion() {
  try {
    console.log('🌍 MULTILINGUAL JOB DELETION ANALYSIS');
    console.log('='.repeat(40));
    console.log('⚠️  Checking ALL languages for irrelevant jobs');
    console.log('✅ Conservative: Only removing CLEARLY unsuitable roles');
    console.log('');
    
    // Get total count first
    const { count: totalCount, error: countError } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true });
    
    if (countError) throw countError;
    console.log(`📊 Total jobs in database: ${totalCount}`);
    
    // Get ALL jobs in batches
    let allJobs = [];
    const batchSize = 1000;
    let offset = 0;
    
    console.log(`📥 Fetching all jobs for multilingual analysis...`);
    
    while (true) {
      const { data: batch, error } = await supabase
        .from('jobs')
        .select('id, title, company, location, description, experience_required, source')
        .range(offset, offset + batchSize - 1)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (batch.length === 0) break;
      
      allJobs = allJobs.concat(batch);
      offset += batchSize;
      
      console.log(`   📥 Fetched ${allJobs.length}/${totalCount} jobs...`);
      if (batch.length < batchSize) break;
    }
    
    console.log(`✅ Loaded ${allJobs.length} jobs for multilingual analysis`);
    
    // EXPANDED MULTILINGUAL CRITERIA
    const CLEARLY_SENIOR_TITLES = [
      // English
      'chief executive', 'chief operating', 'chief financial', 'chief technology', 'chief marketing',
      'ceo', 'coo', 'cfo', 'cto', 'cmo', 'chief ',
      'president', 'vice president', 'vp ', 'executive vice president', 'evp',
      'managing director', 'executive director', 'senior director',
      'head of department', 'head of division', 'department head', 'head of ',
      'senior partner', 'managing partner', 'principal partner',
      'senior principal', 'principal consultant', 'principal manager',
      'senior manager', 'senior team leader', 'senior supervisor',
      'director of', 'regional director', 'country manager',
      'board member', 'board director', 'chairman', 'chairwoman',
      
      // French
      'directeur général', 'directrice générale', 'directeur', 'directrice',
      'chef de département', 'responsable département', 'chef d\'équipe senior',
      'directeur financier', 'directrice financière', 'directeur commercial',
      'responsable senior', 'manager senior', 'chef de région',
      
      // German
      'geschäftsführer', 'geschäftsführerin', 'direktor', 'direktorin',
      'abteilungsleiter', 'abteilungsleiterin', 'senior manager',
      'bereichsleiter', 'bereichsleiterin', 'hauptabteilungsleiter',
      
      // Italian
      'direttore generale', 'direttrice generale', 'direttore', 'direttrice',
      'responsabile senior', 'capo reparto', 'capo divisione',
      'manager senior', 'dirigente', 'amministratore delegato',
      
      // Spanish
      'director general', 'directora general', 'director', 'directora',
      'jefe de departamento', 'jefa de departamento', 'gerente senior',
      'responsable senior', 'jefe de área', 'jefa de área'
    ];
    
    const CLEARLY_NOT_BUSINESS_SCHOOL = [
      // === ENGLISH ===
      // Healthcare/Medical 
      'nurse', 'nursing', 'doctor', 'physician', 'surgeon', 'medical doctor',
      'pharmacist', 'dentist', 'veterinarian', 'radiologist', 'therapist',
      'paramedic', 'medical assistant', 'healthcare worker',
      
      // Education
      'teacher', 'professor', 'lecturer', 'instructor', 'tutor',
      'school administrator', 'academic coordinator', 'professorship',
      'educator', 'teaching assistant',
      
      // Food service & hospitality
      'chef', 'cook', 'kitchen', 'waiter', 'waitress', 'bartender', 'server',
      'dishwasher', 'food service', 'restaurant server', 'sous chef',
      'chef de rang', 'chef de partie', 'kitchen assistant',
      
      // Manual labor/trades
      'truck driver', 'delivery driver', 'driver', 'taxi driver',
      'warehouse worker', 'factory worker', 'production worker',
      'construction worker', 'electrician', 'plumber', 'carpenter',
      'mechanic', 'technician', 'maintenance worker', 'janitor',
      'cleaner', 'security guard', 'groundskeeper',
      
      // Basic retail/service
      'cashier', 'store clerk', 'sales associate', 'shop assistant',
      'customer service representative', 'call center agent',
      
      // === ITALIAN ===
      // Healthcare
      'infermiere', 'infermiera', 'medico', 'dottore', 'dottoressa',
      'farmacista', 'dentista', 'chirurgo', 'ospedale', 'clinica',
      
      // Education
      'insegnante', 'professore', 'professoressa', 'docente', 'istruttore',
      'educatore', 'educatrice', 'maestro', 'maestra',
      
      // Food service
      'cuoco', 'cuoca', 'chef', 'cameriere', 'cameriera', 'barista',
      'sotto chef', 'aiuto cuoco', 'cucina', 'ristorante',
      
      // Manual/Service
      'autista', 'camionista', 'operaio', 'operaia', 'tecnico',
      'meccanico', 'elettricista', 'idraulico', 'muratore',
      'pulitore', 'pulitrice', 'addetto pulizie', 'magazziniere',
      'cassiere', 'cassiera', 'commesso', 'commessa',
      
      // === FRENCH ===
      // Healthcare
      'infirmier', 'infirmière', 'médecin', 'docteur', 'chirurgien',
      'pharmacien', 'pharmacienne', 'dentiste', 'hôpital',
      
      // Education
      'enseignant', 'enseignante', 'professeur', 'professeure', 'instituteur',
      'institutrice', 'formateur', 'formatrice', 'éducateur', 'éducatrice',
      
      // Food service
      'cuisinier', 'cuisinière', 'chef cuisinier', 'serveur', 'serveuse',
      'barman', 'barmaid', 'commis de cuisine', 'aide cuisinier',
      
      // Manual/Service
      'chauffeur', 'conducteur', 'conductrice', 'ouvrier', 'ouvrière',
      'technicien', 'technicienne', 'mécanicien', 'mécanicienne',
      'électricien', 'électricienne', 'plombier', 'maçon',
      'agent de nettoyage', 'femme de ménage', 'magasinier',
      'caissier', 'caissière', 'vendeur', 'vendeuse',
      
      // === GERMAN ===
      // Healthcare
      'krankenschwester', 'krankenpfleger', 'arzt', 'ärztin', 'chirurg',
      'apotheker', 'apothekerin', 'zahnarzt', 'zahnärztin',
      
      // Education
      'lehrer', 'lehrerin', 'professor', 'professorin', 'dozent',
      'dozentin', 'ausbilder', 'ausbilderin', 'erzieher', 'erzieherin',
      
      // Food service
      'koch', 'köchin', 'küchenchef', 'kellner', 'kellnerin',
      'barkeeper', 'barmann', 'küchenhelfer', 'küchenhilfe',
      
      // Manual/Service
      'fahrer', 'lkw-fahrer', 'arbeiter', 'arbeiterin', 'techniker',
      'mechaniker', 'mechanikerin', 'elektriker', 'elektrikerin',
      'klempner', 'maurer', 'reinigungskraft', 'lagerarbeiter',
      'kassierer', 'kassiererin', 'verkäufer', 'verkäuferin',
      
      // === SPANISH ===
      // Healthcare
      'enfermero', 'enfermera', 'médico', 'doctor', 'doctora',
      'farmacéutico', 'farmacéutica', 'dentista', 'cirujano',
      
      // Education
      'profesor', 'profesora', 'maestro', 'maestra', 'docente',
      'instructor', 'instructora', 'educador', 'educadora',
      
      // Food service
      'cocinero', 'cocinera', 'chef', 'camarero', 'camarera',
      'barman', 'ayudante de cocina', 'pinche de cocina',
      
      // Manual/Service
      'conductor', 'conductora', 'camionero', 'obrero', 'obrera',
      'técnico', 'mecánico', 'mecánica', 'electricista',
      'fontanero', 'albañil', 'limpiador', 'limpiadora',
      'almacenero', 'cajero', 'cajera', 'vendedor', 'vendedora',
      
      // === DUTCH ===
      // Healthcare
      'verpleegkundige', 'arts', 'dokter', 'chirurg', 'apotheker',
      'tandarts', 'ziekenhuis',
      
      // Education
      'leraar', 'docent', 'professor', 'onderwijzer', 'instructeur',
      
      // Food service
      'kok', 'chef-kok', 'ober', 'serveerster', 'barman',
      'keukenhulp', 'keukenassistent',
      
      // Manual/Service
      'chauffeur', 'vrachtwagenchauffeur', 'arbeider', 'technicus',
      'monteur', 'elektricien', 'loodgieter', 'schoonmaker',
      'magazijnmedewerker', 'kassier', 'verkoper'
    ];
    
    // Analyze each job with multilingual criteria
    console.log(`\n🌍 Analyzing ${allJobs.length} jobs with multilingual criteria...`);
    
    const jobsToDelete = allJobs.filter(job => {
      const title = job.title.toLowerCase();
      const description = (job.description || '').toLowerCase();
      
      // Check for clearly senior titles (any language)
      const hasClearlySeniorTitle = CLEARLY_SENIOR_TITLES.some(term => {
        const termLower = term.toLowerCase().trim();
        return title.includes(termLower);
      });
      
      // Check for clearly non-business school roles (any language)
      const isClearlyNotBusinessSchool = CLEARLY_NOT_BUSINESS_SCHOOL.some(term => {
        const termLower = term.toLowerCase().trim();
        return title.includes(termLower);
      });
      
      return hasClearlySeniorTitle || isClearlyNotBusinessSchool;
    });
    
    // Categorize deletions
    const seniorRoles = jobsToDelete.filter(job => {
      const title = job.title.toLowerCase();
      return CLEARLY_SENIOR_TITLES.some(term => title.includes(term.toLowerCase()));
    });
    
    const irrelevantRoles = jobsToDelete.filter(job => {
      const title = job.title.toLowerCase();
      return CLEARLY_NOT_BUSINESS_SCHOOL.some(term => title.includes(term.toLowerCase()));
    });
    
    const deletionPercentage = (jobsToDelete.length / allJobs.length) * 100;
    
    console.log(`\n📊 MULTILINGUAL DELETION ANALYSIS:`);
    console.log(`   🎯 Total jobs analyzed: ${allJobs.length.toLocaleString()}`);
    console.log(`   🗑️  Jobs to delete: ${jobsToDelete.length.toLocaleString()} (${deletionPercentage.toFixed(1)}%)`);
    console.log(`   📊 Jobs to keep: ${(allJobs.length - jobsToDelete.length).toLocaleString()} (${(100 - deletionPercentage).toFixed(1)}%)`);
    
    console.log(`\n📋 DELETION BREAKDOWN:`);
    console.log(`   🎖️  Senior/Executive roles: ${seniorRoles.length.toLocaleString()}`);
    console.log(`   🚫 Non-business school roles: ${irrelevantRoles.length.toLocaleString()}`);
    
    // Show language-specific examples
    console.log(`\n🔍 SAMPLE MULTILINGUAL IRRELEVANT JOBS TO DELETE:`);
    
    // Italian examples
    const italianJobs = irrelevantRoles.filter(job => 
      job.title.toLowerCase().includes('cuoco') || 
      job.title.toLowerCase().includes('cameriere') ||
      job.title.toLowerCase().includes('infermiere') ||
      job.title.toLowerCase().includes('professore')
    ).slice(0, 5);
    
    // French examples  
    const frenchJobs = irrelevantRoles.filter(job => 
      job.title.toLowerCase().includes('cuisinier') || 
      job.title.toLowerCase().includes('serveur') ||
      job.title.toLowerCase().includes('infirmier') ||
      job.title.toLowerCase().includes('enseignant')
    ).slice(0, 5);
    
    // German examples
    const germanJobs = irrelevantRoles.filter(job => 
      job.title.toLowerCase().includes('koch') || 
      job.title.toLowerCase().includes('kellner') ||
      job.title.toLowerCase().includes('lehrer') ||
      job.title.toLowerCase().includes('krankenschwester')
    ).slice(0, 5);
    
    console.log(`\n🇮🇹 ITALIAN JOBS TO DELETE:`);
    italianJobs.forEach((job, i) => {
      console.log(`   ${i+1}. "${job.title}" at ${job.company}`);
    });
    
    console.log(`\n🇫🇷 FRENCH JOBS TO DELETE:`);
    frenchJobs.forEach((job, i) => {
      console.log(`   ${i+1}. "${job.title}" at ${job.company}`);
    });
    
    console.log(`\n🇩🇪 GERMAN JOBS TO DELETE:`);
    germanJobs.forEach((job, i) => {
      console.log(`   ${i+1}. "${job.title}" at ${job.company}`);
    });
    
    // Show some general samples
    console.log(`\n🔍 SAMPLE SENIOR ROLES TO DELETE (multilingual):`);
    seniorRoles.slice(0, 10).forEach((job, i) => {
      console.log(`   ${i+1}. "${job.title}" at ${job.company} (${job.source})`);
    });
    
    // Final assessment
    if (deletionPercentage > 30) {
      console.log(`\n⚠️  WARNING: Planning to delete ${deletionPercentage.toFixed(1)}% of all jobs`);
      console.log(`   This seems aggressive - please review criteria!`);
    } else {
      console.log(`\n✅ MULTILINGUAL APPROACH LOOKS GOOD:`);
      console.log(`   Deleting ${deletionPercentage.toFixed(1)}% of jobs - found many more irrelevant roles!`);
      console.log(`   Much better coverage of non-business school jobs across languages`);
    }
    
    return jobsToDelete.map(job => job.id);
    
  } catch (error) {
    console.error('❌ Multilingual analysis failed:', error.message);
    return [];
  }
}

// Export for deletion script
export { multilingualJobDeletion };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const idsToDelete = await multilingualJobDeletion();
  console.log(`\n🌍 MULTILINGUAL DELETION READY: ${idsToDelete.length.toLocaleString()} job IDs identified`);
  console.log(`\n❓ Proceed with multilingual deletion?`);
}
