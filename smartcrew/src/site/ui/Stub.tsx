// Placeholder content for a scene that hasn't been built yet (removed as each scene lands).
export function Stub({ id, title, note }: { id: string; title: string; note?: string }) {
  return (
    <div className="stub wrap">
      <p className="stub-id">Scene · {id}</p>
      <h2 className="t-h2 stub-title">{title}</h2>
      {note && <p className="t-small stub-note">{note}</p>}
    </div>
  );
}
