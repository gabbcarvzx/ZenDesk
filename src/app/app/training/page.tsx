import type { Metadata } from "next";
import { TrainingOverview } from "@/features/training/components/training-overview";
import { getTrainingPageData } from "@/features/training/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Treinamento",
};

export default async function TrainingPage() {
  const data = await getTrainingPageData();

  return <TrainingOverview data={data} />;
}
