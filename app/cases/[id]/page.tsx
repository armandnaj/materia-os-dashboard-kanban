import type { Metadata } from "next";
import { CaseDetailApp } from "@/components/case-detail-app";

export const metadata: Metadata = {
  title: "Кейс — МИСТЕРИЯ CASES",
  description: "Проектная страница AI-кейса Материи.",
};

export default function CaseDetailPage() {
  return <CaseDetailApp />;
}
