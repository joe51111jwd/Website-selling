import "@fontsource-variable/archivo/wdth.css";
import "@fontsource-variable/schibsted-grotesk";
import "./founder.css";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { HERO, readAngle, track, type Bucket, type CalcResult, type Intent, type OpenSignup } from "./copy";
import { Hero } from "./Hero";
import { Proof } from "./Proof";
import { Leak } from "./Leak";
import { Crew } from "./Crew";
import { Features } from "./Features";
import { Offer } from "./Offer";
import { Founder } from "./Founder";
import { Faq } from "./Faq";
import { Replace } from "./Replace";
import { Footer } from "./Footer";
import { EMPTY, Signup, loadSaved, type SignupState } from "./Signup";
import logo from "./assets/logo.svg";

/** Is this element on screen? */
function useInView(id: string, rootMargin = "0px") {
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = document.getElementById(id);
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [id, rootMargin]);
  return inView;
}

type Pop = { intent: Intent; source: string; size?: Bucket; calc?: CalcResult; resumed: boolean; initial: SignupState };

// Direction B, "the plain-spoken founder page": PLAYBOOK §2.1 order, Andrew's voice, real photos,
// real screens, and a sentence index for all the features.
export default function FounderPage() {
  const [angle] = useState(readAngle);
  const [pop, setPop] = useState<Pop | null>(null);
  const [pill, setPill] = useState<SignupState | null>(null);
  const heroCta = useInView("f-hero-cta", "-56px 0px 0px 0px");
  const finalCta = useInView("f-final-cta");

  useEffect(() => {
    document.title = "SmartCrew · Software for dirt work contractors";
    const prev = document.body.style.background;
    document.body.style.background = "#FCFAF8";
    document.body.style.margin = "0";
    track("hero_visible_cta");
    return () => {
      document.body.style.background = prev;
    };
  }, []);

  const open: OpenSignup = useCallback(({ intent, source, size, calc }) => {
    const saved = loadSaved();
    const resumed = !!saved && saved.step > 1 && saved.step < 4 && !size;
    track("cta_click", { source, intent, size_prefilled: !!size });
    track("popup_open", { intent, source, resumed });
    setPop({ intent, source, size, calc, resumed, initial: resumed && saved ? saved : { ...EMPTY, size: saved?.size ?? null, company: saved?.company ?? "" } });
  }, []);

  const showBar = !heroCta && !finalCta && !pop;

  return (
    <div className={`p-founder${showBar ? " has-bar" : ""}`}>
      <header className="f-header">
        <div className="f-wrap f-header-in">
          <a href="#top" className="f-logo" aria-label="SmartCrew, back to top">
            <img src={logo} alt="SmartCrew" width={160} height={22} />
          </a>
          <button type="button" className={`f-btn f-btn-dark f-btn-sm f-header-cta${heroCta ? "" : " is-on"}`} tabIndex={heroCta ? -1 : 0} aria-hidden={heroCta} onClick={() => open({ intent: "trial", source: "header" })}>
            Get my free trial
          </button>
        </div>
      </header>

      <main>
        <Hero angle={angle} open={open} />
        <Proof />
        <Leak open={open} />
        <Crew />
        <Features initial={HERO[angle].feature} />
        <Offer open={open} />
        <Founder open={open} />
        <Faq />
        <Replace open={open} />
      </main>
      <Footer />

      {/* phone: sticky trial bar once the hero button has scrolled away */}
      <div className={`f-bar${showBar ? " is-on" : ""}`} aria-hidden={!showBar}>
        <div className="f-bar-text">
          <b>Founding Member trial</b>
          <span>Starts with a call with Andrew</span>
        </div>
        <button type="button" className="f-btn f-btn-dark" tabIndex={showBar ? 0 : -1} onClick={() => open({ intent: "trial", source: "sticky" })}>
          Get my free trial
        </button>
      </div>

      <AnimatePresence>
        {pill && !pop && (
          <motion.button
            type="button"
            className="f-pill"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => open({ intent: "trial", source: "pill" })}
          >
            Finish claiming your trial{pill.company ? ` for ${pill.company}` : ""}
          </motion.button>
        )}
      </AnimatePresence>

      {pop && (
        <Signup
          key={`${pop.source}-${pop.size ?? ""}`}
          intent={pop.intent}
          source={pop.source}
          presetSize={pop.size}
          calc={pop.calc}
          resumed={pop.resumed}
          initial={pop.initial}
          onClose={(st) => {
            setPop(null);
            setPill(st.step < 4 && (st.size || st.company) ? st : null);
          }}
        />
      )}
    </div>
  );
}
