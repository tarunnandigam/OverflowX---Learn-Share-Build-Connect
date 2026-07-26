import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useToast } from '../contexts/ToastContext';
import API from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  ShieldCheck, 
  RefreshCw, 
  Pencil, 
  ExternalLink, 
  Cake, 
  Clock, 
  Calendar, 
  Mail, 
  Sliders, 
  Cpu, 
  Shield,
  X
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

// Import refactored setting tabs
import PreferencesTab from './Settings/PreferencesTab';
import SecurityTab from './Settings/SecurityTab';
import LanguageTab from './Settings/LanguageTab';
import ProfileTab from './Settings/ProfileTab';
import SubscriptionTab from './Settings/SubscriptionTab';
import EmailTab from './Settings/EmailTab';

const Settings = () => {
  const { user } = useSelector((state) => state.auth);
  const { addToast } = useToast();
  const { t, currentLanguage, requestLanguageChange, verifyLanguageChange } = useLanguage();

  // Selected Section State
  const [activeSection, setActiveSection] = useState('preferences');
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['preferences', 'security', 'language', 'subscription', 'edit-profile', 'email-settings'].includes(tab)) {
      setActiveSection(tab);
    }
  }, [location]);

  // Scroll to top of viewport when active settings section changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeSection]);

  // Preferences Toggles States
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem('user-preferences');
    return saved ? JSON.parse(saved) : {
      highContrast: false,
      newEditor: true,
      keyboardShortcuts: false,
      leftNavigation: true,
      hotNetworkQuestions: true,
      stagingGround: true,
      tagGuidance: false,
      experiments: true,
    };
  });

  // Selected Theme State
  const [selectedTheme, setSelectedTheme] = useState(() => {
    return localStorage.getItem('theme-preference') || 'light';
  });

  // Excluded Companies List State
  const [excludeInput, setExcludeInput] = useState('');
  const [excludedCompanies, setExcludedCompanies] = useState(['Meta', 'Alphabet', 'Amazon']);

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});

  // Language Settings State
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage);
  const [isSwappingLanguage, setIsSwappingLanguage] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [devOtp, setDevOtp] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [swapTarget, setSwapTarget] = useState('');

  // Profile Edit fields
  const [displayName, setDisplayName] = useState(user?.username || 'Anshuman Varma');
  const [bioText, setBioText] = useState(user?.bio || 'Full stack engineer building OverflowX.');

  // Countdown timer for OTP
  useEffect(() => {
    let timer;
    if (isVerifyModalOpen && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isVerifyModalOpen, countdown]);

  // Apply Theme Helper
  const applyTheme = (themeMode) => {
    const root = document.documentElement;
    root.classList.remove('dark');
    if (themeMode === 'dark') {
      root.classList.add('dark');
    } else if (themeMode === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemPrefersDark) {
        root.classList.add('dark');
      }
    }
  };

  const handleThemeChange = (themeMode) => {
    setSelectedTheme(themeMode);
    localStorage.setItem('theme-preference', themeMode);
    applyTheme(themeMode);
    addToast(`Theme preference updated to ${themeMode}.`, 'success');
  };

  const handlePreferenceToggle = (key) => {
    const updated = { ...preferences, [key]: !preferences[key] };
    setPreferences(updated);
    localStorage.setItem('user-preferences', JSON.stringify(updated));
    addToast('Preferences saved.', 'success');
  };

  const handleAddCompany = (e) => {
    e.preventDefault();
    if (excludeInput.trim() && !excludedCompanies.includes(excludeInput.trim())) {
      setExcludedCompanies([...excludedCompanies, excludeInput.trim()]);
      setExcludeInput('');
      addToast('Company excluded from ad listings.', 'success');
    }
  };

  const handleRemoveCompany = (companyName) => {
    setExcludedCompanies(excludedCompanies.filter(c => c !== companyName));
    addToast('Company exclusion removed.', 'info');
  };

  const validatePassword = () => {
    const tempErrors = {};
    if (!currentPassword) {
      tempErrors.currentPassword = 'Current password is required';
    }
    if (!newPassword) {
      tempErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 6) {
      tempErrors.newPassword = 'New password must be at least 6 characters';
    }
    if (newPassword !== confirmPassword) {
      tempErrors.confirmPassword = 'Passwords do not match';
    }
    setPasswordErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;

    setIsPasswordLoading(true);
    try {
      await API.put('/auth/update-password', {
        currentPassword,
        newPassword,
      });
      addToast('Password updated successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordErrors({});
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update password. Check your inputs.';
      addToast(msg, 'error');
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleRequestLanguage = async (e) => {
    e.preventDefault();
    if (selectedLanguage === currentLanguage) {
      addToast('Please select a different language', 'warning');
      return;
    }

    setIsSwappingLanguage(true);
    try {
      const data = await requestLanguageChange(selectedLanguage);
      setSwapTarget(selectedLanguage);
      setDevOtp(data._devOtp || '');
      setCountdown(60);
      setIsVerifyModalOpen(true);
      addToast('Verification code sent successfully.', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to request language change.';
      addToast(msg, 'error');
    } finally {
      setIsSwappingLanguage(false);
    }
  };

  const handleVerifyLanguage = async (e) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      addToast('Please enter a 6-digit code', 'warning');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      await verifyLanguageChange(otpCode);
      addToast('Language switched successfully!', 'success');
      setIsVerifyModalOpen(false);
      setOtpCode('');
      setDevOtp('');
    } catch (err) {
      addToast('Invalid verification code.', 'error');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    try {
      const data = await requestLanguageChange(swapTarget);
      setDevOtp(data._devOtp || '');
      setCountdown(60);
      addToast('Verification code resent.', 'success');
    } catch (err) {
      addToast('Failed to resend code', 'error');
    }
  };

  const handleProfileSave = (e) => {
    e.preventDefault();
    addToast('Profile changes saved successfully (Simulation)!', 'success');
  };

  const getMemberDays = () => {
    if (!user?.createdAt) return `4 ${t('days')}`;
    const diffTime = Math.abs(new Date() - new Date(user.createdAt));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} ${diffDays !== 1 ? t('days') : t('day')}`;
  };

  const getLastSeenText = () => {
    if (!user?.loginHistory || user.loginHistory.length === 0) return new Date().toLocaleString();
    return new Date(user.loginHistory[user.loginHistory.length - 1].loginTime).toLocaleString();
  };

  return (
    <div className="max-w-[1100px] mx-auto text-[13px] text-gray-800 font-sans">
      
      {/* Top Header Profile Card */}
      <div className="relative mb-5 pt-4">
        <div className="flex flex-wrap items-center gap-4 md:gap-5 pb-5 border-b border-gray-200">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-md border border-gray-200 overflow-hidden shadow-sm flex-shrink-0">
            {user?.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-purple-600 text-white flex items-center justify-center font-bold text-2xl uppercase">
                {user?.username?.charAt(0)}
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
              {displayName}
            </h1>
            
            <ul className="flex flex-wrap items-center gap-3.5 mt-2 text-xs text-gray-500 font-normal">
              <li className="flex items-center gap-1">
                <Cake size={14} className="text-gray-400" />
                <span>{t('memberFor')} <span className="text-gray-800 font-medium">{getMemberDays()}</span></span>
              </li>
              <li className="flex items-center gap-1">
                <Clock size={14} className="text-gray-400" />
                <span>{t('lastSeen')} <span className="text-gray-800 font-medium">{getLastSeenText()}</span></span>
              </li>
              <li className="flex items-center gap-1">
                <Calendar size={14} className="text-gray-400" />
                <span>{t('visited')} {user?.loginHistory ? new Set(user.loginHistory.map(log => new Date(log.loginTime).toDateString())).size : 1} {t('daysTotal')}</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-wrap gap-2 sm:ml-auto">
            <button 
              onClick={() => setActiveSection('edit-profile')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-[3px] text-xs font-medium shadow-sm transition-all cursor-pointer"
            >
              <Pencil size={12} className="text-yellow-600" />
              <span>Edit profile</span>
            </button>
            <button 
              onClick={() => addToast('Redirecting to StackExchange Network...', 'info')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-[3px] text-xs font-medium shadow-sm transition-all cursor-pointer"
            >
              <span>Network profile</span>
              <ExternalLink size={11} className="text-blue-500" />
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center border-b border-gray-200 mt-4 text-[13px]">
          <Link to={`/profile/${user?.username}`} className="px-4 py-2 text-gray-600 hover:text-gray-900 border-b-2 border-transparent transition-colors">
            Profile
          </Link>
          <Link to={`/profile/${user?.username}`} className="px-4 py-2 text-gray-600 hover:text-gray-900 border-b-2 border-transparent transition-colors">
            Activity
          </Link>
          <button onClick={() => addToast('Saves list is empty.', 'info')} className="px-4 py-2 text-gray-600 hover:text-gray-900 border-b-2 border-transparent transition-colors cursor-pointer">
            Saves
          </button>
          <button className="px-4 py-2 font-bold text-gray-900 border-b-2 border-orange-500 cursor-default bg-gray-50">
            Settings
          </button>
        </div>
      </div>

      {/* Main Settings Body */}
      <div className="flex flex-col md:flex-row gap-6 pt-2 pb-16">
        
        {/* Left Side Navigation Directory */}
        <div className="w-full md:w-[220px] flex-shrink-0">
          <nav className="flex flex-col space-y-4" aria-label="Settings Directory">
            
            {/* Personal Info group */}
            <div>
              <div className="px-3 text-[11px] font-bold text-gray-900 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Pencil size={11} className="text-gray-400" />
                <span>Personal Information</span>
              </div>
              <ul className="space-y-0.5">
                <li>
                  <button 
                    onClick={() => setActiveSection('edit-profile')}
                    className={`w-full text-left px-3 py-1.5 rounded-full text-xs font-normal transition-all cursor-pointer ${
                      activeSection === 'edit-profile' ? 'bg-[#F1F2F3] font-bold text-gray-900' : 'hover:bg-gray-100 text-gray-650'
                    }`}
                  >
                    Edit profile
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveSection('change-password')}
                    className={`w-full text-left px-3 py-1.5 rounded-full text-xs font-normal transition-all cursor-pointer ${
                      activeSection === 'change-password' ? 'bg-[#F1F2F3] font-bold text-gray-900' : 'hover:bg-gray-100 text-gray-655'
                    }`}
                  >
                    Change password
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => addToast('Account deletion is simulated. No action required.', 'warning')}
                    className="w-full text-left px-3 py-1.5 rounded-full text-xs font-normal hover:bg-gray-100 text-gray-655 text-red-650 cursor-pointer"
                  >
                    Delete profile
                  </button>
                </li>
              </ul>
            </div>

            {/* Email settings group */}
            <div>
              <div className="px-3 text-[11px] font-bold text-gray-900 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Mail size={11} className="text-gray-400" />
                <span>Email Settings</span>
              </div>
              <ul className="space-y-0.5">
                <li>
                  <button 
                    onClick={() => setActiveSection('email-settings')}
                    className={`w-full text-left px-3 py-1.5 rounded-full text-xs font-normal transition-all cursor-pointer ${
                      activeSection === 'email-settings' ? 'bg-[#F1F2F3] font-bold text-gray-900' : 'hover:bg-gray-100 text-gray-655'
                    }`}
                  >
                    Edit email settings
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => addToast('Tag watch preferences loaded.', 'info')}
                    className="w-full text-left px-3 py-1.5 rounded-full text-xs font-normal hover:bg-gray-100 text-gray-655 cursor-pointer"
                  >
                    Tag watching & ignoring
                  </button>
                </li>
              </ul>
            </div>

            {/* Site settings group */}
            <div>
              <div className="px-3 text-[11px] font-bold text-gray-900 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Sliders size={11} className="text-gray-400" />
                <span>Site settings</span>
              </div>
              <ul className="space-y-0.5">
                <li>
                  <button 
                    onClick={() => setActiveSection('preferences')}
                    className={`w-full text-left px-3 py-1.5 rounded-full text-xs font-normal transition-all cursor-pointer ${
                      activeSection === 'preferences' ? 'bg-[#F1F2F3] font-bold text-gray-900' : 'hover:bg-gray-100 text-gray-655'
                    }`}
                  >
                    Preferences
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveSection('language')}
                    className={`w-full text-left px-3 py-1.5 rounded-full text-xs font-normal transition-all cursor-pointer ${
                      activeSection === 'language' ? 'bg-[#F1F2F3] font-bold text-gray-900' : 'hover:bg-gray-100 text-gray-655'
                    }`}
                  >
                    Language Settings
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveSection('subscription')}
                    className={`w-full text-left px-3 py-1.5 rounded-full text-xs font-normal transition-all cursor-pointer ${
                      activeSection === 'subscription' ? 'bg-[#F1F2F3] font-bold text-gray-900' : 'hover:bg-gray-100 text-gray-655'
                    }`}
                  >
                    {t('subscriptionPlan')}
                  </button>
                </li>
              </ul>
            </div>

            {/* Access group */}
            <div>
              <div className="px-3 text-[11px] font-bold text-gray-900 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Shield size={11} className="text-gray-400" />
                <span>Access</span>
              </div>
              <ul className="space-y-0.5">
                <li>
                  <button 
                    onClick={() => addToast('Redirecting to Collectives administration...', 'info')}
                    className="w-full text-left px-3 py-1.5 rounded-full text-xs font-normal hover:bg-gray-100 text-gray-650 cursor-pointer"
                  >
                    Collectives
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => addToast('Single Sign-On login records verified.', 'info')}
                    className="w-full text-left px-3 py-1.5 rounded-full text-xs font-normal hover:bg-gray-100 text-gray-650 cursor-pointer"
                  >
                    Logins
                  </button>
                </li>
              </ul>
            </div>

            {/* API group */}
            <div>
              <div className="px-3 text-[11px] font-bold text-gray-900 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Cpu size={11} className="text-gray-400" />
                <span>API integrations</span>
              </div>
              <ul className="space-y-0.5">
                <li>
                  <button 
                    onClick={() => addToast('No third-party developer integrations active.', 'info')}
                    className="w-full text-left px-3 py-1.5 rounded-full text-xs font-normal hover:bg-gray-100 text-gray-650 cursor-pointer"
                  >
                    Authorized applications
                  </button>
                </li>
              </ul>
            </div>
          </nav>
        </div>

        {/* Right Active Settings Panel */}
        <div className="flex-1 min-w-0 bg-white border border-gray-200 rounded-lg p-5 md:p-6 shadow-sm">
          
          {activeSection === 'preferences' && (
            <PreferencesTab 
              selectedTheme={selectedTheme}
              handleThemeChange={handleThemeChange}
              preferences={preferences}
              handlePreferenceToggle={handlePreferenceToggle}
              excludeInput={excludeInput}
              setExcludeInput={setExcludeInput}
              excludedCompanies={excludedCompanies}
              handleAddCompany={handleAddCompany}
              handleRemoveCompany={handleRemoveCompany}
            />
          )}

          {activeSection === 'change-password' && (
            <SecurityTab 
              currentPassword={currentPassword}
              setCurrentPassword={setCurrentPassword}
              newPassword={newPassword}
              setNewPassword={setNewPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
              passwordErrors={passwordErrors}
              isPasswordLoading={isPasswordLoading}
              handlePasswordSubmit={handlePasswordSubmit}
            />
          )}

          {activeSection === 'language' && (
            <LanguageTab 
              selectedLanguage={selectedLanguage}
              setSelectedLanguage={setSelectedLanguage}
              isSwappingLanguage={isSwappingLanguage}
              handleRequestLanguage={handleRequestLanguage}
            />
          )}

          {activeSection === 'subscription' && (
            <SubscriptionTab />
          )}

          {activeSection === 'email-settings' && (
            <EmailTab />
          )}

          {activeSection === 'edit-profile' && (
            <ProfileTab 
              displayName={displayName}
              setDisplayName={setDisplayName}
              bioText={bioText}
              setBioText={setBioText}
              handleProfileSave={handleProfileSave}
            />
          )}

        </div>
      </div>

      {/* OTP VERIFICATION MODAL OVERLAY */}
      {isVerifyModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-200">
          <div className="bg-white w-full max-w-[420px] rounded-lg shadow-2xl p-6 relative transform scale-100 transition-all duration-200">
            
            <button 
              onClick={() => {
                setIsVerifyModalOpen(false);
                setOtpCode('');
                setDevOtp('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-full transition-all"
            >
              <X size={18} />
            </button>

            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-[#E1ECF4] flex items-center justify-center mb-4 border border-[#7AA7C7]">
                <ShieldCheck className="text-[#0A95FF] w-6 h-6" />
              </div>

              <h3 className="text-[20px] font-normal mb-2 text-center text-gray-900 font-sans">
                Verify Identity
              </h3>
              <p className="text-[12.5px] text-gray-600 text-center mb-6 leading-relaxed">
                Please enter the 6-digit code sent to your {swapTarget === 'fr' ? 'Email' : 'Mobile'}.
              </p>

              <form onSubmit={handleVerifyLanguage} className="w-full space-y-4">
                <div className="flex flex-col gap-1">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    required
                    className="w-full p-2.5 text-center text-xl tracking-widest border border-gray-305 border-gray-300 rounded focus:outline-none focus:ring-4 focus:ring-[#0074CC]/20 focus:border-[#0074CC]"
                  />
                </div>

                <div className="flex justify-between items-center text-[12px]">
                  <span className="text-gray-500">
                    Code valid for a few minutes
                  </span>
                  {countdown > 0 ? (
                    <span className="text-gray-600 font-bold">
                      Resend in {countdown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="text-[#0074CC] hover:text-[#0A95FF] flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <RefreshCw size={12} />
                      Resend Code
                    </button>
                  )}
                </div>

                {/* Dev Assistant Banner */}
                {import.meta.env.DEV && devOtp && (
                  <div className="p-3.5 bg-blue-50 border border-[#7AA7C7] rounded">
                    <div className="text-[10px] font-bold text-[#0074CC] uppercase tracking-wider mb-1">
                      Developer Mode Assistance
                    </div>
                    <div className="text-xs text-gray-700">
                      Auto-received OTP: <strong className="font-mono text-[13.5px] select-all bg-white border px-1 py-0.5 rounded ml-1 text-gray-900">{devOtp}</strong>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isVerifyingOtp || otpCode.length !== 6}
                    className="flex-1 py-2 bg-[#0A95FF] hover:bg-[#0074CC] text-white rounded font-bold text-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    {isVerifyingOtp ? 'Verifying...' : 'Verify code'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsVerifyModalOpen(false);
                      setOtpCode('');
                      setDevOtp('');
                    }}
                    className="flex-1 py-2 text-gray-500 hover:bg-gray-100 rounded text-xs font-bold border border-transparent hover:border-gray-250 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
