import React from 'react';
import { Globe, Users, Award, Briefcase, Megaphone, Link2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProductsDropdown = ({ onClose }) => {
  const navigate = useNavigate();

  const products = [
    {
      title: 'Questions & Answers',
      desc: 'Browse public coding answers and help others learn.',
      icon: <Globe className="text-[#F48024]" size={15} />,
      action: () => {
        navigate('/');
        onClose();
      }
    },
    {
      title: 'Collectives',
      desc: 'Connect with creators and developers around specific tech stacks.',
      icon: <Award className="text-yellow-600" size={15} />,
      action: () => {
        navigate('/tags');
        onClose();
      }
    },
    {
      title: 'Talent & Jobs',
      desc: 'Explore engineering career boards and developer jobs.',
      icon: <Briefcase className="text-blue-650 text-blue-600" size={15} />,
      action: () => {
        navigate('/users');
        onClose();
      }
    },
    {
      title: 'Advertising',
      desc: 'Reach developers and technologists worldwide.',
      icon: <Megaphone className="text-emerald-600" size={15} />,
      action: () => {
        onClose();
      }
    }
  ];

  return (
    <div className="absolute left-[70px] top-[42px] w-[320px] bg-white border border-[#e3e6e8] rounded shadow-xl z-50 text-[13px] text-gray-800 overflow-hidden transform origin-top-left transition-all font-sans">
      <div className="p-3 bg-[#f8f9f9] border-b border-[#e3e6e8] font-bold text-[#232629] flex items-center gap-1.5 text-xs">
        <Link2 size={13} className="text-[#525960]" />
        <span>Products Directory</span>
      </div>
      
      <div className="p-2 space-y-0.5 max-h-[360px] overflow-y-auto">
        {products.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={p.action}
            className="w-full text-left flex gap-3 p-2.5 rounded hover:bg-[#f8f9f9] hover:text-[#0074cc] group transition-all duration-100 cursor-pointer"
          >
            <span className="mt-0.5 p-1 bg-gray-50 rounded border border-gray-150 group-hover:bg-white group-hover:border-gray-200 transition-colors">
              {p.icon}
            </span>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-[#0c0d0e] text-xs leading-none group-hover:text-[#0074cc] transition-colors mb-1">
                {p.title}
              </h4>
              <p className="text-[11px] text-[#525960] leading-normal font-normal">
                {p.desc}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProductsDropdown;
