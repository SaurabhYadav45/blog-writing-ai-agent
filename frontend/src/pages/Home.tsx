import { Link } from 'react-router-dom';
import { MessageSquarePlus } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { HeroSection } from '../components/home/HeroSection';
import { FeaturesSection } from '../components/home/FeaturesSection';
import { HowItWorksSection } from '../components/home/HowItWorksSection';
import { PricingSection } from '../components/home/PricingSection';
import { FaqSection } from '../components/home/FaqSection';

export const Home = () => {
  return (
    <div className="flex flex-col items-center bg-[#FFFAF3] relative">
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

      {/* Floating Feedback Button */}
      <Link
        to="/feedback"
        className="fixed bottom-6 right-6 p-4 bg-orange-500 text-white rounded-full shadow-xl hover:bg-orange-600 hover:scale-105 transition-all duration-300 z-50 group flex items-center justify-center cursor-pointer"
        aria-label="Feedback and Support"
      >
        <MessageSquarePlus className="w-6 h-6" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out font-semibold text-sm group-hover:ml-2">
          Help / Feedback
        </span>
      </Link>
    </div>
  );
};
