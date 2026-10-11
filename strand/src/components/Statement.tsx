import { filaments, products, stats } from "../content/catalog";

const m = Math.round(stats(products[0], 45, filaments.signal).lineM / 10) * 10;

export default function Statement() {
  return (
    <section className="statement" aria-label="How it's made">
      <p className="statement__text">
        A printer doesn't carve or cast. <strong>It draws.</strong> One strand of plastic, 0.4 millimetres wide, laid down in a
        single path until the line becomes a thing you can hold. A 45 millimetre cube is about <strong>{m} metres</strong> of it.
      </p>
      <p className="statement__note mono">Keep scrolling. The line makes the collection as you go.</p>
    </section>
  );
}
