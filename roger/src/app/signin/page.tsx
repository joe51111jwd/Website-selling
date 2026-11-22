import type { Metadata } from "next";
import { HandoffStub } from "@/components/handoff-stub";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function Page() {
  return <HandoffStub route="/signin" what="Sign-in lives here." />;
}
