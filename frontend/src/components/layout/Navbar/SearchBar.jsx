import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Hash } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import API from '../../../services/api';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [popularTags, setPopularTags] = useState(['javascript', 'react', 'css', 'html', 'node.js', 'tailwindcss', 'mongodb', 'express']);
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const { t } = useLanguage();

  useEffect(() => {
    let active = true;
    const fetchTags = async () => {
      try {
        const response = await API.get('/posts/tags');
        if (active && response.data && Array.isArray(response.data)) {
          const tagNames = response.data.map(t => t._id).filter(Boolean);
          if (tagNames.length > 0) {
            setPopularTags(tagNames.slice(0, 8));
          }
        }
      } catch (err) {
        console.error('Error fetching popular tags', err);
      }
    };
    fetchTags();
    return () => { active = false; };
  }, []);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate('/', { state: { searchQuery: query.trim() } });
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (tag) => {
    setQuery(tag);
    navigate('/', { state: { selectedTag: tag } });
    setShowSuggestions(false);
  };

  const handleClear = () => {
    setQuery('');
  };

  return (
    <div ref={containerRef} className="flex-1 max-w-3xl px-4 flex items-center relative font-sans">
      <form onSubmit={handleSearchSubmit} className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          className="block w-full pl-9 pr-9 py-1.5 border border-[#babfc4] rounded bg-white placeholder-gray-400 focus:outline-none focus:ring-[4px] focus:ring-[#0074cc]/15 focus:border-[#379fef] text-[13px] text-gray-800 transition-all duration-100"
          placeholder={t('searchPlaceholder')}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      {/* Search Suggestions Dropdown Overlay (mimicking Stack Overflow exactly) */}
      {showSuggestions && (
        <div className="absolute top-[42px] left-4 right-4 bg-white border border-[#e3e6e8] rounded shadow-lg z-50 py-3 text-[13px]">
          <div className="px-4 pb-2 text-[10px] font-bold text-[#6a737c] tracking-wider border-b border-gray-100 flex items-center gap-1 font-sans">
            <Hash size={11} className="text-[#6a737c]" />
            <span>POPULAR TOPICS / TAGS</span>
          </div>
          <div className="grid grid-cols-2 gap-1 p-2">
            {popularTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleSuggestionClick(tag)}
                className="flex items-center gap-2 px-3 py-1.5 text-left text-[#39739d] hover:bg-[#e1ecf4] hover:text-[#2c5878] rounded transition-all duration-150 font-mono text-xs w-full cursor-pointer"
              >
                <span className="text-[#83a6c4]">#</span>
                <span>{tag}</span>
              </button>
            ))}
          </div>
          {query.trim() && (
            <div className="border-t border-gray-100 mt-1 px-4 py-2 text-xs text-gray-500 font-sans">
              Press <span className="font-semibold text-gray-700">Enter</span> to search for <span className="font-mono text-[#0074CC]">"{query}"</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
