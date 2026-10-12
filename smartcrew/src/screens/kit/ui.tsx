import type { CSSProperties, ReactNode } from "react";
import { Icon, type IconName } from "./Icon";
import { hmPad, initials as toInitials } from "./format";

const cx = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(" ");

// ── Badge: red count bubble (sidebar, tabs) ─────────────────────────────────
export type BadgeTone = "red" | "grey" | "orange" | "blue" | "green";
export function Badge({ children, tone = "red", size = "sm", className, style }: { children: ReactNode; tone?: BadgeTone; size?: "sm" | "md"; className?: string; style?: CSSProperties }) {
  return (
    <span className={cx("sc-badge", tone !== "red" && `sc-badge--${tone}`, size === "md" && "sc-badge--md", className)} style={style}>
      {children}
    </span>
  );
}

// ── Pill: tinted status pill ("Clocked In", "Not paid", "Active ▾", "High") ─
export type PillTone = "green" | "ok" | "red" | "blue" | "orange" | "grey" | "purple" | "dark";
export function Pill({
  children,
  tone = "grey",
  size = "md",
  dot = false,
  caret = false,
  outline = false,
  select = false,
  className,
  style,
}: {
  children: ReactNode;
  tone?: PillTone;
  size?: "sm" | "md";
  /** leading coloured dot (Active ●, Todo ●) */
  dot?: boolean;
  /** trailing chevron (dropdown pills) */
  caret?: boolean;
  outline?: boolean;
  /** wide grey dropdown look used for "● Pending ▾" status selects */
  select?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span className={cx("sc-pill", `sc-pill--${tone}`, size === "sm" && "sc-pill--sm", outline && "sc-pill--outline", select && "sc-pill--select", className)} style={style}>
      {dot && <span className="sc-pill-dot" />}
      {children}
      {caret && <Icon name="chevronDown" size={13} stroke={1.8} className="sc-pill-caret" />}
    </span>
  );
}

