import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Sparkles, BookOpen } from 'lucide-react';

export const Docs = () => {
  return (
    <div className="flex flex-col min-h-screen bg-[#FFFAF3] relative overflow-hidden">
      {/* Background Gradient */}
      <div 
        className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.85] z-0"
        style={{ backgroundImage: 'radial-gradient(292.12% 100% at 50% 0%, #FFFAF3 0%, #FFF8F1 21.63%, #FFE4C9 45.15%, #FFE9C9 67.31%,#F9F7F5 100%)' }}
      />
      <div className="relative z-10 flex flex-col flex-grow">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-32 w-full flex-grow flex items-center justify-center">
        
        <div className="bg-white p-10 md:p-16 rounded-[32px] shadow-sm border border-slate-100 text-center relative overflow-hidden w-full max-w-2xl">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-400 to-orange-500"></div>
          
          <div className="w-20 h-20 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-inner">
            <BookOpen className="w-10 h-10 text-orange-500" />
          </div>

          <h1 className="text-4xl font-bold mb-4 text-gray-900 tracking-tight">Documentation</h1>
          <p className="text-slate-500 text-lg mb-8 max-w-md mx-auto">
            We are working hard to bring you comprehensive documentation and developer guides. 
          </p>

          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-orange-100 text-orange-600 font-bold text-sm">
            <Sparkles className="w-4 h-4" />
            <span>Coming Soon</span>
          </div>

        </div>
        </div>
      </div>
      <div className="relative z-10 w-full">
        <Footer />
      </div>
    </div>
  );
};
