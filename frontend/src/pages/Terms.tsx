import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const Terms = () => {
  return (
    <div className="flex flex-col min-h-screen bg-[#FFFAF3] relative overflow-hidden">
      {/* Background Gradient */}
      <div 
        className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.85] z-0"
        style={{ backgroundImage: 'radial-gradient(292.12% 100% at 50% 0%, #FFFAF3 0%, #FFF8F1 21.63%, #FFE4C9 45.15%, #FFE9C9 67.31%,#F9F7F5 100%)' }}
      />
      <div className="relative z-10 flex flex-col flex-grow">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-32 w-full flex-grow">
          <h1 className="text-4xl font-bold mb-6 text-gray-900">Terms of Service</h1>
        <div className="prose prose-orange max-w-none text-slate-600">
          <p className="text-sm font-medium mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">1. Acceptance of Terms</h2>
          <p className="mb-4">
            By accessing or using BlogFusion, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.
          </p>

          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">2. Description of Service</h2>
          <p className="mb-4">
            BlogFusion provides an AI-powered platform for generating and managing blog content. We do not guarantee that the generated content will be entirely accurate, complete, or error-free. It is your responsibility to review and verify all generated content before publication.
          </p>

          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">3. Content Ownership</h2>
          <p className="mb-4">
            You retain all rights and ownership to the final content generated through your account on BlogFusion. You are solely responsible for ensuring that your use of the generated content does not violate any third-party copyrights, trademarks, or intellectual property rights.
          </p>

          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">4. Acceptable Use</h2>
          <p className="mb-4">
            You agree not to use the service to generate content that is illegal, abusive, harassing, defamatory, or otherwise objectionable. We reserve the right to terminate accounts that violate these guidelines.
          </p>

          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">5. Limitation of Liability</h2>
          <p className="mb-4">
            In no event shall BlogFusion, nor its directors, employees, or partners, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
          </p>
        </div>
      </div>
      </div>
      <div className="relative z-10 w-full">
        <Footer />
      </div>
    </div>
  );
};
