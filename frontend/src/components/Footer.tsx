import { Link } from 'react-router-dom';

const TwitterIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
  </svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const GithubIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </svg>
);

export const Footer = () => {
  return (
    <footer 
      className="w-full relative pt-16 pb-12 mt-auto border-t border-orange-100/50"
      style={{
          backgroundImage: `url(/Footer.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'bottom center',
          backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
          
          {/* Brand Column */}
          <div className="lg:col-span-2 flex flex-col">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <img src="/icon.png" alt="icon" className="w-8 h-8 rounded-lg shadow-sm object-cover" />
              <span className="font-extrabold text-2xl tracking-tight text-gray-900">
                BlogFusion
              </span>
            </Link>
            <p className="text-slate-500 font-light text-sm mb-8 max-w-xs sm:max-w-md lg:max-w-xs leading-relaxed">
              The next generation of AI writing. Create high-quality, production-ready technical blogs using autonomous AI agents that research, plan, and draft content live.
            </p>
            <h2 className="text-5xl sm:text-6xl font-bold text-slate-400/20 tracking-tight mt-auto hidden sm:block lg:block">
              BlogFusion
            </h2>
          </div>

          {/* Links Columns: 2 cols on mobile (Product & Resources top row, Legal bottom row), 3 cols in 1 single row on tab and desktop */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:col-span-3 gap-8 sm:gap-10 lg:gap-12">
            <div className="flex flex-col gap-4">
              <h3 className="font-bold text-slate-900 mb-2">Product</h3>
              <a href="/#features" className="text-sm text-slate-500 hover:text-[#FF4500] transition-colors">Features</a>
              <a href="/#how-it-works" className="text-sm text-slate-500 hover:text-[#FF4500] transition-colors">How it Works</a>
              <a href="/#pricing" className="text-sm text-slate-500 hover:text-[#FF4500] transition-colors">Pricing</a>
              <Link to="/login" className="text-sm text-slate-500 hover:text-[#FF4500] transition-colors">Get Started</Link>
            </div>

            <div className="flex flex-col gap-4">
              <h3 className="font-bold text-slate-900 mb-2">Resources</h3>
              <Link to="/contact" className="text-sm text-slate-500 hover:text-[#FF4500] transition-colors">Contact Support</Link>
              <Link to="/feedback" className="text-sm text-slate-500 hover:text-[#FF4500] transition-colors">Leave Feedback</Link>
              <Link to="/docs" className="text-sm text-slate-500 hover:text-[#FF4500] transition-colors">Documentation</Link>
              <Link to="/blog" className="text-sm text-slate-500 hover:text-[#FF4500] transition-colors">Blog</Link>
            </div>

            <div className="flex flex-col gap-4 col-span-2 md:col-span-1">
              <h3 className="font-bold text-slate-900 mb-2">Legal</h3>
              <Link to="/privacy" className="text-sm text-slate-500 hover:text-[#FF4500] transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="text-sm text-slate-500 hover:text-[#FF4500] transition-colors">Terms of Service</Link>
              <Link to="/cookies" className="text-sm text-slate-500 hover:text-[#FF4500] transition-colors">Cookie Policy</Link>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-8 border-t border-slate-200/60">
          <p className="text-xs text-slate-500 font-medium mb-4 sm:mb-0">
            Copyright © {new Date().getFullYear()} BlogFusion. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
             <a href="https://twitter.com" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-slate-500 hover:text-[#1DA1F2] transition-colors text-sm font-medium">
               <TwitterIcon className="w-[18px] h-[18px] text-[#1DA1F2]" />
               Twitter
             </a>
             <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-slate-500 hover:text-[#0A66C2] transition-colors text-sm font-medium">
               <LinkedinIcon className="w-[18px] h-[18px] text-[#0A66C2]" />
               LinkedIn
             </a>
             <a href="https://github.com" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-slate-500 hover:text-[#333] transition-colors text-sm font-medium">
               <GithubIcon className="w-[18px] h-[18px] text-[#333]" />
               GitHub
             </a>
          </div>
        </div>

      </div>
    </footer>
  );
};
