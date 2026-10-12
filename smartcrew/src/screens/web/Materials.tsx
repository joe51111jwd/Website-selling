import "./Materials.css";
import type { ReactNode } from "react";
import { WebShell, Icon, money, num, datePad } from "../kit";
import { materialOrders, materialTotals, projectById, vendorById, type MaterialOrder } from "../data";

// W8 Materials → Orders (Gen C), after vercel-module-materials-hauling-web.png.
// Period is "Month" (not "All" as in the capture) so the KPI totals stay a subset of the
// dashboard's season-to-date material expense.

/** The newest order (rip-rap for the Hwy 9 culvert, hauled in 7 loads) is a split parent row. */
const SPLIT_PARENT = "mo-0424";

const orders = [...materialOrders].sort((a, b) => (a.delivery < b.delivery ? 1 : a.delivery > b.delivery ? -1 : 0));

const COLS = ["Project", "Vendor", "Quantity", "Unit", "Unit Cost", "Class", "Delivery", "Billable", "Paid", "Action"];

// Material-style glyphs used by the row action buttons (the app's Flutter build draws these
// with Material Icons, not the outline set used elsewhere). Local because the kit icons are
// stroke-only.
type MName = "edit" | "copy" | "split" | "delete" | "inventory" | "payments" | "receipt" | "moneyOff";
const MPATH: Record<MName, string> = {
  inventory:
    "M20 2H4c-1 0-2 .9-2 2v3.01c0 .72.43 1.34 1 1.69V20c0 1.1 1.1 2 2 2h14c.9 0 2-.9 2-2V8.7c.57-.35 1-.97 1-1.69V4c0-1.1-1-2-2-2zm-1 18H5V9h14v11zm1-13H4V4h16v3zM9 12h6v2H9z",
  payments:
    "M19 14V6c0-1.1-.9-2-2-2H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zm-2 0H3V6h14v8zm-7-7c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm13 0v11c0 1.1-.9 2-2 2H4v-2h17V7h2z",
  receipt:
    "M19.5 3.5 18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2 7.5 3.5 6 2v14H3v3c0 1.66 1.34 3 3 3h12c1.66 0 3-1.34 3-3V2l-1.5 1.5zM15 20H6c-.55 0-1-.45-1-1v-1h10v2zm4-1c0 .55-.45 1-1 1s-1-.45-1-1v-3H8V5h11v14zM9 7h6v2H9zm7 0h2v2h-2zm-7 3h6v2H9zm7 0h2v2h-2z",
  moneyOff:
    "M12.5 6.9c1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-.53.12-1.03.3-1.48.54l1.47 1.47c.41-.17.91-.27 1.51-.27zM5.33 4.06 4.06 5.33 7.5 8.77c0 2.08 1.56 3.21 3.91 3.91l3.51 3.51c-.34.48-1.05.91-2.42.91-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c.96-.18 1.82-.55 2.45-1.12l2.22 2.22 1.27-1.27L5.33 4.06z",
  edit: "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
  copy: "M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z",
  split: "M14 4l2.29 2.29-2.88 2.88 1.42 1.42 2.88-2.88L20 10V4h-6zm-4 0H4v6l2.29-2.29 4.71 4.7V20h2v-8.41l-5.29-5.3L10 4z",
  delete: "M7 21q-.82 0-1.41-.59T5 19V6H4V4h5V3h6v1h5v2h-1v13q0 .82-.59 1.41T17 21H7zM17 6H7v13h10V6zM9 17h2V8H9v9zm4 0h2V8h-2v9z",
};
function MIcon({ name, size }: { name: MName; size: number }) {
  return (
    <svg className="sc-icon" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      {/* the app's banknote stack has the back note on the left */}
      <path d={MPATH[name]} transform={name === "payments" ? "matrix(-1 0 0 1 24 0)" : undefined} />
    </svg>
  );
}

