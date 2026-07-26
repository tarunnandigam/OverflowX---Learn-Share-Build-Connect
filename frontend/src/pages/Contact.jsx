import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Mail, MapPin, Globe, ArrowRight, CheckCircle2, MessageSquare, ShieldQuestion, HelpCircle, Loader2 } from 'lucide-react';
import API from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { Link } from 'react-router-dom';

const Contact = () => {
  const { user } = useSelector((state) => state.auth);
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: 'General Inquiry'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Autofill logged in user details
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.username || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) {
      addToast('Please fill in all fields.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await API.post('/auth/contact', formData);
      addToast(response.data.message || 'Message sent successfully!', 'success');
      setIsSuccess(true);
      setFormData({
        name: user?.username || '',
        email: user?.email || '',
        subject: '',
        message: '',
        category: 'General Inquiry'
      });
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to send message. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto text-[13px] text-gray-800 font-sans">
      
      {/* Top Banner Header */}
      <div className="pb-6 mb-8 border-b border-gray-200">
        <h1 className="text-[27px] text-gray-900 font-normal leading-tight">
          Contact OverflowX Support
        </h1>
        <p className="text-gray-600 text-sm mt-2 max-w-2xl leading-relaxed">
          Have a question about our community, feedback on site performance, or billing issues? Drop us a line and our moderators will help you out.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Columns (Form) */}
        <div className="md:col-span-2">
          {isSuccess ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-[5px] p-6 text-center flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-300">
              <CheckCircle2 className="w-16 h-16 text-emerald-600 animate-bounce" />
              <div>
                <h3 className="text-lg font-bold text-emerald-900">Message Sent Successfully!</h3>
                <p className="text-emerald-700 text-xs mt-1.5 max-w-md leading-relaxed">
                  Thank you for reaching out to us. We have received your inquiry and our support representatives will contact you via email shortly.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSuccess(false)}
                className="mt-2 text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-[3px] font-bold text-xs shadow-sm transition-all duration-150 cursor-pointer"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-[3px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#F48024]" />
                <span>Submit a Request</span>
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Inquiry Type */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-xs text-gray-700">
                    What can we help you with?
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-[3px] text-xs focus:border-[#0074CC] focus:ring-4 focus:ring-[#0074CC]/20 outline-none transition-all duration-150 bg-white"
                  >
                    <option value="General Inquiry">General site questions & rules</option>
                    <option value="Technical Support">Technical bug or account issues</option>
                    <option value="Billing & Subscriptions">Billing, payment & subscriptions</option>
                    <option value="Feedback">Feature request or feedback</option>
                  </select>
                </div>

                {/* Name & Email Group */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-xs text-gray-700">
                      Your Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="e.g. John Doe"
                      disabled={!!user}
                      className="w-full p-2 border border-gray-300 rounded-[3px] text-xs focus:border-[#0074CC] focus:ring-4 focus:ring-[#0074CC]/20 outline-none transition-all duration-150 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-xs text-gray-700">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="you@example.com"
                      disabled={!!user}
                      className="w-full p-2 border border-gray-300 rounded-[3px] text-xs focus:border-[#0074CC] focus:ring-4 focus:ring-[#0074CC]/20 outline-none transition-all duration-150 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>

                {/* Subject */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-xs text-gray-700">
                    Subject / Topic
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    placeholder="Short description of the issue"
                    className="w-full p-2 border border-gray-300 rounded-[3px] text-xs focus:border-[#0074CC] focus:ring-4 focus:ring-[#0074CC]/20 outline-none transition-all duration-150"
                  />
                </div>

                {/* Message */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-xs text-gray-700">
                    Detailed Message
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    placeholder="Explain your problem or share details here..."
                    className="w-full p-2 border border-gray-300 rounded-[3px] text-xs focus:border-[#0074CC] focus:ring-4 focus:ring-[#0074CC]/20 outline-none transition-all duration-150"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#0A95FF] hover:bg-[#0074CC] text-white font-bold py-2 px-4 rounded-[3px] disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Submit Request <ArrowRight size={13} />
                    </>
                  )}
                </button>

              </form>
            </div>
          )}
        </div>

        {/* Right Columns (Contact Card Info) */}
        <div className="space-y-6">
          
          {/* FAQ Card */}
          <div className="bg-sky-50 border border-sky-100 rounded-[3px] p-4 text-[12px] text-gray-700">
            <h4 className="font-bold text-sky-900 mb-2 flex items-center gap-1.5">
              <ShieldQuestion className="w-4 h-4 text-sky-600" />
              Before you submit:
            </h4>
            <ul className="space-y-2 list-disc pl-4 text-sky-800 leading-normal font-normal">
              <li>
                Check out the <Link to="/tags" className="text-sky-600 font-bold hover:underline">Tags Directory</Link> to categorize your programming questions correctly.
              </li>
              <li>
                If you need help with formatting rules, visit the <Link to="/questions/ask" className="text-sky-600 font-bold hover:underline">Ask Question Guideline</Link>.
              </li>
              <li>
                Inquiries regarding suspended profiles, bans, or moderator choices will take up to 24 hours to review.
              </li>
            </ul>
          </div>

          {/* Company Details */}
          <div className="bg-white border border-gray-200 rounded-[3px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-4">
            <h3 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-2 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#F48024]" />
              OverflowX HQ
            </h3>
            <p className="text-[#525960] mb-2 leading-relaxed">
              100 Developer Way, Tech District<br />
              San Francisco, CA 94107
            </p>
            <div className="pt-2 border-t border-[#e3e6e8] mt-3">
              <p className="text-[#525960]">
                Email us directly at:{' '}
                <a href="mailto:support@overflowx.com" className="text-[#0074CC] hover:underline">
                  support@overflowx.com
                </a>
              </p>
            </div>

              <div className="flex gap-2 items-center font-sans">
                <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <a href="https://stackoverflow.co" target="_blank" rel="noopener noreferrer" className="text-[#0074CC] hover:underline">
                  stackoverflow.co
                </a>
              </div>
            </div>

          {/* Extra Help Center Callout */}
          <div className="bg-[#FDF7E2] border border-[#E6E4C4] rounded-[3px] p-5">
            <h4 className="font-bold text-gray-800 text-xs mb-2">Need Instant Help?</h4>
            <p className="text-gray-600 text-[11px] leading-relaxed mb-3">
              We have a vast collection of help articles and guides covering account setup, points, and community guidelines.
            </p>
            <button
              type="button"
              onClick={() => addToast('Tour and help guides are available inside the top navbar help dropdown.', 'info')}
              className="text-[#0074CC] font-bold text-xs hover:underline flex items-center gap-1 cursor-pointer"
            >
              Browse Tour Guides <ArrowRight size={11} />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Contact;
