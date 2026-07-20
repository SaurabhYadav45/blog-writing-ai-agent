import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export const FaqSection = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
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
  );
};
