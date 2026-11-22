import type { Metadata } from "next";
import { LegalPage } from "@/components/v3/legal-page";
import { terms } from "@/data/legal";

export const metadata: Metadata = { title: "Terms" };

export default function Page() {
  return <LegalPage title="Terms" sections={terms} />;
}
