import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronUp, ChevronDown, Check } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { getMediaUrl } from '../../utils/media';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const AnswerCard = ({
  comment,
  currentUser,
  postOwnerId,
  isAccepted = false,
  isQuestionOwner = false,
  onDelete,
  onVote,
  onAccept,
}) => {
  const { addToast } = useToast();
  const commentOwnerName = comment.user?.username || 'Unknown User';
  const isCommentOwner = currentUser?._id === comment.user?._id || currentUser?._id === comment.user;
  const canDelete = currentUser?.role === 'admin' || isCommentOwner || postOwnerId === currentUser?._id;

  const upvotes = comment.upvotes?.length || 0;
  const downvotes = comment.downvotes?.length || 0;
  const voteBalance = upvotes - downvotes;
  const isUpvoted = comment.upvotes?.includes(currentUser?._id);
  const isDownvoted = comment.downvotes?.includes(currentUser?._id);

  return (
    <div className={`flex gap-4 p-4 md:p-5 bg-white border rounded-md shadow-sm hover:shadow transition-all duration-150 relative ${
      isAccepted ? 'border-emerald-300 bg-emerald-50/30' : 'border-gray-200'
    }`}>
      {/* Voting Column */}
      {onVote && (
        <div className="flex flex-col items-center flex-shrink-0 w-10 pt-1">
          <button
            type="button"
            onClick={() => onVote(comment._id, 'upvote')}
            className={`p-1.5 border rounded-full transition-colors ${
              isUpvoted
                ? 'bg-orange-100 border-orange-400 text-orange-600'
                : 'border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-orange-500'
            }`}
            title="This answer is useful"
          >
            <ChevronUp size={18} />
          </button>

          <span className={`text-[16px] font-semibold my-1 ${voteBalance > 0 ? 'text-gray-900' : voteBalance < 0 ? 'text-red-500' : 'text-gray-500'}`}>
            {voteBalance}
          </span>

          <button
            type="button"
            onClick={() => onVote(comment._id, 'downvote')}
            className={`p-1.5 border rounded-full transition-colors ${
              isDownvoted
                ? 'bg-orange-100 border-orange-400 text-orange-600'
                : 'border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-orange-500'
            }`}
            title="This answer is not useful"
          >
            <ChevronDown size={18} />
          </button>

          {/* Accept Answer Button (only visible to question owner) */}
          {onAccept && isQuestionOwner && (
            <button
              type="button"
              onClick={() => onAccept(comment._id)}
              className={`mt-3 p-1.5 rounded-full transition-all ${
                isAccepted
                  ? 'text-emerald-600 bg-emerald-100 border-2 border-emerald-400'
                  : 'text-gray-300 hover:text-emerald-500 border-2 border-transparent'
              }`}
              title={isAccepted ? 'Unaccept this answer' : 'Accept this answer'}
            >
              <Check size={18} strokeWidth={3} />
            </button>
          )}

          {/* Show accepted checkmark for non-owners */}
          {isAccepted && !isQuestionOwner && (
            <div className="mt-3 p-1.5 text-emerald-600" title="Accepted answer">
              <Check size={18} strokeWidth={3} />
            </div>
          )}
        </div>
      )}

      <div className="flex-1 min-w-0">
        {/* Accepted badge */}
        {isAccepted && (
          <div className="flex items-center gap-1.5 mb-3 text-emerald-700 text-[12px] font-medium">
            <Check size={14} strokeWidth={3} />
            <span>Accepted Answer</span>
          </div>
        )}

        <div className="text-[14px] text-[#232629] leading-relaxed break-words mb-4 markdown-content">
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
            {comment.text || ''}
          </ReactMarkdown>
        </div>

        <div className="flex justify-between items-center gap-4 text-xs mt-3 pt-3 border-t border-gray-50">
          <div className="flex gap-3 text-gray-500 font-medium">
            <button 
              type="button" 
              onClick={() => {
                const shareUrl = `${window.location.origin}${window.location.pathname}#answer-${comment._id}`;
                navigator.clipboard.writeText(shareUrl);
                addToast('Answer link copied to clipboard!', 'success');
              }}
              className="hover:text-gray-800 transition-colors cursor-pointer"
            >
              Share
            </button>
            <button 
              type="button" 
              onClick={() => {
                addToast('Thank you! This answer has been reported for moderation review.', 'info');
              }}
              className="hover:text-gray-800 transition-colors cursor-pointer"
            >
              Flag
            </button>
            {canDelete && (
              <button
                type="button"
                onClick={() => onDelete(comment._id)}
                className="text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
              >
                Delete
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 bg-gray-50/50 px-2 py-1 rounded border border-gray-100">
            {comment.user?.avatar ? (
              <img src={getMediaUrl(comment.user.avatar)} alt={commentOwnerName} className="w-5 h-5 rounded-sm object-cover" />
            ) : (
              <div className="w-5 h-5 rounded-sm bg-blue-600 text-white flex items-center justify-center font-bold text-[9px] uppercase">
                {commentOwnerName.charAt(0)}
              </div>
            )}
            <Link to={`/profile/${commentOwnerName}`} className="text-[#0074CC] hover:text-[#0A95FF] font-medium transition-colors">
              {commentOwnerName}
            </Link>
            <span className="font-bold text-gray-600 text-[10px]" title="Reputation">
              {comment.user?.reputation || 1}
            </span>
            <span className="text-gray-400">
              answered {new Date(comment.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnswerCard;
