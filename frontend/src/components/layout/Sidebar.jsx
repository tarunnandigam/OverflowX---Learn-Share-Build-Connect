import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Globe, Tag, Users, Bookmark, Award, Sparkles, MessageSquare } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';

const Sidebar = ({ onClose }) => {
  const location = useLocation();
  const { addToast } = useToast();
  const { t } = useLanguage();

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  const navItemClass = ({ isActive }) =>
    `px-2 py-1.5 text-xs rounded-sm flex items-center gap-2 transition-colors duration-150 cursor-pointer ${
      isActive
        ? 'bg-[#f1f2f3] text-[#0c0d0e] font-bold border-r-[3px] border-[#f48024]'
        : 'text-[#525960] hover:text-[#0c0d0e] hover:bg-[#f8f9f9] font-normal'
    }`;

  return (
    <aside className="w-[240px] flex-shrink-0 font-sans border-r border-[#e3e6e8] min-h-screen py-4 bg-white text-[13px]">
      <nav className="space-y-4">
        {/* Home Link */}
        <div className="px-2">
          <NavLink to="/" onClick={handleLinkClick} className={navItemClass}>
            <span>Home</span>
          </NavLink>
        </div>

        {/* Public Section */}
        <div>
          <div className="px-4 text-[11px] font-bold text-[#6a737c] uppercase tracking-wider mb-1">
            Public
          </div>
          <div className="space-y-0.5">
            <NavLink to="/questions" onClick={handleLinkClick} className={navItemClass}>
              <Globe size={14} className="text-[#6a737c]" />
              <span>Questions</span>
            </NavLink>
            <NavLink to="/tags" onClick={handleLinkClick} className={navItemClass}>
              <Tag size={14} className="text-[#6a737c]" />
              <span>Tags</span>
            </NavLink>
            <NavLink to="/users" onClick={handleLinkClick} className={navItemClass}>
              <Users size={14} className="text-[#6a737c]" />
              <span>Users</span>
            </NavLink>
            <NavLink to="/social" onClick={handleLinkClick} className={navItemClass}>
              <MessageSquare size={14} className="text-[#6a737c]" />
              <span>Social Space</span>
            </NavLink>
          </div>
        </div>

        {/* Collectives */}
        <div>
          <div className="px-4 text-[11px] font-bold text-[#6a737c] uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Collectives</span>
          </div>
          <div className="px-2">
            <button
              type="button"
              onClick={() => addToast('Collectives feature is coming soon!', 'info')}
              className="w-full text-left px-2 py-1.5 text-xs text-[#525960] hover:bg-[#f8f9f9] rounded-sm flex items-center gap-2 cursor-pointer"
            >
              <Sparkles size={14} className="text-[#f48024]" />
              <span>Explore Collectives</span>
            </button>
          </div>
        </div>

        {/* Teams */}
        <div>
          <div className="px-4 text-[11px] font-bold text-[#6a737c] uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Teams</span>
            <span
              onClick={() => addToast('OverflowX Teams subscription is coming soon! Collaborate privately with your organization.', 'info')}
              className="text-[#6a737c] hover:text-[#0074cc] cursor-pointer text-[10px] lowercase normal-case"
            >
              What's this?
            </span>
          </div>
          <div className="px-2">
            <NavLink to="/settings?tab=subscription" onClick={handleLinkClick} className={navItemClass}>
              <Award size={14} className="text-[#6a737c]" />
              <span>Create a Free Team</span>
            </NavLink>
          </div>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
