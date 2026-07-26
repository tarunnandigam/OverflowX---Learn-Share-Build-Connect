import React from 'react';
import { HelpCircle, Info, ExternalLink, BookOpen, Settings } from 'lucide-react';

const HelpDropdown = ({ onClose }) => {
  const menuItems = [
    {
      label: 'Tour',
      desc: 'Start here for a quick overview of the site',
      icon: <Info size={13} className="text-blue-500" />,
      link: '/'
    },
    {
      label: 'Help Center',
      desc: 'Detailed answers to common questions',
      icon: <HelpCircle size={13} className="text-gray-500" />,
      link: '/'
    },
    {
      label: 'Meta Discussions',
      desc: 'Discuss the site features, design, and policies',
      icon: <BookOpen size={13} className="text-[#F48024]" />,
      link: '/'
    },
    {
      label: 'Keyboard Shortcuts',
      desc: 'Explore shortcuts for faster navigation',
      icon: <Settings size={13} className="text-purple-505 text-purple-500" />,
      link: '/settings'
    }
  ];

  return (
    <div className="absolute right-0 top-[50px] w-[300px] bg-white border border-[#e3e6e8] rounded shadow-xl z-50 text-[13px] text-gray-800 overflow-hidden transform origin-top-right transition-all font-sans">
      
      {/* Header */}
      <div className="bg-[#f8f9f9] px-4 py-2.5 border-b border-[#e3e6e8]">
        <span className="font-bold text-[#232629] flex items-center gap-1.5 text-xs">
          <HelpCircle size={13} className="text-blue-600" /> Help & Support
        </span>
      </div>

      {/* Items */}
      <div className="divide-y divide-[#e3e6e8] max-h-[300px] overflow-y-auto">
        {menuItems.map((item, idx) => (
          <a
            key={idx}
            href={item.link}
            onClick={(e) => {
              if (item.link === '/') e.preventDefault(); // mock link
            }}
            className="flex gap-3 p-3 hover:bg-[#f8f9f9] transition-colors duration-150 group"
          >
            <span className="mt-0.5">{item.icon}</span>
            <div className="flex-1">
              <h4 className="font-bold text-[#232629] text-xs flex items-center gap-1.5 group-hover:text-[#0074cc] transition-colors duration-150">
                <span>{item.label}</span>
                {item.link === '/' && <ExternalLink size={9} className="text-gray-400" />}
              </h4>
              <p className="text-[11px] text-[#6a737c] mt-0.5 leading-normal font-normal">
                {item.desc}
              </p>
            </div>
          </a>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-[#e3e6e8] bg-[#f8f9f9] text-center p-2">
        <button 
          onClick={onClose}
          className="text-[11px] font-semibold text-[#525960] hover:text-[#232629] transition-colors py-1 cursor-pointer w-full block"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default HelpDropdown;
