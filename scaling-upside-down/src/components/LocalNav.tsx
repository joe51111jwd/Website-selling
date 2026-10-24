import { book } from "../content";

/** Apple's product bar: frosted, the product name on the left, sections and a blue pill on the right. */
export function LocalNav({ visible, dark }: { visible: boolean; dark: boolean }) {
  return (
    <nav className={`localnav${dark ? " dark" : ""}${visible ? " in" : ""}`} aria-label="Book">
      <div className="localnav-inner">
        <a className="localnav-title" href="#top">
          {book.title}
        </a>
        <div className="localnav-menu">
          <a href="#overview">Overview</a>
          <a href="#model">The model</a>
          <a href="#bootloader">Bootloader</a>
          <a href="#faq">Questions</a>
          <a className="btn btn-blue btn-sm" href="#buy">
            {book.cta}
          </a>
        </div>
      </div>
    </nav>
  );
}
