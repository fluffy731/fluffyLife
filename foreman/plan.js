// Master plan: every stage of a Victorian new-home build, mapped to the BPC DB-U activity list.
// Stages 1 and 2 are built out; the rest are planned and keep the same layout when they are added.
export const CHECKED = '8 November 2026';

export const FLAGS = {
  V: { label: 'Verified', hint: `Checked against the source named in Sources on ${CHECKED}.` },
  T: { label: 'Typical', hint: 'Normal industry practice. The endorsed drawings, specification and your building surveyor govern.' },
  C: { label: 'Confirm', hint: 'Not checked this session, or likely to change. Confirm against the current Act, NCC clause, Standard or product listing before relying on it.' },
};

// The 12 activities BPC says a DB-U applicant must evidence (also the best guide to the exam's scope).
export const ACTS = [
  'Establish whether a building permit is needed', 'Apply for and obtain a building permit', 'Comply with a building permit',
  'Arrange certification of completed work', 'Produce cost estimates and quotations', 'Identify the need for, and establish, a major domestic building contract',
  'Plan and prepare for construction', 'Arrange workers or subcontractors safely and competently', 'Develop, communicate, monitor and maintain site safety plans',
  'Ensure site safety inductions are done', 'Supervise all work for compliance with the NCC, Australian Standards and local authority requirements', 'Ensure work follows safety and environmental legislation',
];

