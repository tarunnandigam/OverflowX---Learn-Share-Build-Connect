import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useToast } from '../../contexts/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { updateUser } from '../../store/authSlice';
import API from '../../services/api';
import { CreditCard, CheckCircle2, Clock, Check, X, ShieldAlert, Sparkles } from 'lucide-react';

const SubscriptionTab = () => {
  const { addToast } = useToast();
  const { t } = useLanguage();
  const dispatch = useDispatch();
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [bypassTimeCheck, setBypassTimeCheck] = useState(false);
  const [simulatedCheckoutOrder, setSimulatedCheckoutOrder] = useState(null);

  // Prices: Bronze: ₹100, Silver: ₹300, Gold: ₹1000
  const plansList = [
    {
      name: 'Free',
      price: '₹0',
      description: 'Perfect for casual learners and readers.',
      limit: '1 question per day',
      features: ['Basic community learning access', 'Standard reputation points awards', '1 daily question posting limit']
    },
    {
      name: 'Bronze',
      price: '₹100',
      description: 'Ideal for active students asking basic queries.',
      limit: '5 questions per day',
      features: ['Standard daily limit (5 questions)', 'Faster question visibility', 'Reputation points multiplier', 'Dedicated support badge']
    },
    {
      name: 'Silver',
      price: '₹300',
      description: 'Best for engineering professionals and educators.',
      limit: '10 questions per day',
      features: ['Professional daily limit (10 questions)', 'Priority answer tracking', 'Extended profile badge', 'Custom tag watch customization']
    },
    {
      name: 'Gold',
      price: '₹1000',
      description: 'Uncapped unlimited question and knowledge sharing.',
      limit: 'Unlimited questions',
      features: ['Unlimited daily questions', 'Exclusive Gold profile styling', 'Instant query notifications', '24/7 priority developer feedback']
    }
  ];

  useEffect(() => {
    fetchUsage();

    // Dynamically load Razorpay SDK only when SubscriptionTab is mounted
    let script;
    if (!window.Razorpay) {
      script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }

    return () => {
      if (script && document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const fetchUsage = async () => {
    try {
      setLoading(true);
      const res = await API.get('/subscriptions/usage');
      setUsage(res.data);
    } catch (err) {
      addToast('Failed to load subscription details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (planName) => {
    if (planName === 'Free') {
      addToast('You are already on the Free Plan.', 'info');
      return;
    }

    setPurchasing(true);
    try {
      const res = await API.post('/subscriptions/checkout', {
        planName,
        bypassTimeCheck
      });

      const orderData = res.data;

      if (orderData.isMock) {
        // Open simulation popup
        setSimulatedCheckoutOrder(orderData);
        addToast('Mock order generated. Launching Simulated Payment gateway.', 'info');
      } else {
        // Launch real Razorpay SDK if checkout.js is loaded
        if (window.Razorpay) {
          const options = {
            key: orderData.key,
            amount: orderData.amount,
            currency: orderData.currency,
            name: 'OverflowX Community',
            description: `${planName} Subscription Upgrade`,
            order_id: orderData.id,
            handler: async (response) => {
              try {
                setPurchasing(true);
                const verifyRes = await API.post('/subscriptions/verify', {
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  planName,
                  bypassTimeCheck
                });
                addToast(verifyRes.data.message, 'success');
                if (verifyRes.data.user) {
                  dispatch(updateUser(verifyRes.data.user));
                }
                fetchUsage();
              } catch (verifyErr) {
                addToast(verifyErr.response?.data?.message || 'Payment signature verification failed', 'error');
              } finally {
                setPurchasing(false);
              }
            },
            theme: { color: '#0A95FF' }
          };
          const rzp = new window.Razorpay(options);
          rzp.open();
        } else {
          addToast('Razorpay SDK failed to load. Falling back to Simulated Payment.', 'warning');
          orderData.isMock = true;
          setSimulatedCheckoutOrder(orderData);
        }
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Checkout initiation failed. Is payment time window open?', 'error');
    } finally {
      setPurchasing(false);
    }
  };

  const handleSimulateSuccess = async () => {
    if (!simulatedCheckoutOrder) return;
    setPurchasing(true);
    try {
      const res = await API.post('/subscriptions/verify', {
        razorpay_order_id: simulatedCheckoutOrder.id,
        isMock: true,
        planName: simulatedCheckoutOrder.planName,
        bypassTimeCheck
      });
      addToast(res.data.message, 'success');
      if (res.data.user) {
        dispatch(updateUser(res.data.user));
      }
      setSimulatedCheckoutOrder(null);
      fetchUsage();
    } catch (err) {
      addToast(err.response?.data?.message || 'Simulation verification failed', 'error');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-3">
        <div className="w-8 h-8 border-4 border-[#0A95FF] border-t-transparent rounded-full animate-spin"></div>
        <span className="text-gray-500 text-xs font-semibold">Loading plan details...</span>
      </div>
    );
  }

  const currentPlan = usage?.plan || 'Free';
  const questionsPosted = usage?.questionsToday || 0;
  const limitVal = usage?.limit === Infinity ? 'Unlimited' : (usage?.limit || 1);
  const postedPercent = usage?.limit === Infinity ? 0 : Math.min(100, (questionsPosted / limitVal) * 100);

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-3 mb-6">
        <h2 className="text-[20px] font-normal text-gray-900 font-sans flex items-center gap-2">
          <CreditCard className="text-[#0A95FF]" size={22} />
          Subscription Plans & Billing
        </h2>
      </div>

      {/* Development Options Banner */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="font-bold text-amber-700 text-xs flex items-center gap-1.5 mb-1 uppercase tracking-wider">
            <Clock size={14} /> Controlled Payments Mode
          </span>
          <p className="text-[12px] text-amber-600 leading-normal">
            Real payments are restricted to between **10:00 AM and 11:00 AM IST** daily. Toggle the test mode bypass below to bypass the time checks.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 bg-white border border-amber-250 px-3 py-1.5 rounded shadow-sm">
          <input
            id="bypass-time"
            type="checkbox"
            checked={bypassTimeCheck}
            onChange={(e) => setBypassTimeCheck(e.target.checked)}
            className="w-4 h-4 rounded text-[#0A95FF] border-gray-300 focus:ring-[#0A95FF]/30 cursor-pointer"
          />
          <label htmlFor="bypass-time" className="text-xs font-bold text-gray-700 cursor-pointer">
            Bypass Time Restriction
          </label>
        </div>
      </div>

      {/* Current Active Plan Stats Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Your Active Plan</h3>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className={`px-3.5 py-1 text-sm font-bold rounded-full ${
                currentPlan === 'Gold' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                currentPlan === 'Silver' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                currentPlan === 'Bronze' ? 'bg-yellow-50 text-yellow-700 border border-yellow-250' :
                'bg-gray-100 text-gray-700 border border-gray-200'
              }`}>
                {currentPlan} Plan
              </span>
              {currentPlan !== 'Free' && (
                <span className="text-[11.5px] text-gray-400">
                  Renews/Expires: {usage?.expiresAt ? new Date(usage.expiresAt).toLocaleDateString() : '30 days'}
                </span>
              )}
            </div>
            
            <div className="mt-4 flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs text-gray-600">
                <span>Questions Posted Today:</span>
                <span className="font-bold text-gray-800">{questionsPosted} / {limitVal}</span>
              </div>
              {currentPlan !== 'Gold' && (
                <div className="w-full h-2.5 bg-gray-150 bg-gray-100 rounded-full overflow-hidden border">
                  <div 
                    className="h-full bg-[#0A95FF] transition-all duration-300" 
                    style={{ width: `${postedPercent}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          {currentPlan !== 'Gold' && (
            <div className="md:border-l md:pl-6 border-gray-200 flex flex-col justify-center">
              <span className="text-xs text-gray-500 mb-1">Need higher limits?</span>
              <p className="text-[12.5px] text-gray-700 font-semibold max-w-[240px] leading-relaxed">
                Upgrade your subscription plan to Bronze, Silver, or Gold to increase your daily query limit immediately.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Subscription Plans Grid */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">Choose subscription plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plansList.map((plan) => {
            const isCurrent = plan.name === currentPlan;
            return (
              <div 
                key={plan.name} 
                className={`border rounded-lg p-5 flex flex-col justify-between transition-all ${
                  isCurrent 
                    ? 'border-indigo-500 bg-indigo-50/20 shadow-md ring-2 ring-indigo-500/20' 
                    : 'border-gray-200 bg-white hover:border-gray-300 shadow-sm'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-base font-bold text-gray-900">{plan.name}</h4>
                    {isCurrent && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-100 border border-indigo-200 px-2.5 py-0.5 rounded-full uppercase">
                        <CheckCircle2 size={11} /> Current Plan
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-3">
                    <span className="text-2xl font-extrabold text-gray-900">{plan.price}</span>
                    <span className="text-xs text-gray-500">/ month</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-4 leading-normal">{plan.description}</p>
                  
                  <div className="border-t border-gray-100 pt-3.5 mb-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-2">Features included</span>
                    <ul className="space-y-2">
                      {plan.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-700 leading-normal">
                          <Check size={14} className="text-green-600 flex-shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-2">
                  {plan.name === 'Free' ? (
                    <button
                      disabled
                      className="w-full py-2 bg-gray-100 text-gray-400 rounded text-xs font-bold border border-gray-200 cursor-not-allowed"
                    >
                      Default Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleCheckout(plan.name)}
                      disabled={purchasing || isCurrent}
                      className={`w-full py-2.5 rounded text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer ${
                        isCurrent 
                          ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                          : 'bg-[#0A95FF] hover:bg-[#0074CC] text-white'
                      }`}
                    >
                      {isCurrent ? 'Already Upgraded' : `Upgrade to ${plan.name}`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SIMULATED CHECKOUT MODAL OVERLAY */}
      {simulatedCheckoutOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-[420px] rounded-lg shadow-2xl overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Header banner */}
            <div className="bg-indigo-600 p-5 text-white relative">
              <button 
                onClick={() => setSimulatedCheckoutOrder(null)}
                className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/25 hover:bg-black/45 p-1 rounded-full transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
              
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles size={18} className="text-amber-300 animate-pulse" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">OverflowX Simulated Checkout</span>
              </div>
              <h3 className="text-[18px] font-bold">Simulated Payment Gateway</h3>
            </div>

            {/* Modal content */}
            <div className="p-6 space-y-5">
              <div className="p-3.5 bg-yellow-50 border border-yellow-250 rounded text-[12px] text-yellow-800 leading-normal flex items-start gap-2">
                <ShieldAlert size={16} className="flex-shrink-0 mt-0.5 text-yellow-600" />
                <span>
                  You are utilizing developer simulation mode because mock credentials are configured. This request will bypass Razorpay server requests and simulate a successful billing event.
                </span>
              </div>

              <div className="border border-gray-200 rounded p-4 space-y-2.5 bg-gray-50/50">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Selected Subscription Plan:</span>
                  <strong className="text-gray-900 font-bold">{simulatedCheckoutOrder.planName}</strong>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Order ID:</span>
                  <span className="font-mono text-gray-800">{simulatedCheckoutOrder.id}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Currency:</span>
                  <span className="text-gray-800">{simulatedCheckoutOrder.currency}</span>
                </div>
                <div className="border-t border-gray-200 pt-2.5 flex justify-between items-baseline">
                  <span className="text-xs font-bold text-gray-800">Total Payable Amount:</span>
                  <strong className="text-lg font-extrabold text-[#0A95FF]">
                    ₹{(simulatedCheckoutOrder.amount / 100).toFixed(2)}
                  </strong>
                </div>
              </div>

              <div className="flex gap-3.5 pt-2">
                <button
                  onClick={handleSimulateSuccess}
                  disabled={purchasing}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-xs shadow-sm transition-colors cursor-pointer"
                >
                  {purchasing ? 'Processing...' : 'Simulate Success Payment'}
                </button>
                <button
                  onClick={() => setSimulatedCheckoutOrder(null)}
                  disabled={purchasing}
                  className="flex-1 py-2.5 text-gray-500 hover:bg-gray-100 rounded text-xs font-bold border border-gray-250 transition-all cursor-pointer"
                >
                  Cancel Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionTab;
