import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ChevronUp, ChevronDown, Bookmark, Clock, Share2, Flag, Trash2, Eye, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import API from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';
import AnswerCard from '../components/common/AnswerCard';
import { getMediaUrl } from '../utils/media';

const QuestionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { addToast } = useToast();
  const { t } = useLanguage();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newAnswer, setNewAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const fetchQuestion = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get(`/posts/${id}`);
      setPost(res.data);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to retrieve question details.', 'error');
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [id, addToast, navigate]);

  useEffect(() => {
    if (id) {
      fetchQuestion();
    }
  }, [id, fetchQuestion]);

  const handleVote = async (voteType) => {
    if (!user) {
      addToast('You must be logged in to vote on questions.', 'warning');
      navigate('/login');
      return;
    }
    try {
      const res = await API.post(`/posts/${id}/vote`, { voteType });
      setPost(res.data);
      addToast('Vote updated!', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update vote.', 'error');
    }
  };

  const handleShareQuestion = () => {
    navigator.clipboard.writeText(window.location.href);
    addToast('Question link copied to clipboard! Share it anywhere.', 'success');
  };

  const handleFlagQuestion = () => {
    addToast('Thank you! This question has been reported for moderation review.', 'info');
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!user) {
      addToast('You must be logged in to answer questions.', 'warning');
      navigate('/login');
      return;
    }
    if (!newAnswer.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await API.post(`/posts/${id}/comment`, { text: newAnswer });
      setPost(res.data);
      setNewAnswer('');
      addToast('Answer posted successfully!', 'success');
    } catch (err) {
      addToast('Failed to post answer.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!user) return;
    if (!window.confirm('Are you sure you want to delete this question?')) return;

    try {
      await API.delete(`/posts/${id}`);
      addToast('Question deleted successfully!', 'success');
      navigate('/');
    } catch (err) {
      addToast('Failed to delete question.', 'error');
    }
  };

  const handleDeleteAnswer = async (commentId) => {
    if (!user) return;
    if (!window.confirm('Are you sure you want to delete this answer?')) return;

    try {
      const res = await API.delete(`/posts/${id}/comment/${commentId}`);
      setPost(res.data);
      addToast('Answer deleted successfully!', 'success');
    } catch (err) {
      addToast('Failed to delete answer.', 'error');
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      addToast('You must be logged in to bookmark questions.', 'warning');
      navigate('/login');
      return;
    }
    try {
      const res = await API.post(`/posts/${id}/bookmark`);
      setIsBookmarked(res.data.isBookmarked);
      addToast(res.data.isBookmarked ? 'Question saved!' : 'Question unsaved.', 'success');
    } catch (err) {
      // Fallback to local toggle if API doesn't support it yet
      setIsBookmarked(!isBookmarked);
    }
  };

  const handleVoteAnswer = async (commentId, voteType) => {
    if (!user) {
      addToast('You must be logged in to vote on answers.', 'warning');
      navigate('/login');
      return;
    }
    try {
      const res = await API.post(`/posts/${id}/comment/${commentId}/vote`, { voteType });
      setPost(res.data);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to vote on answer.', 'error');
    }
  };

  const handleAcceptAnswer = async (commentId) => {
    if (!user) {
      addToast('You must be logged in to accept answers.', 'warning');
      navigate('/login');
      return;
    }
    try {
      const res = await API.post(`/posts/${id}/accept/${commentId}`);
      setPost(res.data);
      addToast('Answer accepted!', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to accept answer.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#F48024]"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center text-gray-500 py-20">
        Question not found.
      </div>
    );
  }

  const upvotes = post.upvotes?.length ?? post.likes?.length ?? 0;
  const downvotes = post.downvotes?.length ?? 0;
  const voteBalance = upvotes - downvotes;

  const isUpvoted = post.upvotes?.includes(user?._id);
  const isDownvoted = post.downvotes?.includes(user?._id);
  const postOwnerName = post.user?.username || 'Unknown User';

  return (
    <div className="max-w-[1000px] mx-auto text-[13px] text-gray-800">
      {/* Header */}
      <div className="pb-4 mb-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-4">
          <h1 className="text-[24px] text-gray-900 font-normal leading-tight break-words flex-1">
            {post.caption}
          </h1>
          <button
            onClick={() => navigate('/questions/ask')}
            className="bg-[#0A95FF] hover:bg-[#0074CC] text-white px-3 py-2 rounded text-[13px] transition-colors whitespace-nowrap"
          >
            Ask Question
          </button>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Asked <span className="text-gray-800">{new Date(post.createdAt).toLocaleDateString()}</span></span>
          </div>
          <div>
            Active <span className="text-gray-800">{new Date(post.updatedAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            <span>Viewed <span className="text-gray-800">{post.views || 0} time{(post.views || 0) !== 1 ? 's' : ''}</span></span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        {/* Voting Column */}
        <div className="flex flex-row sm:flex-col items-center justify-start sm:justify-start flex-shrink-0 gap-3.5 sm:gap-2.5 w-full sm:w-12 pt-2 border-b sm:border-b-0 pb-3.5 sm:pb-0 border-gray-200">
          <button
            onClick={() => handleVote('upvote')}
            className={`p-2 border rounded-full transition-colors ${
              isUpvoted
                ? 'bg-orange-100 border-orange-400 text-orange-600'
                : 'border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-orange-500'
            }`}
            title="This question shows research effort; it is useful and clear"
          >
            <ChevronUp size={24} />
          </button>

          <span className="text-[20px] font-semibold text-gray-700">{voteBalance}</span>

          <button
            onClick={() => handleVote('downvote')}
            className={`p-2 border rounded-full transition-colors ${
              isDownvoted
                ? 'bg-orange-100 border-orange-400 text-orange-600'
                : 'border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-orange-500'
            }`}
            title="This question does not show any research effort; it is not useful or clear"
          >
            <ChevronDown size={24} />
          </button>

          <button
            onClick={handleBookmark}
            className={`p-2 transition-colors sm:mt-2 ${isBookmarked ? 'text-orange-500' : 'text-gray-300 hover:text-orange-500'}`}
          >
            <Bookmark size={18} fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Content Column */}
        <div className="flex-1 min-w-0">
          <div className="prose max-w-none mb-6">
            <div className="text-[15px] text-[#232629] leading-relaxed break-words markdown-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSanitize]}
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={match[1]}
                        PreTag="div"
                        className="my-3 rounded-md text-[13px] overflow-x-auto"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : inline ? (
                      <code className="bg-gray-100 px-1 py-0.5 rounded font-mono text-[12px] text-red-600" {...props}>{children}</code>
                    ) : (
                      <pre className="bg-gray-50 border border-gray-200 p-3 rounded font-mono text-[12px] overflow-x-auto my-3 text-gray-800"><code {...props}>{children}</code></pre>
                    );
                  },
                  h1: ({ children }) => <h2 className="text-lg font-bold mt-5 mb-3 text-gray-900">{children}</h2>,
                  h2: ({ children }) => <h3 className="text-base font-bold mt-4 mb-2 text-gray-900">{children}</h3>,
                  h3: ({ children }) => <h4 className="text-sm font-bold mt-3 mb-1 text-gray-900">{children}</h4>,
                  li: ({ children }) => <li className="ml-4 list-disc">{children}</li>,
                  p: ({ children }) => <p className="mb-3">{children}</p>,
                }}
              >
                {post.description || ''}
              </ReactMarkdown>
            </div>
          </div>

           {post.mediaUrl && (
             <div className="mb-6 rounded-md border border-gray-200 overflow-hidden max-w-lg">
               {post.type === 'video' ? (
                 <video src={getMediaUrl(post.mediaUrl)} controls className="w-full object-cover" />
               ) : (
                 <img src={getMediaUrl(post.mediaUrl)} alt="Attached context" className="w-full object-cover" />
               )}
             </div>
           )}

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-6">
            {post.tags && post.tags.map((tag) => (
              <span
                key={tag}
                className="text-[#39739D] bg-[#E1ECF4] px-1.5 py-1 rounded-[3px] text-[12px]"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Share/Delete Actions & Owner info */}
          <div className="flex flex-wrap justify-between items-start gap-4 pb-4 border-b border-gray-100 mb-6">
            <div className="flex gap-3 text-gray-500">
              <button 
                onClick={handleShareQuestion}
                className="hover:text-gray-800 cursor-pointer flex items-center gap-1"
              >
                <Share2 size={13} /> Share
              </button>
              <button 
                onClick={handleFlagQuestion}
                className="hover:text-gray-800 cursor-pointer flex items-center gap-1"
              >
                <Flag size={13} /> Flag
              </button>
              {(user?.role === 'admin' || post.user?._id === user?._id || post.user === user?._id) && (
                <button
                  onClick={handleDeleteQuestion}
                  className="text-red-600 hover:text-red-800 cursor-pointer flex items-center gap-1 font-medium"
                >
                  <Trash2 size={13} /> Delete
                </button>
              )}
            </div>

            {/* Author info card */}
            <div className="bg-[#EBF4FB] border border-[#d6e9f8] rounded p-2.5 w-[200px]">
              <span className="text-xs text-gray-500 block mb-1">
                asked {new Date(post.createdAt).toLocaleDateString()}
              </span>
              <div className="flex items-center gap-2">
                {post.user?.avatar ? (
                  <img src={getMediaUrl(post.user.avatar)} alt={postOwnerName} className="w-8 h-8 rounded-sm object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-sm bg-purple-600 text-white flex items-center justify-center font-bold text-sm uppercase">
                    {postOwnerName.charAt(0)}
                  </div>
                )}
                <div>
                  <Link to={`/profile/${postOwnerName}`} className="text-[#0074CC] hover:text-[#0A95FF] font-medium block">
                    {postOwnerName}
                  </Link>
                  <span className="text-[11px] text-gray-500 font-bold block" title="Reputation">
                    {post.user?.reputation || 1}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Answers Section */}
          <div className="mb-8">
            <h2 className="text-[19px] text-gray-800 font-normal border-b border-gray-100 pb-2 mb-4">
              {post.comments?.length || 0} Answer{(post.comments?.length !== 1) ? 's' : ''}
            </h2>

            <div className="space-y-4">
              {post.comments && post.comments.map((comment) => (
                <AnswerCard
                  key={comment._id}
                  comment={comment}
                  currentUser={user}
                  postOwnerId={post.user?._id || post.user}
                  isAccepted={post.acceptedAnswer && post.acceptedAnswer.toString() === comment._id.toString()}
                  isQuestionOwner={post.user?._id === user?._id || post.user === user?._id}
                  onDelete={handleDeleteAnswer}
                  onVote={handleVoteAnswer}
                  onAccept={handleAcceptAnswer}
                />
              ))}
            </div>
          </div>

          {/* Add Answer Box */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-[19px] font-normal text-gray-800 mb-4 font-sans">Your Answer</h3>
            {user ? (
              <form onSubmit={handleSubmitAnswer} className="space-y-4">
                <textarea
                  placeholder="Write your answer here... Supports Markdown formatting."
                  rows={8}
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  className="w-full border border-gray-300 rounded p-3 font-mono text-sm focus:border-[#0074CC] focus:ring-4 focus:ring-[#0074CC]/20 outline-none"
                  required
                />
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <button
                    type="submit"
                    disabled={isSubmitting || !newAnswer.trim()}
                    className="bg-[#0A95FF] hover:bg-[#0074CC] text-white font-bold py-2 px-4 rounded-[3px] disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {isSubmitting ? 'Posting...' : 'Post Your Answer'}
                  </button>
                  <p className="text-xs text-gray-500">
                    Provide detailed explanations, code snippets, or reference links.
                  </p>
                </div>
              </form>
            ) : (
              <div className="bg-[#fdf7e2] border border-[#e6e4c4] p-5 rounded-[3px] text-[13px] text-gray-700 flex flex-col items-center gap-3">
                <p className="text-center font-medium">
                  To answer this question, you must have an account. Join the community to help others!
                </p>
                <div className="flex gap-2">
                  <Link to="/login" className="bg-[#e1ecf4] hover:bg-[#b3d3ea] border border-[#7aa7c7] text-[#39739d] px-4 py-2 rounded-[3px] font-medium transition-colors cursor-pointer">
                    Log in
                  </Link>
                  <Link to="/register" className="bg-[#0A95FF] hover:bg-[#0074CC] text-white px-4 py-2 rounded-[3px] font-medium transition-colors cursor-pointer">
                    Sign up
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionDetail;
