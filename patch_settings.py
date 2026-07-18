import re

with open(r'c:\Users\saura\OneDrive\Documents\Desktop\GenAi Projects\Blog Writing AI Agent\frontend\src\pages\Settings.tsx', 'r') as f:
    content = f.read()

# Add state variables
state_vars = """
  const [brandPersona, setBrandPersona] = useState('');
  const [cmsWordpressUrl, setCmsWordpressUrl] = useState('');
  const [cmsWordpressUsername, setCmsWordpressUsername] = useState('');
  const [cmsWordpressAppPassword, setCmsWordpressAppPassword] = useState('');
  const [cmsMediumToken, setCmsMediumToken] = useState('');
  const [personaType, setPersonaType] = useState('Casual');
"""
content = re.sub(r'const \[apiSecret, setApiSecret\] = useState\(\'\'\);', r"const [apiSecret, setApiSecret] = useState('');" + "\n" + state_vars, content)

# Update fetchUser
fetch_updates = """
          setBrandPersona(data.brand_persona || '');
          setCmsWordpressUrl(data.cms_wordpress_url || '');
          setCmsWordpressUsername(data.cms_wordpress_username || '');
          if (data.brand_persona && !['Casual', 'Professional', 'Humorous', 'Technical'].includes(data.brand_persona)) {
              setPersonaType('Custom');
          } else if (data.brand_persona) {
              setPersonaType(data.brand_persona);
          }
"""
content = re.sub(r'setApiSecret\(data\.cloudinary_api_secret \|\| \'\'\);', r"setApiSecret(data.cloudinary_api_secret || '');\n" + fetch_updates, content)

# Update handleSubmit
submit_updates = """
        brand_persona: personaType === 'Custom' ? brandPersona : personaType,
        cms_wordpress_url: cmsWordpressUrl || null,
        cms_wordpress_username: cmsWordpressUsername || null,
"""
content = re.sub(r'cloudinary_api_secret: apiSecret \|\| null,', r"cloudinary_api_secret: apiSecret || null,\n" + submit_updates, content)

submit_passwords = """
      if (cmsWordpressAppPassword) dataToUpdate.cms_wordpress_app_password = cmsWordpressAppPassword;
      if (cmsMediumToken) dataToUpdate.cms_medium_token = cmsMediumToken;
"""
content = re.sub(r'const res = await updateMe\(token, dataToUpdate\);', submit_passwords + r"\n      const res = await updateMe(token, dataToUpdate);", content)

# Insert UI
ui_block = """
            <div className="w-full h-px bg-slate-100"></div>

            {/* Brand Voice Section */}
            <section className="space-y-5">
              <div className="flex flex-col">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-orange-500" />
                  Brand Voice & Persona
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Define the default tone and personality for your AI-generated blogs.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Persona Type</label>
                  <select
                    value={personaType}
                    onChange={(e) => {
                      setPersonaType(e.target.value);
                      if (e.target.value !== 'Custom') setBrandPersona('');
                    }}
                    className="block w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
                  >
                    <option value="Casual">Casual & Friendly</option>
                    <option value="Professional">Professional & Corporate</option>
                    <option value="Humorous">Humorous & Witty</option>
                    <option value="Technical">Technical & Analytical</option>
                    <option value="Custom">Custom Persona</option>
                  </select>
                </div>
                {personaType === 'Custom' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Custom Persona Instructions</label>
                    <textarea
                      value={brandPersona}
                      onChange={(e) => setBrandPersona(e.target.value)}
                      placeholder="E.g., Write like a witty tech reviewer who uses emojis..."
                      className="block w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none h-24 resize-none"
                    />
                  </div>
                )}
              </div>
            </section>

            <div className="w-full h-px bg-slate-100"></div>

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
                    <input type="password" placeholder="••••••••••••" value={cmsWordpressAppPassword} onChange={(e) => setCmsWordpressAppPassword(e.target.value)} className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" />
                  </div>
                </div>
              </div>

              <div className="space-y-4 border border-slate-200 p-6 rounded-xl bg-slate-50 mt-4">
                <h4 className="font-semibold text-slate-700">Medium</h4>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Integration Token</label>
                  <input type="password" placeholder="••••••••••••" value={cmsMediumToken} onChange={(e) => setCmsMediumToken(e.target.value)} className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" />
                  <p className="text-xs text-slate-400 mt-1">Get this from your Medium settings.</p>
                </div>
              </div>
            </section>
"""
# Ensure Sparkles and Globe are imported
if "Globe" not in content:
    content = content.replace("Sparkles, ", "").replace("Save, ", "Save, Sparkles, Globe, ")

content = re.sub(r'\{/\* Cloudinary Integrations \*/\}', ui_block + '\n            {/* Cloudinary Integrations */}', content)

with open(r'c:\Users\saura\OneDrive\Documents\Desktop\GenAi Projects\Blog Writing AI Agent\frontend\src\pages\Settings.tsx', 'w') as f:
    f.write(content)
