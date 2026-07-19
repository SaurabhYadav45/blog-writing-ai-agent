import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMe, updateMe } from '../services/users';
import { Save, Sparkles, Globe, User, Key, CheckCircle, Loader2, Image as ImageIcon, CreditCard, AlertTriangle, Trash2, Crown, Download, Receipt } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { loadRazorpay } from '../utils/razorpay';
import { useLocation } from 'react-router-dom';
import jsPDF from 'jspdf';
import { UpgradeModal } from '../components/UpgradeModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { MODEL_PRICING, MODEL_NAMES } from '../config/models';

export const Settings = () => {
  const { token, user, refreshUser, logout } = useAuth();
  const location = useLocation();
  
  const [fullName, setFullName] = useState('');
  const [cloudName, setCloudName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');

  const [brandPersona, setBrandPersona] = useState('');
  const [cmsWordpressUrl, setCmsWordpressUrl] = useState('');
  const [cmsWordpressUsername, setCmsWordpressUsername] = useState('');
  const [cmsWordpressAppPassword, setCmsWordpressAppPassword] = useState('');
  const [cmsMediumToken, setCmsMediumToken] = useState('');
  const [cmsLinkedinToken, setCmsLinkedinToken] = useState('');
  const [cmsLinkedinAuthorUrn, setCmsLinkedinAuthorUrn] = useState('');
  const [personaType, setPersonaType] = useState('Casual');

  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) return;
      setIsLoading(true);
      try {
        const res = await getMe(token);
        if (res.ok) {
          const data = await res.json();
          setFullName(data.full_name || '');
          setCloudName(data.cloudinary_cloud_name || '');
          setApiKey(data.cloudinary_api_key || '');
          setApiSecret(data.cloudinary_api_secret || '');

          setBrandPersona(data.brand_persona || '');
          setCmsWordpressUrl(data.cms_wordpress_url || '');
          setCmsWordpressUsername(data.cms_wordpress_username || '');
          setCmsLinkedinAuthorUrn(data.cms_linkedin_author_urn || '');
          if (data.brand_persona && !['Casual', 'Professional', 'Humorous', 'Technical'].includes(data.brand_persona)) {
              setPersonaType('Custom');
          } else if (data.brand_persona) {
              setPersonaType(data.brand_persona);
          }

        }
        
        // Fetch payment history
        const histRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/payments/history`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (histRes.ok) {
          const histData = await histRes.json();
          setPaymentHistory(histData);
        }
      } catch (err) {
        console.error("Failed to load user settings", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    setIsSaving(true);
    setMessage(null);
    
    try {
      const dataToUpdate: any = {
        full_name: fullName,
        cloudinary_cloud_name: cloudName || null,
        cloudinary_api_key: apiKey || null,
        cloudinary_api_secret: apiSecret || null,

        brand_persona: personaType === 'Custom' ? brandPersona : personaType,
        cms_wordpress_url: cmsWordpressUrl || null,
        cms_wordpress_username: cmsWordpressUsername || null,

      };
      
      
      if (cmsWordpressAppPassword) dataToUpdate.cms_wordpress_app_password = cmsWordpressAppPassword;
      if (cmsMediumToken) dataToUpdate.cms_medium_token = cmsMediumToken;
      if (cmsLinkedinToken) dataToUpdate.cms_linkedin_token = cmsLinkedinToken;
      if (cmsLinkedinAuthorUrn) dataToUpdate.cms_linkedin_author_urn = cmsLinkedinAuthorUrn;

      const res = await updateMe(token, dataToUpdate);
      if (res.ok) {
        setMessage({ type: 'success', text: 'Settings updated successfully!' });
        await refreshUser(); // Refresh context user
      } else {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to update settings');
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSaving(false);
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleUpgrade = async () => {
    if (!token) return;
    setIsUpgrading(true);
    
    try {
        const isLoaded = await loadRazorpay();
        if (!isLoaded) {
            setMessage({ type: 'error', text: 'Razorpay SDK failed to load. Please check your connection.' });
            return;
        }

        // Create order on backend
        const orderRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/payments/create-order`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        // Clean up URL so we don't get stuck in a loop if the user closes the modal
        if (window.location.search.includes('upgrade=true')) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        if (!orderRes.ok) {
            const err = await orderRes.json();
            throw new Error(err.detail || 'Failed to create order');
        }

        const orderData = await orderRes.json();

        const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID || '', // Frontend Razorpay Key ID
            amount: orderData.amount,
            currency: orderData.currency,
            name: "Blog Writing AI Agent",
            description: "Upgrade to Pro Plan (50 Credits)",
            order_id: orderData.id,
            handler: async function (response: any) {
                // Verify payment on backend
                const verifyRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/payments/verify-payment`, {
                    method: 'POST',
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_signature: response.razorpay_signature
                    })
                });

                if (verifyRes.ok) {
                    setMessage({ type: 'success', text: 'Payment successful! Plan upgraded to Pro.' });
                    await refreshUser(); // refresh user state
                    
                    // Clear the ?upgrade=true from URL and reload to prevent any stuck state
                    window.location.href = '/settings';
                } else {
                    const err = await verifyRes.json();
                    setMessage({ type: 'error', text: err.detail || 'Payment verification failed.' });
                }
            },
            prefill: {
                name: user?.full_name || '',
                email: user?.email || '',
            },
            theme: {
                color: "#f97316" // orange-500
            }
        };

        const paymentObject = new window.Razorpay(options);
        paymentObject.on('payment.failed', function (response: any){
            setMessage({ type: 'error', text: response.error.description || 'Payment failed' });
        });
        paymentObject.open();
    } catch (err: any) {
        setMessage({ type: 'error', text: err.message });
    } finally {
        setIsUpgrading(false);
    }
  };

  const handleDeleteAccount = () => {
    setDeleteModalOpen(true);
  };

  const confirmDeleteAccount = async () => {
    setDeleteModalOpen(false);
    if (!token) return;
    
    setIsLoading(true);
    try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/me`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            logout();
        } else {
            const err = await res.json();
            throw new Error(err.detail || 'Failed to delete account');
        }
    } catch (err: any) {
        setMessage({ type: 'error', text: err.message });
        setIsLoading(false);
    }
  };

  const downloadReceipt = (tx: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Theme Colors
    const primaryColor: [number, number, number] = [249, 115, 22]; // Orange
    const grayDark: [number, number, number] = [51, 65, 85]; // Slate 700
    const grayLight: [number, number, number] = [100, 116, 139]; // Slate 500
    const grayBackground: [number, number, number] = [248, 250, 252]; // Slate 50

    // Header Background
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Header Text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('BlogFusion', 20, 26);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('PAYMENT RECEIPT', pageWidth - 20, 26, { align: 'right' });

    // Transaction Details
    let currentY = 60;
    doc.setTextColor(...grayDark);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Receipt Details', 20, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...grayLight);
    currentY += 8;
    doc.text(`Date: ${new Date(tx.created_at).toLocaleString()}`, 20, currentY);
    currentY += 6;
    doc.text(`Transaction ID: ${tx.razorpay_payment_id}`, 20, currentY);
    currentY += 6;
    doc.text(`Order ID: ${tx.razorpay_order_id}`, 20, currentY);

    // Billed To (Right Side)
    let rightY = 60;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...grayDark);
    doc.setFontSize(12);
    doc.text('Billed To', pageWidth - 20, rightY, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...grayLight);
    rightY += 8;
    doc.text(`${user?.full_name || 'Customer'}`, pageWidth - 20, rightY, { align: 'right' });
    if (user?.email) {
      rightY += 6;
      doc.text(`${user.email}`, pageWidth - 20, rightY, { align: 'right' });
    }

    currentY = 100;

    // Table Header Background
    doc.setFillColor(...grayBackground);
    doc.rect(20, currentY, pageWidth - 40, 12, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...grayDark);
    doc.text('Description', 25, currentY + 8);
    doc.text('Amount', pageWidth - 25, currentY + 8, { align: 'right' });

    // Table Content
    currentY += 20;
    doc.setFont('helvetica', 'normal');
    doc.text('Pro Plan Upgrade (1 Month)', 25, currentY);
    doc.text(`INR ${(tx.amount / 100).toFixed(2)}`, pageWidth - 25, currentY, { align: 'right' });

    // Line Separator
    currentY += 10;
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.line(20, currentY, pageWidth - 20, currentY);

    // Total
    currentY += 15;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...primaryColor);
    doc.text('Total Paid:', pageWidth - 70, currentY, { align: 'right' });
    doc.text(`INR ${(tx.amount / 100).toFixed(2)}`, pageWidth - 25, currentY, { align: 'right' });

    // Status
    currentY += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...grayLight);
    doc.text(`Payment Status: ${tx.status.toUpperCase()}`, pageWidth - 25, currentY, { align: 'right' });

    // Footer
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(10);
    doc.text('Thank you for choosing BlogFusion!', pageWidth / 2, pageHeight - 30, { align: 'center' });
    doc.text('If you have any questions, please contact support@blogfusion.ai', pageWidth / 2, pageHeight - 24, { align: 'center' });

    doc.save(`receipt_${tx.razorpay_payment_id}.pdf`);
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const shouldUpgrade = queryParams.get('upgrade') === 'true';
    if (shouldUpgrade && user && user.plan_name === 'Free' && !isUpgrading && !isLoading) {
      handleUpgrade();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, user, isLoading]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#FFFAF3]">
      {/* Decorative gradient overlay */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center z-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(292.12% 100% at 50% 0%, #FFFAF3 0%, #FFF8F1 21.63%, #FFE4C9 45.15%, #FFE9C9 67.31%,#F9F7F5 100%)' }}
      />
      <Navbar />

      <div className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Account Settings</h1>
              <p className="text-slate-500 mt-1">Manage your profile, billing, and external integrations.</p>
            </div>
            
            <button
              type="submit"
              form="settings-form"
              disabled={isSaving || isLoading}
              className="flex items-center gap-2 py-2.5 px-6 rounded-xl text-sm font-bold text-white bg-linear-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all shadow-md shadow-orange-500/20 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-orange-100">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : (
          <form id="settings-form" onSubmit={handleSubmit} className="space-y-8">
            
            {message && (
              <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {message.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
                <p className="font-medium">{message.text}</p>
              </div>
            )}

            {/* Profile Section */}
            <section className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-orange-500" />
                  Profile Information
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="block w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-400 mt-1.5">Email cannot be changed.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Display Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className="block w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
                  />
                </div>
              </div>
            </section>

            <div className="w-full h-px bg-slate-100"></div>

            
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
                      if (e.target.value === 'Custom' && user?.plan_name !== 'Pro') {
                        setShowUpgradeModal(true);
                        return;
                      }
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
            <section className="space-y-5">
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

            <div className="w-full h-px bg-slate-100"></div>

            {/* Subscription & Billing */}
            <section className="space-y-5">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-orange-500" />
                Subscription & Billing
              </h3>
              
              <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">Current Plan: {user?.plan_name || 'Free'}</p>
                  <p className="text-sm text-slate-500 mt-1">You have {user?.credits} credits remaining.</p>
                  {user?.plan_name === 'Pro' && user?.plan_expires_at && (
                    <p className="text-xs text-orange-600 font-medium mt-1">
                      Plan expires on {new Date(user.plan_expires_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                {user?.plan_name === 'Pro' ? (
                  <div className="flex items-center gap-2 px-5 py-2.5 bg-orange-100 text-orange-700 text-sm font-bold rounded-xl cursor-default border border-orange-200">
                    <Crown className="w-4 h-4 fill-orange-700" />
                    Pro Member
                  </div>
                ) : (
                  <button 
                    type="button" 
                    onClick={handleUpgrade}
                    disabled={isUpgrading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-orange-400 to-orange-500 text-white text-sm font-bold rounded-xl hover:from-orange-500 hover:to-orange-600 transition-all shadow-md shadow-orange-500/20 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isUpgrading ? <Loader2 className="w-4 h-4 fill-white animate-spin" /> : <Crown className="w-4 h-4 fill-white" />}
                    Upgrade Plan
                  </button>
                )}
              </div>
            </section>
            
            {/* Pricing Estimator */}
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-500" />
                Model Pricing Calculator
              </h3>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden text-sm">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-slate-700">Model Name</th>
                      <th className="px-4 py-3 font-semibold text-slate-700">Input Cost (per 1M tokens)</th>
                      <th className="px-4 py-3 font-semibold text-slate-700">Output Cost (per 1M tokens)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {Object.entries(MODEL_PRICING).map(([model, pricing]) => (
                      <tr key={model} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900">{model}</td>
                        <td className="px-4 py-3">${pricing.input.toFixed(2)}</td>
                        <td className="px-4 py-3">${pricing.output.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Payment History */}
            <section className="space-y-5">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-orange-500" />
                Payment History
              </h3>
              
              <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
                {paymentHistory.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    No payment history found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                        <tr>
                          <th className="px-6 py-3 font-semibold">Date</th>
                          <th className="px-6 py-3 font-semibold">Transaction ID</th>
                          <th className="px-6 py-3 font-semibold">Amount</th>
                          <th className="px-6 py-3 font-semibold">Status</th>
                          <th className="px-6 py-3 font-semibold text-right">Receipt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {paymentHistory.map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">{new Date(tx.created_at).toLocaleDateString()}</td>
                            <td className="px-6 py-4 font-mono text-xs">{tx.razorpay_payment_id}</td>
                            <td className="px-6 py-4 font-medium text-slate-900">INR {tx.amount / 100}</td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                {tx.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                type="button"
                                onClick={() => downloadReceipt(tx)}
                                className="inline-flex items-center gap-1.5 text-orange-500 hover:text-orange-600 font-medium transition-colors cursor-pointer"
                              >
                                <Download className="w-4 h-4" />
                                Download
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>

            {/* <div className="w-full h-px bg-slate-100"></div> */}

            {/* Danger Zone */}
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Danger Zone
              </h3>
              
              <div className="p-5 border border-red-200 rounded-xl bg-red-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-red-800">Delete Account</p>
                  <p className="text-sm text-red-600 mt-1">Once you delete your account, there is no going back. Please be certain.</p>
                </div>
                <button type="button" onClick={handleDeleteAccount} disabled={isLoading} className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors shadow-sm whitespace-nowrap cursor-pointer">
                  <Trash2 className="w-4 h-4" />
                  {isLoading ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </section>

          </form>
        )}
          </div>
        </div>
      </div>
      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
        featureName="Custom Brand Personas" 
      />
      <ConfirmModal 
        isOpen={deleteModalOpen}
        title="Delete Account"
        message="Are you absolutely sure you want to permanently delete your account? All your blogs, settings, and transaction details will be lost forever. This action cannot be undone."
        confirmText="Permanently Delete"
        onConfirm={confirmDeleteAccount}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </div>
  );
};
