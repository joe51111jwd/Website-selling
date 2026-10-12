import { WebShell, Button, Segmented, Icon, money, dateSlash, type IconName } from "../kit";
import { deals, dealStages, pipelineTotals, type DealStage } from "../data";
import "./Pipeline.css";

// W10 Sales Pipeline (Gen C), after vercel-module-pipeline-bidding.png: four KPI tiles, Board View ·
// List View · Actions · Activity Logs, and the kanban board (Leads · In Progress · Proposal Sent ·
// Negotiation …) that scrolls sideways, so the Negotiation column is cut at the card edge as in the
// capture. Deals and KPI totals come from data.ts (KPIs are sums of the open deals).

/** Count-badge tint per stage (Leads grey, In Progress orange, Proposal Sent amber as captured; Negotiation purple as in Gen B). */
const STAGE_TONE: Record<DealStage, string> = {
  Leads: "grey",
  "In Progress": "orange",
  "Proposal Sent": "amber",
  Negotiation: "purple",
  Won: "green",
  Lost: "red",
};

const KPIS: { icon: IconName; label: string; value: string | number }[] = [
  { icon: "dollar", label: "Pipeline Value", value: money(pipelineTotals.value, { cents: false }) },
  { icon: "fileText", label: "Active Deals", value: pipelineTotals.activeDeals },
  { icon: "checkCircle", label: "Won This Month", value: pipelineTotals.wonThisMonth },
  { icon: "briefcase", label: "In Negotiation", value: pipelineTotals.inNegotiation },
];

/** Keep the last two words together so a wrapped deal name never leaves a one-word orphan ("160 ac"). */
const keepLastWords = (s: string) => s.replace(/ (\S+)$/, "\u00a0$1");

export default function Pipeline() {
  return (
    <WebShell
      active="Pipeline"
      title="Sales Pipeline"
      contentClassName="scpipe-page"
      actions={
        <Button variant="primary" icon="plus" className="scpipe-new">
          New Deal
        </Button>
      }
    >
      <div className="scpipe-kpis">
        {KPIS.map((k) => (
          <div key={k.label} className="scpipe-kpi">
            <span className="scpipe-kpi-icon">
              <Icon name={k.icon} size={17} stroke={1.7} />
            </span>
            <div className="scpipe-kpi-body">
              <span className="scpipe-kpi-label">{k.label}</span>
              <span className="scpipe-kpi-value sc-num">{k.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="scpipe-board">
        <Segmented items={["Board View", "List View", "Actions", "Activity Logs"]} value="Board View" className="scpipe-tabs" />
        <div className="scpipe-cols">
          {dealStages.map((stage) => {
            const list = deals.filter((d) => d.stage === stage);
            return (
              <div key={stage} className="scpipe-col">
                <div className="scpipe-col-head">
                  <span className="scpipe-col-title">{stage}</span>
                  <span className={`scpipe-count is-${STAGE_TONE[stage]}`}>{list.length}</span>
                </div>
                {list.map((d) => (
                  <div key={d.id} className="scpipe-card">
                    <div className="scpipe-card-name">{keepLastWords(d.name)}</div>
                    <div className="scpipe-card-sub sc-trunc">{d.company}</div>
                    <div className="scpipe-card-value sc-num">{money(d.value, { cents: false })}</div>
                    <div className="scpipe-card-sub">Close: {dateSlash(d.close)}</div>
                    {d.notes && <div className="scpipe-card-note sc-trunc">{d.notes}</div>}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </WebShell>
  );
}
