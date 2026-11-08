// Content for the builder-registration checklist (Victoria, Domestic Builder – Unlimited).
// Checked against the BPC website on 7 November 2026; the reasoning and links are in docs/builder/db-u-requirements.md.
// `confirm: true` marks a step the public BPC pages do not spell out. The app shows "Confirm in portal" beside it.
// Ticks key on `key`, never on wording, so the text can be edited without losing anyone's progress.

export const TABS = [
  { id: "list", label: "Checklist", icon: "✅" },
  { id: "projects", label: "Projects", icon: "🏗️" },
  { id: "refs", label: "Referees", icon: "✍️" },
  { id: "folders", label: "Folders", icon: "📁" },
  { id: "exam", label: "Exam", icon: "💻" },
];

// The activities BPC says a DB-U applicant must show they can do competently (info sheet "What is domestic building work").
// They are also the best guide to the exam, since BPC has published no syllabus.
export const ACTIVITIES = [
  ["permit-need", "Establish whether a building permit is needed"],
  ["permit-get", "Apply for and obtain a building permit"],
  ["permit-comply", "Comply with the building permit"],
  ["certify", "Arrange certification of completed work"],
  ["estimate", "Produce cost estimates and quotations"],
  ["contract", "Identify the need for, and set up, a major domestic building contract"],
  ["plan", "Plan and prepare for construction"],
  ["subs", "Arrange workers or subcontractors to work safely and competently"],
  ["safety-plan", "Develop, communicate, monitor and maintain site safety plans"],
  ["inductions", "Ensure site safety inductions are done"],
  ["supervise", "Supervise all construction for NCC, Australian Standards and council compliance"],
  ["legislation", "Ensure work follows safety and environmental legislation"],
];

export const STEPS = [
  ["asked", "Asked"],
  ["agreed", "Agreed"],
  ["pack", "Project list sent"],
  ["submitted", "Report submitted"],
  ["seen", "Seen in my application"],
];

// The paperwork to hold for each of the three projects. BPC publishes no per-project document list, so this one is our own:
// it follows the components SD-TRR-052 Part E asks the referee about (permit, inspections, drawings, completion).
// Generic on purpose: the repo is public, so no addresses, permit numbers or names go in here.
export const PROJECT_DOCS = [
  ["planning", "Endorsed planning plans, if a planning permit applied", "The council-endorsed set, with the planning permit number showing. Skip it if no planning permit was needed."],
  ["working", "Architectural working drawings, final revision", "The set the building permit was issued on, stamped by the building surveyor, not an earlier issue."],
  ["structural", "Structural drawings, final revision", "The engineer's set that matches the permit revision. If two revisions are in circulation, ask the surveyor which one was stamped."],
  ["permit", "Building permit, including any amendments", "The permit itself, with its number and the surveyor's name. A permit number quoted on another document is not a copy of the permit."],
  ["inspections", "Mandatory inspection records", "Inspection approvals or the surveyor's inspection log. They show you arranged the inspections and cleared any rectification."],
  ["final", "Occupancy permit or certificate of final inspection", "The issued permit or certificate, not the application for it."],
];

const docSection = (n) => ({
  id: `doc${n}`, tab: "list", title: `Project ${n} documents`, icon: "📐",
  items: PROJECT_DOCS.map(([k, text, note]) => ({ key: `doc${n}.${k}`, text, note })),
});

