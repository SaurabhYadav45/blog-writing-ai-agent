import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMe, updateMe } from '../services/users';
import { Save, CheckCircle, Loader2 } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { loadRazorpay } from '../utils/razorpay';
import { useLocation } from 'react-router-dom';
import jsPDF from 'jspdf';
import { UpgradeModal } from '../components/UpgradeModal';
import { ConfirmModal } from '../components/ConfirmModal';

import { ProfileSettings } from '../components/settings/ProfileSettings';
import { IntegrationSettings } from '../components/settings/IntegrationSettings';
import { BillingSettings } from '../components/settings/BillingSettings';
import { DangerZone } from '../components/settings/DangerZone';

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

        const orderRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/payments/create-order`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (window.location.search.includes('upgrade=true')) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        if (!orderRes.ok) {
            const err = await orderRes.json();
            throw new Error(err.detail || 'Failed to create order');
        }

        const orderData = await orderRes.json();

        const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID || '', 
            amount: orderData.amount,
            currency: orderData.currency,
            name: "BlogFusion",
            description: "Upgrade to Pro Plan (50 Credits)",
            order_id: orderData.id,
            handler: async function (response: any) {
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
                    await refreshUser(); 
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
                color: "#f97316"
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

    const primaryColor: [number, number, number] = [249, 115, 22]; 
    const grayDark: [number, number, number] = [51, 65, 85]; 
    const grayLight: [number, number, number] = [100, 116, 139]; 
    const grayBackground: [number, number, number] = [248, 250, 252]; 

    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('BlogFusion', 20, 26);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('PAYMENT RECEIPT', pageWidth - 20, 26, { align: 'right' });

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

    doc.setFillColor(...grayBackground);
    doc.rect(20, currentY, pageWidth - 40, 12, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...grayDark);
    doc.text('Description', 25, currentY + 8);
    doc.text('Amount', pageWidth - 25, currentY + 8, { align: 'right' });

    currentY += 20;
    doc.setFont('helvetica', 'normal');
    doc.text('Pro Plan Upgrade (1 Month)', 25, currentY);
    doc.text(`INR ${(tx.amount / 100).toFixed(2)}`, pageWidth - 25, currentY, { align: 'right' });

    currentY += 10;
    doc.setDrawColor(226, 232, 240); 
    doc.line(20, currentY, pageWidth - 20, currentY);

    currentY += 15;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...primaryColor);
    doc.text('Total Paid:', pageWidth - 70, currentY, { align: 'right' });
    doc.text(`INR ${(tx.amount / 100).toFixed(2)}`, pageWidth - 25, currentY, { align: 'right' });

    currentY += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...grayLight);
    doc.text(`Payment Status: ${tx.status.toUpperCase()}`, pageWidth - 25, currentY, { align: 'right' });

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
  }, [location.search, user, isLoading]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#FFFAF3]">
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

                <ProfileSettings
                  user={user}
                  fullName={fullName}
                  setFullName={setFullName}
                  personaType={personaType}
                  setPersonaType={setPersonaType}
                  brandPersona={brandPersona}
                  setBrandPersona={setBrandPersona}
                  setShowUpgradeModal={setShowUpgradeModal}
                />

                <IntegrationSettings
                  cmsWordpressUrl={cmsWordpressUrl} setCmsWordpressUrl={setCmsWordpressUrl}
                  cmsWordpressUsername={cmsWordpressUsername} setCmsWordpressUsername={setCmsWordpressUsername}
                  cmsWordpressAppPassword={cmsWordpressAppPassword} setCmsWordpressAppPassword={setCmsWordpressAppPassword}
                  cmsMediumToken={cmsMediumToken} setCmsMediumToken={setCmsMediumToken}
                  cmsLinkedinToken={cmsLinkedinToken} setCmsLinkedinToken={setCmsLinkedinToken}
                  cmsLinkedinAuthorUrn={cmsLinkedinAuthorUrn} setCmsLinkedinAuthorUrn={setCmsLinkedinAuthorUrn}
                  cloudName={cloudName} setCloudName={setCloudName}
                  apiKey={apiKey} setApiKey={setApiKey}
                  apiSecret={apiSecret} setApiSecret={setApiSecret}
                />

                <BillingSettings
                  user={user}
                  handleUpgrade={handleUpgrade}
                  isUpgrading={isUpgrading}
                  paymentHistory={paymentHistory}
                  downloadReceipt={downloadReceipt}
                />

                <DangerZone
                  handleDeleteAccount={handleDeleteAccount}
                  isLoading={isLoading}
                />
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
