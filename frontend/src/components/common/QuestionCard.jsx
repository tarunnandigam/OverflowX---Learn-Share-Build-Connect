import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, ArrowUp } from 'lucide-react';
import { getMediaUrl } from '../../utils/media';

const QuestionCard = ({
  post,
  currentUser,
  onLike,
  onDelete,
  onSelectTag
}) => {
  const isLiked = post.likes?.includes(currentUser?._id);
  const postOwnerName = post.user?.username || 'Unknown User';
  const upvotesCount = post.upvotes?.length ?? post.likes?.length ?? 0;
  const downvotesCount = post.downvotes?.length ?? 0;
  const votes = upvotesCount - downvotesCount;
  const answers = post.comments?.length || 0;
  


  // Use actual tags — no fake defaults
  const postTags = post.tags && post.tags.length > 0 ? post.tags : [];

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const isOwner = currentUser?.role === 'admin' || post.user?._id === currentUser?._id || post.user === currentUser?._id;

  return (
    <div className="flex flex-col sm:flex-row p-4 md:p-5 border-b border-gray-200 gap-4 md:gap-5 hover:bg-gray-50/70 transition-all duration-200 group relative">
      {/* Left Stats Block */}
      <div className="flex flex-row sm:flex-col items-center sm:items-end flex-wrap gap-3 sm:gap-1.5 flex-shrink-0 w-full sm:w-[108px] text-[13px] text-gray-500 border-b sm:border-b-0 pb-2 sm:pb-0 border-gray-150">
        <div className="text-gray-900 text-sm font-medium flex items-center gap-1">
          <span>{votes}</span>
          <span className="text-xs text-gray-500 font-normal">votes</span>
        </div>
        <div className={`px-2 py-0.5 rounded text-xs transition-colors duration-150 ${
          answers > 0 
            ? 'text-emerald-700 border border-emerald-600 bg-emerald-50/50 font-medium' 
            : 'text-gray-500'
        }`}>
          <span>{answers}</span> answers
        </div>
        <div className="text-xs text-gray-400">
          {post.views || 0} views
        </div>
        <div className="sm:mt-1.5">
          <button 
            type="button"
            onClick={() => onLike(post._id)} 
            className={`flex items-center gap-1 border px-2 py-1 rounded-md text-[10px] font-medium transition-all duration-150 ${
              isLiked 
                ? 'bg-orange-50 text-orange-600 border-orange-200 shadow-sm' 
                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800'
            }`} 
            title={isLiked ? "Remove vote" : "Upvote"}
          >
            <ArrowUp size={11} className={isLiked ? "stroke-[3px]" : ""} />
            <span>{isLiked ? 'Voted' : 'Vote'}</span>
          </button>
        </div>
      </div>

      {/* Right Content Block */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <Link to={`/questions/${post._id}`} className="flex-1 min-w-0">
            <h3 className="text-[16px] md:text-[17px] text-[#0074CC] hover:text-[#0A95FF] mb-1.5 font-normal leading-snug break-words group-hover:text-[#0A95FF] transition-colors duration-150">
              {post.caption}
            </h3>
          </Link>
          
          {isOwner && (
            <button
              type="button"
              onClick={() => onDelete(post._id)}
              className="text-gray-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-full transition-colors duration-150 flex-shrink-0"
              title="Delete Question"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
        
        <p className="text-[13px] text-[#3B4045] line-clamp-2 mb-3 leading-relaxed">
          {post.description 
            ? (post.description.length > 180 ? post.description.substring(0, 180) + '...' : post.description) 
            : (post.mediaUrl ? 'View attached media for more context on this question.' : 'Click to view this question detail and answers.')}
        </p>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-auto pt-1">
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {postTags.map(tag => (
              <button 
                type="button"
                key={tag} 
                onClick={() => onSelectTag(tag)} 
                className="text-[#39739D] bg-[#E1ECF4] hover:bg-[#D0E3F1] hover:text-[#2c5878] px-2 py-1 rounded-[4px] text-[11px] font-mono transition-colors duration-150 border border-transparent hover:border-[#b3d3ea]"
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Author Info */}
          <div className="flex items-center text-[12px] text-gray-500 gap-2 flex-shrink-0 bg-gray-50/50 px-2 py-1 rounded border border-gray-100 sm:ml-auto">
            {post.user?.avatar ? (
              <img src={getMediaUrl(post.user.avatar)} alt={postOwnerName} className="w-4 h-4 rounded-sm object-cover" />
            ) : (
              <div className="w-4 h-4 rounded-sm bg-indigo-600 text-white flex items-center justify-center font-bold text-[8px] uppercase">
                {postOwnerName.charAt(0)}
              </div>
            )}
            <Link to={`/profile/${postOwnerName}`} className="text-[#0074CC] hover:text-[#0A95FF] font-medium">
              {postOwnerName}
            </Link>
            <span className="font-bold text-gray-600 text-[10px]" title="Reputation score">
              {post.user?.reputation || 1}
            </span>
            <span className="text-gray-400">asked {formatDate(post.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionCard;
