import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/Logo.png';
import { useToast } from '../../contexts/ToastContext';

const Footer = () => {
  const { addToast } = useToast();

  const handleFeatureClick = (name) => {
    addToast(`${name} page is coming soon!`, 'info');
  };

  return (
    <footer className="bg-[#232629] text-[#babfc4] text-[11px] py-8 md:py-12 border-t border-gray-800 font-sans mt-auto">
      <div className="max-w-[1264px] mx-auto px-4 flex flex-col md:flex-row gap-8 justify-between">
        
        {/* Left: Brand Logo & Icon */}
        <div className="flex-shrink-0 flex items-start gap-2">
          <img src={logo} alt="OverflowX Logo" className="w-8 h-8 object-contain" />
        </div>

        {/* Center: Footnote columns */}
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-6">
          
          {/* Column 1: Stack Overflow */}
          <div>
            <h5 className="font-bold uppercase text-[12px] text-white mb-3 tracking-wide">OverflowX</h5>
            <ul className="space-y-2">
              <li><Link to="/" className="hover:text-white transition-colors">Questions</Link></li>
              <li><Link to="/tags" className="hover:text-white transition-colors">Tags</Link></li>
              <li><Link to="/users" className="hover:text-white transition-colors">Users</Link></li>
              <li>
                <span 
                  onClick={() => handleFeatureClick('Help Center')} 
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Help Center
                </span>
              </li>
            </ul>
          </div>

          {/* Column 2: Company */}
          <div>
            <h5 className="font-bold uppercase text-[12px] text-white mb-3 tracking-wide">Company</h5>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://stackoverflow.co/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-white transition-colors"
                >
                  About
                </a>
              </li>
              <li>
                <a 
                  href="https://stackoverflow.co/company/press/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-white transition-colors"
                >
                  Press
                </a>
              </li>
              <li>
                <a 
                  href="https://stackoverflow.co/company/careers" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-white transition-colors"
                >
                  Work Here
                </a>
              </li>
              <li>
                <Link 
                  to="/contact" 
                  className="hover:text-white transition-colors"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Products */}
          <div>
            <h5 className="font-bold uppercase text-[12px] text-white mb-3 tracking-wide">Products</h5>
            <ul className="space-y-2">
              <li>
                <span 
                  onClick={() => handleFeatureClick('Teams')} 
                  className="hover:text-[#fff] transition-colors cursor-pointer"
                >
                  Teams
                </span>
              </li>
              <li>
                <span 
                  onClick={() => handleFeatureClick('Advertising')} 
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Advertising
                </span>
              </li>
              <li>
                <span 
                  onClick={() => handleFeatureClick('Collectives')} 
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Collectives
                </span>
              </li>
              <li>
                <span 
                  onClick={() => handleFeatureClick('Talent')} 
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Talent
                </span>
              </li>
            </ul>
          </div>

          {/* Column 4: Networks */}
          <div>
            <h5 className="font-bold uppercase text-[12px] text-white mb-3 tracking-wide">Stack Exchange Network</h5>
            <ul className="space-y-2">
              <li>
                <span 
                  onClick={() => handleFeatureClick('Technology Network')} 
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Technology
                </span>
              </li>
              <li>
                <span 
                  onClick={() => handleFeatureClick('Culture & Recreation')} 
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Culture & recreation
                </span>
              </li>
              <li>
                <span 
                  onClick={() => handleFeatureClick('Life & Arts')} 
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Life & arts
                </span>
              </li>
              <li>
                <span 
                  onClick={() => handleFeatureClick('Network API')} 
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  API
                </span>
              </li>
            </ul>
          </div>

        </div>

        {/* Right: Copyright info */}
        <div className="flex flex-col justify-between items-start md:items-end text-[#9199a1]">
          <div className="flex gap-3 text-xs mb-4 md:mb-0">
            <span onClick={() => handleFeatureClick('Blog')} className="hover:text-white cursor-pointer transition-colors">Blog</span>
            <span onClick={() => handleFeatureClick('Facebook')} className="hover:text-white cursor-pointer transition-colors">Facebook</span>
            <span onClick={() => handleFeatureClick('Twitter')} className="hover:text-white cursor-pointer transition-colors">Twitter</span>
            <span onClick={() => handleFeatureClick('LinkedIn')} className="hover:text-white cursor-pointer transition-colors">LinkedIn</span>
          </div>
          <p className="mt-auto md:text-right max-w-xs text-[#9199a1] leading-relaxed">
            Site design / logo © 2026 OverflowX Community Learning. All rights reserved. Stack Overflow content licensed under CC BY-SA.
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
