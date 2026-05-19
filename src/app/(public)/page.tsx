import { BenefitsSection } from "@/features/marketing/components/benefits-section";
import { FaqSection } from "@/features/marketing/components/faq-section";
import { FinalCtaSection } from "@/features/marketing/components/final-cta-section";
import { HeroSection } from "@/features/marketing/components/hero-section";
import { HowItWorksSection } from "@/features/marketing/components/how-it-works-section";
import { NichesSection } from "@/features/marketing/components/niches-section";
import { ProblemSolutionSection } from "@/features/marketing/components/problem-solution-section";
import { PricingPreview } from "@/features/marketing/components/pricing-preview";
import { ProductMockupsSection } from "@/features/marketing/components/product-mockups-section";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ProblemSolutionSection />
      <BenefitsSection />
      <HowItWorksSection />
      <NichesSection />
      <ProductMockupsSection />
      <PricingPreview />
      <FaqSection />
      <FinalCtaSection />
    </>
  );
}
