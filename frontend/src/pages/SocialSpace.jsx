import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Share2, Image, Video, Film, Send, Users, UserPlus, UserMinus, Plus, Trash2 } from 'lucide-react';
import API from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getMediaUrl } from '../utils/media';

const SocialSpace = () => {
  const { user: currentUser } = useSelector((state) => state.auth);
  const { addToast } = useToast();
  const { t } = useLanguage();

  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [friendCount, setFriendCount] = useState(0);
  const [friendsList, setFriendsList] = useState([]);
  const [nonFriends, setNonFriends] = useState([]);

  // Create Post form state
  const [caption, setCaption] = useState('');
  const [postType, setPostType] = useState('text'); // text, photo, video
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaUrl, setMediaUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active comments sections (postId -> boolean)
  const [openComments, setOpenComments] = useState({});
  const [newComments, setNewComments] = useState({}); // postId -> comment text

  // Load social posts, user friends and user recommendations
  const fetchData = useCallback(async () => {
    if (!currentUser?.username) return;
    try {
      setIsLoading(true);
      // Fetch user profile to get friend count and list
      const profileRes = await API.get(`/users/${currentUser.username}`);
      const populatedFriends = (profileRes.data?.user?.friends || []).filter(f => f && f._id && f.username);
      setFriendsList(populatedFriends);
      setFriendCount(populatedFriends.length);

      // Fetch all users to recommend friends
      const usersRes = await API.get('/users');
      const allUsers = (usersRes.data || []).filter(u => u && u._id && u.username);
      
      // Filter out self and current friends
      const filteredRecommendations = allUsers.filter(
        (u) => 
          currentUser?._id &&
          u._id !== currentUser._id && 
          !populatedFriends.some(f => f && f._id === u._id)
      );
      setNonFriends(filteredRecommendations.slice(0, 5));

      // Fetch social posts
      const postsRes = await API.get('/posts?isSocial=true&limit=50');
      setPosts(postsRes.data.posts || []);
    } catch (err) {
      addToast('Failed to load social space data.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 border-4 border-[#0A95FF] border-t-transparent rounded-full animate-spin"></div>
        <span className="text-gray-500 text-xs font-semibold">Loading User Profile...</span>
      </div>
    );
  }

  // Handle media upload
  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Auto-detect type
    if (file.type.startsWith('image/')) {
      setPostType('photo');
    } else if (file.type.startsWith('video/')) {
      setPostType('video');
    }
    setMediaFile(file);
    setMediaUrl(URL.createObjectURL(file));
  };

  // Submit new post
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!caption.trim()) {
      addToast('Caption text is required', 'warning');
      return;
    }

    setIsSubmitting(true);
    let finalMediaUrl = '';

    try {
      // 1. Upload media if present
      if (mediaFile) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('media', mediaFile);
        const uploadRes = await API.post('/posts/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        finalMediaUrl = uploadRes.data.url;
        setIsUploading(false);
      }

      // 2. Create post
      const newPostData = {
        caption: caption.trim(),
        type: postType,
        mediaUrl: finalMediaUrl || '',
        isSocial: true
      };

      const res = await API.post('/posts', newPostData);
      setPosts((prev) => [res.data, ...prev]);
      
      // Reset form
      setCaption('');
      setPostType('text');
      setMediaFile(null);
      setMediaUrl('');
      addToast('Social post shared successfully!', 'success');
      fetchData(); // reload limits/data
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create social post.', 'error');
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  // Toggle Friend/Unfriend
  const handleToggleFriend = async (userId, targetUsername) => {
    try {
      const res = await API.post(`/users/${userId}/friend`);
      addToast(res.data.message, 'success');
      fetchData();
    } catch (err) {
      addToast('Failed to change friendship status', 'error');
    }
  };

  // Like a post
  const handleLike = async (postId) => {
    try {
      const res = await API.post(`/posts/${postId}/like`);
      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? { ...p, likes: res.data.likes } : p))
      );
    } catch (err) {
      addToast('Failed to update like status', 'error');
    }
  };

  // Toggle comments expand
  const toggleCommentsSection = (postId) => {
    setOpenComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  // Write new comment
  const handleAddComment = async (postId) => {
    const commentText = newComments[postId] || '';
    if (!commentText.trim()) return;

    try {
      const res = await API.post(`/posts/${postId}/comment`, { text: commentText });
      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? { ...p, comments: res.data.comments } : p))
      );
      setNewComments((prev) => ({ ...prev, [postId]: '' }));
      addToast('Comment added!', 'success');
    } catch (err) {
      addToast('Failed to post comment', 'error');
    }
  };

  // Share a post
  const handleShare = async (postId) => {
    try {
      // 1. Increment share count in backend
      const res = await API.post(`/posts/${postId}/share`);
      
      // Update state
      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? { ...p, sharesCount: res.data.sharesCount } : p))
      );

      // 2. Copy link
      const postUrl = `${window.location.origin}/questions/${postId}`;
      await navigator.clipboard.writeText(postUrl);
      addToast('Link copied to clipboard! Share it anywhere.', 'success');
    } catch (err) {
      addToast('Failed to share post.', 'error');
    }
  };

  // Delete post (if own)
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this social post?')) return;
    try {
      await API.delete(`/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      addToast('Post removed successfully.', 'success');
    } catch (err) {
      addToast('Failed to delete post.', 'error');
    }
  };

  // Check user posting limits displays
  const getPostingLimitText = () => {
    if (friendCount === 0) {
      return 'You have 0 friends. Posting is restricted. Connect with friends to share posts!';
    } else if (friendCount === 1) {
      return 'Posting Limit: 1 post per day (Current connections: 1 friend).';
    } else if (friendCount >= 2 && friendCount <= 10) {
      return `Posting Limit: 2 posts per day (Current connections: ${friendCount} friends).`;
    } else {
      return `Unlimited Posting (Current connections: ${friendCount} friends).`;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-[1100px] mx-auto text-[13px] text-gray-800 p-2 font-sans">
      
      {/* Left Main Content Feed */}
      <div className="flex-1 min-w-0 max-w-[700px] mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-[27px] font-normal text-gray-900 leading-none mb-2">OverflowX Social Space</h1>
            <p className="text-[13px] text-gray-500 font-medium">{getPostingLimitText()}</p>
          </div>
        </div>

        {/* Share New Post Panel */}
        <div className="bg-white border border-gray-200 rounded-[5px] p-4 mb-6 shadow-sm">
          <form onSubmit={handleCreatePost} className="space-y-4">
            <div className="flex gap-3">
              {currentUser.avatar ? (
                <img src={getMediaUrl(currentUser.avatar)} alt={currentUser.username} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm uppercase flex-shrink-0">
                  {currentUser.username.charAt(0)}
                </div>
              )}
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Share what is on your mind..."
                className="w-full border-none focus:ring-0 focus:outline-none resize-none min-h-[60px] text-[14px]"
                maxLength={500}
              />
            </div>

            {/* Media Preview */}
            {mediaUrl && (
              <div className="relative rounded-lg overflow-hidden max-h-[300px] border border-gray-100 bg-gray-50 flex items-center justify-center">
                {postType === 'photo' ? (
                  <img src={mediaUrl} alt="Preview" className="max-h-[300px] object-contain w-full" />
                ) : (
                  <video src={mediaUrl} controls className="max-h-[300px] object-contain w-full" />
                )}
                <button
                  type="button"
                  onClick={() => { setMediaFile(null); setMediaUrl(''); setPostType('text'); }}
                  className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-1 rounded-full"
                  title="Remove media"
                >
                  <Plus size={16} className="rotate-45" />
                </button>
              </div>
            )}

            {/* Bottom options */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-gray-500 hover:text-[#0A95FF] cursor-pointer font-semibold">
                  <Image size={18} />
                  <span>Photo / Video</span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleMediaChange}
                    className="hidden"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isUploading || !caption.trim() || friendCount === 0}
                className="bg-[#0A95FF] hover:bg-[#0074CC] text-white px-4 py-1.5 rounded font-semibold text-[13px] flex items-center gap-1.5 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
              >
                <Send size={14} />
                <span>{isUploading ? 'Uploading...' : isSubmitting ? 'Posting...' : 'Share'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Posts feed */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-[5px] p-4 animate-pulse h-60" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 border border-gray-200 rounded-[5px] text-gray-500 flex flex-col items-center gap-3">
            <Users size={48} className="text-gray-300" />
            <p className="font-semibold text-base">No social posts yet.</p>
            <p className="text-sm text-gray-400">Be the first to share an update in the social space!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => {
              const isLiked = post.likes?.includes(currentUser._id);
              const isOwnPost = post.user?._id === currentUser._id;
              
              return (
                <div key={post._id} className="bg-white border border-gray-200 rounded-[5px] shadow-sm overflow-hidden">
                  
                  {/* Post Author Header */}
                  <div className="flex items-center gap-3 p-4">
                    {post.user?.avatar ? (
                      <img src={getMediaUrl(post.user.avatar)} alt={post.user.username} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-sm uppercase">
                        {post.user?.username?.charAt(0) || '?'}
                      </div>
                    )}
                    <div>
                      <Link to={`/profile/${post.user?.username}`} className="font-bold text-gray-900 hover:text-[#0A95FF]">
                        {post.user?.username || 'Unknown User'}
                      </Link>
                      <span className="text-[11px] text-gray-500 block">
                        {new Date(post.createdAt).toLocaleString()}
                      </span>
                    </div>

                    {isOwnPost && (
                      <button
                        onClick={() => handleDeletePost(post._id)}
                        className="ml-auto text-gray-400 hover:text-red-500 p-1.5 rounded transition-colors"
                        title="Delete social post"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  {/* Caption Content */}
                  <div className="px-4 pb-2 text-[14px] leading-relaxed text-gray-800 whitespace-pre-line">
                    {post.caption}
                  </div>

                  {/* Media Content */}
                  {post.mediaUrl && (
                    <div className="border-y border-gray-100 bg-black flex items-center justify-center max-h-[500px] overflow-hidden">
                      {post.type === 'video' ? (
                        <video src={getMediaUrl(post.mediaUrl)} controls className="max-h-[500px] w-full object-contain" />
                      ) : (
                        <img src={getMediaUrl(post.mediaUrl)} alt="Social Media" className="max-h-[500px] w-full object-contain" />
                      )}
                    </div>
                  )}

                  {/* Action stats & buttons */}
                  <div className="px-4 py-2 flex items-center justify-between text-gray-500 text-[12px] border-b border-gray-100">
                    <span>{post.likes?.length || 0} Likes</span>
                    <div className="flex gap-4">
                      <span>{post.comments?.length || 0} Comments</span>
                      <span>{post.sharesCount || 0} Shares</span>
                    </div>
                  </div>

                  {/* Interactive Button bar */}
                  <div className="px-4 py-1 flex items-center justify-between text-gray-600 font-semibold border-b border-gray-50">
                    <button
                      onClick={() => handleLike(post._id)}
                      className={`flex items-center gap-1.5 py-1.5 px-3 rounded hover:bg-gray-50 transition-colors cursor-pointer ${
                        isLiked ? 'text-red-600' : 'text-gray-600 hover:text-red-600'
                      }`}
                    >
                      <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
                      <span>Like</span>
                    </button>

                    <button
                      onClick={() => toggleCommentsSection(post._id)}
                      className="flex items-center gap-1.5 py-1.5 px-3 rounded hover:bg-gray-50 text-gray-600 hover:text-[#0A95FF] transition-colors cursor-pointer"
                    >
                      <MessageCircle size={18} />
                      <span>Comment</span>
                    </button>

                    <button
                      onClick={() => handleShare(post._id)}
                      className="flex items-center gap-1.5 py-1.5 px-3 rounded hover:bg-gray-50 text-gray-600 hover:text-green-600 transition-colors cursor-pointer"
                    >
                      <Share2 size={18} />
                      <span>Share</span>
                    </button>
                  </div>

                  {/* Comments Section Drawer */}
                  {openComments[post._id] && (
                    <div className="bg-gray-50 p-4 border-t border-gray-100 space-y-4">
                      {/* List comments */}
                      {post.comments?.length > 0 && (
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                          {post.comments.map((comment) => (
                            <div key={comment._id} className="flex gap-2">
                              {comment.user?.avatar ? (
                                <img src={getMediaUrl(comment.user.avatar)} alt={comment.user.username} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                                  {comment.user?.username?.charAt(0) || '?'}
                                </div>
                              )}
                              <div className="flex-1 bg-white p-2 rounded-[5px] border border-gray-200">
                                <div className="flex items-center justify-between mb-0.5">
                                  <Link to={`/profile/${comment.user?.username}`} className="font-bold text-gray-900 text-xs">
                                    {comment.user?.username || 'Unknown User'}
                                  </Link>
                                  <span className="text-[10px] text-gray-400">
                                    {new Date(comment.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-[12px] text-gray-800 leading-snug">{comment.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add comment input */}
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="Write a comment..."
                          value={newComments[post._id] || ''}
                          onChange={(e) =>
                            setNewComments((prev) => ({ ...prev, [post._id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddComment(post._id);
                          }}
                          className="flex-1 text-[13px] bg-white border border-gray-300 rounded-[3px] px-3 py-1.5 focus:outline-none focus:border-[#0A95FF] focus:ring-1 focus:ring-[#0A95FF]"
                        />
                        <button
                          onClick={() => handleAddComment(post._id)}
                          className="text-[#0A95FF] hover:text-[#0074CC] p-1.5"
                          title="Send comment"
                        >
                          <Send size={18} />
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Social Sidebar (Friends & Recommendations) */}
      <div className="w-full lg:w-[280px] flex-shrink-0 space-y-6">
        
        {/* User Friends list */}
        <div className="bg-white border border-gray-200 rounded-[5px] p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
            <Users size={18} className="text-[#F48024]" />
            <h2 className="text-[15px] font-bold text-gray-900">Your Friends ({friendCount})</h2>
          </div>

          {friendsList.length === 0 ? (
            <p className="text-gray-400 italic text-center py-4">No friends added yet. Add friends below to increase your posting limit!</p>
          ) : (
            <div className="space-y-3">
              {friendsList.map((friend) => (
                <div key={friend._id} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {friend.avatar ? (
                      <img src={getMediaUrl(friend.avatar)} alt={friend.username} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                        {friend.username.charAt(0)}
                      </div>
                    )}
                    <Link to={`/profile/${friend.username}`} className="text-gray-900 font-semibold hover:text-[#0A95FF] truncate block">
                      {friend.username}
                    </Link>
                  </div>
                  <button
                    onClick={() => handleToggleFriend(friend._id, friend.username)}
                    className="text-red-500 hover:text-red-700 text-xs font-semibold shrink-0"
                    title="Remove Friend"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Friend Recommendations (Non-friends list) */}
        <div className="bg-white border border-gray-200 rounded-[5px] p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
            <UserPlus size={18} className="text-[#0A95FF]" />
            <h2 className="text-[15px] font-bold text-gray-900">Find Friends</h2>
          </div>

          {nonFriends.length === 0 ? (
            <p className="text-gray-400 italic text-center py-4">No recommendations. Search or view users from the Users page!</p>
          ) : (
            <div className="space-y-4">
              {nonFriends.map((rec) => (
                <div key={rec._id} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {rec.avatar ? (
                      <img src={getMediaUrl(rec.avatar)} alt={rec.username} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gray-500 text-white flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                        {rec.username.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <Link to={`/profile/${rec.username}`} className="text-gray-900 font-semibold hover:text-[#0A95FF] truncate block">
                        {rec.username}
                      </Link>
                      <span className="text-[10px] text-gray-400 block truncate">{rec.bio || 'No bio'}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleFriend(rec._id, rec.username)}
                    className="bg-[#E1ECF4] text-[#39739d] hover:bg-[#b3d3ea] border border-[#7aa7c7] px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-0.5 shrink-0 transition-colors"
                  >
                    <Plus size={10} /> Add
                  </button>
                </div>
              ))}
              <div className="text-center pt-2">
                <Link to="/users" className="text-[#0074CC] hover:text-[#0A95FF] font-semibold text-xs">
                  View all users directory →
                </Link>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default SocialSpace;