export const STAGES = [
  { n: 1, title: 'Permits, contract and site establishment', built: true, acts: [1, 2, 5, 6, 7, 8, 9, 10, 12],
    blurb: 'Planning and building permits, the major domestic building contract, DBI, surveys, soil report, safety plan and a compliant site.',
    topics: ['Planning permit vs building permit', 'Contract rules, deposits and stage payments', 'Domestic building insurance', 'Estimating and quotes', 'Site safety and environmental controls'],
    trades: ['Land surveyor', 'Geotechnical engineer', 'Structural engineer', 'Energy rater', 'Building surveyor', 'Fencing, toilet, power, skip hire'] },
  { n: 2, title: 'Footings and slab-on-ground', built: true, acts: [3, 4, 7, 8, 11, 12],
    blurb: 'Set-out, excavation, under-slab plumbing, membrane, termite barrier, reinforcement, pour and cure. Edge beam, penetration and beam-junction details.',
    topics: ['Site classification and AS 2870', 'Edge beams and rebates', 'Membrane laps and penetrations', 'Cover, chairs and laps', 'Mandatory inspection before the pour', 'Curing'],
    trades: ['Excavator', 'Plumber (drainer)', 'Termite installer', 'Steel fixer', 'Concreter', 'Ready-mix and pump'] },
  { n: 3, title: 'Wall framing', blurb: 'Timber and steel frames, MGP10 studs, plates, noggings, bracing, tie-down and lintels.',
    topics: ['AS 1684 and the span tables', 'Bracing and tie-down', 'Lintels and openings', 'Frame inspection stage'], trades: ['Carpenter or framing crew', 'Truss and frame fabricator', 'Engineer (steel)'] },
  { n: 4, title: 'Roof framing and trusses', blurb: 'Truss design and delivery, crane, temporary bracing, fixing, battens and tie-down.',
    topics: ['Truss engineering documents', 'Temporary and permanent bracing', 'Wind classification', 'Crane and working-at-heights safety'], trades: ['Truss manufacturer', 'Crane operator', 'Carpenter'] },
  { n: 5, title: 'Roof cladding, gutters and stormwater', blurb: 'Sarking, metal or tile roofing, flashings, gutters, downpipes and legal point of discharge.',
    topics: ['Roof pitch and cladding rules', 'Flashings and penetrations', 'Gutter and downpipe sizing', 'Stormwater to the legal point of discharge'], trades: ['Roofer', 'Plumber', 'Scaffolder'] },
  { n: 6, title: 'External walls', blurb: 'Brick veneer, cladding and render. Damp-proof course, weepholes, articulation joints and flashings.',
    topics: ['DPC and weepholes', 'Cavity and ties', 'Articulation joints', 'Cladding and wall wrap'], trades: ['Bricklayer', 'Cladding installer', 'Renderer', 'Scaffolder'] },
  { n: 7, title: 'Windows, doors and lock-up', blurb: 'Window and door installation, sill flashing, wall wrap, garage door and security.',
    topics: ['Window energy ratings', 'Flashing and sealing', 'Lock-up stage payment', 'Glazing safety (AS 1288)'], trades: ['Window manufacturer', 'Glazier', 'Carpenter'] },
  { n: 8, title: 'Plumbing and drainage rough-in', blurb: 'Sewer, stormwater, hot and cold water, gas. Tests, certificates of compliance and mandatory plumbing inspections.',
    topics: ['Licensed plumber requirements', 'Certificate of compliance', 'Pressure and water tests', 'Backflow and hot water temperature'], trades: ['Plumber', 'Gas fitter', 'Drainer'] },
  { n: 9, title: 'Electrical and data rough-in', blurb: 'Switchboard, cabling, smoke alarms, data and solar-ready provisions.',
    topics: ['Licensed electrician and certificate of electrical safety', 'Smoke alarms (AS 3786)', 'RCDs', 'Energy-efficiency lighting limits'], trades: ['Electrician', 'Data installer', 'Solar installer'] },
  { n: 10, title: 'Wet areas and waterproofing', blurb: 'Shower, bathroom and laundry waterproofing to AS 3740: preparation, primer, membrane, hob, drains and flood tests.',
    topics: ['AS 3740 and NCC wet area rules', 'Falls and floor wastes', 'Membrane coats, bond breakers, angles', 'Flood test and certificate'], trades: ['Waterproofer', 'Plumber', 'Plasterer'] },
  { n: 11, title: 'Insulation and energy efficiency', blurb: 'Batts, sarking, sealing, window schedule and the NatHERS or Verification Using a Reference Building route.',
    topics: ['Energy rating route', 'R-values and installation', 'Air sealing', 'Compliance with the energy report'], trades: ['Insulation installer', 'Energy rater'] },
  { n: 12, title: 'Internal linings', blurb: 'Plasterboard, fire-rated and moisture-resistant sheets, cornice and set.',
    topics: ['Fire separation and fire-rated linings', 'Sound insulation', 'Wet-area sheet types', 'Lining inspection'], trades: ['Plasterer', 'Painter (set coat)'] },
  { n: 13, title: 'Fix-out: joinery, stairs and balustrades', blurb: 'Doors, architraves, kitchen, wardrobes, stairs and balustrades.',
    topics: ['Stair going, rise and slip resistance', 'Balustrade heights and openings', 'Door hardware and accessibility'], trades: ['Carpenter', 'Joiner', 'Stair builder'] },
  { n: 14, title: 'Tiling and floor coverings', blurb: 'Tiling over waterproofing, timber, carpet and finishing details.',
    topics: ['Tile adhesives and movement joints', 'Protecting the membrane', 'Slip resistance'], trades: ['Tiler', 'Flooring installer'] },
  { n: 15, title: 'Painting and final fix', blurb: 'Painting, electrical and plumbing fit-off, commissioning, cleaning and defects list.',
    topics: ['Defects and the practical completion process', 'Commissioning services', 'Certificates to collect'], trades: ['Painter', 'Electrician', 'Plumber', 'Cleaner'] },
  { n: 16, title: 'Bushfire and fire safety', blurb: 'BAL assessment, construction requirements by BAL, smoke alarms, fire separation and Class 10 buildings.',
    topics: ['BAL-12.5 to BAL-FZ and AS 3959', 'Smoke alarm locations', 'Fire separation to boundaries'], trades: ['Bushfire consultant', 'Builder'] },
  { n: 17, title: 'External works', blurb: 'Driveway, fencing, retaining walls, landscaping, decks, garages and Class 10 structures.',
    topics: ['Retaining wall rules and permits', 'Drainage and falls away from the house', 'Class 10 requirements'], trades: ['Concreter', 'Fencer', 'Landscaper', 'Carpenter'] },
  { n: 18, title: 'Completion, occupancy and handover', blurb: 'Final inspection, certificates, occupancy permit, handover, defects period and warranties.',
    topics: ['Occupancy permit and final certificate', 'Statutory warranties and defects liability', 'Final payment and DBI claim periods', 'Records to hand over'], trades: ['Building surveyor', 'All trades (certificates)'] },
];

export const CROSS = [
  { t: 'Estimating and quotations', d: 'Quantities, trade quotes, allowances, margin, and how to compare inclusions and exclusions.' },
  { t: 'Contracts, variations and payments', d: 'Contract content, cooling-off, variations, extensions of time, stage payments, termination.' },
  { t: 'Safety on site', d: 'Safety plan, SWMS for high-risk work, inductions, working at heights, excavations, electrical safety.' },
  { t: 'Insurance and warranties', d: 'DBI, contract works and public liability insurance, statutory warranties, defects.' },
  { t: 'Records and certificates', d: 'Permits, engineers\' certificates, plumbing and electrical compliance certificates, inspection records.' },
];

