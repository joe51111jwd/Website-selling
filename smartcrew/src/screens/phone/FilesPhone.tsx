import { PhoneShell, PhoneHeader, CircleButton, Input } from "../kit";
import { fileFolders as F, jobFiles, projectById } from "../data";
import "./FilesPhone.css";

// The crew app's Docs tab (Watch it work, The Month's Document Storage; Andrew's comment-mode note,
// Oct 21: "Show mobile app of files"). The open job's folders and newest files, the same ones the
// laptop's Files page shows.

const job = projectById(F.open);
const FOLDERS = ["Plans", "Photos", "Permits", "Change Orders", "Safety"];

export default function FilesPhone() {
  return (
    <PhoneShell tab="Docs">
      <PhoneHeader icon="docs" title="Docs" right={<CircleButton icon="upload" />} />
      <Input select value={job.name} className="pfl-job" />
      <div className="pfl-folders">
        {FOLDERS.map((f, i) => (
          <span key={f} className={`pfl-chip${i === 0 ? " is-on" : ""}`}>
            {f}
          </span>
        ))}
      </div>
      <ul className="pfl-list">
        {jobFiles.slice(0, 7).map((f) => (
          <li key={f.id} className="pfl-row">
            <span className={`pfl-ic pfl-ic--${f.kind}`}>{f.kind === "pdf" ? "PDF" : f.kind === "image" ? "JPG" : "XLS"}</span>
            <span className="pfl-main">
              <span className="pfl-name">{f.name}</span>
              <span className="pfl-meta">
                {f.folder} · {f.date} · {f.size}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </PhoneShell>
  );
}
