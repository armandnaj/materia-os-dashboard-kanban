import type { Metadata } from "next";
import { CasesApp } from "@/components/cases-app";

export const metadata: Metadata = {
  title: "МИСТЕРИЯ CASES — AIAIAI lab",
  description: "Библиотека проверенных AI-кейсов, гипотез и направлений Материи.",
};

export default function CasesPage() {
  return <CasesApp />;
}
