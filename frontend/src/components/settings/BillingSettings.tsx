import React from 'react';
import { CreditCard, Crown, Receipt, Download, Loader2 } from 'lucide-react';

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

      <div className="w-full h-px bg-slate-100 mt-5 mb-5"></div>
    </>
  );
};
