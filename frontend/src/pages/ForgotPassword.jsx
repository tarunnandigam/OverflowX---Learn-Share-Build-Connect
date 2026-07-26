import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useToast } from '../contexts/ToastContext';
import API from '../services/api';
import { KeyRound, Copy, Check } from 'lucide-react';
import logo from '../assets/Logo.png';
import { useLanguage } from '../contexts/LanguageContext';

const ForgotPassword = () => {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { t } = useLanguage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emailOrPhone.trim()) {
      setErrorMsg('Please enter your email or phone number');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setTempPassword('');
    setIsCopied(false);

    try {
      const response = await API.post('/auth/forgot-password', { emailOrPhone: emailOrPhone.trim() });
      setSuccessMsg(response.data.message);
      if (response.data.tempPassword) {
        setTempPassword(response.data.tempPassword);
      }
      addToast('Password reset successful!', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reset password. Please check your inputs.';
      setErrorMsg(msg);
      addToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(tempPassword);
    setIsCopied(true);
    addToast('Password copied to clipboard!', 'success');
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="flex flex-col justify-center items-center px-4 font-sans text-[#242729] w-full py-8">
      
      {/* Logo Section */}
      <div className="flex flex-col items-center mb-6">
        <img src={logo} alt="OverflowX Logo" className="w-12 h-12 object-contain mb-4" />
        <div className="flex items-center gap-2 mb-2">
          <KeyRound className="text-[#F48024] w-6 h-6" />
          <h2 className="text-[27px] font-normal tracking-tight text-[#242729]">
            Reset your password
          </h2>
        </div>
        <p className="text-[13px] text-[#525960] max-w-[300px] text-center mt-2">
          Enter your email or phone number to reset your password.
        </p>
      </div>

      <div className="w-full max-w-[316px]">
        {/* Main Card */}
        <div className="bg-white rounded-[7px] shadow-[0_10px_24px_rgba(0,0,0,0.05),_0_20px_48px_rgba(0,0,0,0.05),_0_1px_4px_rgba(0,0,0,0.1)] p-6 mb-6">
          
          {!successMsg ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-[15px] text-[#0C0D0E]">
                  Email or Phone
                </label>
                <input
                  type="text"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  required
                  className={`w-full p-2 text-sm border rounded-[3px] focus:outline-none focus:ring-4 focus:ring-[#0074CC]/20 ${
                    errorMsg ? 'border-red-500' : 'border-gray-300 focus:border-[#0074CC]'
                  }`}
                />
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="text-[12px] text-red-500 font-bold mb-2">
                  {errorMsg}
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading || !emailOrPhone.trim()}
                  className="w-full py-2 bg-[#0A95FF] hover:bg-[#0074CC] text-white rounded-[3px] font-bold text-[13px] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] disabled:opacity-50 transition-colors"
                >
                  {isLoading ? 'Processing...' : 'Reset password'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 text-center">
              {/* Success Message */}
              <div className="text-[13px] text-[#1E7E34] bg-[#D4EDDA] border border-[#C3E6CB] p-3 rounded-[3px]">
                {successMsg}
              </div>

              {/* Developer Assistant Mode */}
              {import.meta.env.DEV && tempPassword && (
                <div className="p-4 bg-[#E1ECF4] border border-[#7AA7C7] rounded-[3px] text-left">
                  <div className="text-[11px] font-bold text-[#0074CC] uppercase tracking-wider mb-2">
                    Developer Mode
                  </div>
                  <div className="text-[13px] text-[#3B4045] mb-2">
                    Temporary password generated:
                  </div>
                  <div className="flex items-center justify-between bg-white px-3 py-2 border border-[#BABFC4] rounded-[3px]">
                    <span className="font-mono font-bold text-[14px] text-[#242729]">
                      {tempPassword}
                    </span>
                    <button
                      onClick={handleCopy}
                      className="text-[#0074CC] hover:text-[#0A95FF]"
                      title="Copy to clipboard"
                    >
                      {isCopied ? <Check size={16} className="text-[#1E7E34]" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={() => navigate('/login')}
                className="w-full py-2 bg-[#0A95FF] hover:bg-[#0074CC] text-white rounded-[3px] font-bold text-[13px] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] mt-4 transition-colors"
              >
                Back to log in
              </button>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex flex-col gap-2 items-center text-[13px] text-[#242729]">
          <div>
            Don't have an account?{' '}
            <Link to="/register" className="text-[#0074CC] hover:text-[#0A95FF]">
              Sign up
            </Link>
          </div>
          <div>
            Remember your password?{' '}
            <Link to="/login" className="text-[#0074CC] hover:text-[#0A95FF]">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

