import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, Zap, FileText,
  MessageSquare, Search, ListChecks, Edit3, Sparkles,
  Check, X, Star, Shield, ChevronDown
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const Home = () => {
  const { token } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
    <div className="flex flex-col items-center bg-[#FFFAF3]">
      
      {/* Sticky Header */}
      <Navbar />

      {/* 1. Hero Section */}
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

      {/* 2. Features Section */}
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

      {/* 3. How It Works Section */}
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

      {/* 4. Pricing Section */}
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
                <h3 className="text-2xl font-bold text-slate-800 mb-4">Free</h3>
                <div className="flex items-baseline justify-center gap-1 mb-6">
                  <span className="text-5xl font-extrabold text-slate-800">$0</span>
                  <span className="text-slate-500 font-medium">/m</span>
                </div>
                <ul className="space-y-3 mb-8 text-left w-full max-w-[260px] flex-1">
                  {[
                    { text: "3 AI Blogs per month", included: true },
                    { text: "GPT model", included: true },
                    { text: "Basic web research", included: true },
                    { text: "Claude access", included: false },
                    { text: "Custom Image Generation", included: false },
                    { text: "Priority Support", included: false },
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
                  <h3 className="text-2xl font-bold text-[#8b3a1a] mb-4">Premium</h3>
                  <div className="flex items-baseline justify-center gap-1 mb-6">
                    <span className="text-5xl font-extrabold text-[#8b3a1a]">$5</span>
                    <span className="text-slate-500 font-medium">/m</span>
                  </div>
                  <ul className="space-y-3 mb-8 text-left w-full max-w-[260px] flex-1">
                    {[
                      { text: "Unlimited AI Blogs", included: true },
                      { text: "GPT model", included: true },
                      { text: "Deep web research", included: true },
                      { text: "Claude access", included: true },
                      { text: "Custom Image Generation", included: true },
                      { text: "Priority Support", included: true },
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

      {/* 5. FAQ Section */}
      <section id="faq" className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 mb-10">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tighter text-gray-900 mb-12 text-center">Frequently Asked Questions</h2>
        <div className="space-y-1">
          {[
            { 
              q: "What makes BlogFusion different from standard ChatGPT?", 
              a: "BlogFusion is designed specifically for technical blogs. Instead of just spitting out text, it uses autonomous agents to research live information, generate a verified structural outline, and then draft the content step-by-step with real citations." 
            },
            { 
              q: "How does the Live Streaming Drafting work?", 
              a: "Once you approve an outline, you can watch our agent write your blog in real-time. You'll see its thought process, the sources it's pulling from, and how it formats the markdown live on your screen." 
            },
            { 
              q: "Can I export my blogs to WordPress or Hashnode?", 
              a: "Absolutely! BlogFusion generates clean, standard Markdown (.md) files complete with frontmatter and placeholder images. You can export these files directly or copy-paste the Markdown into any modern CMS like Hashnode, Dev.to, or WordPress." 
            },
            { 
              q: "Does BlogFusion generate diagrams automatically?", 
              a: "Yes. Whenever explaining complex technical architecture or workflows, the AI will automatically generate Mermaid.js diagrams directly inside your Markdown files." 
            },
            { 
              q: "Can I use the generated content commercially?", 
              a: "Yes, you own 100% of the rights to the content generated using BlogFusion. You are free to publish, monetize, or distribute it anywhere." 
            }
          ].map((faq, i) => (
            <motion.div 
              key={i} 
              className={`bg-white  shadow-sm border overflow-hidden transition-all duration-300 ${openFaq === i ? 'border-orange-200' : 'border-orange-50 hover:border-orange-100 hover:shadow-md'}`}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <button 
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full px-6 py-3 flex items-center justify-between text-left focus:outline-none"
              >
                <h3 className={`text-base font-semibold transition-colors duration-300 ${openFaq === i ? 'text-[#FF4500]' : 'text-gray-900'}`}>
                  {faq.q}
                </h3>
                <motion.div 
                  animate={{ rotate: openFaq === i ? 180 : 0 }} 
                  transition={{ duration: 0.3 }}
                  className={`flex-shrink-0 ml-4 p-1 rounded-full ${openFaq === i ? 'bg-orange-100 text-[#FF4500]' : 'bg-gray-50 text-gray-400'}`}
                >
                  <ChevronDown className="w-4 h-4 cursor-pointer" />
                </motion.div>
              </button>
              
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="px-6 pb-5 text-sm text-gray-600 font-light leading-relaxed border-t border-orange-50 mt-1 pt-3">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 6. Footer */}
      <Footer />

    </div>
  );
};
