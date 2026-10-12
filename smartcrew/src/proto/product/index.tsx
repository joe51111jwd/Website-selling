import "@fontsource-variable/funnel-display";
import "@fontsource-variable/funnel-sans";
import "./product.css";
import "./moments.css";
import "./signup.css";

import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { ANGLES, readAngle, type OpenSignup } from "./data";
import { Crew, Faq, Features, FinishPill, Footer, Founder, Header, Hero, Leak, Offer, Proof, StickyBar, useInView } from "./Sections";
import Replace from "./Replace";
import Signup, { type SignupState } from "./Signup";
import { track } from "./track";

// Direction C: "Show the product, field to office". The real app is the hero; the feature
// system pairs what the crew does in the crew app with what the office sees.
// http://127.0.0.1:5310/?proto=product (&angle=timecards|payroll|overbudget|replace)

const Specimen = lazy(() => import("./Specimen"));
const RenderPhone = lazy(() => import("./RenderPhone"));

export default function ProductProto() {
  const q = new URLSearchParams(location.search);
  if (q.get("render") === "iphone")
    return (
      <Suspense fallback={null}>
        <RenderPhone />
      </Suspense>
    );
  if (q.has("specimen"))
    return (
      <Suspense fallback={null}>
        <Specimen />
      </Suspense>
    );
  return <Page />;
}

function Page() {
  const [angle] = useState(readAngle);
  const [signup, setSignup] = useState<SignupState>({ open: false, intent: "trial", source: "" });
  const [closerCta, setCloserCta] = useState(false);
  const [pill, setPill] = useState(false);
  const heroCta = useRef<HTMLButtonElement>(null);
  const heroVisible = useInView(heroCta);

  useEffect(() => {
    document.title = "SmartCrew · Software for dirt work contractors";
    document.documentElement.classList.add("p-product-root");
    return () => document.documentElement.classList.remove("p-product-root");
  }, []);

  const openSignup: OpenSignup = useCallback(({ intent, source, size, calc }) => {
    track("cta_click", { source, intent, size_prefilled: !!size });
    setPill(false);
    setSignup({ open: true, intent, source, size, calc });
  }, []);

  const close = useCallback(() => {
    setSignup((s) => ({ ...s, open: false }));
    try {
      const raw = localStorage.getItem("sc_signup_v1");
      if (raw && JSON.parse(raw).step > 0) setPill(true);
    } catch {
      /* ignore */
    }
  }, []);

  const onCloser = useCallback((v: boolean) => setCloserCta(v), []);

  return (
    <div className="p-product">
      <a className="pp-skip" href="#what-it-does">
        Skip to what SmartCrew does
      </a>
      <Header showCta={!heroVisible} openSignup={openSignup} />
      <main>
        <Hero angle={angle} openSignup={openSignup} ctaRef={heroCta} />
        <Proof />
        <Leak openSignup={openSignup} />
        <Crew />
        <Features initial={ANGLES[angle].moment} />
        <Offer openSignup={openSignup} />
        <Founder openSignup={openSignup} />
        <Faq />
        <Replace openSignup={openSignup} onCtaVisible={onCloser} />
      </main>
      <Footer />
      <StickyBar show={!heroVisible && !closerCta && !signup.open} openSignup={openSignup} />
      <FinishPill show={pill && !signup.open} onOpen={() => openSignup({ intent: signup.intent, source: "pill" })} />
      <Signup state={signup} onClose={close} />
    </div>
  );
}
