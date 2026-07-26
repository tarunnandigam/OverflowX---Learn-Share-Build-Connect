import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

const AskQuestionModal = ({ isOpen, onClose, onSubmit }) => {
  const { addToast } = useToast();
  const [caption, setCaption] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [postType, setPostType] = useState('text');
  const [mediaUrl, setMediaUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

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
      await onSubmit({
        type: postType,
        mediaUrl: finalMediaUrl,
        caption: caption.trim(),
        description: description.trim(),
        tags: tags.trim()
      });
      // Reset form states on success
      setCaption('');
      setDescription('');
      setTags('');
      setMediaUrl('');
      setPostType('text');
      onClose();
    } catch (err) {
      // Errors handled by parent component / toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-200">
      <div className="bg-white w-full max-w-[800px] rounded-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transform scale-100 transition-transform duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-[#F8F9F9] rounded-t-lg">
          <h2 className="text-[20px] font-medium text-gray-900 font-sans">Ask a public question</h2>
          <button 
            type="button"
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-full transition-colors duration-150"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Informational Banner */}
          <div className="bg-sky-50 border border-sky-200 p-4 rounded-lg text-[#3B4045] text-xs leading-relaxed">
            <h3 className="font-bold text-sky-800 text-[13px] mb-1.5">Writing a good question</h3>
            <p className="mb-2">You're ready to ask a programming-related question and this form will help guide you through the process.</p>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li>Summarize your problem in a one-line title.</li>
              <li>Describe your problem in more detail.</li>
              <li>Describe what you tried and what you expected to happen.</li>
            </ul>
          </div>

          {/* Title Field */}
          <div className="border border-gray-200 p-5 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow duration-150">
            <label className="block font-bold text-[14px] text-gray-900 mb-0.5">Title</label>
            <p className="text-[11px] text-gray-500 mb-2.5">Be specific and imagine you're asking a question to another person.</p>
            <input
              type="text"
              placeholder="e.g. Is there an R function for finding the index of an element in a vector?"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 text-sm focus:border-[#0074CC] focus:ring-4 focus:ring-[#0074CC]/20 outline-none transition-all"
              required
            />
          </div>

          {/* Details / Problem description */}
          <div className="border border-gray-200 p-5 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow duration-150">
            <label className="block font-bold text-[14px] text-gray-900 mb-0.5">What are the details of your problem?</label>
            <p className="text-[11px] text-gray-500 mb-3">Introduce the problem and expand on what you put in the title. Minimum 20 characters.</p>
            
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

            <textarea
              placeholder="Describe your issue here... Supports Markdown formatting."
              rows={8}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded p-3 font-mono text-xs focus:border-[#0074CC] focus:ring-4 focus:ring-[#0074CC]/20 outline-none transition-all resize-y"
              required
            />
          </div>

          {/* Tags Field */}
          <div className="border border-gray-200 p-5 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow duration-150">
            <label className="block font-bold text-[14px] text-gray-900 mb-0.5">Tags</label>
            <p className="text-[11px] text-gray-500 mb-2.5">Add tags to describe what your question is about (comma separated).</p>
            <input
              type="text"
              placeholder="e.g. javascript, react, node.js"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 text-sm focus:border-[#0074CC] focus:ring-4 focus:ring-[#0074CC]/20 outline-none transition-all"
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
              onClick={onClose}
              className="text-rose-700 hover:bg-rose-50 py-2.5 px-4 rounded-[4px] transition-colors font-medium text-sm"
            >
              Discard draft
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AskQuestionModal;
