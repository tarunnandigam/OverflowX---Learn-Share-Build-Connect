import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { translations } from '../locales/translations';
import { updateUser } from '../store/authSlice';
import API from '../services/api';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  // Initialize language: if logged in, use user.language. Otherwise check localStorage or fallback to 'en'.
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    if (user && user.language) {
      return user.language;
    }
    return localStorage.getItem('language') || 'en';
  });

  // Sync state with logged in user language
  useEffect(() => {
    if (user && user.language && user.language !== currentLanguage) {
      setCurrentLanguage(user.language);
    }
  }, [user, currentLanguage]);

  const t = (key) => {
    const dict = translations[currentLanguage] || translations['en'];
    return dict[key] !== undefined ? dict[key] : (translations['en'][key] !== undefined ? translations['en'][key] : key);
  };

  // Switch guest language directly
  const switchGuestLanguage = (lang) => {
    if (!translations[lang]) return;
    setCurrentLanguage(lang);
    localStorage.setItem('language', lang);
  };

  // Request secure switch
  const requestLanguageChange = async (lang) => {
    const response = await API.post('/auth/language/request', { language: lang });
    return response.data; // contains _devOtp
  };

  // Verify secure switch
  const verifyLanguageChange = async (code) => {
    const response = await API.post('/auth/language/verify', { code });
    const { user: updatedUser } = response.data;
    
    // Update active language in context
    setCurrentLanguage(updatedUser.language);
    
    // Update user in Redux store
    dispatch(updateUser(updatedUser));
    
    return response.data;
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        t,
        switchGuestLanguage,
        requestLanguageChange,
        verifyLanguageChange,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
