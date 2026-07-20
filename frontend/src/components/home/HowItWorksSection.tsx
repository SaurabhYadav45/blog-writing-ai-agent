import { motion } from 'framer-motion';
import { MessageSquare, Search, ListChecks, Edit3, Sparkles } from 'lucide-react';

export const HowItWorksSection = () => {
  return (
    <section 
      id="how-it-works" 
      className="w-full py-16 sm:py-24 relative overflow-hidden"
    >
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center z-0"
        style={{ backgroundImage: 'radial-gradient(292.12% 100% at 50% 0%, #FFFAF3 0%, #FFF8F1 21.63%, #FFE4C9 45.15%, #FFE9C9 67.31%,#F9F7F5 100%)' }}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-gray-900 sm:pb-8">How it works</h2>
        </motion.div>
        
        <div className="flex flex-col items-center max-w-5xl mx-auto relative">
          
          {/* Desktop Connective Lines */}
          <div className="hidden md:block absolute top-[44px] left-[15%] right-[15%] h-[2px] border-t-2 border-dashed border-gray-400 z-0"></div>
          <div className="hidden md:block absolute top-[284px] left-[35%] right-[35%] h-[2px] border-t-2 border-dashed border-gray-400 z-0"></div>

          {/* Top Row: 3 Steps */}
          <div className="grid md:grid-cols-3 gap-8 w-full mb-16 relative z-10">
            {[
              { num: 1, icon: <MessageSquare className="w-10 h-10"/>, title: "Provide Topic", desc: 'Tell the AI "what you want to write about", audience, and tone.' },
              { num: 2, icon: <Search className="w-10 h-10"/>, title: "AI Researches", desc: 'The agent autonomously scours the web for "live trends and facts".' },
              { num: 3, icon: <ListChecks className="w-10 h-10"/>, title: "Review Plan", desc: 'Approve or edit the highly detailed "structural outline".' }
            ].map((step, i) => (
              <motion.div 
                key={step.num}
                className="flex flex-col items-center text-center relative z-10"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -2 }}
              >
                <div 
                  className="w-[88px] h-[88px] rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, #FF9B73 0%, #FF7B47 100%)',
                    boxShadow: '0 4px 16px rgba(255, 123, 71, 0.3)'
                  }}
                >
                  {step.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{step.num}. {step.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed max-w-xs">
                  {step.desc.split('"').map((part, index) => 
                    index % 2 === 1 ? <span key={index} className="font-medium text-gray-800">"{part}"</span> : <span key={index}>{part}</span>
                  )}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Bottom Row: 2 Steps */}
          <div className="grid md:grid-cols-2 gap-8 w-full max-w-2xl relative z-10">
            {[
              { num: 4, icon: <Edit3 className="w-10 h-10"/>, title: "AI Drafts Live", desc: 'Watch the AI write the blog in "real-time", embedding citations.' },
              { num: 5, icon: <Sparkles className="w-10 h-10"/>, title: "Refine & Publish", desc: 'Regenerate sections until perfect, then "export to Markdown".' }
            ].map((step, i) => (
              <motion.div 
                key={step.num}
                className="flex flex-col items-center text-center relative z-10"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + (i * 0.1) }}
                viewport={{ once: true }}
                whileHover={{ y: -2 }}
              >
                <div 
                  className="w-[88px] h-[88px] rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, #FF9B73 0%, #FF7B47 100%)',
                    boxShadow: '0 4px 16px rgba(255, 123, 71, 0.3)'
                  }}
                >
                  {step.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{step.num}. {step.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed max-w-xs">
                  {step.desc.split('"').map((part, index) => 
                    index % 2 === 1 ? <span key={index} className="font-medium text-gray-800">"{part}"</span> : <span key={index}>{part}</span>
                  )}
                </p>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};
