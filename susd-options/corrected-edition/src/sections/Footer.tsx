import { COPY } from '../copy';
import { LINKS } from '../links';

export function Footer() {
  return (
    <footer className="foot">
      <p className="foot__line">{COPY.footer.line}</p>
      <a className="foot__link" href={LINKS.appendix}>
        {COPY.file.appendix}
      </a>
    </footer>
  );
}
