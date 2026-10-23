import type { SeoPage } from "../../types";

export const page: SeoPage = {
  kind: "industry",
  slug: "drilling-software",
  nav: "Drilling",
  keyword: "drilling contractor software",
  updated: "2026-10-22",
  title: "Drilling Contractor Software for Rigs and Crews | SmartCrew",
  description:
    "Software for drilling contractors: rig and support truck hours, crew time by bore or hole, footage in the daily log, water and spoils hauling and job cost.",
  eyebrow: "Drilling software",
  h1: "Software for drilling contractors",
  lede:
    "Drilling contractor software ties crew hours, rig hours, daily footage, support trucks and hauled water or spoils to each bore or hole, so you can see what a job costs per day on the rig. SmartCrew does that for drilling companies with 5 to 100 people, in one app built for dirt work and heavy civil trades. It does not log drill paths, read locator data or connect to the rig's own controls; it tracks the people, machines, loads and money around the rig.",
  summary: [
    "On a drilling job the rig day is the unit of cost. Crew, rig, support trucks and fuel all add up per day, whatever the footage.",
    "Make each job a project and use activity codes for setup, pilot, ream or drill, pullback or casing, and teardown and move.",
    "SmartCrew logs who worked which rig on which code, the daily footage and notes in the report, and every load of water, mud or spoils.",
    "SmartCrew does not record bore paths, locator readings or rig sensor data. Keep those tools for the drilling itself.",
  ],
  hero: [{ id: "phone-working" }, { id: "web-dashboard" }],
  blocks: [
    { t: "h2", text: "What does a drilling contractor need from software?" },
    {
      t: "p",
      text: "A drilling contractor needs software that turns each rig day into a cost and puts the day's footage next to it. A directional bore, a rock drilling job or a set of foundation holes is bid on footage or holes, but it is spent by the day: the crew on the clock, the rig running, the vac truck and the water truck behind it, and fuel for all of them.",
    },
    {
      t: "p",
      text: "When the ground fights back, footage per day drops while the daily cost stays the same. The office needs to see that on day two, not when the job closes. That means hours, machines, loads and the foreman's footage note all landing on the same job every day.",
    },
    {
      t: "table",
      caption: "What a drilling company tracks per job, and where SmartCrew keeps it",
      head: ["What to track", "Why it matters on a drilling job", "Where it lives in SmartCrew"],
      rows: [
        ["Crew hours by phase", "Setup, drilling and moves are priced differently, and a long move eats a day.", "[Time tracking](features/construction-time-tracking): project, activity code and machine at clock-in."],
        ["Rig and support truck hours", "The rig is the main cost, but the vac, water and pipe trucks add up.", "[Equipment](features/heavy-equipment-maintenance-software): hours, locations, inspections and service requests."],
        ["Footage and conditions", "Footage per day against the bid is the number that says if the job is on track.", "[Daily reports](features/construction-daily-report-app): progress and production logs, photos and field notes."],
        ["Water, mud and spoils loads", "Hauling drilling fluid and spoils is a real cost on many bores.", "[Hauling](features/hauling-software): tickets with truck, project, import or export, material and yards."],
        ["Cost against the bid", "The bid was footage. The cost is days. You want both on one page.", "[Job costing](features/construction-job-costing): budget against spent, daily."],
      ],
      note: "Feature availability varies by plan. Fleet Management, Sales CRM, and Scheduling & Communications are Premium categories.",
    },

    { t: "h2", text: "How do you track drilling crew hours by bore or hole?" },
    {
      t: "p",
      text: "You track drilling crew hours by bore or hole by setting up the job in SmartCrew with activity codes for each phase and having the crew pick the code and the rig at clock-in. Typical codes are mobilize, setup, pilot bore, ream, pullback, rock drilling, casing, cleanup and move. A driver who spends the morning hauling water picks the water truck and the hauling code.",
    },
    {
      t: "p",
      text: "Log & Switch moves a worker to a new task or machine in two taps, so a helper who goes from the rig to the vac truck splits the day correctly. GPS clock-ins show who is on which site, which matters when crews run bores on several streets in one week.",
    },
    {
      t: "shots",
      shots: [{ id: "phone-select-task" }, { id: "phone-working" }],
      caption: "Choosing the job, activity code and machine, and a worker on the clock. (Demo account; names and numbers are made up.)",
    },

    { t: "h2", text: "How do you record daily footage and ground conditions?" },
    {
      t: "p",
      text: "You record daily footage and ground conditions in the foreman's daily report, with the footage, the conditions and photos, before the crew leaves the site. SmartCrew's daily reports hold progress and production logs, photos and field notes, and the office gets them automatically.",
    },
    {
      t: "p",
      text: "Those notes are the record behind a change order. If the bid assumed clay and the crew hit cobble or rock at 40 feet, a dated note with photos from that day is far stronger than a memory at the end of the month.",
    },
    {
      t: "note",
      title: "Worked example (not a statistic)",
      text: "Take a 600-foot bore bid at 200 feet a day, so three rig days. If the daily reports show 200, 120 and 90 feet, the crew has drilled 410 feet in three days with 190 left. At 90 feet a day that is about two more days (190 ÷ 90 = 2.1), so the job runs five days against a three-day bid. The foreman's notes on why are what you take to the customer.",
    },
    { t: "cta", title: "See your rig days next to your footage", text: "A short call with Andrew: he sets SmartCrew up around your rigs, trucks and activity codes." },

    { t: "h2", text: "How should a drilling company track water and spoils hauling?" },
    {
      t: "p",
      text: "A drilling company should log every load of water in and fluid or spoils out on a digital ticket, with the truck, the job, import or export, the material and the yards or volume noted. In SmartCrew the driver logs the load on the phone, or takes a photo of a disposal or supplier ticket and the AI reader enters the data.",
    },
    {
      t: "p",
      text: "Fuel logs sit on the same job. When the hauling log and the fuel log are attached to the bore, the true cost of a day on the rig is easier to see.",
    },
    {
      t: "shots",
      shots: [{ id: "phone-hauling" }, { id: "web-d-hauling" }],
      caption: "A driver logging a load, and the office hauling log. (Demo account.)",
    },

    { t: "h2", text: "How do you keep drill rigs and support trucks inspected?" },
    {
      t: "p",
      text: "You keep rigs and trucks inspected by doing daily and DOT inspections on the phone and turning failed items into service requests the shop can see. SmartCrew keeps hours, mileage, last and next service and an inspection log for each machine, and the service queue shows urgency and status.",
    },
    {
      t: "shots",
      shots: [{ id: "web-d-inspections" }, { id: "phone-dot" }],
      caption: "A truck's record with its DOT inspection log, and an inspection on a phone. (Demo account.)",
    },

    { t: "h2", text: "What should a drilling contractor ask a software vendor?" },
    {
      t: "ol",
      items: [
        "Can a helper split a day between the rig and a support truck without a second timecard?",
        "Can the foreman log footage, conditions and photos from the field in a few minutes?",
        "Can water, fluid and spoils loads be logged by the driver or from a ticket photo?",
        "Does the job page show labor, equipment and materials against the bid while the bore is still open?",
        "Does it connect to my accounting? (SmartCrew: QuickBooks Online today.)",
        "Does it record bore paths or locator data? (SmartCrew does not.)",
      ],
    },

    { t: "h2", text: "What SmartCrew does not do for a drilling company" },
    {
      t: "p",
      text: "SmartCrew does not record bore paths or locator readings, read rig sensor data, do estimating or takeoff, provide telematics hardware, process payroll or log ELD hours of service. Keep your bore logging and locating tools. SmartCrew sends payroll-ready time to QuickBooks Online; it does not run payroll itself.",
    },

    { t: "h2", text: "How do you get started with SmartCrew?" },
    {
      t: "p",
      text: "You get started with a short call with Andrew Drish, SmartCrew's founder. The team sets up the account, moves your information over, organizes workflows and trains your people, and most companies are up and running within a few weeks. Pricing depends on your company size and the features you need; it's built to be well below enterprise construction software. You get a number on a short call with Andrew.",
    },
  ],
  faqs: [
    {
      q: "What is the best software for a directional drilling company?",
      a: "For a drilling company with 5 to 100 people, SmartCrew covers crew time, rig and truck hours, daily footage notes, hauling and job cost in one app. Bore path logging and locating need their own tools, which SmartCrew does not replace.",
    },
    {
      q: "Can SmartCrew track footage per day?",
      a: "Yes, as part of the daily report. Foremen record progress and production, photos and field notes each day, and the office gets the report automatically.",
    },
    {
      q: "Does SmartCrew connect to my drill rig?",
      a: "No. SmartCrew does not read rig sensors or provide telematics hardware. Machine hours come from the crew's time records and equipment entries.",
    },
    {
      q: "Can SmartCrew track vac truck and water truck loads?",
      a: "Yes. Each digital haul ticket records the truck, project, import or export, material and yards, and the AI reader can fill it in from a ticket photo.",
    },
    {
      q: "How much does SmartCrew cost for a drilling contractor?",
      a: "Pricing depends on your company size and the features you need; it's built to be well below enterprise construction software. You get a number on a short call with Andrew.",
    },
  ],
  related: ["underground-utility-software", "excavation-software", "features/hauling-software", "features/construction-daily-report-app", "guides/what-is-smartcrew"],
};
