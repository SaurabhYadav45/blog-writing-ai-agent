import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { HeroSection } from '../components/home/HeroSection';
import { FeaturesSection } from '../components/home/FeaturesSection';
import { HowItWorksSection } from '../components/home/HowItWorksSection';
import { PricingSection } from '../components/home/PricingSection';
import { FaqSection } from '../components/home/FaqSection';

export const Home = () => {
  return (
    <div className="flex flex-col items-center bg-[#FFFAF3]">
      {/* Sticky Header */}
      <Navbar />

      {/* 1. Hero Section */}
      <HeroSection />

      {/* 2. Features Section */}
      <FeaturesSection />

      {/* 3. How It Works Section */}
      <HowItWorksSection />

      {/* 4. Pricing Section */}
      <PricingSection />

      {/* 5. FAQ Section */}
      <FaqSection />

      {/* 6. Footer */}
      <Footer />
    </div>
  );
};
