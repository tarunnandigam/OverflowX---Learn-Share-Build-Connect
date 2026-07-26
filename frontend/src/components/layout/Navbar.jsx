import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Inbox, Trophy, HelpCircle, LogOut, Menu } from 'lucide-react';
import { logout, updateUser } from '../../store/authSlice';
import { toggleMobileSidebar } from '../../store/themeSlice';
import API from '../../services/api';
import { getMediaUrl } from '../../utils/media';

import BrandLogo from './Navbar/BrandLogo';
import SearchBar from './Navbar/SearchBar';
import InboxDropdown from './Navbar/InboxDropdown';
import AchievementsDropdown from './Navbar/AchievementsDropdown';
import HelpDropdown from './Navbar/HelpDropdown';

const Navbar = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeDropdown, setActiveDropdown] = useState(null);
  const navRef = useRef(null);

  const toggleDropdown = (name) => {
    setActiveDropdown((prev) => (prev === name ? null : name));
  };

  useEffect(() => {
    const fetchUserReputation = async () => {
      if (!user) return;
      try {
        const response = await API.get('/auth/me');
        if (response.data) {
          dispatch(updateUser(response.data));
        }
      } catch (err) {
        console.error('Failed to sync user reputation:', err);
      }
    };
    fetchUserReputation();
  }, [dispatch, user?._id, location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await API.post('/auth/logout');
    } catch (e) {
      // ignore
    }
    dispatch(logout());
    navigate('/login');
  };

  return (
    <nav 
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-50 bg-[#f8f9f9] border-t-[3px] border-t-[#F48024] border-b border-[#e3e6e8] h-[50px] flex items-center"
    >
      <div className="max-w-[1264px] mx-auto px-4 w-full h-full flex items-center justify-between">
        
        {/* Left: Hamburger Menu & Brand Logo & Links */}
        <div className="flex items-center gap-1 h-full">
          <button
            type="button"
            onClick={() => dispatch(toggleMobileSidebar())}
            className="md:hidden p-1.5 hover:bg-[#e3e6e8] text-gray-600 rounded transition-colors mr-1 cursor-pointer"
            title="Toggle Sidebar"
          >
            <Menu size={20} />
          </button>
          <BrandLogo />
        </div>

        {/* Center: Interactive Search Bar */}
        <SearchBar />

        {/* Right: User Menu & Dropdowns */}
        <div className="flex items-center h-full">
          {user ? (
            <div className="flex items-center h-full">
              
              {/* User Profile info (mimicking Stack Overflow exactly) */}
              {(() => {
                const reputation = user.reputation || 1;
                const goldBadges = Math.floor(reputation / 500);
                const silverBadges = Math.floor((reputation % 500) / 100);
                const bronzeBadges = Math.floor((reputation % 100) / 25);

                return (
                  <Link 
                    to={`/profile/${user.username}`} 
                    className="flex items-center hover:bg-[#e3e6e8] px-3 h-[50px] transition-colors duration-150"
                  >
                    {user.avatar ? (
                      <img src={getMediaUrl(user.avatar)} alt={user.username} className="h-6 w-6 rounded object-cover" />
                    ) : (
                      <div className="h-6 w-6 rounded bg-[#a259ff] text-white flex items-center justify-center font-bold text-[11px]">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="hidden sm:inline font-bold text-[12px] ml-1.5 text-[#3c4146] font-sans" title="Reputation">
                      {reputation.toLocaleString()}
                    </span>
                    
                    {/* Badge circles style */}
                    <div className="hidden sm:flex items-center ml-2 space-x-1.5 text-[11px] text-[#6a737c]">
                      {goldBadges > 0 && (
                        <span className="flex items-center" title={`${goldBadges} gold badges`}>
                          <span className="w-1.5 h-1.5 bg-[#ffcc01] rounded-full mr-0.5"></span>{goldBadges}
                        </span>
                      )}
                      {silverBadges > 0 && (
                        <span className="flex items-center" title={`${silverBadges} silver badges`}>
                          <span className="w-1.5 h-1.5 bg-[#b4b8bc] rounded-full mr-0.5"></span>{silverBadges}
                        </span>
                      )}
                      {bronzeBadges > 0 && (
                        <span className="flex items-center" title={`${bronzeBadges} bronze badges`}>
                          <span className="w-1.5 h-1.5 bg-[#d1a684] rounded-full mr-0.5"></span>{bronzeBadges}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })()}

              {/* Inbox Trigger */}
              <div className="relative h-full flex items-center">
                <button 
                  type="button"
                  onClick={() => toggleDropdown('inbox')} 
                  className={`p-2 text-[#525960] hover:bg-[#e3e6e8] hover:text-[#232629] transition-all h-[50px] px-3.5 cursor-pointer flex items-center ${
                    activeDropdown === 'inbox' ? 'bg-[#e3e6e8] text-[#232629]' : ''
                  }`}
                  title="Recent notifications"
                >
                  <Inbox size={19} className="stroke-[2.2]" />
                </button>
                {activeDropdown === 'inbox' && (
                  <InboxDropdown onClose={() => setActiveDropdown(null)} />
                )}
              </div>

              {/* Trophy/Achievements Trigger */}
              <div className="hidden sm:flex relative h-full items-center">
                <button 
                  type="button"
                  onClick={() => toggleDropdown('achievements')} 
                  className={`p-2 text-[#525960] hover:bg-[#e3e6e8] hover:text-[#232629] transition-all h-[50px] px-3.5 cursor-pointer flex items-center ${
                    activeDropdown === 'achievements' ? 'bg-[#e3e6e8] text-[#232629]' : ''
                  }`}
                  title="Recent achievements"
                >
                  <Trophy size={19} className="stroke-[2.2]" />
                </button>
                {activeDropdown === 'achievements' && (
                  <AchievementsDropdown onClose={() => setActiveDropdown(null)} />
                )}
              </div>

              {/* Help Trigger */}
              <div className="hidden sm:flex relative h-full items-center">
                <button 
                  type="button"
                  onClick={() => toggleDropdown('help')} 
                  className={`p-2 text-[#525960] hover:bg-[#e3e6e8] hover:text-[#232629] transition-all h-[50px] px-3.5 cursor-pointer flex items-center ${
                    activeDropdown === 'help' ? 'bg-[#e3e6e8] text-[#232629]' : ''
                  }`}
                  title="Help and tour resources"
                >
                  <HelpCircle size={19} className="stroke-[2.2]" />
                </button>
                {activeDropdown === 'help' && (
                  <HelpDropdown onClose={() => setActiveDropdown(null)} />
                )}
              </div>

              {/* Logout Trigger */}
              <button 
                type="button"
                onClick={handleLogout} 
                className="p-2 text-[#525960] hover:bg-[#e3e6e8] hover:text-[#232629] transition-all h-[50px] px-3.5 cursor-pointer flex items-center" 
                title="Log out"
              >
                <LogOut size={19} className="stroke-[2.2]" />
              </button>
            </div>
          ) : (
            <div className="flex gap-1 ml-2 font-sans">
              <Link 
                to="/login" 
                className="text-[12px] text-[#39739d] bg-[#e1ecf4] border border-[#7aa7c7] hover:bg-[#b3d3ea] px-3 py-1.5 rounded transition-all duration-150 font-medium cursor-pointer"
              >
                Log in
              </Link>
              <Link 
                to="/register" 
                className="text-[12px] text-white bg-[#0a95ff] hover:bg-[#0074cc] border border-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] px-3 py-1.5 rounded transition-all duration-150 font-medium cursor-pointer"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
