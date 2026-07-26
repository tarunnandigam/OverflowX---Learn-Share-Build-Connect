import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { logout, updateUser } from '../store/authSlice';
import API from '../services/api';
import logo from '../assets/Logo.png';
import { useLanguage } from '../contexts/LanguageContext';

const Verify = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const { t } = useLanguage();

  // Active tab: 'email' or 'phone'
  const [activeTab, setActiveTab] = useState(user?.isEmailVerified ? 'phone' : 'email');

  // Input states for codes
  const [emailCode, setEmailCode] = useState('');
  const [phoneCode, setPhoneCode] = useState('');

  // Loading states
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [isResendingPhone, setIsResendingPhone] = useState(false);
  const [isUpdatingContacts, setIsUpdatingContacts] = useState(false);

  // Timers
  const [emailTimer, setEmailTimer] = useState(0);
  const [phoneTimer, setPhoneTimer] = useState(0);

  // Edit contacts state
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [newPhone, setNewPhone] = useState(user?.phone || '');
  const [editErrors, setEditErrors] = useState({});

  // Developer mock codes (for testing ease)
  const [devEmailCode, setDevEmailCode] = useState(location.state?.emailOtp || '');
  const [devPhoneCode, setDevPhoneCode] = useState(location.state?.phoneOtp || '');

  // Timers countdown
  useEffect(() => {
    let emailInterval;
    if (emailTimer > 0) {
      emailInterval = setInterval(() => {
        setEmailTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(emailInterval);
  }, [emailTimer]);

  useEffect(() => {
    let phoneInterval;
    if (phoneTimer > 0) {
      phoneInterval = setInterval(() => {
        setPhoneTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(phoneInterval);
  }, [phoneTimer]);

  // Redirect/tab sync when verification state updates
  useEffect(() => {
    if (user?.isEmailVerified && activeTab === 'email') {
      setActiveTab('phone');
    }
  }, [user, activeTab]);

  // Submit email OTP
  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    if (emailCode.length !== 6) {
      addToast('Please enter the 6-digit code', 'error');
      return;
    }

    setIsVerifying(true);
    try {
      const response = await API.post('/auth/verify-email', { code: emailCode });
      dispatch(updateUser(response.data.user));
      addToast('Email verified successfully!', 'success');
      setEmailCode('');
    } catch (err) {
      addToast(err.response?.data?.message || 'Verification failed. Please try again.', 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  // Submit phone OTP
  const handleVerifyPhone = async (e) => {
    e.preventDefault();
    if (phoneCode.length !== 6) {
      addToast('Please enter the 6-digit code', 'error');
      return;
    }

    setIsVerifying(true);
    try {
      const response = await API.post('/auth/verify-phone', { code: phoneCode });
      dispatch(updateUser(response.data.user));
      addToast('Phone number verified successfully!', 'success');
      setPhoneCode('');
    } catch (err) {
      addToast(err.response?.data?.message || 'Verification failed. Please try again.', 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  // Resend codes
  const handleResendCode = async (type) => {
    if (type === 'email') {
      setIsResendingEmail(true);
      try {
        const response = await API.post('/auth/resend-email');
        addToast('Verification code resent to email', 'success');
        setEmailTimer(60);
        if (response.data._devEmailOtp) {
          setDevEmailCode(response.data._devEmailOtp);
        }
      } catch (err) {
        addToast(err.response?.data?.message || 'Failed to resend code', 'error');
      } finally {
        setIsResendingEmail(false);
      }
    } else {
      setIsResendingPhone(true);
      try {
        const response = await API.post('/auth/resend-phone');
        addToast('SMS code resent to phone number', 'success');
        setPhoneTimer(60);
        if (response.data._devPhoneOtp) {
          setDevPhoneCode(response.data._devPhoneOtp);
        }
      } catch (err) {
        addToast(err.response?.data?.message || 'Failed to resend code', 'error');
      } finally {
        setIsResendingPhone(false);
      }
    }
  };

  // Edit contacts
  const handleUpdateContacts = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!newEmail) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(newEmail)) errors.email = 'Valid email is required';

    if (newPhone && !/^\+?[1-9]\d{1,14}$/.test(newPhone.replace(/\s/g, ''))) {
      errors.phone = 'Valid phone format expected (e.g. +1234567890)';
    }

    setEditErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsUpdatingContacts(true);
    try {
      const response = await API.post('/auth/update-contacts', {
        email: newEmail,
        phone: newPhone,
      });

      dispatch(updateUser(response.data.user));
      addToast('Details updated & new codes sent!', 'success');

      if (response.data._devEmailOtp) setDevEmailCode(response.data._devEmailOtp);
      if (response.data._devPhoneOtp) setDevPhoneCode(response.data._devPhoneOtp);

      setShowEditPanel(false);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update contact info.', 'error');
    } finally {
      setIsUpdatingContacts(false);
    }
  };

  const handleLogout = async () => {
    try {
      await API.post('/auth/logout');
    } catch (err) {
      // ignore
    }
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-[#F1F2F3] text-[#242729] font-sans">
      
      {/* Logo Area */}
      <div className="flex flex-col items-center mb-6">
        <img src={logo} alt="OverflowX Logo" className="w-12 h-12 object-contain mb-4" />
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="text-[#F48024] w-6 h-6" />
          <h2 className="text-[27px] font-normal tracking-tight text-[#242729]">
            Verify your account
          </h2>
        </div>
      </div>

      <div className="w-full max-w-[316px]">
        {/* Verification Checklist / Dev Test Help Alert */}
        {import.meta.env.DEV && (devEmailCode || devPhoneCode) && (
          <div className="p-4 mb-4 rounded-[5px] border border-[#7AA7C7] bg-[#E1ECF4]">
            <h4 className="text-[11px] font-bold text-[#0074CC] uppercase tracking-widest mb-2">
              Developer Mode OTP codes
            </h4>
            <div className="grid grid-cols-2 text-xs font-semibold text-[#3B4045] gap-2">
              <div>
                Email: <span className="text-[#0074CC] font-bold bg-white px-2 py-0.5 rounded">{devEmailCode || 'Not sent'}</span>
              </div>
              <div>
                Phone: <span className="text-[#0074CC] font-bold bg-white px-2 py-0.5 rounded">{devPhoneCode || 'Not sent'}</span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-[7px] shadow-[0_10px_24px_rgba(0,0,0,0.05),_0_20px_48px_rgba(0,0,0,0.05),_0_1px_4px_rgba(0,0,0,0.1)] p-6 pt-5">
          
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-6 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('email')}
              disabled={user?.isEmailVerified}
              className={`flex-1 text-center pb-2 text-[13px] font-bold transition-all cursor-pointer ${
                activeTab === 'email'
                  ? 'border-b-2 border-[#F48024] text-[#242729]'
                  : 'text-[#525960] hover:text-[#242729]'
              } ${user?.isEmailVerified ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              Email {user?.isEmailVerified && '✓'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('phone')}
              disabled={user?.isPhoneVerified && user?.isEmailVerified}
              className={`flex-1 text-center pb-2 text-[13px] font-bold transition-all cursor-pointer ${
                activeTab === 'phone'
                  ? 'border-b-2 border-[#F48024] text-[#242729]'
                  : 'text-[#525960] hover:text-[#242729]'
              } ${user?.isPhoneVerified ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              Phone {user?.isPhoneVerified && '✓'}
            </button>
          </div>

          {activeTab === 'email' ? (
            /* Email Form */
            <form onSubmit={handleVerifyEmail} className="space-y-4">
              <p className="text-[13px] text-[#3B4045] mb-4">
                Enter the 6-digit OTP code sent to <strong className="text-[#242729] font-bold">{user?.email}</strong>.
              </p>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-[15px] text-[#0C0D0E]">
                  Email Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  id="emailCode"
                  value={emailCode}
                  onChange={(e) => setEmailCode(e.target.value.replace(/[^0-9]/g, ''))}
                  required
                  className="w-full p-2 text-sm border border-gray-300 rounded-[3px] focus:outline-none focus:ring-4 focus:ring-[#0074CC]/20 focus:border-[#0074CC] font-mono tracking-widest text-center"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isVerifying || emailCode.length !== 6}
                  className="w-full py-2 bg-[#0A95FF] hover:bg-[#0074CC] text-white rounded-[3px] font-bold text-[13px] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] disabled:opacity-50 transition-colors"
                >
                  {isVerifying ? 'Verifying...' : 'Verify Email'}
                </button>
              </div>

              <div className="flex justify-between items-center text-[12px] text-[#6A737C] mt-2">
                <span>Code valid for 15 mins</span>
                <button
                  type="button"
                  onClick={() => handleResendCode('email')}
                  disabled={emailTimer > 0 || isResendingEmail}
                  className="text-[#0074CC] hover:text-[#0A95FF] font-bold disabled:opacity-50 transition-colors"
                >
                  {emailTimer > 0 ? `Resend in ${emailTimer}s` : 'Resend Code'}
                </button>
              </div>
            </form>
          ) : (
            /* Phone Form */
            <form onSubmit={handleVerifyPhone} className="space-y-4">
              {!user?.phone ? (
                <div className="text-[13px] p-4 bg-[#FDF2F5] text-[#C22E32] rounded-[3px] border border-[#DE4B59]">
                  <p className="mb-2">⚠️ No phone number registered.</p>
                  <button
                    type="button"
                    onClick={() => setShowEditPanel(true)}
                    className="text-[#0074CC] hover:text-[#0A95FF] font-bold underline"
                  >
                    Add Phone Number
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-[13px] text-[#3B4045] mb-4">
                    Enter the 6-digit OTP code sent via SMS to <strong className="text-[#242729] font-bold">{user?.phone}</strong>.
                  </p>

                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-[15px] text-[#0C0D0E]">
                      SMS Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      id="phoneCode"
                      value={phoneCode}
                      onChange={(e) => setPhoneCode(e.target.value.replace(/[^0-9]/g, ''))}
                      required
                      className="w-full p-2 text-sm border border-gray-300 rounded-[3px] focus:outline-none focus:ring-4 focus:ring-[#0074CC]/20 focus:border-[#0074CC] font-mono tracking-widest text-center"
                    />
                  </div>
                </>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isVerifying || !user?.phone || phoneCode.length !== 6}
                  className="w-full py-2 bg-[#0A95FF] hover:bg-[#0074CC] text-white rounded-[3px] font-bold text-[13px] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] disabled:opacity-50 transition-colors"
                >
                  {isVerifying ? 'Verifying...' : 'Verify Phone'}
                </button>
              </div>

              <div className="flex justify-between items-center text-[12px] text-[#6A737C] mt-2">
                <span>Code valid for 15 mins</span>
                <button
                  type="button"
                  onClick={() => handleResendCode('phone')}
                  disabled={phoneTimer > 0 || isResendingPhone || !user?.phone}
                  className="text-[#0074CC] hover:text-[#0A95FF] font-bold disabled:opacity-50 transition-colors"
                >
                  {phoneTimer > 0 ? `Resend in ${phoneTimer}s` : 'Resend Code'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="mt-8 text-center text-[13px]">
          <button
            type="button"
            onClick={() => setShowEditPanel(!showEditPanel)}
            className="text-[#0074CC] hover:text-[#0A95FF] mb-4 block w-full"
          >
            {showEditPanel ? 'Cancel edit' : 'Wrong details? Update Email/Phone'}
          </button>

          {showEditPanel && (
            <div className="bg-white rounded-[7px] shadow-sm p-4 text-left border border-gray-200 mb-4">
              <form onSubmit={handleUpdateContacts} className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[15px] text-[#0C0D0E]">New Email</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    className={`w-full p-2 text-sm border rounded-[3px] focus:outline-none focus:ring-4 focus:ring-[#0074CC]/20 ${
                      editErrors.email ? 'border-red-500' : 'border-gray-300 focus:border-[#0074CC]'
                    }`}
                  />
                  {editErrors.email && <span className="text-[12px] text-red-500">{editErrors.email}</span>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[15px] text-[#0C0D0E]">New Phone</label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className={`w-full p-2 text-sm border rounded-[3px] focus:outline-none focus:ring-4 focus:ring-[#0074CC]/20 ${
                      editErrors.phone ? 'border-red-500' : 'border-gray-300 focus:border-[#0074CC]'
                    }`}
                  />
                  {editErrors.phone && <span className="text-[12px] text-red-500">{editErrors.phone}</span>}
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingContacts}
                  className="w-full py-2 bg-[#E1ECF4] hover:bg-[#B3D3EA] text-[#39739D] rounded-[3px] font-bold text-[13px] border border-[#7AA7C7]"
                >
                  {isUpdatingContacts ? 'Updating...' : 'Save and Resend Codes'}
                </button>
              </form>
            </div>
          )}

          <div className="flex gap-1 justify-center mt-6">
            <button
              onClick={handleLogout}
              className="text-[#C22E32] hover:text-[#DE4B59]"
            >
              Sign Out / Cancel Registration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Verify;
