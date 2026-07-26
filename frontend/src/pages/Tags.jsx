import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import API from '../services/api';
import { useToast } from '../contexts/ToastContext';

const Tags = () => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { addToast } = useToast();
  const navigate = useNavigate();

  const fetchTagsAndCounts = async () => {
    try {
      setLoading(true);
      const res = await API.get('/posts/tags');
      // The backend returns an array of { name: string, count: number } objects
      setTags(res.data || []);
    } catch (err) {
      addToast('Failed to load tags directory.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTagsAndCounts();
  }, []);

  const filteredTags = tags.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTagClick = (tagName) => {
    navigate('/', { state: { selectedTag: tagName } });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#F48024]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto text-[13px] text-gray-800">
      <h1 className="text-[24px] text-gray-900 font-normal mb-2 font-sans">Tags</h1>
      <p className="text-gray-600 mb-6 max-w-xl text-[13px] leading-relaxed">
        A tag is a keyword or label that categorizes your question with other, similar questions. Using the right tags makes it easier for others to find and answer your question.
      </p>

      {/* Search and Filters */}
      <div className="mb-6 flex items-center max-w-sm border border-gray-300 rounded-[3px] p-2 bg-white focus-within:border-[#0074CC] focus-within:ring-4 focus-within:ring-[#0074CC]/20 outline-none">
        <Search size={16} className="text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Filter by tag name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-[13px] text-gray-800 outline-none"
        />
      </div>

      {/* Grid of Tags */}
      {filteredTags.length === 0 ? (
        <div className="text-center text-gray-500 py-10 bg-gray-50 border border-gray-200 rounded">
          No tags found matching your query.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredTags.map((tag) => (
            <div key={tag.name} className="p-3 bg-white border border-gray-200 rounded-[3px] flex flex-col justify-between hover:shadow-sm transition-shadow">
              <div>
                <span
                  onClick={() => handleTagClick(tag.name)}
                  className="inline-block text-[#39739D] bg-[#E1ECF4] hover:bg-[#D0E3F1] px-1.5 py-0.5 rounded-[3px] text-[12px] font-mono cursor-pointer mb-2"
                >
                  {tag.name}
                </span>
                <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed mb-4">
                  Questions categorized under the tag "{tag.name}". Click to view questions and discussions related to this topic.
                </p>
              </div>
              <div className="text-xs text-gray-500 flex justify-between items-center border-t border-gray-100 pt-2">
                <span>{tag.count} question{tag.count !== 1 ? 's' : ''}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Tags;
