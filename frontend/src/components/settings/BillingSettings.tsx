import React from 'react';
import { CreditCard, Crown, Receipt, Download, Loader2, Check } from 'lucide-react';

interface BillingSettingsProps {
  user: any;
  handleUpgrade: () => void;
  isUpgrading: boolean;
  paymentHistory: any[];
  downloadReceipt: (tx: any) => void;
}

export const BillingSettings: React.FC<BillingSettingsProps> = ({
  user,
  handleUpgrade,
  isUpgrading,
  paymentHistory,
  downloadReceipt
}) => {
  return (
    <>
      {/* Subscription & Billing */}
      <section className="space-y-5">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-orange-500" />
          Subscription & Billing
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free Plan Card */}
          <div className={`p-6 border rounded-2xl flex flex-col relative bg-white ${user?.plan_name !== 'Pro' ? 'border-orange-400 ring-1 ring-orange-400' : 'border-slate-200'}`}>
            {user?.plan_name !== 'Pro' && (
              <span className="absolute -top-3 right-6 bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full border border-orange-200">
                Current Plan
              </span>
            )}
            <div className="mb-4">
              <h4 className="text-xl font-bold text-slate-900">Free Starter</h4>
              <p className="text-sm text-slate-500 mt-1">Perfect to try out BlogFusion.</p>
            </div>
            <div className="mb-6">
              <span className="text-3xl font-extrabold text-slate-900">₹0</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1 text-sm text-slate-600">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> 1 Generation Credit</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Basic LLM Models</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Standard Generation Speed</li>
            </ul>
            {user?.plan_name !== 'Pro' && (
              <div className="mt-auto pt-4 border-t border-slate-100">
                <p className="text-sm text-slate-600 font-medium">Remaining Credits: <span className="text-orange-600 font-bold">{user?.credits} / 1</span></p>
              </div>
            )}
          </div>

          {/* Pro Plan Card */}
          <div className={`p-6 border rounded-2xl flex flex-col relative bg-gradient-to-b from-orange-50 to-white ${user?.plan_name === 'Pro' ? 'border-orange-500 ring-2 ring-orange-500 shadow-lg shadow-orange-500/10' : 'border-orange-200'}`}>
            {user?.plan_name === 'Pro' && (
              <span className="absolute -top-3 right-6 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                Current Plan
              </span>
            )}
            <div className="mb-4">
              <h4 className="text-xl font-bold text-orange-700 flex items-center gap-2">
                <Crown className="w-5 h-5 fill-orange-700" />
                Pro Professional
              </h4>
              <p className="text-sm text-slate-500 mt-1">For serious content creators.</p>
            </div>
            <div className="mb-6">
              <span className="text-3xl font-extrabold text-slate-900">₹199</span>
              <span className="text-slate-500 text-sm font-medium"> / mo</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1 text-sm text-slate-600">
              <li className="flex items-center gap-2 font-semibold text-slate-900"><Check className="w-4 h-4 text-orange-500" /> 20 Generation Credits</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-orange-500" /> Premium LLM Models</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-orange-500" /> High-Resolution Image Models</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-orange-500" /> Premium Support</li>
            </ul>
            
            {user?.plan_name === 'Pro' ? (
              <div className="mt-auto pt-4 border-t border-orange-100 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Remaining Credits: <span className="text-orange-600 font-bold">{user?.credits} / 20</span></p>
                  {user?.plan_expires_at && (
                    <p className="text-xs text-slate-500 mt-1">Expires on {new Date(user.plan_expires_at).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            ) : (
              <button 
                type="button" 
                onClick={handleUpgrade}
                disabled={isUpgrading}
                className="mt-auto flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-orange-400 to-orange-500 text-white text-sm font-bold rounded-xl hover:from-orange-500 hover:to-orange-600 transition-all shadow-md shadow-orange-500/20 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {isUpgrading ? <Loader2 className="w-5 h-5 fill-white animate-spin" /> : <Crown className="w-5 h-5 fill-white" />}
                Upgrade to Pro
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="w-full h-px bg-slate-100 mt-5 mb-5"></div>

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
                      <td className="px-6 py-4 font-medium text-slate-900">{(tx.currency || 'USD').toUpperCase()} {tx.amount / 100}</td>
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

      <div className="w-full h-px bg-slate-100 mt-5 mb-5"></div>
    </>
  );
};
