import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import API from '../services/api';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { AlertCircle, Eye, Edit2 } from 'lucide-react';

const AskQuestion = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [caption, setCaption] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [postType, setPostType] = useState('text');
  const [mediaUrl, setMediaUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeMode, setActiveMode] = useState('edit'); // 'edit' or 'preview'

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!caption.trim()) {
      addToast('Please enter a question title', 'warning');
      return;
    }
    if (description.trim().length < 20) {
      addToast('Please describe your problem in more detail (min. 20 chars)', 'warning');
      return;
    }

    let finalMediaUrl = mediaUrl.trim();
    if (postType === 'photo' && !finalMediaUrl) {
      finalMediaUrl = 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=60';
    } else if (postType === 'video' && !finalMediaUrl) {
      finalMediaUrl = 'https://assets.mixkit.co/videos/preview/mixkit-keyboard-typing-close-up-1582-large.mp4';
    }

    setIsSubmitting(true);
    try {
      const response = await API.post('/posts', {
        type: postType,
        mediaUrl: finalMediaUrl,
        caption: caption.trim(),
        description: description.trim(),
        tags: tags.trim()
      });
      addToast('Question asked successfully!', 'success');
      navigate(`/questions/${response.data._id}`);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to publish question', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto text-[13px] text-gray-800 font-sans pb-16">
      
      {/* Title & Banner Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-[27px] text-gray-900 font-normal">Ask a public question</h1>
      </div>

      {/* Notice Banner */}
      <div className="bg-[#EBF4FB] border border-[#B3D3EA] p-5 rounded-md mb-6 text-gray-700">
        <h3 className="font-medium text-[16px] text-gray-900 mb-2">Writing a good question</h3>
        <p className="mb-3 text-[13px] leading-relaxed">
          You're ready to ask a programming-related question and this guide will help you through the process.
          Looking to ask a non-programming question? See <span className="text-[#0074CC] hover:underline cursor-pointer">topics here</span> to find the right site.
        </p>
        <h4 className="font-bold text-[12px] uppercase tracking-wider text-gray-500 mb-1.5">Steps:</h4>
        <ul className="list-decimal pl-5 space-y-1 text-gray-600 text-[13px]">
          <li>Summarize your problem in a one-line title.</li>
          <li>Describe your problem in more detail.</li>
          <li>Describe what you tried and what you expected to happen.</li>
          <li>Add "tags" which help connect your question with similar users.</li>
        </ul>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Form Column */}
        <form onSubmit={handleSubmit} className="flex-1 space-y-6">
          
          {/* Question Title Card */}
          <div className="bg-white border border-gray-200 rounded p-6 shadow-sm hover:shadow-md transition-all">
            <label htmlFor="title-input" className="block font-bold text-[15px] text-gray-900 mb-1">
              Title
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Be specific and imagine you're asking a question to another programmer.
            </p>
            <input
              id="title-input"
              type="text"
              placeholder="e.g. Is there an R function for finding the index of an element in a vector?"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-[#0074CC] focus:ring-4 focus:ring-[#0074CC]/20 outline-none transition-all"
              required
            />
          </div>

          {/* Details / Editor Card */}
          <div className="bg-white border border-gray-200 rounded p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="description-textarea" className="block font-bold text-[15px] text-gray-900">
                What are the details of your problem?
              </label>
              
              {/* Edit/Preview Toggle tabs */}
              <div className="flex border border-gray-300 rounded overflow-hidden">
                <button
                  type="button"
                  onClick={() => setActiveMode('edit')}
                  className={`px-3 py-1 flex items-center gap-1.5 text-xs font-medium transition-all ${
                    activeMode === 'edit' ? 'bg-gray-100 text-gray-800' : 'bg-white hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  <Edit2 size={12} /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMode('preview')}
                  className={`px-3 py-1 flex items-center gap-1.5 text-xs font-medium transition-all ${
                    activeMode === 'preview' ? 'bg-gray-100 text-gray-800' : 'bg-white hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  <Eye size={12} /> Preview
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Introduce the problem and expand on what you put in the title. Minimum 20 characters. Supports Markdown formatting.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <select
                value={postType}
                onChange={(e) => setPostType(e.target.value)}
                className="border border-gray-300 rounded p-2 text-sm focus:border-[#0074CC] outline-none bg-white cursor-pointer"
              >
                <option value="text">Standard Text Question</option>
                <option value="photo">Include Image Snippet</option>
                <option value="video">Include Video Demonstration</option>
              </select>
              
              {postType !== 'text' && (
                <input
                  type="url"
                  placeholder="Media URL (e.g., https://example.com/image.png)"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  className="flex-1 border border-gray-300 rounded p-2 text-sm focus:border-[#0074CC] outline-none"
                />
              )}
            </div>

            {activeMode === 'edit' ? (
              <textarea
                id="description-textarea"
                placeholder="Describe your issue here..."
                rows={12}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-300 rounded p-3 font-mono text-[13px] focus:border-[#0074CC] focus:ring-4 focus:ring-[#0074CC]/20 outline-none transition-all resize-y"
                required
              />
            ) : (
              <div className="border border-gray-200 rounded p-4 bg-gray-50/50 min-h-[250px] overflow-y-auto max-h-[400px]">
                {description.trim() ? (
                  <div className="prose max-w-none text-[14px] leading-relaxed markdown-content">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeSanitize]}
                      components={{
                        code({ node, inline, className, children, ...props }) {
                          return inline ? (
                            <code className="bg-gray-100 px-1 py-0.5 rounded font-mono text-[12px] text-red-600" {...props}>{children}</code>
                          ) : (
                            <pre className="bg-gray-50 border border-gray-200 p-3 rounded font-mono text-[12px] overflow-x-auto my-3 text-gray-800"><code {...props}>{children}</code></pre>
                          );
                        },
                        h1: ({ children }) => <h2 className="text-lg font-bold mt-4 mb-2 text-gray-900">{children}</h2>,
                        h2: ({ children }) => <h3 className="text-base font-bold mt-3 mb-1 text-gray-900">{children}</h3>,
                        li: ({ children }) => <li className="ml-4 list-disc">{children}</li>,
                        p: ({ children }) => <p className="mb-2">{children}</p>,
                      }}
                    >
                      {description}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-gray-400 italic text-center pt-20">Nothing to preview yet.</p>
                )}
              </div>
            )}
          </div>

          {/* Tags Card */}
          <div className="bg-white border border-gray-200 rounded p-6 shadow-sm hover:shadow-md transition-all">
            <label htmlFor="tags-input" className="block font-bold text-[15px] text-gray-900 mb-1">
              Tags
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Add up to 5 tags to describe what your question is about. Separate tags with commas.
            </p>
            <input
              id="tags-input"
              type="text"
              placeholder="e.g. javascript, react, css"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full border border-gray-300 rounded p-2.5 text-sm focus:border-[#0074CC] focus:ring-4 focus:ring-[#0074CC]/20 outline-none transition-all"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !caption.trim()}
              className="bg-[#0A95FF] hover:bg-[#0074CC] text-white font-bold py-2.5 px-4 rounded-[4px] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer text-sm"
            >
              {isSubmitting ? 'Posting...' : 'Post your question'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-rose-700 hover:bg-rose-50 py-2.5 px-4 rounded-[4px] transition-colors font-medium text-sm"
            >
              Discard draft
            </button>
          </div>
        </form>

        {/* Right Advice Sidebar */}
        <div className="w-full lg:w-[320px] flex-shrink-0">
          <div className="bg-amber-50/50 border border-amber-200/80 rounded p-4 shadow-sm text-xs text-gray-700 leading-relaxed sticky top-[70px]">
            <h3 className="font-bold text-amber-800 text-[13px] mb-2 flex items-center gap-1.5">
              <AlertCircle size={15} /> Asking tips
            </h3>
            <div className="space-y-3">
              <div>
                <h4 className="font-bold text-gray-800 mb-0.5">1. Formulate a good title</h4>
                <p>Start with a summary of the problem, write standard questions like "How to do X in language Y?". Avoid generic terms like "help please".</p>
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-0.5">2. Provide code snippets</h4>
                <p>Surround code using backticks (```) block notation to get syntax-formatted view outputs.</p>
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-0.5">3. Avoid duplicate checks</h4>
                <p>Do a quick search of the site first to see if your question has been answered before saving time.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AskQuestion;
