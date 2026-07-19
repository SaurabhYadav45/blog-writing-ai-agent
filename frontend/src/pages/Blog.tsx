import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const Blog = () => {
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
          
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <span className="text-3xl">✨</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
            Our Blog is <br/> <span className="text-orange-500">Coming Soon</span>
          </h1>
          
          <p className="text-lg text-slate-600 mb-10 max-w-lg mx-auto leading-relaxed">
            We are working hard to bring you the best articles, tutorials, and insights on AI writing. Stay tuned!
          </p>

          <button className="bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-xl font-medium transition-all shadow-md shadow-slate-200">
            Notify Me
          </button>
        </div>

        </div>
      </div>
      <div className="relative z-10 w-full">
        <Footer />
      </div>
    </div>
  );
};
