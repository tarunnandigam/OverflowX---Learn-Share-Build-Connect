import React, { useState, useEffect } from 'react';
import { Trophy, Award, TrendingUp, Loader2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import API from '../../../services/api';

const AchievementsDropdown = ({ onClose }) => {
  const { user } = useSelector((state) => state.auth);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const response = await API.get('/users/notifications');
        const list = response.data.filter((item) => item.isAchievement);
        setAchievements(list);
      } catch (err) {
        console.error('Failed to fetch achievements:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAchievements();
  }, []);

  const timeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'Just now';
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="absolute right-0 top-[50px] w-[360px] bg-white border border-[#e3e6e8] rounded shadow-xl z-50 text-[13px] text-gray-800 overflow-hidden transform origin-top-right transition-all font-sans">
      
      {/* Header */}
      <div className="bg-[#f8f9f9] px-4 py-2.5 border-b border-[#e3e6e8] flex justify-between items-center">
        <span className="font-bold text-[#232629] flex items-center gap-1.5 text-xs">
          <Trophy size={13} className="text-[#F48024]" /> Achievements
        </span>
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#6a737c] bg-[#e3e6e8]/40 px-2 py-0.5 rounded">
          <TrendingUp size={11} className="text-emerald-600" />
          <span>Rep: {user?.reputation !== undefined ? user.reputation.toLocaleString() : 1}</span>
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-[#e3e6e8] max-h-[320px] overflow-y-auto">
        {loading ? (
          <div className="p-8 flex justify-center items-center text-gray-500 gap-2">
            <Loader2 size={16} className="animate-spin" />
            <span>Loading achievements...</span>
          </div>
        ) : achievements.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No achievements yet
          </div>
        ) : (
          achievements.map((item) => (
            <div 
              key={item._id} 
              className="p-3 hover:bg-[#f8f9f9] transition-colors duration-150 flex items-start gap-3"
            >
              {/* Type Indicator */}
              {item.type === 'reputation' ? (
                <span className={`font-mono font-bold text-[11px] px-1.5 py-0.5 rounded flex-shrink-0 w-[36px] text-center ${
                  item.change && !item.change.startsWith('-')
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                    : 'bg-rose-50 text-rose-700 border border-rose-100'
                }`}>
                  {item.change}
                </span>
              ) : (
                <span className={`p-1.5 rounded flex-shrink-0 border ${
                  item.badgeClass === 'gold' 
                    ? 'bg-yellow-50 text-yellow-600 border-yellow-250' 
                    : item.badgeClass === 'silver' 
                    ? 'bg-slate-50 text-slate-500 border-slate-250' 
                    : 'bg-amber-50 text-amber-800 border-amber-250'
                }`}>
                  <Award size={13} />
                </span>
              )}

              <div className="flex-1">
                <p className="text-[12px] text-[#232629] font-normal leading-normal">
                  {item.reason}
                </p>
                <span className="text-[10px] text-[#6a737c] block mt-0.5">
                  {timeAgo(item.createdAt)}
                </span>
              </div>
            </div>
          ))
        )}
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

export default AchievementsDropdown;
