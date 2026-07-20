import { motion } from 'framer-motion';
import { Bot, Zap, FileText, Search } from 'lucide-react';

export const FeaturesSection = () => {
  return (
    <section 
      id="features" 
      className="w-full py-16 sm:py-24"
      style={{
        backgroundImage: 'radial-gradient(292.12% 100% at 50% 0%,#ffffff 0%, #F9F7F5 10%, #FFF8F1 21.63%, #FFE4C9 45.15%, #FFE9C9 67.31%,#FFFAF3 100%)'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.span
            className="text-sm font-semibold text-gray-500 tracking-widest uppercase"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            CORE FEATURES
          </motion.span>
          <motion.h2
            className="text-3xl md:text-5xl font-bold tracking-tight mt-3 text-gray-900 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true, amount: 0.5 }}
          >
            Supercharge your <span className="text-[#FF4500]">content engine</span>
          </motion.h2>
        </motion.div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {[
            { icon: <Bot className="w-8 h-8 text-[#FF4500]"/>, title: <><strong className='font-bold'>AI-Powered Research</strong><br/><span className="text-sm font-light text-gray-500 mt-2 block">Automatically gathers reliable information from the web to create accurate, up-to-date, and trustworthy blog content.</span></> },
            { icon: <Zap className="w-8 h-8 text-[#FF4500]"/>, title: <><strong className='font-bold'>Live Preview</strong><br/><span className="text-sm font-light text-gray-500 mt-2 block">Watch your blog come to life in real-time. See the agent's thought process and citations as it types.</span></> },
            { icon: <FileText className="w-8 h-8 text-[#FF4500]"/>, title: <><strong className='font-bold'>Markdown & Diagrams</strong><br/><span className="text-sm font-light text-gray-500 mt-2 block">Exports clean Markdown complete with generated Mermaid diagrams and AI placeholder images.</span></> },
            { icon: <Search className="w-8 h-8 text-[#FF4500]"/>, title: <><strong className='font-bold'>SEO Optimized</strong><br/><span className="text-sm font-light text-gray-500 mt-2 block">Automatically structures headers, keywords, and meta descriptions to ensure your content ranks.</span></> }
          ].map((feature, i) => (
            <motion.div 
              key={i} 
              className="bg-white p-6 lg:p-8 border border-transparent rounded-[32px] hover:border-[#FF4500] hover:shadow-xl transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <div className="w-fit mb-6">
                {feature.icon}
              </div>
              <h3 className="text-gray-800 text-lg font-light leading-snug">
                {feature.title}
              </h3>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
