import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const Cookies = () => {
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
          <h1 className="text-4xl font-bold mb-6 text-gray-900">Cookie Policy</h1>
          <div className="prose prose-orange max-w-none text-slate-600">
            <p className="text-sm font-medium mb-8">Last updated: {new Date().toLocaleDateString()}</p>
            
            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">1. What Are Cookies</h2>
            <p className="mb-4">
              Cookies are small text files that are placed on your computer or mobile device when you visit our website. They are widely used to make websites work more efficiently and provide information to the owners of the site.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">2. How We Use Cookies</h2>
            <p className="mb-4">
              We use cookies primarily for essential functioning of the BlogFusion app. Specifically, we use them to:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Keep you signed in to your account.</li>
              <li>Remember your preferences (like your selected AI model).</li>
              <li>Understand how you use our platform so we can improve the experience.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">3. Types of Cookies We Use</h2>
            <p className="mb-4">
              <strong>Essential Cookies:</strong> These are required for the operation of our service. They include cookies that enable you to log into secure areas.<br/>
              <strong>Analytical/Performance Cookies:</strong> These allow us to recognize and count the number of visitors and see how visitors move around our website.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">4. Managing Cookies</h2>
            <p className="mb-4">
              Most web browsers allow some control of most cookies through the browser settings. However, if you use your browser settings to block all cookies (including essential cookies) you may not be able to access all or parts of our site.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">5. Contact Us</h2>
            <p className="mb-4">
              If you have any questions about our use of cookies, please contact us at privacy@blogfusion.ai.
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
