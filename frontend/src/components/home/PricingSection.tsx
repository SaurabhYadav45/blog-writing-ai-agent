import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { Check, X, Star, Shield } from 'lucide-react';

export const PricingSection = () => {
  const { token } = useAuth();
  
  const blobConfigs = useMemo(() => {
    return [...Array(6)].map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      x: [0, Math.random() * 100 - 50],
      y: [0, Math.random() * 100 - 50],
      duration: Math.random() * 10 + 10,
    }));
  }, []);

  return (
    <section id="pricing" className="w-full py-16 sm:py-24 relative overflow-hidden">
      {/* Background animated elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {blobConfigs.map((config, i) => (
          <motion.div
            key={i}
            className="absolute w-64 h-64 rounded-full bg-gradient-to-r from-orange-100/30 to-orange-200/20 blur-3xl"
            style={{
              top: config.top,
              left: config.left,
            }}
            animate={{
              x: config.x,
              y: config.y,
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: config.duration,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      <div className="container mx-auto max-w-6xl px-4 relative z-10">
        <motion.div 
          className="text-center mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter mb-4">
            Choose Your <span className='text-orange-400'>Plan</span>
          </h2>
          <p className="text-gray-500 text-lg sm:text-lg max-w-2xl mx-auto font-light">
            Start building your <strong className="font-bold text-gray-700">technical blogs</strong> today. Upgrade anytime as your needs grow.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 max-w-[850px] mx-auto mt-12">
          {/* Free Tier */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            viewport={{ once: true }}
            className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden relative flex flex-col text-center transition-all duration-300 hover:shadow-md"
          >
            <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-[#f5eeff] to-white pointer-events-none"></div>
            <div className="p-8 relative z-10 flex-1 flex flex-col items-center">
              <h3 className="text-2xl font-bold text-slate-800 mb-4">Free Starter</h3>
              <div className="flex items-baseline justify-center gap-1 mb-6">
                <span className="text-5xl font-extrabold text-slate-800">₹0</span>
                <span className="text-slate-500 font-medium">/mo</span>
              </div>
              <ul className="space-y-3 mb-8 text-left w-full max-w-[260px] flex-1">
                {[
                  { text: "1 Generation Credit", included: true },
                  { text: "Basic LLM Models", included: true },
                  { text: "Standard Generation Speed", included: true },
                  { text: "Editor and Preview Tab", included: true },
                  { text: "Logs and Metrics tabs", included: true },
                  { text: "SEO optimization", included: true },
                  { text: "Premium LLM Models", included: false },
                ].map((item, i) => (
                  <li key={i} className={`flex items-center gap-3 text-[15px] ${item.included ? 'text-slate-600' : 'text-slate-400 opacity-60'}`}>
                    {item.included ? <Check className="w-5 h-5 text-emerald-500 shrink-0" /> : <X className="w-5 h-5 text-red-400 shrink-0" />}
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
              <Link to="/login" className="w-full py-3.5 rounded-full text-slate-800 font-bold shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 bg-gradient-to-b from-white to-[#e9ddff] border border-[#f0e6ff]">
                Get Started Free
              </Link>
            </div>
          </motion.div>

          {/* Pro Tier */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            viewport={{ once: true }}
            className="relative mt-8 lg:mt-0"
          >
            {/* Badge positioned outside the card bounds */}
            <div className="absolute -top-[16px] left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-200 to-orange-100 text-[#a0451e] text-sm font-bold px-5 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 z-20 border border-orange-200">
              <Star className="w-4 h-4 fill-current" /> Most Popular
            </div>
            
            <div className="bg-white rounded-[24px] shadow-xl shadow-orange-500/10 border border-orange-100 overflow-hidden relative flex flex-col text-center h-full transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/15">
              <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-[#ffeedb] to-white pointer-events-none"></div>
              <div className="p-8 relative z-10 flex-1 flex flex-col items-center">
                <h3 className="text-2xl font-bold text-[#8b3a1a] mb-4">Pro Professional</h3>
                <div className="flex items-baseline justify-center gap-1 mb-6">
                  <span className="text-5xl font-extrabold text-[#8b3a1a]">₹199</span>
                  <span className="text-slate-500 font-medium">/mo</span>
                </div>
                <ul className="space-y-3 mb-8 text-left w-full max-w-[260px] flex-1">
                  {[
                    { text: "20 Generation Credits", included: true },
                    { text: "Blog Section Regeneration", included: true },
                    { text: "Premium LLM Models", included: true },
                    { text: "High-Resolution Image Models", included: true },
                    { text: "Auto Publish Feautre", included: true },
                    { text: "Premium Support", included: true },
                    { text: "Everything in Free Tier", included: true },
                  ].map((item, i) => (
                    <li key={i} className={`flex items-center gap-3 text-[15px] ${item.included ? 'text-slate-700' : 'text-slate-400 opacity-60'}`}>
                      {item.included ? <Check className="w-5 h-5 text-emerald-500 shrink-0" /> : <X className="w-5 h-5 text-red-400 shrink-0" />}
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
                <Link 
                  to={token ? "/settings?upgrade=true" : "/login"} 
                  className="w-full py-3.5 rounded-full text-white font-bold shadow-[0_4px_14px_rgba(249,115,22,0.3)] hover:shadow-[0_6px_20px_rgba(249,115,22,0.4)] transition-all hover:-translate-y-0.5 bg-gradient-to-r from-orange-400 to-orange-500 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Shield className="w-4 h-4" /> Upgrade to Pro
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
