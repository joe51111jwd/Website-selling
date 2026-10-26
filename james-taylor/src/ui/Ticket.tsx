import { motion } from "motion/react";
import { TICKETS } from "../content";
import "./Ticket.css";

/** A kitchen order ticket from his career (by ticket number), stamped once it's on screen. */
export function Ticket({ no, small = false }: { no: string; small?: boolean }) {
  const i = TICKETS.findIndex((t) => t.no === no);
  const t = TICKETS[i];
  if (!t) return null;
  const open = t.stamp === "Open";
  return (
    <article className={`ticket ${small ? "ticket-sm" : ""}`}>
      <header>
        <span>Ticket #{t.no}</span>
        <span>
          {String(i + 1).padStart(2, "0")}/{String(TICKETS.length).padStart(2, "0")}
        </span>
      </header>
      <div className="ticket-rule" />
      <p className="ticket-when">{t.when}</p>
      <h3 className="ticket-where">{t.where}</h3>
      {!small && <p className="ticket-what">{t.what}</p>}
      <footer>
        <span>Chef: J. Taylor</span>
        <span>{open ? "Now open" : "Ordered"}</span>
      </footer>
      <motion.span
        className={`ticket-stamp ${open ? "open" : ""}`}
        aria-hidden
        initial={{ opacity: 0, scale: 2.4, rotate: -14 }}
        whileInView={{ opacity: 0.88, scale: 1, rotate: -14 }}
        viewport={{ once: true, amount: 0.8 }}
        transition={{ type: "spring", stiffness: 520, damping: 18, delay: 0.55 }}
      >
        {open ? "Open" : "Fired"}
      </motion.span>
    </article>
  );
}
