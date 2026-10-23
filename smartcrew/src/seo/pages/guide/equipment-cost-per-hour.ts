import type { SeoPage } from "../../types";

// Wave 5 (Oct 22, 2026). Answers the "equipment cost per hour" questions from
// src/seo/research/top-50-questions.md. Method and life ranges: FAO forest road engineering manual,
// chapter 3, "Calculation of machine rates" (tables adapted from the Caterpillar Performance Handbook).
// Every dollar figure on this page is a labelled worked example, not a SmartCrew or market number.
const FAO = "https://www.fao.org/4/T0579E/t0579e05.htm";
const USACE = "https://www.publications.usace.army.mil/Portals/76/Publications/EngineerPamphlets/EP_1110-1-8_Vol_12.pdf";

export const page: SeoPage = {
  kind: "guide",
  slug: "guides/equipment-cost-per-hour",
  nav: "Equipment cost per hour",
  keyword: "equipment cost per hour",
  updated: "2026-10-22",
  title: "Equipment Cost per Hour: How to Work It Out | SmartCrew",
  description:
    "How to calculate heavy equipment cost per hour: owning costs, operating costs and hours worked, with a worked excavator example and typical machine lives in hours.",
  eyebrow: "Guide: equipment cost per hour",
  h1: "How to calculate heavy equipment cost per hour",
  lede:
    "Equipment cost per hour is the machine's yearly owning cost plus its operating cost, divided by the hours it actually works. Owning cost is depreciation, interest, insurance, taxes and storage; operating cost is fuel, oil and grease, repairs and wear parts. The number that moves it most is utilization: a machine that sits half the season costs far more per working hour.",
  summary: [
    "Hourly rate = (yearly owning cost + yearly operating cost) ÷ hours worked in the year.",
    "Straight-line depreciation per hour = (delivered price minus salvage value) ÷ life in hours.",
    "Typical planning lives run about 8,000 to 12,000 hours for an excavator, depending on how hard it works (FAO, adapted from Caterpillar).",
    "Fewer working hours spread the same insurance, interest and storage over less work, so the hourly rate climbs.",
    "The rate only helps if real machine hours reach each job; that's the part SmartCrew handles.",
  ],
  hero: [{ id: "web-equipment" }, { id: "phone-select-task" }],
  blocks: [
    { t: "h2", text: "What goes into an equipment cost per hour?" },
    {
      t: "p",
      text: "An hourly equipment rate has two halves: owning costs, which you pay whether the machine runs or not, and operating costs, which grow with every hour on the meter. The FAO's machine rate method splits them the same way ([FAO, Calculation of machine rates](" + FAO + ")). Operator wages are often kept out of the machine rate and costed as labor, because the operator's paid hours and the machine's working hours rarely match.",
    },
    {
      t: "table",
      caption: "The pieces of an hourly machine rate",
      head: ["Piece", "Owning or operating", "How to put a number on it"],
      rows: [
        ["Depreciation", "Owning", "(Delivered price minus salvage value) ÷ life in hours"],
        ["Interest on the money tied up", "Owning", "Interest rate × average investment; FAO notes 0.6 × delivered cost as a quick stand-in for average investment"],
        ["Insurance", "Owning", "Yearly premium for the machine"],
        ["Property or usage taxes", "Owning", "Yearly tax bill for the machine"],
        ["Storage and yard", "Owning", "Share of the yard or shop cost"],
        ["Fuel", "Operating", "Gallons per hour from your fuel log × price per gallon"],
        ["Oil, grease and filters", "Operating", "FAO's rule of thumb: 5 to 10 percent of fuel cost"],
        ["Repairs and maintenance", "Operating", "Your shop records; FAO gives a percent of hourly depreciation when you have none"],
        ["Tires, tracks, teeth and cutting edges", "Operating", "Part cost ÷ hours the part lasts"],
      ],
      note: "Method from the [FAO machine rate chapter](" + FAO + "). The US Army Corps of Engineers publishes a full ownership and operating schedule for federal work in [EP 1110-1-8](" + USACE + ").",
    },

    { t: "h2", text: "Worked example: what does an excavator cost per hour?" },
    {
      t: "p",
      text: "This example works out a mid-size excavator at about $77 an hour to own and run, before the operator. Every input below is an assumption picked to show the arithmetic, not a market price or a SmartCrew number. Swap in your own invoices, fuel log and insurance bill.",
    },
    {
      t: "table",
      caption: "Example only: one excavator, 1,200 working hours a year",
      head: ["Line", "Assumption", "Per hour"],
      rows: [
        ["Depreciation", "$250,000 delivered, $50,000 salvage (20%), 10,000-hour life: $200,000 ÷ 10,000", "$20.00"],
        ["Interest", "8% on $150,000 average investment (0.6 × $250,000) = $12,000 a year ÷ 1,200", "$10.00"],
        ["Insurance", "2% of $150,000 = $3,000 a year ÷ 1,200", "$2.50"],
        ["Taxes", "1% of $150,000 = $1,500 a year ÷ 1,200", "$1.25"],
        ["Storage", "$1,500 a year ÷ 1,200", "$1.25"],
        ["**Owning subtotal**", "", "**$35.00**"],
        ["Fuel", "5 gallons an hour × $4.00", "$20.00"],
        ["Oil and grease", "10% of fuel", "$2.00"],
        ["Repairs", "100% of hourly depreciation", "$20.00"],
        ["**Operating subtotal**", "Wear parts not included", "**$42.00**"],
        ["**Owning and operating**", "Before operator wages", "**$77.00**"],
      ],
      note: "A worked example with made-up inputs. The 10,000-hour life matches FAO's planning figure for an excavator doing steady mass excavation or trenching; the 20% salvage sits at the top of FAO's usual 10 to 20 percent.",
    },
    {
      t: "note",
      title: "Same machine, 800 hours a year",
      text: "Keep everything else the same and cut the working year to 800 hours. Interest, insurance, taxes and storage are still $18,000 a year, now ÷ 800 = $22.50 an hour instead of $15.00. The rate goes from $77.00 to $84.50 an hour. Depreciation per hour stays at $20.00 here only because life is counted in hours; machines also lose value just by getting older. This is example arithmetic, not a statistic.",
    },

    { t: "h2", text: "How many hours does heavy equipment last?" },
    {
      t: "p",
      text: "Planning lives for heavy equipment usually fall between 8,000 and 25,000 hours, and the work matters more than the brand. FAO's table, adapted from the Caterpillar Performance Handbook, gives a light, medium and severe figure for each machine type ([FAO, table 3.1](" + FAO + ")). Use these to set depreciation, then check them against your own trade-in history.",
    },
    {
      t: "table",
      caption: "Ownership periods by working conditions, in machine hours",
      head: ["Machine", "Easy work", "Average work", "Severe work"],
      rows: [
        ["Excavator", "12,000", "10,000", "8,000"],
        ["Small track-type tractor (dozer)", "12,000", "10,000", "8,000"],
        ["Large track-type tractor (dozer)", "22,000", "18,000", "15,000"],
        ["Motor grader", "20,000", "15,000", "12,000"],
        ["Small wheel loader", "12,000", "10,000", "8,000"],
        ["Large wheel loader", "15,000", "12,000", "10,000"],
        ["Off-highway truck", "25,000", "20,000", "15,000"],
      ],
      note: "Source: [FAO, Calculation of machine rates, table 3.1](" + FAO + "), adapted from the Caterpillar Performance Handbook. Easy work is light digging with little impact; severe work is continuous rock, high impact and rough ground.",
    },
    {
      t: "p",
      text: "An excavator setting pipe in a utility trench, digging three or four hours a shift in loose material, is FAO's easy case at 12,000 hours. The same machine loading trucks in shot rock all day is the severe case at 8,000. That gap is a third of the machine's life, which is why one rate for every excavator in the fleet hides real money.",
    },
    { t: "cta", title: "Get real machine hours onto every job", text: "A short call with Andrew, SmartCrew's founder. He sets SmartCrew up around your machines, crews and cost codes." },

    { t: "h2", text: "Why does the hourly rate only work with real machine hours?" },
    {
      t: "p",
      text: "An hourly rate is only as good as the hours you multiply it by. If the foreman guesses that the excavator ran \"most of the day\" on the Main Street job, a $77 rate turns into a guessed cost. In SmartCrew, operators pick the machine when they clock in and use Log & Switch when they move to another machine or task, so machine hours land on the job and activity code they were worked on.",
    },
    {
      t: "steps",
      steps: [
        { title: "The operator picks the machine at clock-in", text: "Project, activity code and equipment are chosen on the phone, so the hours start on the right machine." },
        { title: "Switches are logged as they happen", text: "Log & Switch moves the clock to a new task or machine without a paper note." },
        { title: "The machine record keeps the meter", text: "Each machine shows hours, mileage, last and next service, and its inspection log." },
        { title: "Fuel goes in the log", text: "Material and fuel logs keep gallons with the job, and the AI reader can enter fuel receipts from a photo." },
        { title: "The job page shows equipment against budget", text: "Budget against spent for labor, materials, equipment, other and change orders, while the job is running." },
      ],
    },
    {
      t: "shots",
      shots: [{ id: "web-equipment" }, { id: "web-project-detail" }],
      caption: "Machine records with hours and service dates, and a job page with equipment budget against spent. (Demo data.)",
    },
    {
      t: "p",
      text: "TODO(andrew): confirm how the equipment cost on the job page is priced (an hourly rate set per machine, per class, or entered another way) so this page can say exactly where your calculated rate goes.",
    },

    { t: "h2", text: "What mistakes make an equipment rate wrong?" },
    {
      t: "ul",
      items: [
        "**Dividing by the hours in a year instead of the hours worked.** A machine on the meter 1,200 hours carries its insurance over 1,200 hours, not 2,080.",
        "**Leaving repairs out because the machine is new.** Repairs climb as the hours go up; FAO prices them as a share of depreciation for that reason.",
        "**One rate for every machine of a type.** The severe-work excavator wears out a third sooner than the easy-work one.",
        "**Mixing the operator into the machine rate, then costing the operator again as labor.** Pick one place for the wage.",
        "**Never checking the rate.** Compare the rate with actual fuel and shop spend each season and adjust it.",
      ],
    },
    {
      t: "p",
      text: "For keeping the service side of those numbers, see [heavy equipment maintenance software](features/heavy-equipment-maintenance-software). For putting the cost against the bid, see [construction job costing](features/construction-job-costing).",
    },
  ],
  faqs: [
    {
      q: "What is the formula for equipment cost per hour?",
      a: "Add the machine's yearly owning costs (depreciation, interest, insurance, taxes, storage) to its yearly operating costs (fuel, oil, repairs, wear parts), then divide by the hours it worked that year. Depreciation per hour is the delivered price minus salvage value, divided by the life in hours.",
    },
    {
      q: "What is the difference between owning and operating costs?",
      a: "Owning costs pile up with time whether the machine runs or not: depreciation, interest, insurance, taxes and storage. Operating costs grow with each working hour: fuel, lubricants, repairs, tires and wear parts.",
    },
    {
      q: "How many hours does an excavator last?",
      a: "FAO's planning table, adapted from Caterpillar, gives 12,000 hours for light utility digging, 10,000 for steady mass excavation or trenching, and 8,000 for continuous rock work. Your own trade-in records are the better guide once you have them.",
    },
    {
      q: "Should operator wages be in the equipment rate?",
      a: "They can be, but many contractors keep them out and cost the operator as labor, because the operator is often paid for more hours than the machine runs. Whichever you pick, don't count the wage in both places.",
    },
    {
      q: "Does SmartCrew calculate equipment cost per hour?",
      a: "SmartCrew records machine hours by job from the operator's clock-in, keeps hours and service dates on each machine, logs fuel, and shows equipment budget against spent on the job page. How the equipment rate itself is set is still to be confirmed on this page.",
    },
  ],
  sources: [
    { label: "FAO: Calculation of machine rates (chapter 3)", url: FAO, accessed: "2026-10-22" },
    { label: "US Army Corps of Engineers EP 1110-1-8, Construction Equipment Ownership and Operating Expense Schedule", url: USACE, accessed: "2026-10-22" },
  ],
  related: ["features/heavy-equipment-maintenance-software", "features/construction-job-costing", "excavation-software", "guides/construction-software-pricing"],
};
