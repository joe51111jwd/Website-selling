import { Chars, Label } from "../components/Text";
import { Link } from "../components/Link";
import { ModeSwitch } from "../components/Chrome";
import { usePageReady } from "../lib/transition";

export function NotFound() {
  const ready = usePageReady();
  return (
    <section className="notfound wrap" data-theme="paper" data-x="section.404">
      <Label index="404">Not found</Label>
      <h1 className="notfound-title">
        <Chars text="404" play={ready} />
      </h1>
      <p className="notfound-text">There's nothing on the surface here. Flip to Structure and you'll see there's nothing underneath either.</p>
      <div className="notfound-actions">
        <ModeSwitch />
        <Link to="/" className="btn">
          Back to the index
        </Link>
      </div>
    </section>
  );
}
