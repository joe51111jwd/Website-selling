import type { Metadata } from "next";
import { LegalPage } from "@/components/v3/legal-page";
import { privacy } from "@/data/legal";

export const metadata: Metadata = { title: "Privacy" };

export default function Page() {
  return <LegalPage title="Privacy" sections={privacy} />;
}
