import type { Metadata } from "next";
import { HandoffStub } from "@/components/handoff-stub";

export const metadata: Metadata = { title: "Get started", robots: { index: false } };

export default function Page() {
  return <HandoffStub route="/getstarted" what="The startup page lives here." />;
}
