import React from 'react';
import { Globe, Image as ImageIcon, Key } from 'lucide-react';

interface IntegrationSettingsProps {
  cmsWordpressUrl: string;
  setCmsWordpressUrl: (val: string) => void;
  cmsWordpressUsername: string;
  setCmsWordpressUsername: (val: string) => void;
  cmsWordpressAppPassword: string;
  setCmsWordpressAppPassword: (val: string) => void;
  cmsMediumToken: string;
  setCmsMediumToken: (val: string) => void;
  cmsLinkedinToken: string;
  setCmsLinkedinToken: (val: string) => void;
  cmsLinkedinAuthorUrn: string;
  setCmsLinkedinAuthorUrn: (val: string) => void;
  cloudName: string;
  setCloudName: (val: string) => void;
  apiKey: string;
  setApiKey: (val: string) => void;
  apiSecret: string;
  setApiSecret: (val: string) => void;
}

export const IntegrationSettings: React.FC<IntegrationSettingsProps> = ({
  cmsWordpressUrl, setCmsWordpressUrl,
  cmsWordpressUsername, setCmsWordpressUsername,
  cmsWordpressAppPassword, setCmsWordpressAppPassword,
  cmsMediumToken, setCmsMediumToken,
  cmsLinkedinToken, setCmsLinkedinToken,
  cmsLinkedinAuthorUrn, setCmsLinkedinAuthorUrn,
  cloudName, setCloudName,
  apiKey, setApiKey,
  apiSecret, setApiSecret
}) => {
  return (
    <>
      {/* CMS Integrations */}
      <section className="space-y-5">
        <div className="flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Globe className="w-5 h-5 text-orange-500" />
            CMS Auto-Publishing
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Configure integrations to publish directly to WordPress or Medium.
          </p>
        </div>
        
        <div className="space-y-6 border border-slate-200 p-6 rounded-xl bg-slate-50">
          <h4 className="font-semibold text-slate-700">WordPress</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Site URL</label>
              <input type="text" placeholder="https://mysite.com" value={cmsWordpressUrl} onChange={(e) => setCmsWordpressUrl(e.target.value)} className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Username</label>
              <input type="text" placeholder="admin" value={cmsWordpressUsername} onChange={(e) => setCmsWordpressUsername(e.target.value)} className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">App Password</label>
              <input type="password" placeholder="" value={cmsWordpressAppPassword} onChange={(e) => setCmsWordpressAppPassword(e.target.value)} className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" />
            </div>
          </div>
        </div>

        <div className="space-y-4 border border-slate-200 p-6 rounded-xl bg-slate-50 mt-4">
          <h4 className="font-semibold text-slate-700">Medium</h4>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Integration Token</label>
            <input type="password" placeholder="********" value={cmsMediumToken} onChange={(e) => setCmsMediumToken(e.target.value)} className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" />
            <p className="text-xs text-slate-400 mt-1">Get this from your Medium settings.</p>
          </div>
        </div>

        <div className="space-y-4 border border-slate-200 p-6 rounded-xl bg-slate-50 mt-4">
          <h4 className="font-semibold text-slate-700">LinkedIn Promotion Engine</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">API Access Token</label>
              <input type="password" placeholder="********" value={cmsLinkedinToken} onChange={(e) => setCmsLinkedinToken(e.target.value)} className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Author URN ID</label>
              <input type="text" placeholder="urn:li:person:..." value={cmsLinkedinAuthorUrn} onChange={(e) => setCmsLinkedinAuthorUrn(e.target.value)} className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">Required to automatically promote your blogs on LinkedIn.</p>
        </div>
      </section>

      {/* Cloudinary Integrations */}
      <section className="space-y-5 mt-5">
        <div className="flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-orange-500" />
            Cloudinary Integration
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Bring your own Cloudinary keys to bypass global limits and store generated blog images directly in your own cloud.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Cloud Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Key className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={cloudName}
                onChange={(e) => setCloudName(e.target.value)}
                placeholder="Your cloud name"
                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl bg-white focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">API Key</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Key className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="••••••••••••"
                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl bg-white focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">API Secret</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Key className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="password"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder="••••••••••••"
                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl bg-white focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="w-full h-px bg-slate-100 mt-5"></div>
    </>
  );
};
