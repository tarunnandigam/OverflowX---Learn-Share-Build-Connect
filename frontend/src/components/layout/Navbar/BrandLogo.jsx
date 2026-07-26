import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import ProductsDropdown from './ProductsDropdown';
import ForTeamsPopover from './ForTeamsPopover';
import AboutPopover from './AboutPopover';
import logo from '../../../assets/Logo.png';
import { useLanguage } from '../../../contexts/LanguageContext';

const BrandLogo = () => {
  const [activeMenu, setActiveMenu] = useState(null);
  const containerRef = useRef(null);
  const { t } = useLanguage();

  const toggleMenu = (menuName) => {
    setActiveMenu((prev) => (prev === menuName ? null : menuName));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="flex items-center h-full relative">
      
      {/* Brand Icon and Title */}
      <Link to="/" className="flex items-center gap-1.5 hover:bg-[#e3e6e8] h-full px-3 transition-all duration-150 mr-1.5">
        <div className="w-8 h-8 flex items-center justify-center">
          <img src={logo} alt="OverflowX Logo" className="w-7 h-7 object-contain" />
        </div>
        <span className="hidden sm:inline font-sans text-[18px] text-[#232629] tracking-tight leading-none mt-0.5 font-normal">
          Overflow<span className="font-bold">X</span>
        </span>
      </Link>

      {/* Interactive Links styled exactly like Stack Overflow navigation item classes */}
      <div className="hidden md:flex items-center text-[13px] h-full font-sans">
        
        {/* About Trigger */}
        <button
          type="button"
          onClick={() => toggleMenu('about')}
          className={`hover:bg-[#e3e6e8] text-[#525960] hover:text-[#232629] px-3.5 py-1.5 rounded-full mx-0.5 transition-all duration-150 cursor-pointer font-normal text-xs ${
            activeMenu === 'about' ? 'bg-[#e3e6e8] text-[#232629] font-medium' : ''
          }`}
        >
          {t('about')}
        </button>

        {/* Products Trigger */}
        <button
          type="button"
          onClick={() => toggleMenu('products')}
          className={`hover:bg-[#e3e6e8] text-[#525960] hover:text-[#232629] px-3.5 py-1.5 rounded-full mx-0.5 transition-all duration-150 cursor-pointer font-normal text-xs ${
            activeMenu === 'products' ? 'bg-[#e3e6e8] text-[#232629] font-medium' : ''
          }`}
        >
          {t('products')}
        </button>

        {/* For Teams Trigger */}
        <button
          type="button"
          onClick={() => toggleMenu('teams')}
          className={`hover:bg-[#e3e6e8] text-[#525960] hover:text-[#232629] px-3.5 py-1.5 rounded-full mx-0.5 transition-all duration-150 cursor-pointer font-normal text-xs ${
            activeMenu === 'teams' ? 'bg-[#e3e6e8] text-[#232629] font-medium' : ''
          }`}
        >
          {t('teams')}
        </button>
      </div>

      {/* Render Dropdowns */}
      {activeMenu === 'about' && (
        <AboutPopover onClose={() => setActiveMenu(null)} />
      )}
      {activeMenu === 'products' && (
        <ProductsDropdown onClose={() => setActiveMenu(null)} />
      )}
      {activeMenu === 'teams' && (
        <ForTeamsPopover onClose={() => setActiveMenu(null)} />
      )}
    </div>
  );
};

export default BrandLogo;
