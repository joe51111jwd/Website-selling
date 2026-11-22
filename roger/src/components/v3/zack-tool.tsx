"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { saveFreeRun, type FreeRunResult } from "@/app/zack-actions";
import { ctaLong, zackPasteWarning } from "@/data/v3-copy";
import { zackAdaptPrompt, zackFile, zackRunPrompt, zackVersion } from "@/data/zack";
import { StartLink } from "./start-link";

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-sm btn-light"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 2000);
        } catch {}
      }}
    >
      {done ? "Copied" : label}
    </button>
  );
}

const StepHead = ({ n, title, sub }: { n: string; title: string; sub?: string }) => (
  <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "1.25rem", alignItems: "baseline" }}>
    <span className="t-h3 ink-2" aria-hidden="true">{n}</span>
    <div>
      <h2 className="t-h3">{title}</h2>
      {sub && <p className="ink-2" style={{ marginTop: "0.5rem" }}>{sub}</p>}
    </div>
  </div>
);

/** Email, then instructions with the run-once prompt, then paste the report back. */
export function ZackTool({ agent }: { agent: { slug: string; name: string; listed: boolean } }) {
  const [email, setEmail] = useState("");
  const [emailErr, setEmailErr] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [result, action, pending] = useActionState<FreeRunResult | null, FormData>(saveFreeRun, null);
  const file = zackFile(agent.listed ? agent.slug : "hark");
  const prompt = agent.listed ? zackRunPrompt : zackAdaptPrompt;
  const err = (f: string) => (result && !result.ok && result.field === f ? result.message : "");

  if (result?.ok)
    return (
      <div className="card" style={{ display: "grid", gap: "1.5rem" }} role="status">
        <h2 className="t-h3">Your top plays this week</h2>
        {result.plays.length ? (
          <ol style={{ display: "grid", gap: 0 }}>
            {result.plays.map((p, i) => (
              <li key={i} className="t-lead" style={{ padding: "0.9rem 0", borderTop: "1px solid var(--color-rule)", display: "flex", gap: "1rem" }}>
                <span className="num ink-2">{i + 1}</span>{p}
              </li>
            ))}
          </ol>
        ) : (
          <p className="ink-2">We have your report. Cora reads it when you start.</p>
        )}
        <p className="ink-2">Start now and this report becomes your first run.</p>
        <div><StartLink path="agents" extra={{ zack: result.token }}>{ctaLong}</StartLink></div>
      </div>
    );

  return (
    <div style={{ display: "grid", gap: "clamp(3rem, 8vh, 4.5rem)" }}>
      <section>
        <StepHead n="01" title="Your email" sub="So your report can follow you into your account." />
        <form
          noValidate
          style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap" }}
          onSubmit={(e) => {
            e.preventDefault();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setEmailErr("Enter a valid email address.");
            setEmailErr("");
            setUnlocked(true);
          }}
        >
          <div className="field" style={{ flex: "1 1 18rem" }}>
            <label htmlFor="zack-email">Email</label>
            <input id="zack-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!emailErr} aria-describedby={emailErr ? "zack-email-err" : undefined} />
            {emailErr && <p className="err" id="zack-email-err">{emailErr}</p>}
          </div>
          <button type="submit" className="btn" style={{ marginBottom: emailErr ? "1.7rem" : 0 }}>{unlocked ? "Saved" : "Continue"}</button>
        </form>
      </section>

      <section aria-disabled={!unlocked} style={{ opacity: unlocked ? 1 : 0.4, transition: "opacity 0.4s" }} inert={!unlocked}>
        <StepHead
          n="02"
          title={`Run Zack in ${agent.listed ? agent.name : "your agent"}`}
          sub={agent.listed ? "Download the file, attach it in your own account, and send the prompt. It runs once and sends nothing." : "Start from the Hark file and ask your own agent to adapt it. It runs once and sends nothing."}
        />
        <div className="card" style={{ marginTop: "1.5rem", display: "flex", gap: "1rem", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
          <div>
            <p className="t-meta ink-2">Zack the Collector for</p>
            <p className="t-h3">{agent.listed ? agent.name : "Hark"}</p>
            <p className="t-meta ink-2">Version {zackVersion}</p>
          </div>
          <a className="btn" href={file} download>Download</a>
        </div>
        <div className="code night" style={{ marginTop: "0.75rem" }}>
          <code>{prompt}</code>
          <CopyButton text={prompt} label="Copy prompt" />
        </div>
      </section>

      <section style={{ opacity: unlocked ? 1 : 0.4, transition: "opacity 0.4s" }} inert={!unlocked}>
        <StepHead n="03" title="Paste your report back" />
        <form action={action} style={{ marginTop: "1.5rem", display: "grid", gap: "1rem" }}>
          <p className="draft-note">{zackPasteWarning}</p>
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="agent" value={agent.slug} />
          <div style={{ position: "absolute", left: "-200vw" }} aria-hidden="true">
            <label htmlFor="company">Company</label>
            <input id="company" name="company" tabIndex={-1} autoComplete="off" />
          </div>
          <div className="field">
            <label htmlFor="zack-report">Zack&rsquo;s report</label>
            <textarea id="zack-report" name="report" maxLength={20000} aria-invalid={!!err("report")} aria-describedby={err("report") ? "zack-report-err" : undefined} />
            {err("report") && <p className="err" id="zack-report-err">{err("report")}</p>}
            {(err("email") || err("form")) && <p className="err">{err("email") || err("form")}</p>}
          </div>
          <div><button type="submit" className="btn" disabled={pending}>{pending ? "Reading" : "See my top plays"}</button></div>
        </form>
      </section>

      <p className="ink-2">
        <Link href="/zack" className="link"><span aria-hidden="true">‹</span> Pick a different agent</Link>
      </p>
    </div>
  );
}
