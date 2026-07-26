import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useToast } from '../contexts/ToastContext';
import EmptyState from '../components/common/EmptyState';
import QuestionCard from '../components/common/QuestionCard';
import RightSidebar from '../components/common/RightSidebar';

const Feed = () => {
  const { user } = useSelector((state) => state.auth);
  const { addToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Newest');
  const [selectedTag, setSelectedTag] = useState(null);
  const [searchQuery, setSearchQuery] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [limit, setLimit] = useState(15);

  const tabToSort = {
    'Newest': 'newest',
    'Active': 'active',
    'Unanswered': 'unanswered',
    'Bountied': 'newest', // future: bountied sort
    'Score': 'votes',
  };

  const fetchPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = {
        page: currentPage,
        limit: limit,
        sort: tabToSort[activeTab] || 'newest',
      };
      
      let response;
      if (searchQuery) {
        params.q = searchQuery;
        response = await API.get('/posts/search', { params });
      } else {
        if (selectedTag) {
          params.tag = selectedTag;
        }
        response = await API.get('/posts', { params });
      }

      // Handle both old format (array) and new format (object with posts)
      if (Array.isArray(response.data)) {
        setPosts(response.data);
        setTotalPages(1);
        setTotalQuestions(response.data.length);
      } else {
        setPosts(response.data.posts || []);
        setTotalPages(response.data.totalPages || 1);
        setTotalQuestions(response.data.total || 0);
      }
      // Scroll to top of viewport on feed updates (page change, tab change, etc.)
      window.scrollTo({ top: 0, behavior: 'instant' });
    } catch (err) {
      addToast('Failed to retrieve social feed.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, activeTab, selectedTag, searchQuery, limit]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    if (location.state?.selectedTag) {
      setSelectedTag(location.state.selectedTag);
      setSearchQuery(null);
      setCurrentPage(1);
      // Clear navigation state to avoid sticky filter on page reload
      window.history.replaceState({}, document.title);
    } else if (location.state?.searchQuery) {
      setSearchQuery(location.state.searchQuery);
      setSelectedTag(null);
      setCurrentPage(1);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    const handleOpenModal = () => navigate('/questions/ask');
    window.addEventListener('open-create-post-modal', handleOpenModal);
    return () => window.removeEventListener('open-create-post-modal', handleOpenModal);
  }, [navigate]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleLike = async (postId) => {
    try {
      const response = await API.post(`/posts/${postId}/like`);
      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? { ...p, likes: response.data.likes } : p))
      );
    } catch (err) {
      addToast('Error updating vote status', 'error');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await API.delete(`/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      setTotalQuestions((prev) => prev - 1);
      addToast('Question deleted successfully!', 'success');
    } catch (err) {
      addToast('Failed to delete question', 'error');
    }
  };

  const renderPagination = () => {
    if (totalQuestions === 0) return null;

    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 mb-6 border-t border-gray-100 pt-6">
        
        {/* Left Side: Pagination Numbers */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {totalPages > 1 && currentPage > 1 && (
            <button
              type="button"
              onClick={() => setCurrentPage(currentPage - 1)}
              className="px-2.5 py-1 text-[12px] border border-gray-300 rounded-[3px] hover:bg-gray-100 text-gray-700 transition-colors font-medium cursor-pointer"
            >
              Prev
            </button>
          )}

          {totalPages > 1 && startPage > 1 && (
            <>
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                className="px-2.5 py-1 text-[12px] border border-gray-300 rounded-[3px] hover:bg-gray-100 text-gray-700 transition-colors font-medium cursor-pointer"
              >
                1
              </button>
              {startPage > 2 && <span className="px-0.5 text-gray-400">…</span>}
            </>
          )}

          {totalPages > 1 && pages.map((p) => (
            <button
              type="button"
              key={p}
              onClick={() => setCurrentPage(p)}
              className={`px-2.5 py-1 text-[12px] border rounded-[3px] transition-colors font-medium cursor-pointer ${
                p === currentPage
                  ? 'bg-[#F48024] text-white border-[#F48024]'
                  : 'border-gray-300 hover:bg-gray-100 text-gray-700'
              }`}
            >
              {p}
            </button>
          ))}

          {totalPages > 1 && endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="px-0.5 text-gray-400">…</span>}
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                className="px-2.5 py-1 text-[12px] border border-gray-300 rounded-[3px] hover:bg-gray-100 text-gray-700 transition-colors font-medium cursor-pointer"
              >
                {totalPages}
              </button>
            </>
          )}

          {totalPages > 1 && currentPage < totalPages && (
            <button
              type="button"
              onClick={() => setCurrentPage(currentPage + 1)}
              className="px-2.5 py-1 text-[12px] border border-gray-300 rounded-[3px] hover:bg-gray-100 text-gray-700 transition-colors font-medium cursor-pointer"
            >
              Next
            </button>
          )}
        </div>

        {/* Right Side: Page Size Selector (mimicking Stack Overflow exactly) */}
        <div className="flex items-center gap-1.5 text-xs text-gray-600 font-sans">
          {[15, 30, 50].map((size) => (
            <button
              type="button"
              key={size}
              onClick={() => {
                setLimit(size);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 text-[12px] border rounded-[3px] transition-all duration-150 font-medium cursor-pointer ${
                limit === size
                  ? 'bg-[#F48024] text-white border-[#F48024]'
                  : 'border-gray-300 hover:bg-gray-100 text-gray-700'
              }`}
            >
              {size}
            </button>
          ))}
          <span className="ml-1 text-gray-500 text-[11px] font-normal">per page</span>
        </div>

      </div>
    );
  };

  return (
    <div className="flex justify-center max-w-[1100px] mx-auto text-[13px] text-gray-800">
      {/* Main Content Column */}
      <div className="flex-1 max-w-[750px] mr-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <h1 className="text-[27px] text-gray-900 font-normal">Top Questions</h1>
          <button
            type="button"
            onClick={() => navigate('/questions/ask')}
            className="bg-[#0A95FF] hover:bg-[#0074CC] text-white px-3.5 py-2 rounded shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] text-[13px] transition-colors font-medium whitespace-nowrap"
          >
            Ask Question
          </button>
        </div>

        {/* Question count + Tabs */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 border-b border-gray-200">
          <span className="text-[17px] text-gray-600 font-normal pb-2">
            {totalQuestions.toLocaleString()} question{totalQuestions !== 1 ? 's' : ''}
          </span>
          <div className="flex border border-gray-400 rounded bg-white text-[13px] mb-[-1px] overflow-x-auto max-w-full flex-nowrap shrink-0">
            {['Newest', 'Active', 'Bountied', 'Unanswered', 'Score'].map((tab) => (
              <button
                type="button"
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`px-3 py-2 border-r border-gray-400 last:border-r-0 hover:bg-gray-50 transition-colors flex-shrink-0 ${
                  activeTab === tab ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Tag Filter Banner */}
        {selectedTag && (
          <div className="flex items-center gap-2 mb-4 bg-[#FDF7E2] border border-[#E6E4C4] text-gray-800 px-3 py-2 rounded-[3px] text-[13px]">
            <span>
              Showing questions tagged with <span className="font-bold text-gray-900 font-mono">"{selectedTag}"</span>
            </span>
            <button
              type="button"
              onClick={() => { setSelectedTag(null); setCurrentPage(1); }}
              className="text-[#0074CC] hover:text-[#0A95FF] ml-auto font-medium hover:underline cursor-pointer"
            >
              Clear Filter
            </button>
          </div>
        )}

        {/* Selected Search Query Filter Banner */}
        {searchQuery && (
          <div className="flex items-center gap-2 mb-4 bg-[#E1ECF4] border border-[#B3D3EA] text-gray-800 px-3 py-2 rounded-[3px] text-[13px]">
            <span>
              Showing search results for <span className="font-bold text-gray-900 font-mono">"{searchQuery}"</span>
            </span>
            <button
              type="button"
              onClick={() => { setSearchQuery(null); setCurrentPage(1); }}
              className="text-[#0074CC] hover:text-[#0A95FF] ml-auto font-medium hover:underline cursor-pointer"
            >
              Clear Search
            </button>
          </div>
        )}

        {/* Posts List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex p-4 border-b border-gray-200 gap-4">
                <div className="w-[80px] h-16 bg-gray-100 animate-pulse rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 animate-pulse rounded w-3/4" />
                  <div className="h-3 bg-gray-100 animate-pulse rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <EmptyState
            title="No questions yet"
            message={selectedTag ? "No questions match this tag." : "Be the first to ask a question on OverflowX."}
          />
        ) : (
          <div className="border-t border-gray-200">
            {posts.map((post) => (
              <QuestionCard
                key={post._id}
                post={post}
                currentUser={user}
                onLike={handleLike}
                onDelete={handleDeletePost}
                onSelectTag={(tag) => { setSelectedTag(tag); setCurrentPage(1); }}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {renderPagination()}
      </div>

      {/* Right Sidebar Column */}
      <RightSidebar />
    </div>
  );
};

export default Feed;
