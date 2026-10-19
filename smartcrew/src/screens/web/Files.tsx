import { WebShell, Icon, Avatar, type IconName } from "../kit";
import { fileFolders as F, jobFiles, projectById, crewById, type FileKind } from "../data";
import { SitePhoto } from "./SitePhoto";
import "./Files.css";

// W16 Files: every job's plans, photos and documents, by job. Left, the jobs (and the company's
// own folder) with their file counts; right, the open job: its folders and its newest files.
// Drawn in the Gen C manner of the other web screens (no capture of this page).

const job = projectById(F.open);
const jobCount = F.jobs.find((j) => j.projectId === F.open)!.files;
const allCount = F.jobs.reduce((a, j) => a + j.files, 0) + F.company;

/** The kit has no folder glyph: one in its stroke style. */
function Folder({ size = 18 }: { size?: number }) {
  return (
    <svg className="sc-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" aria-hidden="true">
      <path d="M2.8 6.6c0-1 .8-1.8 1.8-1.8h4.6l2.2 2.4h8c1 0 1.8.8 1.8 1.8v9.4c0 1-.8 1.8-1.8 1.8H4.6c-1 0-1.8-.8-1.8-1.8z" />
    </svg>
  );
}

const FOLDER_ICON: Record<string, IconName> = {
  Plans: "layers",
  Photos: "image",
  Permits: "shieldCheck",
  "Change Orders": "fileText",
  Safety: "hardHat",
};

function FileIcon({ kind, n }: { kind: FileKind; n: number }) {
  if (kind === "image") return <SitePhoto n={n} className="scfl-thumb" />;
  return <span className={`scfl-doc scfl-doc--${kind}`}>{kind === "pdf" ? "PDF" : "XLS"}</span>;
}

export default function Files() {
  return (
    <WebShell active="Projects" contentClassName="scfl">
      <div className="scfl-head">
        <h1 className="scfl-title">Files</h1>
        <div className="scfl-search">
          <Icon name="search" size={18} stroke={1.7} />
          <span>Search all files</span>
        </div>
        <span className="scfl-up">
          <Icon name="upload" size={16} stroke={1.8} />
          Upload
        </span>
      </div>

      <div className="scfl-body">
        <nav className="scfl-jobs">
          <div className="scfl-job">
            <Folder />
            <span className="sc-trunc">All files</span>
            <b>{allCount}</b>
          </div>
          <p className="scfl-jobs-h">Jobs</p>
          {F.jobs.map((j) => (
            <div key={j.projectId} className={`scfl-job${j.projectId === F.open ? " is-on" : ""}`}>
              <Folder />
              <span className="sc-trunc">{projectById(j.projectId).name}</span>
              <b>{j.files}</b>
            </div>
          ))}
          <p className="scfl-jobs-h">Company</p>
          <div className="scfl-job">
            <Folder />
            <span className="sc-trunc">Safety & HR</span>
            <b>{F.company}</b>
          </div>
        </nav>

        <div className="scfl-main">
          <div className="scfl-crumb">
            <span>Files</span>
            <Icon name="chevronRight" size={15} stroke={1.8} />
            <b>{job.name}</b>
            <span className="scfl-count">{jobCount} files</span>
          </div>

          <div className="scfl-folders">
            {F.folders.map((f) => (
              <div key={f.name} className="scfl-folder">
                <span className="scfl-folder-ic">
                  <Icon name={FOLDER_ICON[f.name] ?? "file"} size={18} stroke={1.6} />
                </span>
                <span className="scfl-folder-name">{f.name}</span>
                <span className="scfl-folder-n">{f.files} files</span>
              </div>
            ))}
          </div>

          <div className="scfl-card">
            <div className="scfl-tr scfl-tr--head">
              <div>Name</div>
              <div>Folder</div>
              <div>Uploaded by</div>
              <div>Date</div>
              <div>Size</div>
            </div>
            {jobFiles.map((f, i) => {
              const who = crewById(f.byId);
              return (
                <div key={f.id} className="scfl-tr">
                  <div className="scfl-name">
                    <FileIcon kind={f.kind} n={i + 1} />
                    <span className="sc-trunc">{f.name}</span>
                  </div>
                  <div>
                    <span className="scfl-tag">{f.folder}</span>
                  </div>
                  <div className="scfl-who">
                    <Avatar name={who.name} single size={22} style={{ fontSize: 10.5 }} />
                    <span className="sc-trunc">{who.name}</span>
                  </div>
                  <div>{f.date}</div>
                  <div>{f.size}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </WebShell>
  );
}
