import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Phone, X, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { updateUser } from '../../store/authSlice';
import API from '../../services/api';

const PhoneVerificationModal = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const { addToast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1); // 1: Enter Phone, 2: Enter OTP
  
  const [phone, setPhone] = useState(user?.phone || '');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [devOtpCode, setDevOtpCode] = useState('');

  // Show modal if logged in, email is verified, but phone is NOT verified
  useEffect(() => {
    if (user && user.isEmailVerified && !user.isPhoneVerified) {
      // Small delay to let the dashboard render first
      const timeout = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timeout);
    } else {
      setIsOpen(false);
    }
  }, [user]);

  // Timer logic
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  if (!isOpen) return null;

  const handleUpdatePhone = async (e) => {
    e.preventDefault();
    if (!phone || !/^\+?[1-9]\d{1,14}$/.test(phone.replace(/\s/g, ''))) {
      addToast('Please enter a valid phone number (e.g., +1234567890)', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await API.post('/auth/update-contacts', { phone });
      dispatch(updateUser(response.data.user));
      addToast('OTP sent to your phone!', 'success');
      setTimer(60);
      setStep(2);
      
      // For dev testing, show OTP in console or toast if returned
      if (response.data._devPhoneOtp) {
        console.log("DEV OTP:", response.data._devPhoneOtp);
        addToast(`[Dev Mode] OTP: ${response.data._devPhoneOtp}`, 'info');
        setDevOtpCode(response.data._devPhoneOtp);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update phone number.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      addToast('Please enter the 6-digit code', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await API.post('/auth/verify-phone', { code: otp });
      dispatch(updateUser(response.data.user));
      addToast('Phone verified successfully!', 'success');
      setIsOpen(false); // Close modal on success
    } catch (err) {
      addToast(err.response?.data?.message || 'Invalid OTP. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      const response = await API.post('/auth/resend-phone');
      addToast('SMS code resent!', 'success');
      setTimer(60);
      if (response.data._devPhoneOtp) {
        addToast(`[Dev Mode] OTP: ${response.data._devPhoneOtp}`, 'info');
        setDevOtpCode(response.data._devPhoneOtp);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to resend code', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#121824] w-full max-w-[340px] rounded-[7px] shadow-[0_12px_36px_rgba(0,0,0,0.15)] border border-gray-200 dark:border-neutral-800 relative p-6">
        
        {/* Close Button */}
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors p-1"
        >
          <X size={18} />
        </button>

        <div>
          {/* Header */}
          <h3 className="text-[19px] font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Phone className="text-[#F48024] w-5 h-5" /> Phone Verification
          </h3>

          {/* Description Alert Box */}
          {step === 1 && (
            <div className="bg-[#FFF8E7] dark:bg-amber-950/20 border border-[#F1E0BC] dark:border-amber-900/50 p-4 rounded-[4px] text-xs text-[#80601B] dark:text-amber-350 leading-relaxed mb-4 flex gap-2.5 items-start">
              <AlertCircle className="shrink-0 text-[#F48024] mt-0.5" size={15} />
              <div>
                Please add and verify your phone number to keep your account safe and access all features.
              </div>
            </div>
          )}

          {/* Dev OTP Box */}
          {import.meta.env.DEV && step === 2 && devOtpCode && (
            <div className="bg-[#E1ECF4] border border-[#7AA7C7] rounded-[3px] p-3 text-[12px] text-[#3B4045] mb-4">
              <div className="text-[10px] font-bold text-[#0074CC] uppercase tracking-wider mb-1">Developer Mode Assistant</div>
              <div className="flex justify-between items-center">
                <span>OTP is: <strong className="font-mono text-sm text-[#242729]">{devOtpCode}</strong></span>
                <button
                  type="button"
                  onClick={() => {
                    setOtp(devOtpCode);
                    addToast('Code autofilled!', 'info');
                  }}
                  className="text-[#0074CC] hover:underline font-semibold"
                >
                  Autofill
                </button>
              </div>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleUpdatePhone} className="space-y-4">
              <div className="flex flex-col gap-1.5 text-left w-full">
                <label htmlFor="phoneInput" className="font-bold text-[14px] text-[#0C0D0E] dark:text-[#f8fafc]">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    id="phoneInput"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 99999 99999"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-neutral-700 bg-white dark:bg-[#0b0f19] text-gray-900 dark:text-white rounded-[3px] focus:outline-none focus:ring-4 focus:ring-[#0074CC]/20 focus:border-[#0074CC]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !phone}
                className="w-full py-2 bg-[#0A95FF] hover:bg-[#0074CC] text-white rounded-[3px] font-bold text-[13px] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] disabled:opacity-50 transition-colors flex justify-center items-center gap-1.5 cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>Send OTP <ArrowRight size={14} /></>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center text-xs text-gray-600 dark:text-gray-350 mb-2">
                Sent to: <span className="font-bold">{phone}</span>
                <button type="button" onClick={() => setStep(1)} className="ml-2 text-[#0074CC] hover:underline cursor-pointer">Change</button>
              </div>

              <div className="flex flex-col gap-1.5 text-left w-full">
                <label htmlFor="otpInput" className="font-bold text-[14px] text-[#0C0D0E] dark:text-[#f8fafc]">
                  Enter 6-Digit OTP Code
                </label>
                <input
                  type="text"
                  id="otpInput"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="000000"
                  className="w-full py-2 text-center text-lg font-mono tracking-[0.3em] border border-gray-300 dark:border-neutral-700 bg-white dark:bg-[#0b0f19] text-gray-900 dark:text-white rounded-[3px] focus:outline-none focus:ring-4 focus:ring-[#0074CC]/20 focus:border-[#0074CC]"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full py-2 bg-[#0A95FF] hover:bg-[#0074CC] text-white rounded-[3px] font-bold text-[13px] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] disabled:opacity-50 transition-colors flex justify-center items-center cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Verify Phone Number'
                )}
              </button>

              <div className="flex justify-center mt-3">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={timer > 0 || isLoading}
                  className="text-xs font-bold text-[#0074CC] hover:text-[#0A95FF] disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
                  {timer > 0 ? `Resend in ${timer}s` : 'Resend OTP'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhoneVerificationModal;
