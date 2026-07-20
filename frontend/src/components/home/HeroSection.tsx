import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export const HeroSection = () => {
  return (
    <section 
      className="w-full pt-32 pb-32 lg:pt-40 lg:pb-48 flex flex-col items-center text-center relative"
      style={{
          backgroundImage: `url(/bgimage.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'top center',
          backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center z-10 relative">
        
        {/* Left Sketch */}
        <motion.div
            className="absolute left-4 lg:left-8 top-[75%] w-64 h-64 lg:w-72 lg:h-72 hidden md:flex items-center justify-center opacity-70"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 0.7, x: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
        >
            <img src="/hero_left_sketch.png" alt="AI Robot Sketch" className="object-contain mix-blend-multiply filter contrast-125 brightness-105" />
        </motion.div>

        {/* Right Sketch */}
        <motion.div
            className="absolute right-4 lg:right-8 top-[75%] w-64 h-64 lg:w-72 lg:h-72 hidden md:flex items-center justify-center opacity-70"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 0.7, x: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
        >
            <img src="/hero_right_sketch.png" alt="Blog Checklist Sketch" className="object-contain mix-blend-multiply filter contrast-125 brightness-105" />
        </motion.div>

        <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-sm text-[#FF4500] font-bold text-sm mb-6 border border-orange-300 shadow-md"
      >
        <img src="/icon.png" alt="icon" className="w-4 h-4 rounded" />
        <span>The next generation of AI writing</span>
      </motion.div>
      
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
        className="text-4xl sm:text-5xl md:text-6xl pt-4 leading-tight font-bold tracking-tighter max-w-4xl mx-auto text-gray-900 mb-6"
      >
        Generate Production-Ready Blogs using{' '}
        <span className='text-orange-400'>Multi-Agent AI.</span>
      </motion.h1>

      <motion.p 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        className="text-lg md:text-xl text-gray-500 max-w-2xl mb-10 font-light leading-relaxed"
      >
        Create <strong className='font-bold text-gray-700'>high-quality</strong> blogs with <strong className='font-bold text-gray-700'>AI agents</strong> that <strong className='font-bold text-gray-700'>plan, research,</strong> write, generate visuals, and optimize <strong className='font-bold text-gray-700'>SEO</strong>.
      </motion.p>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-4"
      >
        <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
          <Link 
            to="/login" 
            className="px-8 py-4 flex items-center justify-center shadow-lg"
            style={{
              borderRadius: "12px",
              border: "1.26px solid #FFAA67",
              background: "linear-gradient(95deg, #FFD0A2 4.5%, #FEB070 13.38%, #FF994F 31.58%, #FF7835 57.33%, #FF661F 79.98%, #FF5000 96.85%)",
              boxShadow: "1.26px 3.78px 7.686px 0 rgba(0, 0, 0, 0.20)",
              color: "#fff",
              fontWeight: 600
            }}
          >
            Start Generating Free
          </Link>
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
          <a 
            href="#how-it-works" 
            className="px-8 py-4 bg-orange-100/50 hover:bg-[#E03E00] hover:text-white rounded-[12px] text-[#FF6D2E] font-semibold transition-colors duration-300 block"
          >
            See how it works
          </a>
        </motion.div>
      </motion.div>
      </div>
    </section>
  );
};
