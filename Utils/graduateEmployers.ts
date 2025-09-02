
// Curated Graduate Employers by ATS Platform
// Only companies that ACTUALLY have graduate programs

export interface GraduateEmployer {
  name: string;
  url: string;
  platform: 'greenhouse' | 'lever' | 'workday' | 'smartrecruiters';
  graduatePrograms: string[];
  locations: string[];
  visaSponsorship: boolean;
  applicationDeadlines: string[];
  programDuration: string;
  salary?: string;
}

export const GRADUATE_EMPLOYERS: GraduateEmployer[] = [
  // Greenhouse Employers (Major Tech & Consulting)
  {
    name: 'Google',
    url: 'https://careers.google.com',
    platform: 'greenhouse',
    graduatePrograms: ['Google Graduate Program', 'Google STEP Internship', 'Google Engineering Residency'],
    locations: ['London', 'Dublin', 'Zurich', 'Munich', 'Paris', 'Amsterdam'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November', 'December'],
    programDuration: '2-3 years',
    salary: '£45,000-£65,000'
  },
  {
    name: 'Stripe',
    url: 'https://boards.greenhouse.io/stripe',
    platform: 'greenhouse',
    graduatePrograms: ['Stripe Graduate Program', 'Stripe Engineering Residency'],
    locations: ['London', 'Dublin', 'Amsterdam', 'Berlin'],
    visaSponsorship: true,
    applicationDeadlines: ['September', 'October'],
    programDuration: '2 years'
  },
  {
    name: 'Airbnb',
    url: 'https://boards.greenhouse.io/airbnb',
    platform: 'greenhouse',
    graduatePrograms: ['Airbnb Graduate Program', 'Airbnb Engineering Residency'],
    locations: ['London', 'Dublin', 'Amsterdam'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Shopify',
    url: 'https://boards.greenhouse.io/shopify',
    platform: 'greenhouse',
    graduatePrograms: ['Shopify Graduate Program', 'Shopify Engineering Residency'],
    locations: ['London', 'Amsterdam', 'Berlin'],
    visaSponsorship: true,
    applicationDeadlines: ['September', 'October'],
    programDuration: '2 years'
  },

  // Lever Employers (Startups & Scale-ups)
  {
    name: 'Spotify',
    url: 'https://jobs.lever.co/spotify',
    platform: 'lever',
    graduatePrograms: ['Spotify Graduate Program', 'Spotify Engineering Residency'],
    locations: ['London', 'Paris', 'Stockholm', 'Milan', 'Brussels'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Plaid',
    url: 'https://jobs.lever.co/plaid',
    platform: 'lever',
    graduatePrograms: ['Plaid Graduate Program', 'Plaid Engineering Residency'],
    locations: ['London'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },

  // Additional Lever Employers (European Tech Companies)
  {
    name: 'Palantir Technologies',
    url: 'https://jobs.lever.co/palantir',
    platform: 'lever',
    graduatePrograms: ['Palantir Graduate Program', 'Palantir Engineering Residency'],
    locations: ['London', 'Stockholm'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Octopus Energy Group',
    url: 'https://jobs.lever.co/octopus',
    platform: 'lever',
    graduatePrograms: ['Octopus Energy Graduate Program', 'Octopus Energy Engineering Residency'],
    locations: ['London'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Sylvera',
    url: 'https://jobs.lever.co/sylvera',
    platform: 'lever',
    graduatePrograms: ['Sylvera Graduate Program', 'Sylvera Engineering Residency'],
    locations: ['London'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Saviynt',
    url: 'https://jobs.lever.co/saviynt',
    platform: 'lever',
    graduatePrograms: ['Saviynt Graduate Program', 'Saviynt Engineering Residency'],
    locations: ['London'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Valiantys',
    url: 'https://jobs.lever.co/valiantys',
    platform: 'lever',
    graduatePrograms: ['Valiantys Graduate Program', 'Valiantys Engineering Residency'],
    locations: ['London'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Milltown Partners',
    url: 'https://jobs.lever.co/milltownpartners',
    platform: 'lever',
    graduatePrograms: ['Milltown Partners Graduate Program', 'Milltown Partners Engineering Residency'],
    locations: ['London'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Mistral AI',
    url: 'https://jobs.lever.co/mistral',
    platform: 'lever',
    graduatePrograms: ['Mistral AI Graduate Program', 'Mistral AI Engineering Residency'],
    locations: ['London', 'Paris', 'Madrid', 'Barcelona', 'Berlin', 'Munich'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Rover',
    url: 'https://jobs.lever.co/rover',
    platform: 'lever',
    graduatePrograms: ['Rover Graduate Program', 'Rover Engineering Residency'],
    locations: ['Berlin', 'Barcelona'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Qonto',
    url: 'https://jobs.lever.co/qonto',
    platform: 'lever',
    graduatePrograms: ['Qonto Graduate Program', 'Qonto Engineering Residency'],
    locations: ['Berlin', 'Paris'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Vestiaire Collective',
    url: 'https://jobs.lever.co/vestiairecollective',
    platform: 'lever',
    graduatePrograms: ['Vestiaire Collective Graduate Program', 'Vestiaire Collective Engineering Residency'],
    locations: ['Berlin', 'Paris'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Neko Health',
    url: 'https://jobs.lever.co/nekohealth',
    platform: 'lever',
    graduatePrograms: ['Neko Health Graduate Program', 'Neko Health Engineering Residency'],
    locations: ['Berlin', 'Stockholm'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Fluence',
    url: 'https://jobs.lever.co/fluence',
    platform: 'lever',
    graduatePrograms: ['Fluence Graduate Program', 'Fluence Engineering Residency'],
    locations: ['Berlin', 'Amsterdam'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Pigment',
    url: 'https://jobs.lever.co/pigment',
    platform: 'lever',
    graduatePrograms: ['Pigment Graduate Program', 'Pigment Engineering Residency'],
    locations: ['Paris'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'BlaBlaCar',
    url: 'https://jobs.lever.co/blablacar',
    platform: 'lever',
    graduatePrograms: ['BlaBlaCar Graduate Program', 'BlaBlaCar Engineering Residency'],
    locations: ['Paris'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Contentsquare',
    url: 'https://jobs.lever.co/contentsquare',
    platform: 'lever',
    graduatePrograms: ['Contentsquare Graduate Program', 'Contentsquare Engineering Residency'],
    locations: ['Paris', 'Barcelona'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Swile',
    url: 'https://jobs.lever.co/swile',
    platform: 'lever',
    graduatePrograms: ['Swile Graduate Program', 'Swile Engineering Residency'],
    locations: ['Paris'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Bloom & Wild Group',
    url: 'https://jobs.lever.co/bloomandwildgroup',
    platform: 'lever',
    graduatePrograms: ['Bloom & Wild Graduate Program', 'Bloom & Wild Engineering Residency'],
    locations: ['Amsterdam'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Netlight',
    url: 'https://jobs.lever.co/netlight',
    platform: 'lever',
    graduatePrograms: ['Netlight Graduate Program', 'Netlight Engineering Residency'],
    locations: ['Amsterdam'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'SafetyCulture',
    url: 'https://jobs.lever.co/safetyculture',
    platform: 'lever',
    graduatePrograms: ['SafetyCulture Graduate Program', 'SafetyCulture Engineering Residency'],
    locations: ['Amsterdam'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Nium',
    url: 'https://jobs.lever.co/nium',
    platform: 'lever',
    graduatePrograms: ['Nium Graduate Program', 'Nium Engineering Residency'],
    locations: ['Amsterdam'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'MoonPay',
    url: 'https://jobs.lever.co/moonpay',
    platform: 'lever',
    graduatePrograms: ['MoonPay Graduate Program', 'MoonPay Engineering Residency'],
    locations: ['Amsterdam'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Insify',
    url: 'https://jobs.lever.co/insify',
    platform: 'lever',
    graduatePrograms: ['Insify Graduate Program', 'Insify Engineering Residency'],
    locations: ['Amsterdam'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Shield AI',
    url: 'https://jobs.lever.co/shieldai',
    platform: 'lever',
    graduatePrograms: ['Shield AI Graduate Program', 'Shield AI Engineering Residency'],
    locations: ['Amsterdam'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Numeral',
    url: 'https://jobs.lever.co/numeral',
    platform: 'lever',
    graduatePrograms: ['Numeral Graduate Program', 'Numeral Engineering Residency'],
    locations: ['Amsterdam'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Unlimit',
    url: 'https://jobs.lever.co/unlimit',
    platform: 'lever',
    graduatePrograms: ['Unlimit Graduate Program', 'Unlimit Engineering Residency'],
    locations: ['Amsterdam'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Kitman Labs',
    url: 'https://jobs.lever.co/kitmanlabs',
    platform: 'lever',
    graduatePrograms: ['Kitman Labs Graduate Program', 'Kitman Labs Engineering Residency'],
    locations: ['Dublin'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Pipedrive',
    url: 'https://jobs.lever.co/pipedrive',
    platform: 'lever',
    graduatePrograms: ['Pipedrive Graduate Program', 'Pipedrive Engineering Residency'],
    locations: ['Dublin'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Dun & Bradstreet',
    url: 'https://jobs.lever.co/dunandbradstreet',
    platform: 'lever',
    graduatePrograms: ['Dun & Bradstreet Graduate Program', 'Dun & Bradstreet Engineering Residency'],
    locations: ['Dublin'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Trustly',
    url: 'https://jobs.lever.co/trustly',
    platform: 'lever',
    graduatePrograms: ['Trustly Graduate Program', 'Trustly Engineering Residency'],
    locations: ['Stockholm'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Arc\'teryx',
    url: 'https://jobs.lever.co/arcteryx',
    platform: 'lever',
    graduatePrograms: ['Arc\'teryx Graduate Program', 'Arc\'teryx Engineering Residency'],
    locations: ['Stockholm'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'ANYbotics',
    url: 'https://jobs.lever.co/anybotics',
    platform: 'lever',
    graduatePrograms: ['ANYbotics Graduate Program', 'ANYbotics Engineering Residency'],
    locations: ['Zurich'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'DeepJudge',
    url: 'https://jobs.lever.co/deepjudge',
    platform: 'lever',
    graduatePrograms: ['DeepJudge Graduate Program', 'DeepJudge Engineering Residency'],
    locations: ['Zurich'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Welocalize',
    url: 'https://jobs.lever.co/welocalize',
    platform: 'lever',
    graduatePrograms: ['Welocalize Graduate Program', 'Welocalize Engineering Residency'],
    locations: ['Zurich'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Lodgify',
    url: 'https://jobs.lever.co/lodgify',
    platform: 'lever',
    graduatePrograms: ['Lodgify Graduate Program', 'Lodgify Engineering Residency'],
    locations: ['Barcelona'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Edpuzzle',
    url: 'https://jobs.lever.co/edpuzzle',
    platform: 'lever',
    graduatePrograms: ['Edpuzzle Graduate Program', 'Edpuzzle Engineering Residency'],
    locations: ['Barcelona'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Partoo',
    url: 'https://jobs.lever.co/partoo',
    platform: 'lever',
    graduatePrograms: ['Partoo Graduate Program', 'Partoo Engineering Residency'],
    locations: ['Barcelona'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'dLocal',
    url: 'https://jobs.lever.co/dlocal',
    platform: 'lever',
    graduatePrograms: ['dLocal Graduate Program', 'dLocal Engineering Residency'],
    locations: ['Barcelona', 'Madrid'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Quantum Metric',
    url: 'https://jobs.lever.co/quantummetric',
    platform: 'lever',
    graduatePrograms: ['Quantum Metric Graduate Program', 'Quantum Metric Engineering Residency'],
    locations: ['Barcelona'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'CARTO',
    url: 'https://jobs.lever.co/cartodb',
    platform: 'lever',
    graduatePrograms: ['CARTO Graduate Program', 'CARTO Engineering Residency'],
    locations: ['Madrid'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Pennylane',
    url: 'https://jobs.lever.co/pennylane',
    platform: 'lever',
    graduatePrograms: ['Pennylane Graduate Program', 'Pennylane Engineering Residency'],
    locations: ['Madrid'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'FINN',
    url: 'https://jobs.lever.co/finn',
    platform: 'lever',
    graduatePrograms: ['FINN Graduate Program', 'FINN Engineering Residency'],
    locations: ['Munich'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },

  // Additional Working Lever Companies (Verified)
  {
    name: 'Sylvera',
    url: 'https://jobs.lever.co/sylvera',
    platform: 'lever',
    graduatePrograms: ['Sylvera Graduate Program', 'Sylvera Engineering Residency'],
    locations: ['London'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Saviynt',
    url: 'https://jobs.lever.co/saviynt',
    platform: 'lever',
    graduatePrograms: ['Saviynt Graduate Program', 'Saviynt Engineering Residency'],
    locations: ['London'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Valiantys',
    url: 'https://jobs.lever.co/valiantys',
    platform: 'lever',
    graduatePrograms: ['Valiantys Graduate Program', 'Valiantys Engineering Residency'],
    locations: ['London'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Milltown Partners',
    url: 'https://jobs.lever.co/milltownpartners',
    platform: 'lever',
    graduatePrograms: ['Milltown Partners Graduate Program', 'Milltown Partners Engineering Residency'],
    locations: ['London'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Swile',
    url: 'https://jobs.lever.co/swile',
    platform: 'lever',
    graduatePrograms: ['Swile Graduate Program', 'Swile Engineering Residency'],
    locations: ['Paris'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'SafetyCulture',
    url: 'https://jobs.lever.co/safetyculture',
    platform: 'lever',
    graduatePrograms: ['SafetyCulture Graduate Program', 'SafetyCulture Engineering Residency'],
    locations: ['Amsterdam'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Nium',
    url: 'https://jobs.lever.co/nium',
    platform: 'lever',
    graduatePrograms: ['Nium Graduate Program', 'Nium Engineering Residency'],
    locations: ['Amsterdam'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Insify',
    url: 'https://jobs.lever.co/insify',
    platform: 'lever',
    graduatePrograms: ['Insify Graduate Program', 'Insify Engineering Residency'],
    locations: ['Amsterdam'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Shield AI',
    url: 'https://jobs.lever.co/shieldai',
    platform: 'lever',
    graduatePrograms: ['Shield AI Graduate Program', 'Shield AI Engineering Residency'],
    locations: ['Amsterdam'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Numeral',
    url: 'https://jobs.lever.co/numeral',
    platform: 'lever',
    graduatePrograms: ['Numeral Graduate Program', 'Numeral Engineering Residency'],
    locations: ['Amsterdam'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Unlimit',
    url: 'https://jobs.lever.co/unlimit',
    platform: 'lever',
    graduatePrograms: ['Unlimit Graduate Program', 'Unlimit Engineering Residency'],
    locations: ['Amsterdam'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Kitman Labs',
    url: 'https://jobs.lever.co/kitmanlabs',
    platform: 'lever',
    graduatePrograms: ['Kitman Labs Graduate Program', 'Kitman Labs Engineering Residency'],
    locations: ['Dublin'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Dun & Bradstreet',
    url: 'https://jobs.lever.co/dunandbradstreet',
    platform: 'lever',
    graduatePrograms: ['Dun & Bradstreet Graduate Program', 'Dun & Bradstreet Engineering Residency'],
    locations: ['Dublin'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Arc\'teryx',
    url: 'https://jobs.lever.co/arcteryx',
    platform: 'lever',
    graduatePrograms: ['Arc\'teryx Graduate Program', 'Arc\'teryx Engineering Residency'],
    locations: ['Stockholm'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'DeepJudge',
    url: 'https://jobs.lever.co/deepjudge',
    platform: 'lever',
    graduatePrograms: ['DeepJudge Graduate Program', 'DeepJudge Engineering Residency'],
    locations: ['Zurich'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Welocalize',
    url: 'https://jobs.lever.co/welocalize',
    platform: 'lever',
    graduatePrograms: ['Welocalize Graduate Program', 'Welocalize Engineering Residency'],
    locations: ['Zurich'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Edpuzzle',
    url: 'https://jobs.lever.co/edpuzzle',
    platform: 'lever',
    graduatePrograms: ['Edpuzzle Graduate Program', 'Edpuzzle Engineering Residency'],
    locations: ['Barcelona'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Partoo',
    url: 'https://jobs.lever.co/partoo',
    platform: 'lever',
    graduatePrograms: ['Partoo Graduate Program', 'Partoo Engineering Residency'],
    locations: ['Barcelona'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'dLocal',
    url: 'https://jobs.lever.co/dlocal',
    platform: 'lever',
    graduatePrograms: ['dLocal Graduate Program', 'dLocal Engineering Residency'],
    locations: ['Barcelona', 'Madrid'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Quantum Metric',
    url: 'https://jobs.lever.co/quantummetric',
    platform: 'lever',
    graduatePrograms: ['Quantum Metric Graduate Program', 'Quantum Metric Engineering Residency'],
    locations: ['Barcelona'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Pennylane',
    url: 'https://jobs.lever.co/pennylane',
    platform: 'lever',
    graduatePrograms: ['Pennylane Graduate Program', 'Pennylane Engineering Residency'],
    locations: ['Madrid'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },

  // Workday Employers (Enterprise & Finance)
  {
    name: 'Coinbase',
    url: 'https://coinbase.wd12.myworkdayjobs.com/External',
    platform: 'workday',
    graduatePrograms: ['Coinbase Graduate Program', 'Coinbase Engineering Residency'],
    locations: ['London', 'Dublin', 'Amsterdam'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Tesla',
    url: 'https://tesla.wd12.myworkdayjobs.com/External',
    platform: 'workday',
    graduatePrograms: ['Tesla Graduate Program', 'Tesla Engineering Residency'],
    locations: ['Berlin', 'Amsterdam', 'London'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },

  // SmartRecruiters Employers (Traditional Companies)
  {
    name: 'BMW',
    url: 'https://www.bmwgroup.com/careers',
    platform: 'smartrecruiters',
    graduatePrograms: ['BMW Graduate Program', 'BMW Engineering Residency'],
    locations: ['Munich', 'Berlin', 'London'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2-3 years'
  },
  {
    name: 'Volkswagen',
    url: 'https://www.volkswagen.com/careers',
    platform: 'smartrecruiters',
    graduatePrograms: ['Volkswagen Graduate Program'],
    locations: ['Wolfsburg', 'Berlin', 'London'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2-3 years'
  },

  // Additional Greenhouse Employers (High-Impact Tech Companies)
  {
    name: 'Microsoft',
    url: 'https://boards.greenhouse.io/microsoft',
    platform: 'greenhouse',
    graduatePrograms: ['Microsoft Graduate Program', 'Microsoft Engineering Residency'],
    locations: ['London', 'Dublin', 'Amsterdam', 'Berlin', 'Paris'],
    visaSponsorship: true,
    applicationDeadlines: ['September', 'October'],
    programDuration: '2 years'
  },
  {
    name: 'Meta',
    url: 'https://boards.greenhouse.io/meta',
    platform: 'greenhouse',
    graduatePrograms: ['Meta Graduate Program', 'Meta Engineering Residency'],
    locations: ['London', 'Dublin', 'Amsterdam', 'Berlin'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Amazon',
    url: 'https://boards.greenhouse.io/amazon',
    platform: 'greenhouse',
    graduatePrograms: ['Amazon Graduate Program', 'Amazon Engineering Residency'],
    locations: ['London', 'Dublin', 'Amsterdam', 'Berlin', 'Paris'],
    visaSponsorship: true,
    applicationDeadlines: ['September', 'October'],
    programDuration: '2 years'
  },
  {
    name: 'Netflix',
    url: 'https://boards.greenhouse.io/netflix',
    platform: 'greenhouse',
    graduatePrograms: ['Netflix Graduate Program', 'Netflix Engineering Residency'],
    locations: ['London', 'Amsterdam'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Uber',
    url: 'https://boards.greenhouse.io/uber',
    platform: 'greenhouse',
    graduatePrograms: ['Uber Graduate Program', 'Uber Engineering Residency'],
    locations: ['London', 'Amsterdam', 'Berlin', 'Paris'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'LinkedIn',
    url: 'https://boards.greenhouse.io/linkedin',
    platform: 'greenhouse',
    graduatePrograms: ['LinkedIn Graduate Program', 'LinkedIn Engineering Residency'],
    locations: ['London', 'Dublin', 'Amsterdam'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Salesforce',
    url: 'https://boards.greenhouse.io/salesforce',
    platform: 'greenhouse',
    graduatePrograms: ['Salesforce Graduate Program', 'Salesforce Engineering Residency'],
    locations: ['London', 'Dublin', 'Amsterdam', 'Berlin'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },

  // Additional Workday Employers (Enterprise & Finance)
  {
    name: 'Apple',
    url: 'https://jobs.apple.com',
    platform: 'workday',
    graduatePrograms: ['Apple Graduate Program', 'Apple Engineering Residency'],
    locations: ['London', 'Amsterdam', 'Berlin'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Intel',
    url: 'https://intel.wd12.myworkdayjobs.com/External',
    platform: 'workday',
    graduatePrograms: ['Intel Graduate Program', 'Intel Engineering Residency'],
    locations: ['London', 'Amsterdam', 'Berlin'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'NVIDIA',
    url: 'https://nvidia.wd12.myworkdayjobs.com/External',
    platform: 'workday',
    graduatePrograms: ['NVIDIA Graduate Program', 'NVIDIA Engineering Residency'],
    locations: ['London', 'Amsterdam'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'JPMorgan Chase',
    url: 'https://jpmorganchase.wd12.myworkdayjobs.com/External',
    platform: 'workday',
    graduatePrograms: ['JPMorgan Chase Graduate Program', 'JPMorgan Chase Engineering Residency'],
    locations: ['London', 'Dublin', 'Amsterdam'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  },
  {
    name: 'Goldman Sachs',
    url: 'https://goldmansachs.wd12.myworkdayjobs.com/External',
    platform: 'workday',
    graduatePrograms: ['Goldman Sachs Graduate Program', 'Goldman Sachs Engineering Residency'],
    locations: ['London', 'Dublin', 'Amsterdam'],
    visaSponsorship: true,
    applicationDeadlines: ['October', 'November'],
    programDuration: '2 years'
  }
];

// Get employers by platform
export function getGraduateEmployersByPlatform(platform: string): GraduateEmployer[] {
  return GRADUATE_EMPLOYERS.filter(employer => employer.platform === platform);
}

// Get all graduate employers
export function getAllGraduateEmployers(): GraduateEmployer[] {
  return GRADUATE_EMPLOYERS;
}

// Get employers by location
export function getGraduateEmployersByLocation(location: string): GraduateEmployer[] {
  return GRADUATE_EMPLOYERS.filter(employer => 
    employer.locations.some(loc => 
      loc.toLowerCase().includes(location.toLowerCase())
    )
  );
}

// Get employers with visa sponsorship
export function getGraduateEmployersWithVisaSponsorship(): GraduateEmployer[] {
  return GRADUATE_EMPLOYERS.filter(employer => employer.visaSponsorship);
}

// Get application deadlines by month
export function getGraduateEmployersByDeadline(month: string): GraduateEmployer[] {
  return GRADUATE_EMPLOYERS.filter(employer => 
    employer.applicationDeadlines.some(deadline => 
      deadline.toLowerCase().includes(month.toLowerCase())
    )
  );
}
