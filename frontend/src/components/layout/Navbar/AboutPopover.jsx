import React, { useState, useEffect } from 'react';
import { Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../../services/api';

const AboutPopover = ({ onClose }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    verifiedUsers: 10240,
    questionsPosted: 52800,
    tagCollectives: 184
  });

  useEffect(() => {
    let active = true;
    const fetchStats = async () => {
      try {
        const response = await API.get('/posts/global-stats');
        if (active && response.data) {
          setStats(response.data);
        }
      } catch (err) {
        console.error('Error fetching global stats', err);
      }
    };
    fetchStats();
    return () => { active = false; };
  }, []);

  return (
    <div className="absolute left-[30px] top-[42px] w-[320px] bg-white border border-[#e3e6e8] rounded shadow-xl z-50 text-[13px] text-gray-800 overflow-hidden transform origin-top-left transition-all p-5 font-sans">
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#0074cc] bg-[#e1ecf4] px-2 py-0.5 rounded w-fit mb-3">
        <Info size={11} />
        <span>ABOUT</span>
      </div>

      <p className="text-[11.5px] text-[#525960] mb-4 leading-relaxed font-normal">
        OverflowX is a high-fidelity learning community built for developer pairing, collaborative coding, and secure knowledge exchange.
      </p>

      <div className="border-t border-b border-[#e3e6e8] py-3.5 my-3.5 space-y-2.5">
        <div className="flex items-center justify-between text-[11px] font-normal">
          <span className="text-[#525960]">Verified Users</span>
          <span className="font-bold text-[#232629] bg-[#f8f9f9] border border-[#e3e6e8] px-1.5 py-0.5 rounded">
            {stats.verifiedUsers.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] font-normal">
          <span className="text-[#525960]">Questions Posted</span>
          <span className="font-bold text-[#232629] bg-[#f8f9f9] border border-[#e3e6e8] px-1.5 py-0.5 rounded">
            {stats.questionsPosted.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] font-normal">
          <span className="text-[#525960]">Tag Sub-Collectives</span>
          <span className="font-bold text-[#232629] bg-[#f8f9f9] border border-[#e3e6e8] px-1.5 py-0.5 rounded">
            {stats.tagCollectives.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            navigate('/tags');
            onClose();
          }}
          className="flex-1 bg-[#0a95ff] hover:bg-[#0074cc] text-white font-bold text-xs py-2 px-3 rounded transition-colors duration-100 cursor-pointer"
        >
          Explore tags
        </button>
        <button
          type="button"
          onClick={onClose}
          className="bg-[#f8f9f9] border border-[#e3e6e8] hover:bg-[#e3e6e8] text-[#525960] hover:text-[#232629] font-bold text-xs py-2 px-3 rounded transition-all duration-100 cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default AboutPopover;
