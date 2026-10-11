import { useState, type FormEvent } from "react";
import { filaments } from "../content/catalog";

// Custom orders. In the mockup the form just confirms on the page; wire it to a form
// service or an email API before launch (see README).
export default function Custom() {
  const [sent, setSent] = useState(false);
  const [file, setFile] = useState<string | null>(null);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setSent(true);
  };
  return (
    <section className="custom" id="custom" aria-labelledby="custom-title">
      <div className="custom__head">
        <p className="kicker mono">Custom</p>
        <h2 className="section-title" id="custom-title">Have a part in mind? Send the file.</h2>
        <p className="custom__text">
          STL, 3MF or OBJ, or a sketch with measurements. We'll slice it, quote it within a day, and print it in any of our{" "}
          {Object.keys(filaments).length} filaments.
        </p>
        <ul className="custom__facts mono">
          <li><b>24 h</b> quote</li>
          <li><b>256 mm</b> max per side</li>
          <li><b>0.08 mm</b> finest layer</li>
        </ul>
      </div>
      {sent ? (
        <div className="custom__form custom__sent" role="status">
          <p className="mono">Received</p>
          <p>Thanks. We'll reply within a day with a quote and a slicer preview of your part.</p>
          <button className="btn btn--ghost" onClick={() => (setSent(false), setFile(null))}>Send another</button>
        </div>
      ) : (
        <form className="custom__form" onSubmit={submit}>
          <label className="field">
            <span className="mono">Name</span>
            <input name="name" required autoComplete="name" />
          </label>
          <label className="field">
            <span className="mono">Email</span>
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label className="field field--wide">
            <span className="mono">What should we make?</span>
            <textarea name="message" rows={3} required placeholder="A replacement knob for a 1970s amp, about 30 mm across…" />
          </label>
          <label className={`drop field--wide${file ? " has-file" : ""}`}>
            <input type="file" accept=".stl,.3mf,.obj,.step,.stp,image/*" onChange={(e) => setFile(e.target.files?.[0]?.name ?? null)} />
            <span className="mono">{file ?? "Drop a file, or click to choose"}</span>
            <small>STL · 3MF · OBJ · STEP · photo</small>
          </label>
          <button className="btn btn--big field--wide" type="submit">Ask for a quote</button>
        </form>
      )}
    </section>
  );
}