// Every source used in the two built steps. Shown on each page and in the Sources panel.
export const SOURCES = {
  bpcDomestic: ['BPC: Domestic builder (class scope and experience)', 'https://www.bpc.vic.gov.au/builders/builder-classes/domestic-builder'],
  bpcWork: ['BPC: What is domestic building work', 'https://www.bpc.vic.gov.au/resource-hub/info-sheets/What-is-domestic-building-work'],
  bpcDBI: ['BPC: What is domestic building insurance (DBI)', 'https://www.bpc.vic.gov.au/builders/builders-insurance/what-is-domestic-building-insurance-dbi'],
  cavPay: ['Consumer Affairs Victoria: Deposits and payments', 'https://www.consumer.vic.gov.au/licensing-and-registration/builders-and-tradespeople/running-your-business/deposits-and-payments'],
  cavContract: ['Consumer Affairs Victoria: Preparing a major domestic building contract', 'https://www.consumer.vic.gov.au/licensing-and-registration/builders-and-tradespeople/running-your-business/domestic-building-contracts/preparing-a-major-domestic-building-contract'],
  vbaMand: ['VBA: What you need to know about mandatory notifications', 'https://www.vba.vic.gov.au/news/news/2024/what-you-need-to-know-about-mandatory-notifications'],
  bpcMI01: ['BPC practice note MI 01: Mandatory notifications and inspections', 'https://www.bpc.vic.gov.au/resource-hub/practice-notes/mi-01-mandatory-notifications-and-inspections-of-building-work'],
  abcb42: ['ABCB NCC 2022 Housing Provisions Part 4.2 footings and slabs (adopted edition)', 'https://abcb.gov.au/editions/ncc-2022/adopted/housing-provisions/8-south-australia/42-footings-slabs-and-associated-elements'],
  hiaNcc25: ['HIA: NCC 2025 adopted in Victoria from 1 May 2026', 'https://hia.com.au/resources-and-advice/building-it-right/building-codes/articles/ncc-2025-adopted-in-victoria-1-may-2026'],
  hiaAct: ['HIA: Domestic Building Contracts Amendment Bill 2025, what you need to know', 'https://hia.com.au/resources-and-advice/managing-your-business/managing-compliance/articles/domestic-building-contracts-act-amendment-bill-2025---what-you-need-to-know'],
  hiaRaft: ['HIA: NCC 2022 provisions for raft slabs', 'https://hia.com.au/resources-and-advice/building-it-right/building-codes/articles/ncc-2022-provisions-for-raft-slabs'],
  infra: ['InfraBuild: Polyethylene building films', 'https://www.infrabuild.com/reinforcing/products/accessories/polyethylene-building-films/'],
  bunnMGP: ['Bunnings: 90 x 45mm MGP10 H2 blue pine 3.0m', 'https://www.bunnings.com.au/90-x-45mm-framing-mgp10-h2-blue-pine-3-0m_p8031024'],
  bunnMGPu: ['Bunnings: 90 x 45mm MGP10 untreated pine 3.6m', 'https://www.bunnings.com.au/90-x-45mm-framing-mgp10-untreated-pine-3-6m_p8030083'],
  threeSkill: ['CloudAI-X threejs-skills (MIT), used as guidance for the 3D engine', 'https://github.com/CloudAI-X/threejs-skills'],
};