export const SECTIONS = [
  {
    id: "start", tab: "list", title: "Before you apply", icon: "🧭",
    items: [
      { key: "start.webinar", text: "Attend a BPC registration information webinar", note: "BPC recommends one before you submit. Book on the BPC Events page or call 1300 067 088." },
      { key: "start.account", text: "Log in to (or create) your BPC account", note: "Applications are online: Registration and licensing, then Apply for a new registration or licence." },
      { key: "start.scope", text: "Decide the scope: no conditions, or restricted", note: "Options: Class 1 and 10; Class 1 and 10 plus Class 2 and 4 up to 3 storeys; Class 2 and 4 only. Claim only what your evidence covers." },
      { key: "start.window", text: "All three projects fall inside the last 7 years" },
      { key: "start.paid", text: "Each was paid work as an employee or contractor", note: "Owner-builder work and course placements may be disregarded." },
      { key: "start.supervised", text: "A registered building practitioner supervised you on each" },
    ],
  },
  {
    id: "qual", tab: "list", title: "Qualification", icon: "🎓",
    items: [
      { key: "qual.diploma", text: "CPC50220 Diploma of Building and Construction (Building) completed", note: "This is the prescribed course. The Cert IV (CPC40120) on its own is not." },
      { key: "qual.evidence", text: "Certificate and transcript saved to 02 Qualification", confirm: true, note: "Check the portal slot, and whether certified copies are still needed." },
      { key: "qual.cert4", text: "Cert IV transcript saved too, if you hold it", note: "BPC considers it within the broader assessment of your knowledge and experience." },
    ],
  },
  {
    id: "exp", tab: "list", title: "Experience evidence", icon: "🏗️",
    items: [
      { key: "exp.p1", text: "Project 1 completed on the Projects tab" },
      { key: "exp.p2", text: "Project 2 completed on the Projects tab" },
      { key: "exp.p3", text: "Project 3 completed on the Projects tab" },
      { key: "exp.activities", text: "Every BPC activity is evidenced on at least one project", note: "The Projects tab flags any that are not." },
      { key: "exp.years", text: "Dates add up to at least 3 years of practical experience" },
      { key: "exp.paid", text: "Proof of paid work on hand: contracts, payslips, invoices or ABN records", note: "BPC may ask for it, so keep it in each project's folder." },
    ],
  },
  ...[1, 2, 3].map(docSection),
  {
    id: "ref", tab: "list", title: "Technical referee", icon: "✍️",
    items: [
      { key: "ref.pick", text: "Referee chosen: a registered Domestic Builder in the same class or higher who directly supervised you" },
      { key: "ref.online", text: "Checked in the portal whether the report is online or a signed form", confirm: true, note: "BPC says reports moved online in June 2026, with the referee submitting from their own BPC account. Its class page still mentions signed forms (SD-TRR-052, V9, March 2026)." },
      { key: "ref.login", text: "Referee has a working personal BPC login", confirm: true },
      { key: "ref.pack", text: "Project list sent to the referee: addresses, dates, your role, activities" },
      { key: "ref.received", text: "Report shows as received on your application", confirm: true },
    ],
  },
  {
    id: "prob", tab: "list", title: "Fit and proper", icon: "🛡️",
    items: [
      { key: "prob.declaration", text: "Personal and financial probity declaration completed" },
      { key: "prob.police", text: "National police check done through BPC's online provider", confirm: true, note: "BPC requires a criminal history check. Follow the link in your application." },
      { key: "prob.extadmin", text: "External Administration Declaration done, or not applicable", note: "Needed if you were a director, secretary or influential person of a company that went into external administration. Check the look-back period in the form." },
    ],
  },
  {
    id: "lodge", tab: "list", title: "Lodging", icon: "📤",
    items: [
      { key: "lodge.green", text: "Every application section shows a green tick", note: "You can submit only when all sections are ticked. Work saves automatically." },
      { key: "lodge.slots", text: "Each document slot in the portal filled", confirm: true, note: "BPC cut the DB-U attachments from about 40 to about 7 but does not name them publicly. List them on the Folders tab." },
      { key: "lodge.certified", text: "Certified copies done, if the portal still asks", confirm: true, note: "BPC's FAQ says supporting documents must be certified true copies. The 2026 reform may have relaxed that." },
      { key: "lodge.submit", text: "Submitted, and the confirmation saved to 00 Admin" },
      { key: "lodge.watch", text: "Watching email and the portal for a request for more information", note: "BPC can refuse an application if requested information is not provided." },
    ],
  },
  {
    id: "after", tab: "list", title: "After approval", icon: "🏠",
    items: [
      { key: "after.insurance", text: "Domestic building insurance arranged", note: "Needed once BPC accepts your knowledge and experience. Required for work of $16,000 or more." },
      { key: "after.card", text: "Registration card received and certificate saved to 06" },
      { key: "after.company", text: "Company registered in the class, if you will contract through one", note: "BPC registers individuals. A company can be registered only if a director holds the class. Without it the company cannot sign major domestic building contracts or be named as builder on a permit." },
    ],
  },
  {
    id: "examsetup", tab: "exam", title: "Exam set-up", icon: "💻",
    items: [
      { key: "ex.invite", text: "Invitation email received", note: "Look for “BPC Exams – Account Created” from no-reply@bpc.vic.gov.au. Check junk." },
      { key: "ex.password", text: "Proctortrack password created", note: "At least 12 characters, not a dictionary word, not reused from banking." },
      { key: "ex.id", text: "ID onboarding approved", note: "Can take up to 3 days, so do it the day the invitation arrives." },
      { key: "ex.standards", text: "Online Australian Standards access active", note: "BPC does not provide it. You need your own subscription or online purchase, and you log in during the exam." },
      { key: "ex.nccOnline", text: "Comfortable finding clauses in NCC Online, fast" },
      { key: "ex.adjust", text: "Reasonable adjustments requested, if needed", note: "Email onlineexams@bpc.vic.gov.au or call 1300 067 088 within 3 business days of the invitation." },
      { key: "ex.inperson", text: "In-person sitting requested, only if you hold hard-copy references", note: "Email onlineexams@bpc.vic.gov.au. Availability is limited, so expect a delay." },
      { key: "ex.room", text: "Room ready: alone, one screen, one browser, power connected, desk cleared", note: "Phones, watches, earbuds, tablets and printed notes out of reach. Webcam, mic and speakers on." },
    ],
  },
  {
    id: "examstudy", tab: "exam", title: "Exam study", icon: "📚",
    items: [
      { key: "st.permits", text: "Building permits: when needed, how to get one, complying with it" },
      { key: "st.certify", text: "Certification and final documents when work is complete" },
      { key: "st.estimate", text: "Cost estimates and quotations" },
      { key: "st.dbca", text: "Major domestic building contracts: when required (over $10,000) and what they must contain" },
      { key: "st.insurance", text: "Domestic building insurance (work of $16,000 or more)" },
      { key: "st.safety", text: "Site safety plans and inductions" },
      { key: "st.subs", text: "Engaging subcontractors and checking their registration or licence" },
      { key: "st.ncc", text: "NCC: navigating volumes, clauses and referenced standards" },
      { key: "st.standards", text: "Australian Standards: finding the right one and the right clause" },
      { key: "st.act", text: "Building Act 1993 and regulations: practitioner duties, competent manner and professional standard" },
      { key: "st.legislation", text: "Safety and environmental legislation that applies on site" },
    ],
  },
];

export const SOURCES = [
  ["BPC: Domestic builder", "https://www.bpc.vic.gov.au/builders/builder-classes/domestic-builder"],
  ["BPC: What is domestic building work", "https://www.bpc.vic.gov.au/resource-hub/info-sheets/What-is-domestic-building-work"],
  ["BPC: Registration requirements", "https://www.bpc.vic.gov.au/builders/registration/registration-requirements-and-eligibiity"],
  ["BPC: Building exams", "https://www.bpc.vic.gov.au/builders/building-exams"],
  ["BPC: Licensing and registration reforms", "https://www.bpc.vic.gov.au/builders/registration/licensing-and-registration-reforms"],
  ["BPC: How to complete your application", "https://www.bpc.vic.gov.au/builders/registration/how-to-complete-your-builder-application"],
];

export const CHECKED = "7 November 2026";
