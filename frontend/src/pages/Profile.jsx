import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  MapPin, Calendar, Clock, Edit2, X, Cake, ExternalLink,
  ShieldCheck, RefreshCw, Mail, Sliders, Cpu, Shield 
} from 'lucide-react';
import API from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { updateUser } from '../store/authSlice';
import EmptyState from '../components/common/EmptyState';
import { useLanguage } from '../contexts/LanguageContext';
import { getMediaUrl } from '../utils/media';
import PreferencesTab from './Settings/PreferencesTab';
import SecurityTab from './Settings/SecurityTab';
import LanguageTab from './Settings/LanguageTab';
import ProfileTab from './Settings/ProfileTab';
import SubscriptionTab from './Settings/SubscriptionTab';
import EmailTab from './Settings/EmailTab';

const Profile = () => {
  const { username } = useParams();
  const { user: loggedInUser } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const { addToast } = useToast();

  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Profile');

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    avatar: '',
    bio: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [avatarSource, setAvatarSource] = useState('upload'); // 'upload' or 'url'
  const [isUploading, setIsUploading] = useState(false);

  // Settings Tab Inner Section State
  const [settingsSection, setSettingsSection] = useState('preferences');

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
  const { t, currentLanguage, requestLanguageChange, verifyLanguageChange } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage);
  const [isSwappingLanguage, setIsSwappingLanguage] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [devOtp, setDevOtp] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [swapTarget, setSwapTarget] = useState('');

  // Point Transfer State
  const [transferPointsVal, setTransferPointsVal] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  const handleTransferPoints = async (e) => {
    e.preventDefault();
    const pts = parseInt(transferPointsVal, 10);
    if (!pts || pts <= 0) {
      addToast('Please enter a valid positive number of points', 'warning');
      return;
    }

    setIsTransferring(true);
    try {
      const res = await API.post(`/users/${profileUser._id}/transfer-points`, { points: pts });
      addToast(res.data.message, 'success');
      dispatch(updateUser({ reputation: res.data.senderReputation }));
      setProfileUser((prev) => ({ ...prev, reputation: res.data.receiverReputation }));
      setTransferPointsVal('');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to transfer points', 'error');
    } finally {
      setIsTransferring(false);
    }
  };

  // Profile Edit fields (in Settings)
  const [displayName, setDisplayName] = useState(loggedInUser?.username || '');
  const [bioText, setBioText] = useState(loggedInUser?.bio || '');

  // Calculate top tags dynamically based on user posts
  const topTags = useMemo(() => {
    if (!posts || posts.length === 0) return [];
    
    const tagScores = {};
    posts.forEach(post => {
      if (!post.tags || !Array.isArray(post.tags)) return;
      const upvotesCount = post.upvotes?.length ?? post.likes?.length ?? 0;
      const downvotesCount = post.downvotes?.length ?? 0;
      const score = upvotesCount - downvotesCount;
      
      post.tags.forEach(tag => {
        const normalizedTag = tag.trim().toLowerCase();
        if (normalizedTag) {
          tagScores[normalizedTag] = (tagScores[normalizedTag] || 0) + score;
        }
      });
    });
    
    // Sort descending by score and pick top 5
    return Object.entries(tagScores)
      .map(([name, score]) => ({ name, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [posts]);

  // Sync displayName and bioText when profileUser or loggedInUser is loaded
  useEffect(() => {
    if (loggedInUser) {
      setDisplayName(loggedInUser.username || '');
      setBioText(loggedInUser.bio || '');
    }
  }, [loggedInUser]);

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

  const isOwnProfile = loggedInUser?.username === username;

  useEffect(() => {
    fetchProfile();
  }, [username]);

  // Scroll to top of viewport when active tab or settings sub-section changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab, settingsSection]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await API.get(`/users/${username}`);
      const userData = response.data.user;
      if (userData && userData.friends) {
        userData.friends = userData.friends.filter(f => f && f._id && f.username);
      }
      setProfileUser(userData);
      setPosts(response.data.posts);
      setEditForm({
        avatar: response.data.user.avatar || '',
        bio: response.data.user.bio || ''
      });
    } catch (err) {
      addToast('Failed to load profile', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFriend = async () => {
    try {
      const res = await API.post(`/users/${profileUser._id}/friend`);
      addToast(res.data.message, 'success');
      fetchProfile();
    } catch (err) {
      addToast('Failed to change friendship status', 'error');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Remove coverImage from the API call or just send what we have
      const response = await API.put('/users/profile', editForm);
      setProfileUser((prev) => ({ ...prev, ...response.data }));
      dispatch(updateUser(response.data));
      setIsEditModalOpen(false);
      addToast('Profile updated successfully', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    setIsUploading(true);
    try {
      const response = await API.post('/users/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const relativeUrl = response.data.url;
      const baseUrl = import.meta.env.VITE_API_URL.replace('/api', '');
      const absoluteUrl = `${baseUrl}${relativeUrl}`;
      setEditForm((prev) => ({ ...prev, avatar: absoluteUrl }));
      addToast('Image uploaded successfully', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to upload image', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-[1100px] mx-auto p-6 animate-pulse">
        <div className="flex gap-4">
          <div className="w-[128px] h-[128px] bg-gray-200 rounded" />
          <div className="flex-1 space-y-4 py-2">
            <div className="w-1/3 h-8 bg-gray-200 rounded" />
            <div className="w-1/4 h-4 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="pt-10 max-w-[1100px] mx-auto">
        <EmptyState title="User not found" message="The user you are looking for does not exist." />
      </div>
    );
  }

  // Calculate stats based on posts and user profile
  const reputation = profileUser?.reputation || 1;
  const answers = profileUser?.answersCount !== undefined ? profileUser.answersCount : 0;
  const questions = profileUser?.questionsCount !== undefined ? profileUser.questionsCount : posts.filter(p => !p.isSocial).length;
  
  const formatReached = (count) => {
    if (count === undefined || count === null) return '0';
    if (count < 1000) return count.toString();
    return '~' + (count / 1000).toFixed(1) + 'k';
  };
  const reached = formatReached(profileUser?.reachedCount);

  const goldBadges = Math.floor(reputation / 500);
  const silverBadges = Math.floor((reputation % 500) / 100);
  const bronzeBadges = Math.floor((reputation % 100) / 25);

  const isFriend = profileUser?.friends?.some(f => f && f._id === loggedInUser?._id);

  const getMemberDays = () => {
    if (!profileUser?.createdAt) return `4 ${t('days')}`;
    const diffTime = Math.abs(new Date() - new Date(profileUser.createdAt));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} ${diffDays !== 1 ? t('days') : t('day')}`;
  };

  const getLastSeenText = () => {
    if (!profileUser?.lastSeenTime) return t('thisWeek');
    return new Date(profileUser.lastSeenTime).toLocaleString();
  };

  return (
    <div className="max-w-[1100px] mx-auto text-[13px] text-gray-800 p-4 sm:p-6 font-sans">
      
      {/* Top Header Profile Card */}
      <div className="relative mb-5 pt-4">
        <div className="flex flex-wrap items-center gap-4 md:gap-5 pb-5 border-b border-gray-200">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-md border border-gray-200 overflow-hidden shadow-sm flex-shrink-0">
            {profileUser.avatar ? (
              <img src={getMediaUrl(profileUser.avatar)} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-purple-600 text-white flex items-center justify-center font-bold text-2xl uppercase">
                {profileUser.username?.charAt(0)}
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
              {profileUser.username}
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
                <span>{t('visited')} {profileUser?.visitedDaysCount || 1} {t('daysTotal')}</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-wrap gap-2 sm:ml-auto">
            {isOwnProfile ? (
              <>
                <button 
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-[3px] text-xs font-medium shadow-sm transition-all cursor-pointer"
                >
                  <Edit2 size={12} className="text-yellow-600" />
                  <span>Edit profile</span>
                </button>
                <button 
                  onClick={() => addToast('Redirecting to StackExchange Network...', 'info')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-[3px] text-xs font-medium shadow-sm transition-all cursor-pointer"
                >
                  <span>Network profile</span>
                  <ExternalLink size={11} className="text-blue-500" />
                </button>
              </>
            ) : (
              <button
                onClick={handleToggleFriend}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-bold transition-all shadow-sm border ${
                  isFriend
                    ? 'bg-red-50 text-red-600 hover:bg-red-100 border-red-200'
                    : 'bg-[#e1ecf4] text-[#39739d] hover:bg-[#b3d3ea] border-[#7aa7c7]'
                }`}
              >
                {isFriend ? 'Unfriend' : 'Add Friend'}
              </button>
            )}
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center border-b border-gray-200 mt-4 text-[13px]">
          {(isOwnProfile 
            ? ['Profile', 'Activity', 'Saves', 'Settings', 'Login History'] 
            : ['Profile', 'Activity']
          ).map(tab => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => {
                  if (tab === 'Saves') {
                    addToast('Saves list is empty.', 'info');
                    return;
                  }
                  setActiveTab(tab);
                }}
                className={`px-4 py-2 transition-colors cursor-pointer ${
                  isActive 
                    ? 'font-bold text-gray-900 border-b-2 border-orange-500 bg-gray-50' 
                    : 'text-gray-600 hover:text-gray-900 border-b-2 border-transparent'
                }`}
              >
                {tab === 'Profile' ? t('profile') :
                 tab === 'Activity' ? t('activity') :
                 tab === 'Saves' ? t('saves') :
                 tab === 'Settings' ? t('settings') :
                 tab === 'Login History' ? t('loginHistory') : tab}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === 'Profile' && (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column: Stats */}
          <div className="w-full lg:w-[250px] flex-shrink-0">
            <h2 className="text-[21px] text-gray-900 mb-2 font-medium">Stats</h2>
            <div className="border border-gray-300 rounded p-3 bg-white grid grid-cols-2 gap-3 mb-6 shadow-sm">
              <div className="flex flex-col">
                <span className="text-[17px] font-medium text-gray-900">{reputation.toLocaleString()}</span>
                <span className="text-gray-500">reputation</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[17px] font-medium text-gray-900">{reached}</span>
                <span className="text-gray-500">reached</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[17px] font-medium text-gray-900">{answers}</span>
                <span className="text-gray-500">answers</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[17px] font-medium text-gray-900">{questions}</span>
                <span className="text-gray-500">questions</span>
              </div>
            </div>

            <h2 className="text-[21px] text-gray-900 mb-2 font-medium">Badges</h2>
            <div className="border border-gray-300 rounded p-3 bg-white flex flex-col gap-2.5 mb-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 bg-[#ffcc01] rounded-full"></span>
                <span className="font-semibold text-gray-800 text-[13px]">{goldBadges} Gold Badges</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 bg-[#b4b8bc] rounded-full"></span>
                <span className="font-semibold text-gray-800 text-[13px]">{silverBadges} Silver Badges</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 bg-[#d1a684] rounded-full"></span>
                <span className="font-semibold text-gray-800 text-[13px]">{bronzeBadges} Bronze Badges</span>
              </div>
            </div>

            <h2 className="text-[21px] text-gray-900 mb-2 font-medium">Friends ({profileUser.friends?.length || 0})</h2>
            <div className="border border-gray-300 rounded p-3 bg-white flex flex-col gap-2 mb-6 shadow-sm max-h-[200px] overflow-y-auto">
              {!profileUser.friends || profileUser.friends.length === 0 ? (
                <span className="text-gray-400 italic">No friends added yet.</span>
              ) : (
                profileUser.friends.map(friend => (
                  <div key={friend._id} className="flex items-center gap-2">
                    {friend.avatar ? (
                      <img src={getMediaUrl(friend.avatar)} alt={friend.username} className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-[9px] uppercase">
                        {friend.username.charAt(0)}
                      </div>
                    )}
                    <Link to={`/profile/${friend.username}`} className="text-[#0074CC] hover:text-[#0A95FF] truncate font-medium">
                      {friend.username}
                    </Link>
                  </div>
                ))
              )}
            </div>

            {!isOwnProfile && (
              <>
                <h2 className="text-[21px] text-gray-900 mb-2 font-medium">💰 Transfer Points</h2>
                <div className="border border-gray-300 rounded p-4 bg-white flex flex-col gap-3 mb-6 shadow-sm">
                  <div className="text-gray-600 text-xs flex justify-between items-center">
                    <span>Your Balance:</span>
                    <strong className="text-gray-900 font-bold text-sm bg-gray-50 border border-gray-200 px-2 py-0.5 rounded">
                      {(loggedInUser?.reputation || 0).toLocaleString()} pts
                    </strong>
                  </div>

                  {(loggedInUser?.reputation || 0) <= 10 ? (
                    <div className="p-2.5 bg-amber-50 border border-amber-250 text-amber-800 text-[11px] rounded leading-relaxed">
                      ⚠️ You must have more than 10 points to transfer points to other users.
                    </div>
                  ) : (
                    <form onSubmit={handleTransferPoints} className="space-y-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] text-gray-500 font-bold uppercase">Points to send</label>
                        <input
                          type="number"
                          placeholder="Enter amount..."
                          min="1"
                          max={loggedInUser.reputation}
                          value={transferPointsVal}
                          onChange={(e) => setTransferPointsVal(e.target.value.replace(/\D/g, ''))}
                          required
                          className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:border-[#0074CC] focus:ring-4 focus:ring-[#0074CC]/20 outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isTransferring || !transferPointsVal}
                        className="w-full bg-[#0A95FF] hover:bg-[#0074CC] text-white py-1.5 rounded text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        {isTransferring ? 'Transferring...' : 'Transfer Points'}
                      </button>
                    </form>
                  )}
                </div>
              </>
            )}
            
            <h2 className="text-[21px] text-gray-900 mb-2 font-medium">Top tags</h2>
            <div className="border border-gray-300 rounded p-3 bg-white shadow-sm flex flex-col gap-2">
              {topTags.length === 0 ? (
                <span className="text-gray-400 italic">No tags used yet.</span>
              ) : (
                topTags.map(tag => (
                  <div key={tag.name} className="flex items-center justify-between">
                    <span className="text-[#39739D] bg-[#E1ECF4] px-1.5 py-0.5 rounded-[3px] text-[12px] hover:bg-[#D0E3F1] cursor-pointer">
                      {tag.name}
                    </span>
                    <div className="text-gray-500 flex gap-4">
                      <span className="text-gray-900 font-bold">{tag.score}</span> <span>score</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: About & Posts */}
          <div className="flex-1 min-w-0">
            <h2 className="text-[21px] text-gray-900 mb-2 font-medium">About</h2>
            <div className="mb-8 text-[15px] leading-relaxed text-gray-900 whitespace-pre-line">
              {profileUser.bio ? (
                profileUser.bio
              ) : (
                <span className="text-gray-400 italic">
                  {isOwnProfile ? 'Your about me is currently blank.' : 'Apparently, this user prefers to keep an air of mystery about them.'}
                </span>
              )}
            </div>

            <div className="flex justify-between items-center mb-2">
              <h2 className="text-[21px] text-gray-900 font-medium">Top posts</h2>
            </div>
            
            <div className="border border-gray-300 rounded bg-white shadow-sm overflow-hidden">
              {posts.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-[15px]">
                  You have not created any posts yet.
                </div>
              ) : (
                <div className="flex flex-col">
                  {posts.slice(0, 5).map((post, idx) => (
                    <div key={post._id} className={`flex items-center p-3 hover:bg-gray-50 ${idx !== posts.length - 1 ? 'border-b border-gray-200' : ''}`}>
                      <div className="w-[48px] flex-shrink-0 text-right pr-3">
                        <span className={`inline-block px-2 py-1 rounded text-[12px] ${post.likes?.length > 5 ? 'bg-green-600 text-white' : post.likes?.length > 0 ? 'border border-green-600 text-green-700' : 'text-gray-500'}`}>
                          {post.likes?.length || 0}
                        </span>
                      </div>
                      <Link to="/" className="flex-1 text-[#0074CC] hover:text-[#0A95FF] truncate font-medium">
                        {post.caption || 'Untitled Post'}
                      </Link>
                      <div className="text-gray-500 text-[12px] w-[90px] text-right flex-shrink-0">
                        {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Login History' && isOwnProfile && (
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="text-[21px] text-gray-900 mb-1 font-medium">Login History</h2>
            <p className="text-gray-500 mb-2">
              Here is a list of recent logins to your account. If you see any suspicious activity, please change your password immediately.
            </p>
          </div>

          <div className="border border-gray-300 rounded bg-white shadow-sm overflow-hidden">
            {!profileUser.loginHistory || profileUser.loginHistory.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-[15px]">
                No login history records found.
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-gray-200">
                {[...profileUser.loginHistory].reverse().map((record, index) => (
                  <div key={record._id || index} className="p-4 hover:bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0 mt-0.5">
                        {record.device === 'mobile' ? (
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                        ) : record.device === 'laptop' ? (
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="2" y1="20" x2="22" y2="20"></line><line x1="12" y1="17" x2="12" y2="20"></line></svg>
                        ) : (
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><rect x="2" y="3" width="20" height="12" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="15" x2="12" y2="21"></line></svg>
                        )}
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-gray-900 text-sm">
                            {record.browser} on {record.os}
                          </span>
                          <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wide rounded bg-gray-100 text-gray-600 border border-gray-200">
                            {record.device}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-gray-500 text-[12px]">
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                            IP: <span className="font-mono text-gray-700 font-medium">{record.ipAddress || 'Unknown'}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} className="text-gray-400" />
                            {new Date(record.loginTime).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {record.browser === 'Google Chrome' && (
                      <div className="self-start sm:self-center flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full">
                        <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                        Email OTP Verified
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'Settings' && isOwnProfile && (
        <div className="flex flex-col md:flex-row gap-6 pt-2 pb-16">
          {/* Left Side Navigation Directory */}
          <div className="w-full md:w-[220px] flex-shrink-0">
            <nav className="flex flex-col space-y-4" aria-label="Settings Directory">
              {/* Personal Info group */}
              <div>
                <div className="px-3 text-[11px] font-bold text-gray-900 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Edit2 size={11} className="text-gray-400" />
                  <span>{t('personalInformation')}</span>
                </div>
                <ul className="space-y-0.5">
                  <li>
                    <button 
                      onClick={() => setSettingsSection('edit-profile')}
                      className={`w-full text-left px-3 py-1.5 rounded-full text-xs font-normal transition-all cursor-pointer ${
                        settingsSection === 'edit-profile' ? 'bg-[#F1F2F3] font-bold text-gray-900' : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      {t('editProfile')}
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => setSettingsSection('change-password')}
                      className={`w-full text-left px-3 py-1.5 rounded-full text-xs font-normal transition-all cursor-pointer ${
                        settingsSection === 'change-password' ? 'bg-[#F1F2F3] font-bold text-gray-900' : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      {t('changePassword')}
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => addToast('Account deletion is simulated. No action required.', 'warning')}
                      className="w-full text-left px-3 py-1.5 rounded-full text-xs font-normal hover:bg-gray-100 text-red-650 cursor-pointer"
                    >
                      {t('deleteProfile')}
                    </button>
                  </li>
                </ul>
              </div>

              {/* Email settings group */}
              <div>
                <div className="px-3 text-[11px] font-bold text-gray-900 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Mail size={11} className="text-gray-400" />
                  <span>{t('emailSettings')}</span>
                </div>
                <ul className="space-y-0.5">
                  <li>
                    <button 
                      onClick={() => setSettingsSection('email-settings')}
                      className={`w-full text-left px-3 py-1.5 rounded-full text-xs font-normal transition-all cursor-pointer ${
                        settingsSection === 'email-settings' ? 'bg-[#F1F2F3] font-bold text-gray-900' : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      {t('editEmailSettings')}
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => addToast('Tag watch preferences loaded.', 'info')}
                      className="w-full text-left px-3 py-1.5 rounded-full text-xs font-normal hover:bg-gray-100 text-gray-600 cursor-pointer"
                    >
                      {t('tagPreferences')}
                    </button>
                  </li>
                </ul>
              </div>

              {/* Site settings group */}
              <div>
                <div className="px-3 text-[11px] font-bold text-gray-900 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Sliders size={11} className="text-gray-400" />
                  <span>{t('siteSettings')}</span>
                </div>
                <ul className="space-y-0.5">
                  <li>
                    <button 
                      onClick={() => setSettingsSection('preferences')}
                      className={`w-full text-left px-3 py-1.5 rounded-full text-xs font-normal transition-all cursor-pointer ${
                        settingsSection === 'preferences' ? 'bg-[#F1F2F3] font-bold text-gray-900' : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      {t('preferences')}
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => setSettingsSection('language')}
                      className={`w-full text-left px-3 py-1.5 rounded-full text-xs font-normal transition-all cursor-pointer ${
                        settingsSection === 'language' ? 'bg-[#F1F2F3] font-bold text-gray-900' : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      {t('languageSettings')}
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => setSettingsSection('subscription')}
                      className={`w-full text-left px-3 py-1.5 rounded-full text-xs font-normal transition-all cursor-pointer ${
                        settingsSection === 'subscription' ? 'bg-[#F1F2F3] font-bold text-gray-900' : 'hover:bg-gray-100 text-gray-600'
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
                  <span>{t('access')}</span>
                </div>
                <ul className="space-y-0.5">
                  <li>
                    <button 
                      onClick={() => addToast('Redirecting to Collectives administration...', 'info')}
                      className="w-full text-left px-3 py-1.5 rounded-full text-xs font-normal hover:bg-gray-100 text-gray-600 cursor-pointer"
                    >
                      Collectives
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => addToast('Single Sign-On login records verified.', 'info')}
                      className="w-full text-left px-3 py-1.5 rounded-full text-xs font-normal hover:bg-gray-100 text-gray-600 cursor-pointer"
                    >
                      Logins
                    </button>
                  </li>
                </ul>
              </div>

              {/* API integrations group */}
              <div>
                <div className="px-3 text-[11px] font-bold text-gray-900 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Cpu size={11} className="text-gray-400" />
                  <span>API integrations</span>
                </div>
                <ul className="space-y-0.5">
                  <li>
                    <button 
                      onClick={() => addToast('No third-party developer integrations active.', 'info')}
                      className="w-full text-left px-3 py-1.5 rounded-full text-xs font-normal hover:bg-gray-100 text-gray-600 cursor-pointer"
                    >
                      Authorized applications
                    </button>
                  </li>
                </ul>
              </div>
            </nav>
          </div>

          {/* Right Active Settings Tab Panel */}
          <div className="flex-1 min-w-0 bg-white border border-gray-200 rounded-lg p-5 md:p-6 shadow-sm">
            {settingsSection === 'preferences' && (
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

            {settingsSection === 'change-password' && (
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

            {settingsSection === 'language' && (
              <LanguageTab 
                selectedLanguage={selectedLanguage}
                setSelectedLanguage={setSelectedLanguage}
                isSwappingLanguage={isSwappingLanguage}
                handleRequestLanguage={handleRequestLanguage}
              />
            )}

            {settingsSection === 'subscription' && (
              <SubscriptionTab />
            )}

            {settingsSection === 'email-settings' && (
              <EmailTab />
            )}

            {settingsSection === 'edit-profile' && (
              <ProfileTab 
                displayName={displayName}
                setDisplayName={setDisplayName}
                bioText={bioText}
                setBioText={setBioText}
                handleProfileSave={handleSaveProfile}
              />
            )}
          </div>
        </div>
      )}

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
                    className="w-full p-2.5 text-center text-xl tracking-widest border border-gray-300 rounded focus:outline-none focus:ring-4 focus:ring-[#0074CC]/20 focus:border-[#0074CC]"
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

      {activeTab !== 'Profile' && activeTab !== 'Login History' && activeTab !== 'Settings' && (
        <div className="border border-gray-300 rounded p-8 text-center bg-white shadow-sm">
          <EmptyState title="Not implemented" message={`The ${activeTab} tab is currently under construction.`} />
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white w-full max-w-[500px] rounded shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-[#F8F9F9]">
              <h2 className="text-[21px] font-medium text-gray-900">Edit Profile</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-gray-900 p-1">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              
              <div className="space-y-4">
                {/* Image Source Tab Selection */}
                <div>
                  <label className="block font-bold text-[14px] text-gray-700 mb-2">Image Source</label>
                  <div className="flex bg-gray-100 p-1 rounded-md border border-gray-200">
                    <button
                      type="button"
                      onClick={() => setAvatarSource('upload')}
                      className={`flex-1 text-center py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                        avatarSource === 'upload'
                          ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      Upload Image
                    </button>
                    <button
                      type="button"
                      onClick={() => setAvatarSource('url')}
                      className={`flex-1 text-center py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                        avatarSource === 'url'
                          ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      Image URL
                    </button>
                  </div>
                </div>

                {/* Conditional Fields based on Source Selection */}
                {avatarSource === 'upload' ? (
                  <div className="space-y-3">
                    <label className="block font-bold text-[14px] text-gray-700">Select Image File</label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors border-dashed hover:border-[#0074CC]">
                        <span>Choose File</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                      {isUploading && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <svg className="animate-spin h-4 w-4 text-[#0074CC]" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>Uploading...</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block font-bold text-[14px] text-gray-700 mb-1">External Image URL</label>
                    <input
                      type="text"
                      placeholder="https://example.com/avatar.jpg"
                      value={editForm.avatar}
                      onChange={(e) => setEditForm({ ...editForm, avatar: e.target.value })}
                      className="w-full border border-gray-300 rounded p-2 text-sm focus:border-[#0074CC] focus:ring-4 focus:ring-[#0074CC]/20 outline-none transition-all"
                    />
                  </div>
                )}

                {/* Live Preview Section */}
                <div className="flex items-center gap-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="w-16 h-16 rounded-md border border-gray-200 overflow-hidden shadow-sm flex-shrink-0 bg-white flex items-center justify-center">
                    {editForm.avatar ? (
                      <img
                        src={getMediaUrl(editForm.avatar)}
                        alt="Avatar Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/150?text=Invalid+URL';
                        }}
                      />
                    ) : (
                      <span className="text-gray-400 text-xs italic">No image</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-gray-700">Avatar Preview</div>
                    <div className="text-[11px] text-gray-500 truncate" title={editForm.avatar || 'No avatar specified'}>
                      {editForm.avatar || 'No avatar url specified'}
                    </div>
                    {editForm.avatar && (
                      <button
                        type="button"
                        onClick={() => setEditForm(prev => ({ ...prev, avatar: '' }))}
                        className="text-red-500 hover:text-red-755 font-semibold text-[11px] mt-1 flex items-center gap-0.5 cursor-pointer"
                      >
                        Remove Image
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[15px] text-gray-900 mb-1">About Me</label>
                <textarea 
                  rows={5}
                  value={editForm.bio}
                  onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                  className="w-full border border-gray-300 rounded p-2 focus:border-[#0074CC] focus:ring-4 focus:ring-[#0074CC]/20 outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="submit"
                  disabled={isSaving || isUploading}
                  className="bg-[#0A95FF] hover:bg-[#0074CC] text-white font-bold py-2 px-3 rounded shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Profile'}
                </button>
                <button 
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-[#0074CC] hover:bg-[#E1ECF4] py-2 px-3 rounded font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
