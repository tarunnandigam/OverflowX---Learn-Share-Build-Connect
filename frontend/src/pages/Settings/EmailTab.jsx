import React, { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { Mail, Check } from 'lucide-react';

const EmailTab = () => {
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [emailPrefs, setEmailPrefs] = useState({
    newsletter: true,
    directMessages: true,
    answers: true,
    upvotes: false,
    moderation: true
  });

  // Load preferences on mount
  useEffect(() => {
    const savedPrefs = localStorage.getItem('email-preferences');
    if (savedPrefs) {
      try {
        setEmailPrefs(JSON.parse(savedPrefs));
      } catch (e) {
        console.error('Failed to parse email preferences', e);
      }
    }
  }, []);

  const handleToggle = (key) => {
    setEmailPrefs(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      localStorage.setItem('email-preferences', JSON.stringify(emailPrefs));
      addToast('Email preferences updated successfully!', 'success');
      setSaving(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-3 mb-6">
        <h2 className="text-[20px] font-normal text-gray-900 font-sans flex items-center gap-2">
          <Mail className="text-[#0A95FF]" size={22} />
          Email Settings
        </h2>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm space-y-6">
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-1">Inbox & Activity Notifications</h3>
          <p className="text-xs text-gray-500 mb-4">
            Decide what actions on the platform trigger an immediate email notification to your registered address.
          </p>

          <div className="space-y-3.5">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={emailPrefs.answers}
                onChange={() => handleToggle('answers')}
                className="w-4 h-4 mt-0.5 rounded text-[#0A95FF] border-gray-300 focus:ring-[#0A95FF]/30 cursor-pointer"
              />
              <div>
                <span className="text-xs font-semibold text-gray-800 group-hover:text-gray-900 transition-colors">
                  Answers to my questions
                </span>
                <p className="text-[11.5px] text-gray-500 leading-normal">
                  Receive an email whenever someone posts an answer to one of your questions.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={emailPrefs.directMessages}
                onChange={() => handleToggle('directMessages')}
                className="w-4 h-4 mt-0.5 rounded text-[#0A95FF] border-gray-300 focus:ring-[#0A95FF]/30 cursor-pointer"
              />
              <div>
                <span className="text-xs font-semibold text-gray-800 group-hover:text-gray-900 transition-colors">
                  Direct Messages (DMs)
                </span>
                <p className="text-[11.5px] text-gray-500 leading-normal">
                  Get notified instantly when friends or moderators send you private messages.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={emailPrefs.upvotes}
                onChange={() => handleToggle('upvotes')}
                className="w-4 h-4 mt-0.5 rounded text-[#0A95FF] border-gray-300 focus:ring-[#0A95FF]/30 cursor-pointer"
              />
              <div>
                <span className="text-xs font-semibold text-gray-800 group-hover:text-gray-900 transition-colors">
                  Upvotes & Reputation Awards
                </span>
                <p className="text-[11.5px] text-gray-500 leading-normal">
                  Notify me when my posts are upvoted or when I reach new milestones.
                </p>
              </div>
            </label>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-5">
          <h3 className="text-sm font-bold text-gray-900 mb-1">Newsletters & Updates</h3>
          <p className="text-xs text-gray-500 mb-4">
            Opt-in or opt-out of promotional updates and digest summaries.
          </p>

          <div className="space-y-3.5">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={emailPrefs.newsletter}
                onChange={() => handleToggle('newsletter')}
                className="w-4 h-4 mt-0.5 rounded text-[#0A95FF] border-gray-300 focus:ring-[#0A95FF]/30 cursor-pointer"
              />
              <div>
                <span className="text-xs font-semibold text-gray-800 group-hover:text-gray-900 transition-colors">
                  Weekly Hot Questions Digest
                </span>
                <p className="text-[11.5px] text-gray-500 leading-normal">
                  Get a curated list of top-voted questions and popular tags on the community portal.
                </p>
              </div>
            </label>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-5">
          <h3 className="text-sm font-bold text-gray-900 mb-1">Safety & Account Integrity</h3>
          <p className="text-xs text-gray-500 mb-4">
            Important structural and security notifications that keep your account safe.
          </p>

          <div className="space-y-3.5">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={emailPrefs.moderation}
                onChange={() => handleToggle('moderation')}
                className="w-4 h-4 mt-0.5 rounded text-[#0A95FF] border-gray-300 focus:ring-[#0A95FF]/30 cursor-pointer"
              />
              <div>
                <span className="text-xs font-semibold text-gray-800 group-hover:text-gray-900 transition-colors">
                  Moderation Alerts
                </span>
                <p className="text-[11.5px] text-gray-500 leading-normal">
                  Notifications regarding reported posts, billing details, and major security updates.
                </p>
              </div>
            </label>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-100 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-[#0A95FF] hover:bg-[#0074CC] text-white rounded text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <Check size={14} />
                Save Email Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
},
defaultProps = {};

export default EmailTab;
