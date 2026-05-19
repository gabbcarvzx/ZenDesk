import type { Metadata } from "next";
import { OnboardingWizard } from "@/features/training/components/onboarding-wizard";
import { getOnboardingPageData } from "@/features/training/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Onboarding",
};

export default async function OnboardingPage() {
  const data = await getOnboardingPageData();

  return (
    <OnboardingWizard
      canManage={data.canManage}
      checklist={data.checklist}
      initialProgress={data.onboarding}
      loadError={data.loadError}
      organizationName={data.organizationName}
    />
  );
}
