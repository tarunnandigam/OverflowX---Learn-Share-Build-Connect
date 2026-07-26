import React from 'react';
import { Users, Shield, Zap, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../contexts/ToastContext';

const ForTeamsPopover = ({ onClose }) => {
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleStartTrial = () => {
    navigate('/settings?tab=subscription');
    onClose();
  };

  return (
    <div className="absolute left-[130px] top-[42px] w-[340px] bg-white border border-[#e3e6e8] rounded shadow-xl z-50 text-[13px] text-gray-800 overflow-hidden transform origin-top-left transition-all p-5 font-sans">
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded w-fit mb-3">
        <Sparkles size={11} />
        <span>TEAMS</span>
      </div>

      <h3 className="font-bold text-[#232629] text-xs.5 mb-1.5 leading-snug">
        Collaborate and share knowledge privately
      </h3>
      
      <p className="text-[11.5px] text-[#525960] mb-4 leading-relaxed font-normal">
        Build a secure, private repository of questions and answers for your team or organization.
      </p>

      <ul className="space-y-2.5 mb-5 text-[11.5px] font-normal text-[#525960]">
        <li className="flex items-center gap-2">
          <Shield size={14} className="text-emerald-605 text-emerald-600 flex-shrink-0" />
          <span>Private, encrypted data space</span>
        </li>
        <li className="flex items-center gap-2">
          <Zap size={14} className="text-yellow-505 text-yellow-500 flex-shrink-0" />
          <span>SSO login & Slack/Teams integration</span>
        </li>
        <li className="flex items-center gap-2">
          <Users size={14} className="text-blue-505 text-blue-500 flex-shrink-0" />
          <span>Unlimited workspace members</span>
        </li>
      </ul>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleStartTrial}
          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs py-2 px-3 rounded transition-colors duration-100 cursor-pointer"
        >
          Start Free Trial
        </button>
        <button
          type="button"
          onClick={onClose}
          className="bg-[#f8f9f9] border border-[#e3e6e8] hover:bg-[#e3e6e8] text-[#525960] hover:text-[#232629] font-bold text-xs py-2 px-3 rounded transition-all duration-100 cursor-pointer"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};

export default ForTeamsPopover;