// Pointers into the owner's own Builders Academy notes (CPC50220), by module, volume and section title.
// These are suggestions taken from the section titles only; no course text is copied into this app.
// Folder names follow the notes on the owner's computer (Documents\Builders Academy Notes\...).
const M = {
  '2.1': ['Module 2 · Volume 1', 'Class 1 and 10 buildings'], '2.3': ['Module 2 · Volume 3', 'Apply structural principles'],
  '3.4': ['Module 3 · Volume 4', 'Prepare and evaluate tender documentation'], '3.5': ['Module 3 · Volume 5', 'Monitor costing systems'],
  '3.3': ['Module 3 · Volume 3', 'Manage business risk'], '4.1': ['Module 4 · Volume 1', 'Work health and safety'],
  '4.2': ['Module 4 · Volume 2', 'Quality and materials'], '4.3': ['Module 4 · Volume 3', 'Legal obligations'],
  '4.4': ['Module 4 · Volume 4', 'Manage construction work'], '5.1': ['Module 5 · Volume 1', 'Building codes and standards'],
  '5.2': ['Module 5 · Volume 2', 'Services layout'], '5.3': ['Module 5 · Volume 3', 'Supervising on-site planning'],
  '6.1': ['Module 6 · Volume 1', 'Selecting and managing subcontractors'], '6.2': ['Module 6 · Volume 2', 'Technical and legal reports'],
  '6.3': ['Module 6 · Volume 3', 'Environmental management plans'],
};
const p = (k, section, use) => ({ module: M[k][0], volume: M[k][1], section, use });
export const NOTES_FOLDER = 'Documents\\Builders Academy Notes';
export const NOTES = {
  1: [p('2.1', 'S2 Legislation, compliance and classification', 'Permits and who must comply, before you open the permit pathway.'), p('4.3', 'Legal obligations', 'Contract, insurance and statutory duties.'), p('3.4', 'Tender documentation', 'Quotes and estimates for this step.'), p('4.1', 'Work health and safety', 'Site safety plan and inductions.'), p('6.3', 'Environmental management plans', 'Silt, waste and site controls.')],
  2: [p('2.3', 'S1 Structural behaviour and S2 Laying of footing systems', 'Footing types, site classes and how a slab carries load.'), p('2.1', 'S3 Acceptable construction methods', 'Deemed-to-satisfy slab and footing rules.'), p('4.2', 'Quality and materials', 'Concrete, steel and membrane checks.'), p('5.3', 'Supervising on-site planning', 'Sequencing the trades around the pour.')],
  3: [p('2.3', 'S4 Building of wall systems', 'Frame members, bracing and tie-down.'), p('2.1', 'S3 Acceptable construction methods', 'Timber framing to the Standard.'), p('5.1', 'Building codes and standards', 'Reading the NCC and referenced Standards.')],
  4: [p('2.3', 'S5 Roof systems', 'Trusses, rafters, bracing and loads.'), p('4.1', 'Work health and safety', 'Working at heights and crane lifts.')],
  5: [p('2.3', 'S5 Roof systems', 'Roof structure under the cladding.'), p('5.2', 'Services layout', 'Stormwater and the legal point of discharge.')],
  6: [p('2.3', 'S4 Building of wall systems', 'Wall behaviour, ties and articulation.'), p('2.1', 'S3 Acceptable construction methods', 'Masonry veneer rules.')],
  7: [p('2.1', 'S3 Acceptable construction methods', 'Openings, glazing and flashing rules.'), p('5.1', 'Building codes and standards', 'Energy and glazing provisions.')],
  8: [p('5.2', 'Services layout', 'Plumbing and drainage layout.'), p('6.1', 'Selecting and managing subcontractors', 'Licensed plumber and certificates.')],
  9: [p('5.2', 'Services layout', 'Electrical and data layout.'), p('6.1', 'Selecting and managing subcontractors', 'Licensed electrician and certificates.')],
  10: [p('2.1', 'S3 Acceptable construction methods', 'Wet area rules in the Housing Provisions.'), p('4.2', 'Quality and materials', 'Membrane systems and testing.')],
  11: [p('2.1', 'S5 Assessment methods and compliance', 'Energy and compliance assessment routes.'), p('5.1', 'Building codes and standards', 'Energy efficiency provisions.')],
  12: [p('2.1', 'S6 Fire resistance and compliance', 'Fire-rated linings and separation.'), p('4.2', 'Quality and materials', 'Sheet products and fixing.')],
  13: [p('2.1', 'S3 Acceptable construction methods', 'Stairs and balustrades.'), p('4.4', 'Manage construction work', 'Programme and quality at fix-out.')],
  14: [p('4.2', 'Quality and materials', 'Adhesives, tiles and substrate checks.'), p('4.4', 'Manage construction work', 'Programme and defects at finishing.')],
  15: [p('4.4', 'Manage construction work', 'Defects and practical completion.'), p('6.2', 'Technical and legal reports', 'Records and reports.')],
  16: [p('2.1', 'S4 Performance solution and S6 Fire resistance', 'Bushfire and fire safety compliance paths.'), p('5.1', 'Building codes and standards', 'Referenced Standards.')],
  17: [p('2.3', 'S1 Structural behaviour', 'Retaining walls and loads on soil.'), p('2.1', 'S3 Acceptable construction methods', 'Class 10 structures.')],
  18: [p('4.3', 'Legal obligations', 'Warranties, defects and final payment.'), p('6.2', 'Technical and legal reports', 'Records to hand over.'), p('2.1', 'S2 Legislation, compliance and classification', 'Occupancy and certification.')],
};
// The learning loop each step follows. It is the level structure if this becomes a game.
export const LOOP = ['Read your notes for this step', 'Walk the 3D site and open each detail', 'Answer every exam card without peeking', 'Sit the matching module quiz from your quiz bank'];
