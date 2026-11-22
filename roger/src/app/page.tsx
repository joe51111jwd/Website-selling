import { ClosingBand, PriceChapter, QuestionsChapter, Testimonials } from "@/components/v3/blocks";
import { Compound } from "@/components/v3/compound";
import { ControlBlock } from "@/components/v3/control-block";
import { Hero } from "@/components/v3/hero";
import { How } from "@/components/v3/how";
import { Letter } from "@/components/v3/letter";
import { Monday } from "@/components/v3/monday";
import { Statement } from "@/components/v3/statement";
import { home } from "@/data/v3-copy";

export default function HomePage() {
  return (
    <>
      <Hero headline={home.headline} sub={home.sub} path="re" secondary={{ href: "#how", label: "See how it works" }} loop={home.loop} />
      <Statement lines={home.problem} />
      <How title={home.howTitle} steps={home.steps} scenes={["setup", "zack", "cora", "paste"]} />
      <Monday title={home.mondayTitle} line={home.mondayLine} />
      <Compound title={home.compoundsTitle} line={home.compounds} />
      <Testimonials audience="re" />
      <ControlBlock />
      <section className="chapter ground" data-tone="ground" style={{ paddingTop: 0 }}>
        <div className="wrap"><Letter lead={home.letterLead} more /></div>
      </section>
      <PriceChapter path="re" />
      <QuestionsChapter audience="home" />
      <ClosingBand line={home.closing} path="re" />
    </>
  );
}
