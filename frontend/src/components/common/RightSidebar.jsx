import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flame, TrendingUp, MessageSquare, ThumbsUp, Eye, Loader2 } from 'lucide-react';
import API from '../../services/api';

const BADGE_COLORS = [
  { bg: 'bg-sky-100', text: 'text-sky-700' },
  { bg: 'bg-orange-100', text: 'text-orange-700' },
  { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  { bg: 'bg-purple-100', text: 'text-purple-700' },
  { bg: 'bg-rose-100', text: 'text-rose-700' },
  { bg: 'bg-amber-100', text: 'text-amber-700' },
  { bg: 'bg-teal-100', text: 'text-teal-700' },
  { bg: 'bg-indigo-100', text: 'text-indigo-700' },
];

const RightSidebar = () => {
  const [popularQuestions, setPopularQuestions] = useState([]);
  const [recentQuestions, setRecentQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSidebarData = async () => {
      try {
        setLoading(true);
        const [popularRes, recentRes] = await Promise.all([
          API.get('/posts/popular?limit=5'),
          API.get('/posts?page=1&limit=4&sort=newest')
        ]);
        setPopularQuestions(popularRes.data || []);
        setRecentQuestions(recentRes.data?.posts || []);
      } catch (err) {
        console.error('Failed to load sidebar data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSidebarData();
  }, []);

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="hidden lg:block w-[300px] flex-shrink-0">
        <div className="flex items-center justify-center py-12 text-gray-400">
          <Loader2 size={20} className="animate-spin mr-2" />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden lg:block w-[300px] flex-shrink-0 text-[13px]">
      
      {/* Trending / Popular Questions Box */}
      <div className="border border-[#E6E4C4] bg-[#FDF7E2] rounded-[3px] shadow-sm mb-5 overflow-hidden">
        <ul className="text-gray-800 divide-y divide-[#E6E4C4]">
          {/* Section Header: Trending Questions */}
          <li className="bg-[#FBF3D5] font-bold py-2.5 px-4 text-gray-700 border-b border-[#E6E4C4] flex items-center gap-1.5">
            <Flame size={14} className="text-orange-500" />
            <span>Trending Questions</span>
          </li>
          {popularQuestions.length === 0 ? (
            <li className="px-4 py-3 text-gray-400 italic">No trending questions yet.</li>
          ) : (
            popularQuestions.slice(0, 3).map((q, i) => (
              <li key={q._id} className="hover:bg-[#FBF9EE] transition-colors duration-150">
                <Link to={`/questions/${q._id}`} className="flex items-start px-4 py-2.5 group">
                  <span className="text-orange-500 mr-2 mt-0.5 text-xs">🔥</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-gray-800 group-hover:text-[#0074CC] transition-colors leading-snug line-clamp-2 block">
                      {q.caption}
                    </span>
                    <div className="flex items-center gap-2.5 mt-1 text-[11px] text-gray-500">
                      <span className="flex items-center gap-0.5">
                        <ThumbsUp size={10} /> {q.upvotes || 0}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <MessageSquare size={10} /> {q.comments || 0}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Eye size={10} /> {q.views || 0}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))
          )}

          {/* Section Header: Recently Asked */}
          <li className="bg-[#FBF3D5] font-bold py-2.5 px-4 text-gray-700 border-b border-[#E6E4C4] flex items-center gap-1.5">
            <TrendingUp size={14} className="text-emerald-600" />
            <span>Recently Asked</span>
          </li>
          {recentQuestions.length === 0 ? (
            <li className="px-4 py-3 text-gray-400 italic">No recent questions yet.</li>
          ) : (
            recentQuestions.slice(0, 3).map((q) => (
              <li key={q._id} className="hover:bg-[#FBF9EE] transition-colors duration-150">
                <Link to={`/questions/${q._id}`} className="flex items-start px-4 py-2.5 group">
                  <span className="text-emerald-500 mr-2 mt-0.5 text-xs">💬</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-gray-800 group-hover:text-[#0074CC] transition-colors leading-snug line-clamp-2 block">
                      {q.caption}
                    </span>
                    <span className="text-[11px] text-gray-400 mt-0.5 block">
                      {q.user?.username} • {timeAgo(q.createdAt)}
                    </span>
                  </div>
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Hot Network Questions */}
      <div className="mb-4 px-1">
        <h4 className="text-[15px] font-normal text-gray-800 mb-3 ml-1 flex items-center gap-1.5">
          <Flame size={14} className="text-red-500" />
          <span>Hot Network Questions</span>
        </h4>
        {popularQuestions.length === 0 ? (
          <p className="text-gray-400 italic text-[12px] ml-1">Ask questions to see them here!</p>
        ) : (
          <ul className="space-y-3.5">
            {popularQuestions.map((q, i) => {
              const colors = BADGE_COLORS[i % BADGE_COLORS.length];
              const initial = q.user?.username?.charAt(0)?.toUpperCase() || '?';
              return (
                <li key={q._id} className="flex items-start group">
                  <div className={`w-4 h-4 ${colors.bg} ${colors.text} flex items-center justify-center font-bold rounded-sm text-[8px] mr-2.5 flex-shrink-0 mt-0.5`}>
                    {initial}
                  </div>
                  <Link
                    to={`/questions/${q._id}`}
                    className="text-[#0074CC] hover:text-[#0A95FF] leading-tight transition-colors line-clamp-2"
                  >
                    {q.caption}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

    </div>
  );
};

export default RightSidebar;
