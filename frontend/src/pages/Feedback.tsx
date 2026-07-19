import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { MessageCircle, Bug, Heart, Zap, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

export const Feedback = () => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType || !formData.title || !formData.description) return;
    
    setStatus('loading');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/support/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedType,
          title: formData.title,
          description: formData.description
        }),
      });
      if (res.ok) {
        setStatus('success');
        setFormData({ title: '', description: '' });
        setSelectedType(null);
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
          
          {/* Left Column: Info */}
          <div className="flex-1">
          <h1 className="text-4xl font-bold mb-6 text-gray-900">We Value Your Feedback</h1>
          <p className="text-slate-600 mb-10 text-lg">
            Help us improve BlogFusion by letting us know what you think. What are we doing well? What can we do better? Your insights drive our next features.
          </p>

          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                <Heart className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">Community Driven</h3>
                <p className="text-slate-500 mb-1">We listen to our users. Over 60% of our recent features came directly from community suggestions.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                <Zap className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">Fast Response</h3>
                <p className="text-slate-500 mb-1">Our engineering team reviews all bug reports within 24 hours to ensure a seamless experience.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Form */}
        <div className="flex-1 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Submit Feedback</h2>
          
          {status === 'success' ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex flex-col items-center text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
              <h3 className="text-lg font-bold text-green-900 mb-1">Feedback Submitted!</h3>
              <p className="text-green-700">Thank you for helping us improve BlogFusion.</p>
              <button onClick={() => setStatus('idle')} className="mt-6 px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors">
                Submit another
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-3">What kind of feedback do you have? <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button 
                    onClick={() => setSelectedType('idea')}
                    className={`p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${selectedType === 'idea' ? 'border-orange-500 bg-orange-50' : 'border-slate-100 hover:border-slate-200'}`}
                  >
                    <div className={`p-2 rounded-lg ${selectedType === 'idea' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <MessageCircle size={18} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm text-gray-900">Idea</span>
                      <span className="text-xs text-slate-500">Feature request</span>
                    </div>
                  </button>

                  <button 
                    onClick={() => setSelectedType('bug')}
                    className={`p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${selectedType === 'bug' ? 'border-orange-500 bg-orange-50' : 'border-slate-100 hover:border-slate-200'}`}
                  >
                    <div className={`p-2 rounded-lg ${selectedType === 'bug' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <Bug size={18} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm text-gray-900">Bug</span>
                      <span className="text-xs text-slate-500">Report an issue</span>
                    </div>
                  </button>
                </div>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                  <input 
                    type="text" 
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all" 
                    placeholder="Brief summary" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea 
                    rows={4} 
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all resize-none" 
                    placeholder="Please provide as much detail as possible..."
                  ></textarea>
                </div>

                {status === 'error' && (
                  <p className="text-red-500 text-sm font-medium">Something went wrong. Please try again later.</p>
                )}

                <button 
                  disabled={status === 'loading' || !selectedType}
                  className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold rounded-xl shadow-sm transition-colors mt-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  {status === 'loading' ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </form>
            </>
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
