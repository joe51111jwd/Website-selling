import { useEffect, useRef, useState, type FormEvent } from "react";
import { COPY } from "../copy";
import { BOOK } from "../book";
import { LINKS } from "../links";
import { APPENDIX_URL, optinLive, sendOptin, validEmail } from "../optin";
import { track } from "../scroll";
import { openNotice } from "./NoticeDialog";
import { lenis } from "../lenis";

const B = COPY.book;
const J = COPY.join;

export function Book() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => (ref.current ? track(ref.current, "view") : undefined), []);
  return (
    <section className="book" id="book" ref={ref} aria-labelledby="book-title">
      <p className="kicker">{B.kicker}</p>
      <h2 className="never" id="book-title">
        <span>{B.never[0]}</span>
        <span>{B.never[1]}</span>
      </h2>
      <div className="book-row">
        <p className="book-deck">{B.deck}</p>
        <figure className="book-fig">
          <div className="aura aura-sm" aria-hidden="true" />
          <img src={BOOK.src} srcSet={BOOK.srcSet} sizes="(max-width: 760px) 64vw, 26vw" width={BOOK.w} height={BOOK.h} alt={COPY.hero.cover} loading="lazy" decoding="async" />
        </figure>
        <p className="book-body">{B.body}</p>
      </div>
      <p className="book-map">{B.map}</p>
      <div className="book-actions">
        {LINKS.preorder ? (
          <a className="btn btn-light" href={LINKS.preorder} rel="noopener">
            {B.preorder}
          </a>
        ) : (
          <span className="soon">{B.soon}</span>
        )}
      </div>
    </section>
  );
}

type State = { k: "idle" | "busy" | "sent" | "already" | "soon" | "bad" | "failed"; email?: string };

export function Join() {
  const [st, setSt] = useState<State>({ k: "idle" });
  const [email, setEmail] = useState("");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void optinLive();
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (st.k === "busy") return;
    if (!validEmail(email)) {
      setSt({ k: "bad" });
      input.current?.focus();
      return;
    }
    setSt({ k: "busy" });
    try {
      const r = await sendOptin(email, "home");
      setSt(r.emailed ? { k: "sent", email: email.trim() } : r.already ? { k: "already" } : { k: "soon" });
    } catch (err) {
      setSt({ k: (err as Error).message === "email" ? "bad" : "failed" });
    }
  };

  const msg =
    st.k === "bad"
      ? J.badEmail
      : st.k === "failed"
        ? J.sendFailed
        : st.k === "soon"
          ? J.soon
          : st.k === "sent"
            ? J.sentTo.replace("{email}", st.email ?? "")
            : st.k === "already"
              ? J.already
              : "";
  const done = st.k === "sent" || st.k === "already";

  return (
    <section className="join" id="join" aria-labelledby="join-title">
      <div className="aura aura-join" aria-hidden="true" />
      <h2 className="join-title" id="join-title">
        {J.title}
      </h2>
      <p className="join-offer">{J.offer}</p>
      <form className={`join-form is-${st.k}`} action="/api/optin" method="post" onSubmit={submit} noValidate>
        <label className="sr-only" htmlFor="join-email">
          {J.email}
        </label>
        <input
          ref={input}
          id="join-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={J.placeholder}
          value={email}
          disabled={done}
          aria-invalid={st.k === "bad" || undefined}
          aria-describedby="join-msg"
          onChange={(e) => {
            setEmail(e.target.value);
            if (st.k === "bad" || st.k === "failed" || st.k === "soon") setSt({ k: "idle" });
          }}
        />
        <input type="hidden" name="source" value="home" />
        <input className="hp" type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" />
        <button className="btn btn-red" type="submit" disabled={done} aria-busy={st.k === "busy" || undefined}>
          {st.k === "busy" ? J.sending : J.button}
        </button>
      </form>
      <p className={`join-msg is-${st.k}`} id="join-msg" role="status" aria-live="polite">
        {msg}
      </p>
      <figure className="join-quote">
        <blockquote>{J.quote}</blockquote>
        <figcaption>{J.sign}</figcaption>
      </figure>
      <p className="join-links">
        <a href={APPENDIX_URL}>{J.appendix}</a>
        <button type="button" onClick={(e) => openNotice(e.currentTarget)}>
          {J.notice}
        </button>
      </p>
    </section>
  );
}

export function Nav() {
  const [past, setPast] = useState(false);
  useEffect(() => {
    const on = () => setPast(window.scrollY > window.innerHeight * 0.7);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header className={`nav ${past ? "is-past" : ""}`}>
      <a className="brand" href="#top" aria-label={`${COPY.hero.title}, back to the top`}>
        <span className="mark" aria-hidden="true">
          <i className="up" />
          <i className="side" />
          <i className="down" />
        </span>
        <span className="brand-name">{COPY.hero.title}</span>
      </a>
      <a className="nav-join" href="#join" tabIndex={past ? 0 : -1} aria-hidden={!past || undefined}>
        {COPY.join.button}
      </a>
    </header>
  );
}

export function Footer() {
  const F = COPY.footer;
  const top = () => {
    if (lenis) lenis.scrollTo(0);
    else window.scrollTo({ top: 0 });
  };
  return (
    <footer className="foot">
      <p className="foot-line" aria-label={F.line}>
        {F.line.split(" ").map((w) => (
          <span key={w} aria-hidden="true">
            {w}
          </span>
        ))}
      </p>
      <div className="foot-bar">
        <span>
          © {new Date().getFullYear()} {F.owner}
        </span>
        <a href={APPENDIX_URL}>{J.appendix}</a>
        <button type="button" onClick={(e) => openNotice(e.currentTarget)}>
          {J.notice}
        </button>
        <button type="button" onClick={top}>
          {F.top}
        </button>
      </div>
    </footer>
  );
}
