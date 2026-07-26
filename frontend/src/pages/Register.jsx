import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { loginStart, loginSuccess, loginFailure } from '../store/authSlice';
import { useToast } from '../contexts/ToastContext';
import API from '../services/api';
import logo from '../assets/Logo.png';
import { useLanguage } from '../contexts/LanguageContext';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  
  // OTP Verification States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state) => state.auth);
  const { addToast } = useToast();
  const { t } = useLanguage();

  const getDeviceType = () => {
    const ua = navigator.userAgent;
    if (/Mobi|Android|iPhone|iPad|iPod/i.test(ua)) {
      return 'mobile';
    }
    return window.screen.width <= 1600 ? 'laptop' : 'desktop';
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        dispatch(loginStart());
        const deviceType = getDeviceType();
        const response = await API.post('/auth/google', {
          token: tokenResponse.access_token,
          deviceType
        });
        
        if (response.data.requireOtp) {
          dispatch(loginFailure(null));
          setOtpEmail(response.data.email);
          setDevOtp(response.data._devOtp || '');
          setShowOtpModal(true);
          addToast(response.data.message || 'OTP Verification required.', 'info');
        } else {
          dispatch(loginSuccess(response.data));
          addToast(`Welcome, ${response.data.username}!`, 'success');
          navigate('/');
        }
      } catch (err) {
        const msg = err.response?.data?.message || 'Google Sign Up failed.';
        dispatch(loginFailure(msg));
        addToast(msg, 'error');
      }
    },
    onError: (error) => {
      console.error('Google Sign Up Failed', error);
      addToast('Google Sign Up failed. Please try again.', 'error');
    }
  });

  const validate = () => {
    const tempErrors = {};
    if (!username.trim()) tempErrors.username = 'Display name is required';
    
    if (!email) tempErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) tempErrors.email = 'Valid email is required';
    
    if (!password) tempErrors.password = 'Password is required';
    else if (password.length < 6) tempErrors.password = 'Password must be at least 6 characters';

    if (password !== confirmPassword) {
      tempErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    dispatch(loginStart());
    try {
      const deviceType = getDeviceType();
      const response = await API.post('/auth/register', {
        username,
        email,
        password,
        deviceType
      });

      if (response.data.requireOtp) {
        dispatch(loginFailure(null));
        setOtpEmail(response.data.email);
        setDevOtp(response.data._devOtp || '');
        setShowOtpModal(true);
        addToast(response.data.message || 'OTP Verification required.', 'info');
      } else {
        dispatch(loginSuccess(response.data));
        addToast(`Registration successful! Welcome, ${response.data.username}.`, 'success');
        navigate('/');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      dispatch(loginFailure(msg));
      addToast(msg, 'error');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      addToast('Please enter a 6-digit OTP code', 'error');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const deviceType = getDeviceType();
      const response = await API.post('/auth/login/verify-otp', {
        email: otpEmail,
        otpCode: otpCode,
        otp: otpCode,
        deviceType
      });

      dispatch(loginSuccess(response.data));
      setShowOtpModal(false);
      addToast(`Verification successful. Welcome, ${response.data.username}!`, 'success');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid or expired OTP.';
      addToast(msg, 'error');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-50px)] bg-[#f1f2f3] flex flex-col justify-center items-center py-12 px-4 font-sans">
      
      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Verify Your Email</h3>
            <p className="text-sm text-gray-600 mb-4">
              We sent a 6-digit OTP verification code to <strong>{otpEmail}</strong>.
            </p>
            {devOtp && (
              <div className="bg-blue-50 border border-blue-200 p-3 rounded text-xs text-blue-800 mb-4">
                <strong>Developer Assistant:</strong> Dev OTP code is <code>{devOtp}</code>
              </div>
            )}
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">6-Digit Verification Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full text-center tracking-[0.5em] text-lg font-mono px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isVerifyingOtp}
                  className="flex-1 bg-[#0a95ff] hover:bg-[#0074cc] text-white font-bold py-2 rounded text-sm transition cursor-pointer"
                >
                  {isVerifyingOtp ? 'Verifying...' : 'Verify & Continue'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4 py-2 rounded text-sm cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Brand & Heading */}
      <div className="mb-6 flex flex-col items-center max-w-sm text-center">
        <div className="flex items-center justify-center gap-2.5 mb-3">
          <img src={logo} alt="OverflowX Logo" className="w-10 h-10 object-contain" />
          <span className="text-[26px] font-normal text-gray-800 tracking-tight">
            Overflow<span className="font-bold text-black">X</span>
          </span>
        </div>
        <h1 className="text-xl font-medium text-gray-800 mb-1">Join the OverflowX community</h1>
        <p className="text-xs text-gray-600">
          Get OverflowX for Teams free for up to 50 users.
        </p>
      </div>

      {/* OAuth Button */}
      <div className="w-full max-w-[290px] mb-4">
        <button
          type="button"
          onClick={() => handleGoogleLogin()}
          className="w-full bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-medium py-2 px-3 rounded shadow-sm flex items-center justify-center gap-2 text-xs transition cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          Sign up with Google
        </button>
      </div>

      {/* Registration Card */}
      <div className="w-full max-w-[290px] bg-white border border-[#e3e6e8] rounded-md shadow-md p-6 font-sans">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-xs p-2.5 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1">Display name</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full px-2.5 py-1.5 border ${
                errors.username ? 'border-red-500' : 'border-gray-300'
              } rounded focus:outline-none focus:border-blue-500 text-xs`}
            />
            {errors.username && <span className="text-[10px] text-red-500">{errors.username}</span>}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-2.5 py-1.5 border ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              } rounded focus:outline-none focus:border-blue-500 text-xs`}
            />
            {errors.email && <span className="text-[10px] text-red-500">{errors.email}</span>}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-2.5 py-1.5 border ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              } rounded focus:outline-none focus:border-blue-500 text-xs`}
            />
            {errors.password && <span className="text-[10px] text-red-500">{errors.password}</span>}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1">Confirm password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full px-2.5 py-1.5 border ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              } rounded focus:outline-none focus:border-blue-500 text-xs`}
            />
            {errors.confirmPassword && (
              <span className="text-[10px] text-red-500">{errors.confirmPassword}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#0a95ff] hover:bg-[#0074cc] text-white font-bold py-2 rounded text-xs transition duration-150 cursor-pointer shadow-sm"
          >
            {isLoading ? 'Signing up...' : 'Sign up'}
          </button>
        </form>
      </div>

      <div className="mt-8 text-xs text-gray-600 text-center">
        Already have an account?{' '}
        <Link to="/login" className="text-[#0074cc] hover:text-[#0a95ff]">
          Log in
        </Link>
      </div>
    </div>
  );
};

export default Register;