function Actions({ big }: { big: boolean }) {
  const set: MName[] = big ? ["edit", "copy", "delete"] : ["edit", "copy", "split", "delete"];
  return (
    <div className={`scm-acts${big ? " scm-acts--big" : ""}`}>
      {set.map((n) => (
        <span key={n} className={`scm-act${n === "delete" ? " scm-act--del" : ""}`}>
          <MIcon name={n} size={big ? 12 : 8.5} />
        </span>
      ))}
    </div>
  );
}

function row(o: MaterialOrder): ReactNode[] {
  const p = projectById(o.projectId);
  const split = o.id === SPLIT_PARENT;
  return [
    <div className={`scm-proj${split ? " scm-proj--split" : ""}`}>
      {split && <Icon name="chevronRight" size={16} stroke={1.9} />}
      <span className="sc-trunc">{p.name}</span>
    </div>,
    <span className="sc-trunc scm-txt">{vendorById(o.vendorId).name}</span>,
    num(o.quantity),
    o.unit,
    money(o.unitCost),
    <span className="sc-trunc scm-txt">{o.class}</span>,
    datePad(o.delivery),
    <b className="scm-bill">
      {o.billable ? (
        "Billable"
      ) : (
        <>
          Non<i>-</i>Billable
        </>
      )}
    </b>,
    <span className={`scm-paid${o.paid ? " is-paid" : ""}`}>{o.paid ? "Paid" : "Not paid"}</span>,
    <Actions big={split} />,
  ];
}

const KPIS: { icon: MName; label: string; value: string }[] = [
  { icon: "inventory", label: "Total Orders", value: String(materialTotals.orders) },
  { icon: "payments", label: "Total Cost", value: money(materialTotals.totalCost) },
  { icon: "receipt", label: "Billable Cost", value: money(materialTotals.billable) },
  { icon: "moneyOff", label: "Non-Billable Cost", value: money(materialTotals.nonBillable) },
];

export default function Materials() {
  return (
    <WebShell active="Materials" contentClassName="scm">
      <div className="scm-head">
        <h1 className="scm-title">Materials</h1>
        <div className="scm-period">
          {["Day", "Week", "Month", "All"].map((t) => (
            <span key={t} className={t === "Month" ? "is-active" : undefined}>
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="scm-kpis">
        {KPIS.map((k) => (
          <div key={k.label} className="scm-kpi">
            <MIcon name={k.icon} size={18} />
            <div className="scm-kpi-body">
              <span className="scm-kpi-label">{k.label}</span>
              <span className="scm-kpi-value sc-num">{k.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="scm-card">
        <div className="scm-toolbar">
          <div className="scm-tabs">
            {["Orders", "Field Usage", "Hauling", "Receipts"].map((t) => (
              <span key={t} className={t === "Orders" ? "is-active" : undefined}>
                {t}
              </span>
            ))}
          </div>
          <div className="scm-search">
            <Icon name="search" size={18} stroke={1.7} />
            <span>Search</span>
          </div>
          <span className="scm-btn scm-btn--filters">
            <Icon name="filter" size={16} stroke={1.6} />
            Filters
          </span>
          <span className="scm-btn scm-btn--sort">
            <Icon name="sort" size={15} stroke={1.6} />
            Sort
          </span>
          <span className="scm-btn scm-btn--add">
            <Icon name="plus" size={15} stroke={2} />
            Add
          </span>
        </div>

        <div className="scm-table">
          <div className="scm-tr scm-tr--head">
            {COLS.map((c) => (
              <div key={c} className="scm-td">
                {c}
              </div>
            ))}
          </div>
          {orders.map((o) => (
            <div key={o.id} className={`scm-tr${o.id === SPLIT_PARENT ? " scm-tr--tall" : ""}`}>
              {row(o).map((cell, i) => (
                <div key={i} className="scm-td">
                  {cell}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="scm-pager">
          <Icon name="chevronLeft" size={22} stroke={1.6} />
          <span>Page 1 of 1</span>
          <Icon name="chevronRight" size={22} stroke={1.6} />
        </div>
      </div>
    </WebShell>
  );
}
