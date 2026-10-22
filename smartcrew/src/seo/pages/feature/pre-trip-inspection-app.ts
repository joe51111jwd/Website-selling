import type { SeoPage } from "../../types";

const CFR_396_11 = "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-396/section-396.11";
const CFR_396_13 = "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-396/section-396.13";
const CFR_1926_601 = "https://www.ecfr.gov/current/title-29/subtitle-B/chapter-XVII/part-1926/subpart-O/section-1926.601";

export const page: SeoPage = {
  kind: "feature",
  slug: "features/pre-trip-inspection-app",
  nav: "Pre-trip inspection app",
  keyword: "pre trip inspection app",
  updated: "2026-10-22",
  title: "Pre-Trip Inspection App for Trucks and Heavy Equipment | SmartCrew",
  description:
    "What a pre-trip or daily inspection has to cover for dump trucks and heavy equipment, what the FMCSA and OSHA rules say, and how a phone inspection app keeps the record. Includes SmartCrew's DOT inspection flow.",
  eyebrow: "Pre-trip inspection app",
  h1: "A pre-trip inspection app for trucks and heavy equipment",
  lede:
    "A pre-trip inspection is the walk-around an operator does before a truck or machine moves: brakes, steering, tires, lights, controls, leaks. Federal rules require a written report for commercial motor vehicles, and OSHA requires construction vehicles to be checked at the start of each shift. An inspection app replaces the clipboard with a pass or fail form on the operator's phone, so the record exists, is signed, and lands where the shop can see it. This page covers what the rules say, what to check and how SmartCrew handles it.",
  summary: [
    "FMCSA rule 49 CFR 396.11 requires a driver vehicle inspection report at the end of each day's work for commercial motor vehicles, and 396.13 requires the driver to be satisfied the vehicle is safe before driving.",
    "OSHA's construction rule 29 CFR 1926.601(b)(14) says vehicles in use on an off-highway jobsite must be checked at the beginning of each shift, with a short list of parts.",
    "Reports can be kept electronically under FMCSA's rules. The federal retention period for the driver's report and repair certification is three months.",
    "SmartCrew's inspection form is a pass or fail check on the operator's phone. The result goes into the machine's record and, for defects, into a service queue.",
  ],
  hero: [{ id: "phone-dot" }, { id: "web-d-inspections" }],
  blocks: [
    { t: "h2", text: "What a pre-trip inspection is, and why it gets skipped" },
    {
      t: "p",
      text: "A pre-trip is a short, structured look at a vehicle or machine before it goes to work. The operator walks around it, checks the parts that fail in ways that hurt people, and either clears it or reports a defect. A post-trip does the same at the end of the day, which is when the federal daily report is written.",
    },
    {
      t: "p",
      text: "On a dirt work crew the inspection gets skipped for ordinary reasons. The paper form is in the truck, the pen is dead, the foreman is already waiting and the machine ran fine yesterday. When a defect is found, a note on a clipboard doesn't reach the shop until someone walks it over. When an auditor or insurer asks for last month's reports, they're in a glovebox or they're gone.",
    },

    { t: "h2", text: "What the rules say" },
    {
      t: "p",
      text: "Two federal rules matter most to an excavation or hauling company. They cover different equipment, so check which applies to each of yours.",
    },
    {
      t: "table",
      caption: "The two rules most dirt work companies touch",
      head: ["Rule", "Applies to", "What it requires"],
      rows: [
        ["[49 CFR 396.11](" + CFR_396_11 + ") (FMCSA, driver vehicle inspection report)", "Commercial motor vehicles run by motor carriers, with listed exceptions", "A written report from each driver at the completion of each day's work on each vehicle operated. It names the vehicle and lists any defect that affects safe operation. The driver signs it. Defects likely to affect safe operation must be repaired and certified before the vehicle is driven again."],
        ["[49 CFR 396.13](" + CFR_396_13 + ") (FMCSA, driver inspection)", "The driver of a motor vehicle, before driving", "The driver must be satisfied the vehicle is in safe operating condition, review the last report when required, and sign to acknowledge it and that required repairs were made."],
        ["[29 CFR 1926.601(b)(14)](" + CFR_1926_601 + ") (OSHA, construction motor vehicles)", "Motor vehicles operating on an off-highway jobsite", "All vehicles in use are checked at the beginning of each shift to make sure the listed parts are in safe operating condition and free of apparent damage that could cause failure in use."],
      ],
      note: "Source: the Electronic Code of Federal Regulations, October 22, 2026. This is a plain-English summary, not legal advice. Excavators and similar off-road machines are usually covered by OSHA's earthmoving equipment rule in 1926.602 rather than 1926.601, and by the manufacturer's operator manual. Ask your safety consultant which rule covers each unit.",
    },
    {
      t: "p",
      text: "Two details from the FMCSA text matter for a records system. First, reports may be created and kept electronically. Second, the carrier must keep the report, the repair certification and the driver review certification for three months from the date the report was prepared. A driver who finds no defects does not have to write a defect report under 396.11, but many companies keep a signed “all clear” anyway, because it's the proof the check happened.",
    },

    { t: "h2", text: "What the check covers" },
    {
      t: "p",
      text: "OSHA's list for construction vehicles is short and worth building a form around. FMCSA's rule lists parts including service and parking brakes, steering, lighting, tires, horn, wipers, mirrors, coupling devices, wheels and rims, and emergency equipment.",
    },
    {
      t: "table",
      caption: "Parts named in the rules, with what an operator looks for",
      head: ["Part", "Named in", "What the operator checks"],
      rows: [
        ["Service brakes and trailer brake connections", "OSHA, FMCSA", "Pedal feel, air pressure build-up, leaks, brake connections coupled"],
        ["Parking brake and emergency stopping system", "OSHA, FMCSA", "Holds the vehicle, releases cleanly"],
        ["Steering mechanism", "OSHA, FMCSA", "Play in the wheel, fluid leaks, odd noise"],
        ["Tires, wheels and rims", "OSHA, FMCSA", "Pressure, cuts, bulges, tread, missing lug nuts"],
        ["Lights, horn, wipers and mirrors", "OSHA (horn), FMCSA", "Working and clean; backup alarm and beacon on machines"],
        ["Coupling devices", "OSHA, FMCSA", "Fifth wheel, pintle hook and safety chains secure"],
        ["Seat belts, operating controls and safety devices", "OSHA", "Belts latch, controls respond, guards and handrails in place"],
        ["Emergency equipment", "FMCSA", "Fire extinguisher and warning devices present"],
      ],
      note: "The “what the operator checks” column is common practice, not regulation text. Your equipment manual and safety program set the exact list.",
    },

    { t: "h2", text: "How SmartCrew handles the inspection" },
    {
      t: "p",
      text: "SmartCrew's inspection is a form on the operator's phone. The operator picks the machine, enters hours or miles, and marks each check pass or fail, including brakes, steering, lights and tires. Crews submit inspections from their phones as part of the day, alongside clocking in and picking the machine they're on.",
    },
    {
      t: "steps",
      steps: [
        { title: "Open the inspection on the phone", text: "Choose DOT or daily inspection and the machine or truck." },
        { title: "Enter hours or miles", text: "The reading goes into the machine record, so service intervals use real numbers." },
        { title: "Mark each check pass or fail", text: "Brakes, steering, lights, tires and the rest of the list are one tap each." },
        { title: "Submit", text: "The inspection is saved against the machine with the operator, date and reading." },
        { title: "The shop sees problems", text: "Problems reported from the field show up in the service queue with who reported them, when, urgency and repair status." },
      ],
    },
    {
      t: "shots",
      shots: [{ id: "phone-dot" }, { id: "web-d-inspections" }, { id: "web-service-queue" }],
      caption: "The phone inspection form, a dump truck's record with its inspection log, and the service queue. (Demo account.)",
    },
    {
      t: "p",
      text: "The machine record keeps hours, mileage, last and next service and the inspection log, so the question “who inspected this truck, and when?” has an answer in one place. Maintenance, service requests and utilization sit beside it; see [heavy equipment maintenance software](/features/heavy-equipment-maintenance-software/) for that side.",
    },
    { t: "cta", title: "Want inspections off the clipboard?", text: "A short call with Andrew shows the inspection flow on your trucks and machines." },

    { t: "h2", text: "What SmartCrew isn't" },
    {
      t: "p",
      text: "SmartCrew is not an ELD or hours-of-service product, and it doesn't replace your safety consultant or your DOT compliance process. It is the field record: a signed, dated inspection tied to a machine, with defects routed to the shop. If you need ELD logging, you'd run that product beside it.",
    },

    { t: "h2", text: "What to look for in any inspection app" },
    {
      t: "ul",
      items: [
        "**Works with gloves on, one hand.** If it takes more than a couple of minutes, it won't get done.",
        "**Works offline.** Many pits and job sites have poor signal, so ask how the app handles that.",
        "**Pass or fail per item, with a place for notes and photos.** A defect without a note doesn't help the mechanic.",
        "**Ties to the machine record.** An inspection filed in a folder is better than paper but doesn't change when the next service is due.",
        "**Routes defects to the shop.** The report should become a work item, not stay a report.",
        "**Keeps records you can pull.** You should be able to find last month's inspection for a given truck in seconds.",
      ],
    },
  ],
  faqs: [
    {
      q: "What is a pre-trip inspection?",
      a: "A pre-trip inspection is a walk-around check an operator does before a truck or machine moves, covering parts such as brakes, steering, tires, lights and safety devices. The operator clears the unit or reports a defect.",
    },
    {
      q: "Does the law require a pre-trip inspection?",
      a: "For commercial motor vehicles, FMCSA rules require the driver to be satisfied the vehicle is safe before driving (49 CFR 396.13) and to write a vehicle inspection report at the end of each day's work (396.11). OSHA's construction rule 29 CFR 1926.601(b)(14) requires vehicles in use on an off-highway jobsite to be checked at the beginning of each shift. Which rule covers a given unit depends on the unit.",
    },
    {
      q: "Can inspection reports be kept electronically?",
      a: "Yes. 49 CFR 396.11 says reports may be created and kept electronically under 49 CFR 390.32.",
    },
    {
      q: "How long do you keep a driver vehicle inspection report?",
      a: "Under 49 CFR 396.11, the motor carrier keeps the report, the repair certification and the driver review certification for three months from the date the report was prepared.",
    },
    {
      q: "Does SmartCrew have a DOT inspection app?",
      a: "Yes. SmartCrew's equipment management includes DOT and daily inspections on the operator's phone, with pass or fail checks, hours or miles, and a log on each machine's record. It isn't an ELD or hours-of-service product.",
    },
    {
      q: "What happens when an operator reports a problem?",
      a: "Problems reported from the field go to a service queue that shows who reported them, when, the urgency and the repair status, so the shop can act on them.",
    },
    {
      q: "How much does SmartCrew cost?",
      a: "Pricing depends on your company size and the features you need, and it's built to be well below the cost of enterprise construction software. You get a number on a short call with Andrew.",
    },
  ],
  sources: [
    { label: "49 CFR 396.11, Driver vehicle inspection report(s) (eCFR)", url: CFR_396_11, accessed: "2026-10-22" },
    { label: "49 CFR 396.13, Driver inspection (eCFR)", url: CFR_396_13, accessed: "2026-10-22" },
    { label: "29 CFR 1926.601, Motor vehicles (eCFR)", url: CFR_1926_601, accessed: "2026-10-22" },
  ],
  related: ["features/heavy-equipment-maintenance-software", "features/construction-time-tracking", "excavation-software", "compare/hcss-heavyjob-alternative"],
};
