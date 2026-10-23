import type { SeoPage } from "../../types";

export const page: SeoPage = {
  kind: "industry",
  slug: "septic-software",
  nav: "Septic",
  keyword: "septic contractor software",
  updated: "2026-10-22",
  title: "Septic Contractor Software for Install Crews | SmartCrew",
  description:
    "Software for septic installers: crew hours per system, excavator and loader hours, stone and sand loads, inspection photos and job cost per install, in one app.",
  eyebrow: "Septic software",
  h1: "Software for septic installation contractors",
  lede:
    "Septic contractor software tracks the crew hours, machine hours, stone and sand deliveries and photos behind each system you install, so you know what every tank and drain field really cost. SmartCrew does that for septic companies with 5 to 100 people, in one app built only for dirt work and heavy civil trades. It does not design systems, file permits or run pumping routes; it tracks the install work once the job is sold.",
  summary: [
    "A septic company runs many short jobs. Each one is a small budget, so a single extra day of excavator time can wipe out the margin.",
    "Give every install its own project and split the work into codes like dig, set tank, lay field, backfill and final grade.",
    "SmartCrew records who ran which machine on which install, every load of stone or sand in, and the photos taken before the trench is covered.",
    "SmartCrew is not pumping route software, system design software or a permit tracker. It covers time, machines, materials, photos and job cost.",
  ],
  hero: [{ id: "phone-select-task" }, { id: "web-projects" }],
  blocks: [
    { t: "h2", text: "What does a septic installer need from software?" },
    {
      t: "p",
      text: "A septic installer needs software that keeps the cost of each system separate, because the week is made of several small jobs, not one big one. A crew might finish a drain field on Monday, set a tank across the county on Tuesday and start a mound system on Thursday. If those hours, machines and loads land on one general job number, nobody can tell which install made money.",
    },
    {
      t: "p",
      text: "The other need is proof. Once the field is backfilled, the work is under the ground. The inspector, the homeowner and your own office all want to see the tank, the distribution box and the laterals before they were covered. Photos tied to the job, with the date, settle most questions later.",
    },
    {
      t: "table",
      caption: "What a septic company tracks on each install, and where SmartCrew keeps it",
      head: ["What to track", "Why it matters for septic work", "Where it lives in SmartCrew"],
      rows: [
        ["Crew hours per install", "Each system is bid on its own. Hours have to land on the right address to compare against that bid.", "[Time tracking](features/construction-time-tracking): the worker picks the project, activity code and machine at clock-in."],
        ["Machine hours", "The mini excavator, the track loader and the dump truck are the main cost on a small install.", "[Equipment](features/heavy-equipment-maintenance-software): hours, locations, inspections and service requests."],
        ["Stone, sand and fill loads", "A mound or a sand filter can need a lot of imported material, and each load is a cost.", "[Hauling](features/hauling-software): digital tickets with truck, material, yards and source pit."],
        ["Photos before backfill", "The inspector and the owner want to see what went in the ground.", "[Daily reports](features/construction-daily-report-app): jobsite photos and field notes by job."],
        ["Cost per system", "The only way to price the next one right.", "[Job costing](features/construction-job-costing): budget against spent for labor, materials, equipment and change orders."],
      ],
      note: "Feature availability varies by plan. Fleet Management, Sales CRM, and Scheduling & Communications are Premium categories.",
    },

    { t: "h2", text: "How do you track the cost of each septic system?" },
    {
      t: "p",
      text: "You track the cost of each septic system by making every install its own project in SmartCrew and setting activity codes that match how you bid it. Common codes are site prep, dig tank hole, set tank, trench or bed, lay field, backfill, and final grade and seed. At clock-in the worker picks the install, the code and the machine.",
    },
    {
      t: "p",
      text: "When the operator moves from digging to backfill, Log & Switch changes the task in two taps. The job page then shows labor, materials, equipment and other costs against the budget for that system, so the office sees the overrun while the crew is still on site, not after the invoice goes out.",
    },
    {
      t: "note",
      title: "Worked example (not a statistic)",
      text: "Say a conventional system is bid with 24 crew hours and 16 excavator hours. If the job page shows 30 crew hours and 22 machine hours with backfill still to do, the job is already about 25% over on labor (30 ÷ 24 = 1.25) and over 35% on the machine (22 ÷ 16 = 1.375). That is a pricing lesson for the next bid in the same soil.",
    },
    {
      t: "shots",
      shots: [{ id: "phone-select-task" }, { id: "web-project-detail" }],
      caption: "Picking the job, activity and machine at clock-in, and the office view of budget against spent. (Demo account; names and numbers are made up.)",
    },

    { t: "h2", text: "How should a septic company track stone and sand deliveries?" },
    {
      t: "p",
      text: "A septic company should log every load of stone, sand or fill on a digital ticket when it arrives, with the truck, the job, the material and the yards. Supplier tickets get left on dashboards and keyed in at month end. By then nobody remembers which install they were for.",
    },
    {
      t: "p",
      text: "In SmartCrew the driver or foreman logs the load on the phone. If the ticket came from a supplier, a photo is enough: the AI reader enters the data from the ticket or receipt photo. Fuel and material logs sit on the same job, so the cost of a mound system includes the sand that built it.",
    },
    {
      t: "shots",
      shots: [{ id: "phone-hauling" }, { id: "web-materials" }],
      caption: "Logging a load on a phone, and material orders by project and vendor. (Demo account.)",
    },
    { t: "cta", title: "Set up your installs the way you bid them", text: "Andrew sets SmartCrew up around your crews, machines and activity codes on a short call." },

    { t: "h2", text: "How do you document a septic install before it is covered?" },
    {
      t: "p",
      text: "You document a septic install by taking photos of the tank, the distribution box, the pipe and the field before backfill, and saving them to the job's daily report the same day. In SmartCrew the foreman adds photos and field notes from the phone, and the office gets an automatic daily report.",
    },
    {
      t: "p",
      text: "Those photos are useful three ways. They show the inspector what was installed. They answer a homeowner who calls two years later about where the tank lid is. And they protect you when a dispute starts about depth or layout. Keep plans and permits for the job in [file storage](features/construction-file-storage) next to the photos.",
    },

    { t: "h2", text: "How do you keep a small septic fleet running?" },
    {
      t: "p",
      text: "You keep a small septic fleet running by doing daily and DOT inspections on the phone and sending every failed item to the shop as a service request. A septic company often runs one or two excavators and a dump truck on a trailer. When one is down, a whole install slides.",
    },
    {
      t: "p",
      text: "SmartCrew keeps each machine's hours, mileage, last and next service and inspection log. The service queue shows each problem with its urgency and status. The [pre-trip inspection app](features/pre-trip-inspection-app) page explains the truck side in more detail.",
    },
    {
      t: "shots",
      shots: [{ id: "phone-dot" }, { id: "web-service-queue" }],
      caption: "A DOT inspection on a phone, and the shop's service queue. (Demo account.)",
    },

    { t: "h2", text: "What should a septic contractor ask a software vendor?" },
    {
      t: "ol",
      items: [
        "Can each install be its own job with its own budget, without a lot of setup per job?",
        "Can a worker change task and machine in the middle of a day on a phone?",
        "Can photos and notes be tied to the job and seen by the office the same day?",
        "Can material tickets be entered from a photo instead of by hand?",
        "Does it connect to my accounting? (SmartCrew: QuickBooks Online today.)",
        "Does it do pumping routes or permits? If you need those, plan to keep a separate tool.",
      ],
    },

    { t: "h2", text: "What SmartCrew does not do for a septic company" },
    {
      t: "p",
      text: "SmartCrew does not design septic systems, file permits, schedule pumping routes, do estimating or takeoff, provide telematics hardware, process payroll or log ELD hours of service. If your company does pumping and service work as well as installs, keep your route software for that side. SmartCrew sends payroll-ready time to QuickBooks Online; it does not run payroll itself.",
    },

    { t: "h2", text: "How do you get started with SmartCrew?" },
    {
      t: "p",
      text: "You get started with a short call with Andrew Drish, SmartCrew's founder. The SmartCrew team sets up the account, moves your information over, organizes workflows and trains your people, and most companies are up and running within a few weeks. Pricing depends on your company size and the features you need; it's built to be well below enterprise construction software. You get a number on a short call with Andrew.",
    },
  ],
  faqs: [
    {
      q: "What is the best software for a septic installation company?",
      a: "For a septic installer with 5 to 100 people that runs its own excavators and trucks, an app that tracks hours, machines, material loads and photos per install, like SmartCrew, covers the install side. Pumping routes and system design need separate tools.",
    },
    {
      q: "Can SmartCrew track the cost of each septic system separately?",
      a: "Yes. Each install is its own project with its own budget. Labor, materials, equipment and change orders show against that budget on the job page, with hours by employee and a cost codes tab.",
    },
    {
      q: "Does SmartCrew do septic pumping routes or service scheduling?",
      a: "No. SmartCrew is built for the install crew: time, machines, hauling, daily reports and job cost. It does drag-and-drop crew scheduling for jobs, but it is not pumping route software.",
    },
    {
      q: "Can my crew take photos of the system before backfill?",
      a: "Yes. Foremen add jobsite photos and field notes to the daily report from their phones, and the office gets the report automatically.",
    },
    {
      q: "Does SmartCrew work with QuickBooks?",
      a: "Yes, with QuickBooks Online today. QuickBooks Desktop, Foundation and ADP integrations are in the works.",
    },
    {
      q: "How much does SmartCrew cost for a septic company?",
      a: "Pricing depends on your company size and the features you need; it's built to be well below enterprise construction software. You get a number on a short call with Andrew.",
    },
  ],
  related: ["excavation-software", "underground-utility-software", "features/construction-job-costing", "features/construction-daily-report-app", "features/construction-file-storage", "guides/what-is-smartcrew"],
};
