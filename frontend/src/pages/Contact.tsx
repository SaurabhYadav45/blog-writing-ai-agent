import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Mail, MessageSquare, MapPin, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

export const Contact = () => {
  const [formData, setFormData] = useState({ full_name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.email || !formData.message) return;
    
    setStatus('loading');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/support/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setStatus('success');
        setFormData({ full_name: '', email: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FFFAF3] relative overflow-hidden">
      {/* Background Gradient */}
      <div 
        className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.85] z-0"
        style={{ backgroundImage: 'radial-gradient(292.12% 100% at 50% 0%, #FFFAF3 0%, #FFF8F1 21.63%, #FFE4C9 45.15%, #FFE9C9 67.31%,#F9F7F5 100%)' }}
      />
      <div className="relative z-10 flex flex-col flex-grow">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-32 w-full flex-grow flex flex-col md:flex-row gap-16">
          
          <div className="flex-1">
          <h1 className="text-4xl font-bold mb-6 text-gray-900">Get in Touch</h1>
          <p className="text-slate-600 mb-10 text-lg">
            Have questions about BlogFusion? We're here to help. Reach out to our team and we'll get back to you as soon as possible.
          </p>

          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                <Mail className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">Email Us</h3>
                <p className="text-slate-500 mb-1">For general inquiries and support.</p>
                <a href="mailto:hello@blogfusion.ai" className="text-orange-500 font-medium hover:underline">hello@blogfusion.ai</a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                <MessageSquare className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">Live Chat</h3>
                <p className="text-slate-500 mb-1">Available for Pro users 24/7.</p>
                <span className="text-orange-500 font-medium cursor-pointer hover:underline">Open Support Widget</span>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                <MapPin className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">Office</h3>
                <p className="text-slate-500">123 AI Boulevard, Tech District<br />San Francisco, CA 94105</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Send a Message</h2>
          
          {status === 'success' ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex flex-col items-center text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
              <h3 className="text-lg font-bold text-green-900 mb-1">Message Sent!</h3>
              <p className="text-green-700">Thank you for reaching out. We will get back to you shortly.</p>
              <button onClick={() => setStatus('idle')} className="mt-6 px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors">
                Send another
              </button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all" 
                  placeholder="John Doe" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all" 
                  placeholder="john@company.com" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                <textarea 
                  rows={4} 
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all resize-none" 
                  placeholder="How can we help you?"
                ></textarea>
              </div>
              
              {status === 'error' && (
                <p className="text-red-500 text-sm font-medium">Something went wrong. Please try again later.</p>
              )}
              
              <button 
                disabled={status === 'loading'}
                className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold rounded-xl shadow-sm transition-colors mt-2"
              >
                {status === 'loading' ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>

        </div>
      </div>
      <div className="relative z-10 w-full">
        <Footer />
      </div>
    </div>
  );
};