// ── Button ──────────────────────────────────────────────────────────────────
export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export function Button({
  children,
  variant = "secondary",
  icon,
  iconRight,
  size = "md",
  block = false,
  className,
  style,
}: {
  children?: ReactNode;
  /** primary = black "+ Add"; secondary = grey "Filters"/"Sort"; outline = white bordered; danger = grey with red icon ("Delete") */
  variant?: ButtonVariant;
  icon?: IconName;
  iconRight?: IconName;
  size?: "sm" | "md" | "lg";
  block?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const v = variant === "danger" ? "secondary sc-btn--danger" : variant;
  const is = size === "sm" ? 15 : size === "lg" ? 20 : 17;
  return (
    <span className={cx("sc-btn", `sc-btn--${v}`, size !== "md" && `sc-btn--${size}`, block && "sc-btn--block", className)} style={style}>
      {icon && <Icon name={icon} size={is} stroke={variant === "primary" && icon === "plus" ? 2 : 1.6} />}
      {children}
      {iconRight && <Icon name={iconRight} size={is} stroke={1.6} />}
    </span>
  );
}

/** Square grey icon button (table actions: edit / red delete / ›). */
export function IconButton({
  icon,
  tone = "grey",
  size = 30,
  iconSize,
  round = false,
  className,
  style,
}: {
  icon: IconName;
  tone?: "grey" | "danger" | "plain" | "white";
  size?: number;
  iconSize?: number;
  round?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      className={cx("sc-iconbtn", tone === "danger" && "sc-iconbtn--danger", tone === "plain" && "sc-iconbtn--plain", tone === "white" && "sc-iconbtn--white", round && "sc-iconbtn--round", className)}
      style={{ width: size, height: size, ...style }}
    >
      <Icon name={icon} size={iconSize ?? Math.round(size * 0.5)} stroke={1.6} />
    </span>
  );
}

// ── Segmented tabs: grey track, selected = white pill ──────────────────────
export type SegItem = string | { label: ReactNode; key?: string; badge?: ReactNode; icon?: IconName };
export function Segmented({
  items,
  value,
  size = "md",
  block = false,
  className,
  style,
}: {
  items: SegItem[];
  /** label (or key) of the selected item */
  value: string;
  /** md = dashboard/table tabs (40 px track, 13 px); lg = page-level tabs (Timecards · Payroll …); sm = Day/Week/Month */
  size?: "sm" | "md" | "lg";
  block?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={cx("sc-seg", size !== "md" && `sc-seg--${size}`, block && "sc-seg--block", className)} style={style}>
      {items.map((it, i) => {
        const o = typeof it === "string" ? { label: it, key: it } : it;
        const key = o.key ?? (typeof o.label === "string" ? o.label : String(i));
        const on = key === value;
        return (
          <span key={key} className={cx("sc-seg-item", on && "is-active")}>
            {o.icon && <Icon name={o.icon} size={15} />}
            {o.label}
            {o.badge !== undefined && <Badge size="md">{o.badge}</Badge>}
          </span>
        );
      })}
    </div>
  );
}

// ── KPI card ────────────────────────────────────────────────────────────────
export function Kpi({
  icon,
  label,
  value,
  sub,
  well = true,
  size = "md",
  className,
  style,
}: {
  icon: IconName;
  label: ReactNode;
  value: ReactNode;
  /** third line ("Live", "Projects with activity") */
  sub?: ReactNode;
  /** white circular icon well (dashboard, projects); false = bare icon (materials, pipeline) */
  well?: boolean;
  /** lg = projects board style (14 px label, bigger well) */
  size?: "md" | "lg";
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={cx("sc-kpi", size === "lg" && "sc-kpi--lg", className)} style={style}>
      <span className={well ? "sc-kpi-well" : "sc-kpi-icon"}>
        <Icon name={icon} size={well ? (size === "lg" ? 22 : 20) : 18} stroke={1.7} />
      </span>
      <div className="sc-kpi-body">
        <span className="sc-kpi-label">{label}</span>
        <span className="sc-kpi-value sc-num">{value}</span>
        {sub !== undefined && <span className="sc-kpi-sub">{sub}</span>}
      </div>
    </div>
  );
}

// ── Card ────────────────────────────────────────────────────────────────────
export function Card({ children, surface = false, clip = true, className, style }: { children?: ReactNode; surface?: boolean; clip?: boolean; className?: string; style?: CSSProperties }) {
  return (
    <div className={cx("sc-card", surface && "sc-card--surface", clip && "sc-card--clip", className)} style={style}>
      {children}
    </div>
  );
}

/** Row inside a card: put a <Segmented> first (it pushes the rest right), then Search / Buttons. */
export function Toolbar({ children, className, style }: { children?: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={cx("sc-toolbar", className)} style={style}>
      {children}
    </div>
  );
}

export function Search({ placeholder = "Search", width = 254, value, className, style }: { placeholder?: string; width?: number | string; value?: string; className?: string; style?: CSSProperties }) {
  return (
    <div className={cx("sc-search", className)} style={{ width, ...style }}>
      <Icon name="search" size={17} stroke={1.6} />
      <span style={value ? { color: "#111" } : undefined}>{value ?? placeholder}</span>
    </div>
  );
}

// ── Web filter dropdown ("All Projects ▾") ──────────────────────────────────
export function Select({ value, placeholder, icon, width, className, style }: { value?: string; placeholder?: string; icon?: IconName; width?: number | string; className?: string; style?: CSSProperties }) {
  return (
    <div className={cx("sc-select", !value && "is-placeholder", className)} style={{ width, ...style }}>
      {icon && <Icon name={icon} size={16} />}
      <span className="sc-select-value">{value ?? placeholder}</span>
      <Icon name="chevronDown" size={17} stroke={1.7} className="sc-select-caret" />
    </div>
  );
}

// ── Table ───────────────────────────────────────────────────────────────────
export type Column = {
  key: string;
  header: ReactNode;
  /** px number or any CSS width */
  width?: number | string;
  align?: "left" | "center" | "right";
  /** show the ⇅ sort glyph after the header */
  sortable?: boolean;
};

export function Table({
  columns,
  rows,
  headerHeight = 69,
  rowHeight = 66,
  checkbox = false,
  className,
  style,
}: {
  columns: Column[];
  /** one entry per row: cell content keyed by column key */
  rows: Record<string, ReactNode>[];
  headerHeight?: number;
  rowHeight?: number;
  /** leading checkbox column */
  checkbox?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const al = (a?: Column["align"]) => (a === "center" ? "is-center" : a === "right" ? "is-right" : undefined);
  return (
    <table className={cx("sc-table", className)} style={style}>
      <colgroup>
        {checkbox && <col style={{ width: 56 }} />}
        {columns.map((c) => (
          <col key={c.key} style={c.width !== undefined ? { width: c.width } : undefined} />
        ))}
      </colgroup>
      <thead>
        <tr style={{ height: headerHeight }}>
          {checkbox && (
            <th style={{ paddingLeft: 19 }}>
              <Checkbox />
            </th>
          )}
          {columns.map((c) => (
            <th key={c.key} className={al(c.align)}>
              {c.sortable ? (
                <span className="sc-th-sort">
                  {c.header}
                  <Icon name="sort" size={14} stroke={1.6} />
                </span>
              ) : (
                c.header
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} style={{ height: rowHeight }}>
            {checkbox && (
              <td style={{ paddingLeft: 19 }}>
                <Checkbox checked={r.__checked === true} />
              </td>
            )}
            {columns.map((c) => (
              <td key={c.key} className={al(c.align)}>
                {r[c.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Two-line table cell: main text + grey sub line. */
export function Cell2({ main, sub, className }: { main: ReactNode; sub?: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <div className="sc-trunc">{main}</div>
      {sub !== undefined && <div className="sc-cell-sub sc-trunc">{sub}</div>}
    </div>
  );
}

/** Avatar + name (+ sub line) cell. */
export function PersonCell({ name, sub, initials, photo = false, size = 28 }: { name: string; sub?: ReactNode; initials?: string; photo?: boolean; size?: number }) {
  return (
    <div className="sc-cell-person">
      <Avatar name={name} initials={initials} photo={photo} size={size} />
      <Cell2 main={name} sub={sub} />
    </div>
  );
}

// ── Avatar (initials in a grey circle) ──────────────────────────────────────
export function Avatar({
  name,
  initials,
  size = 28,
  tone = "grey",
  photo = false,
  single = false,
  className,
  style,
}: {
  name: string;
  initials?: string;
  size?: number;
  tone?: "grey" | "dark" | "white";
  /** neutral warm-gradient "photo" disc instead of initials */
  photo?: boolean;
  /** one letter only (timecards rows show "A", "B", …) */
  single?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const txt = single ? name.trim()[0].toUpperCase() : initials ?? toInitials(name);
  return (
    <span
      className={cx("sc-avatar", tone === "dark" && "sc-avatar--dark", photo && "sc-avatar--photo", className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.43), ...(tone === "white" ? { background: "#fff" } : null), ...style }}
    >
      {photo ? <PhotoFace /> : txt}
    </span>
  );
}

function PhotoFace() {
  return (
    <svg viewBox="0 0 28 28" width="100%" height="100%">
      <circle cx="14" cy="11" r="5.2" fill="#3a332e" opacity="0.55" />
      <path d="M4 28c1.5-6 5.5-9 10-9s8.5 3 10 9z" fill="#2c2622" opacity="0.6" />
    </svg>
  );
}

// ── Checkbox ────────────────────────────────────────────────────────────────
export function Checkbox({ checked = false }: { checked?: boolean }) {
  return <span className={cx("sc-check", checked && "is-on")}>{checked && <Icon name="check" size={13} stroke={2.4} />}</span>;
}

// ── Pager: ‹ Page 1 of 1 › ──────────────────────────────────────────────────
export function Pager({ page = 1, pages = 1, className, style }: { page?: number; pages?: number; className?: string; style?: CSSProperties }) {
  return (
    <div className={cx("sc-pager", className)} style={style}>
      <Icon name="chevronLeft" size={20} stroke={1.7} />
      <span>
        Page {page} of {pages}
      </span>
      <Icon name="chevronRight" size={20} stroke={1.7} />
    </div>
  );
}

// ── Hours cell: orange clock + "05h 22m", or red ✕ + "-" ────────────────────
export function Hours({ minutes, big = false }: { minutes: number | null; big?: boolean }) {
  if (minutes === null || minutes === 0)
    return (
      <span className="sc-hours sc-hours--none">
        <Icon name="xCircleFill" size={17} />-
      </span>
    );
  return (
    <span className="sc-hours" style={big ? { fontSize: 15 } : undefined}>
      <Icon name="clock" size={big ? 18 : 15} stroke={1.7} />
      {hmPad(minutes)}
    </span>
  );
}

// ── Phone form controls ─────────────────────────────────────────────────────

/** Label + control stack used by the phone forms. */
export function Field({ label, children, className, style }: { label: ReactNode; children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={cx("sc-field", className)} style={style}>
      <span className="sc-field-label">{label}</span>
      {children}
    </div>
  );
}

/** Phone select/input box (#F5F5F5, 46 px). `select` adds the chevron; `icon` a leading icon. */
export function Input({
  value,
  placeholder,
  icon,
  select = false,
  multiline = false,
  outline = false,
  height,
  className,
  style,
}: {
  value?: ReactNode;
  placeholder?: string;
  icon?: IconName;
  select?: boolean;
  multiline?: boolean;
  /** white with hairline border (live-site style) */
  outline?: boolean;
  height?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const empty = value === undefined || value === null || value === "";
  return (
    <div
      className={cx("sc-input", empty && "is-placeholder", select && "is-select", multiline && "sc-input--area", outline && "sc-input--outline", className)}
      style={height ? { height, minHeight: height, ...style } : style}
    >
      {icon && <Icon name={icon} size={20} stroke={1.5} />}
      <span className="sc-input-value">{empty ? placeholder : value}</span>
      {select && <Icon name="chevronDown" size={18} stroke={1.6} />}
    </div>
  );
}

/** Radio / toggle choice tile ("○ Import", "✓ Yes"). */
export function Choice({ label, selected = false, check = false, className, style }: { label: ReactNode; selected?: boolean; /** selected shows a ✓ instead of a radio dot */ check?: boolean; className?: string; style?: CSSProperties }) {
  return (
    <div className={cx("sc-choice", selected && "is-on", className)} style={style}>
      {selected && check ? <Icon name="check" size={17} stroke={2} /> : <span className="sc-choice-radio" />}
      {label}
    </div>
  );
}

/** Phone button: grey (default), dark (#1F1F1F), outline, pink (Clock Out). */
export function PhoneButton({
  children,
  tone = "grey",
  icon,
  pill = false,
  height,
  className,
  style,
}: {
  children?: ReactNode;
  tone?: "grey" | "dark" | "outline" | "pink";
  icon?: IconName;
  pill?: boolean;
  height?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={cx("sc-pbtn", tone !== "grey" && `sc-pbtn--${tone}`, pill && "sc-pbtn--pill", className)} style={height ? { height, ...style } : style}>
      {icon && <Icon name={icon} size={19} stroke={1.6} />}
      {children}
    </div>
  );
}

/** Round grey icon button (phone header camera / history). */
export function CircleButton({ icon, size = 40, className, style }: { icon: IconName; size?: number; className?: string; style?: CSSProperties }) {
  return (
    <span className={cx("sc-circle-btn", className)} style={{ width: size, height: size, ...style }}>
      <Icon name={icon} size={Math.round(size * 0.56)} stroke={1.75} />
    </span>
  );
}

/** Phone page header: [icon] Title ……… (right). */
export function PhoneHeader({ icon, title, right, className, style }: { icon?: IconName; title: ReactNode; right?: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={cx("sc-phead", className)} style={style}>
      {icon && <CircleButton icon={icon} />}
      <span className="sc-phead-title">{title}</span>
      {right}
    </div>
  );
}
