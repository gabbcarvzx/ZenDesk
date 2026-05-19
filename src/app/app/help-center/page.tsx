import type { Metadata } from "next";
import { HelpCenterClient } from "@/features/training/components/help-center-client";

export const metadata: Metadata = {
  title: "Central de ajuda",
};

export default function HelpCenterPage() {
  return <HelpCenterClient />;
}
