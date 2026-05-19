import { HeroSection } from "@/features/marketing/components/hero-section";
import { OperationsSection } from "@/features/marketing/components/operations-section";
import { ProofSection } from "@/features/marketing/components/proof-section";
import { PricingPreview } from "@/features/marketing/components/pricing-preview";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ProofSection />
      <OperationsSection />
      <PricingPreview />
    </>
  );
}
