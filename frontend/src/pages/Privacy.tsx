import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const Privacy = () => {
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
          <h1 className="text-4xl font-bold mb-6 text-gray-900">Privacy Policy</h1>
        <div className="prose prose-orange max-w-none text-slate-600">
          <p className="text-sm font-medium mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">1. Information We Collect</h2>
          <p className="mb-4">
            We collect information that you provide directly to us, including when you create an account, update your profile, use our AI generation services, or communicate with us. This information may include your name, email address, password, payment information, and any content you submit for processing.
          </p>

          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">2. How We Use Your Information</h2>
          <p className="mb-4">
            We use the information we collect to operate, maintain, and provide the features and functionality of the Service. We also use your information to process payments, communicate with you, and monitor the usage of our Service to improve our AI generation pipelines.
          </p>

          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">3. Data Security and AI Models</h2>
          <p className="mb-4">
            Your input data and generated blogs are stored securely. We do not use your private generated content to train our foundational models without explicit opt-in consent. Data sent to third-party APIs (like OpenAI or Anthropic) is subject to their respective enterprise privacy policies which prohibit training on API data.
          </p>

          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">4. Your Rights</h2>
          <p className="mb-4">
            You have the right to access, update, or delete your personal information at any time through your account settings. When you delete your account, all associated blogs, connected accounts, and data are permanently removed from our active databases.
          </p>

          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">5. Contact Us</h2>
          <p className="mb-4">
            If you have any questions about this Privacy Policy, please contact us at privacy@blogfusion.ai.
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
