import "./Dashboard.css";
import { WebShell, Select, Kpi, MapPanel, Card, Toolbar, Segmented, Search, Button, Table, PersonCell, Pill, Cell2, Icon, money, hm, dateShort, type MapPin } from "../kit";
import { dashboard, clockIns, crewById, projectById, equipmentById } from "../data";

// W1 Dashboard (Gen C): filters, 2×4 KPI grid, crew map, Clock Ins table.

const PINS: MapPin[] = [
  { x: 738, y: 182, label: "MB" },
  { x: 766, y: 198, label: "ER" },
  { x: 614, y: 372, label: "KM" },
  { x: 1205, y: 733, label: "TO" },
  { x: 1010, y: 324, label: "DH" },
  { x: 884, y: 358, label: "CB" },
  { x: 862, y: 482, label: "WT" },
  { x: 1112, y: 388, photo: true },
];

export default function Dashboard() {
  const rows = clockIns.slice(0, 5).map((c) => {
    const person = crewById(c.crewId);
    const project = c.projectId ? projectById(c.projectId) : null;
    const eq = c.equipmentId ? equipmentById(c.equipmentId) : null;
    return {
      employee: <PersonCell name={person.name} initials={person.initials} sub={person.role} />,
      status: <Pill tone="green">{c.status}</Pill>,
      project: project ? <Cell2 main={project.name} sub={project.number} /> : <Cell2 main="Unassigned" sub="Clocked in without task" />,
      activity: c.activity ?? "Unassigned",
      equipment: eq ? <span className="sc-trunc" style={{ display: "block" }}>{eq.name}</span> : "-",
      last: (
        <div className="scd-last">
          <Icon name="info" size={13} stroke={1.6} />
          <Cell2 main={dateShort(c.date)} sub={c.time} />
        </div>
      ),
    };
  });

  return (
    <WebShell
      active="Dashboard"
      title="Dashboard"
      actions={
        <>
          <Select value="All Projects" width={161} />
          <Select value="All Crews" width={140} />
          <Select value="All Activity Codes" width={177} />
          <Select value="All Equipment" width={161} />
        </>
      }
    >
      <div className="scd-top">
        <div className="scd-kpis">
          <Kpi icon="dollarCircle" label="Labor Expense" value={money(dashboard.laborExpense)} sub="Live" />
          <Kpi icon="cash" label="Material Expense" value={money(dashboard.materialExpense)} sub="Live" />
          <Kpi icon="equipment" label="Equipment Expense" value={money(dashboard.equipmentExpense)} sub="Live" />
          <Kpi icon="target" label="Active Projects" value={dashboard.activeProjects} sub="Projects with activity" />
          <Kpi icon="clock" label="Labor Hours" value={hm(dashboard.laborMinutes)} sub="Live" />
          <Kpi icon="clockPlus" label="OT Hours" value={hm(dashboard.otMinutes)} sub="Live" />
          <Kpi icon="truck" label="Equipment Hours" value={hm(dashboard.equipmentMinutes)} sub="Live" />
          <Kpi icon="fileText" label="Field Notes" value={dashboard.fieldNotes} sub="Updates & photos" />
        </div>
        <MapPanel width={524} height={373} center={{ x: 905, y: 452 }} zoom={0.5} pins={PINS} />
      </div>

      <Card className="scd-table">
        <Toolbar>
          <Segmented items={["Clock Ins", "Activity Logs", "Field Notes"]} value="Clock Ins" />
          <Search width={254} />
          <Button icon="sort" className="scd-sort">
            Sort
          </Button>
        </Toolbar>
        <Table
          columns={[
            { key: "employee", header: "Employee", width: 214 },
            { key: "status", header: "Status", width: 124, align: "center" },
            { key: "project", header: "Project", width: 240 },
            { key: "activity", header: "Activity", width: 150 },
            { key: "equipment", header: "Equipment", width: 184 },
            { key: "last", header: "Last Clock In" },
          ]}
          rows={rows}
        />
      </Card>
    </WebShell>
  );
}
