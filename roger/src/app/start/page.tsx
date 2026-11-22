import type { Metadata } from "next";
import { HandoffStub } from "@/components/handoff-stub";

export const metadata: Metadata = { title: "Start", robots: { index: false } };

export default function Page() {
  return <HandoffStub route="/start" what="Sign-up starts here." />;
}
