import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center select-none font-sans">
      {/* Decorative Rotating Compass Container */}
      <div className="relative mb-8">
        {/* Pulsing Outer Aura */}
        <div className="absolute inset-0 bg-[#F48024]/10 dark:bg-[#F48024]/20 rounded-full blur-2xl scale-150 animate-pulse"></div>
        
        {/* Icon Sphere */}
        <div className="relative bg-white dark:bg-[#121824] p-6 rounded-full border border-gray-100 dark:border-gray-800 shadow-xl flex items-center justify-center">
          <Compass size={72} className="text-[#F48024] animate-spin-slow" />
        </div>
      </div>

      {/* Error Code */}
      <h1 className="text-7xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-3">
        404
      </h1>
      
      {/* Error Message Header */}
      <h2 className="text-2xl font-bold text-gray-850 dark:text-gray-100 mb-4">
        Page Not Found
      </h2>
      
      {/* Description Text */}
      <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8 text-[14px] leading-relaxed">
        We couldn't find the page you're looking for. It might have been moved, deleted, or the URL might be incorrect.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <Link
          to="/"
          className="flex items-center justify-center gap-2 px-6 py-3 bg-[#0A95FF] hover:bg-[#0074CC] text-white text-sm font-semibold rounded-[5px] transition-all hover:scale-105 active:scale-95 shadow-md shadow-sky-500/10 hover:shadow-sky-500/20"
        >
          <Home size={16} />
          Go to Home
        </Link>
        <button
          onClick={() => window.history.back()}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 text-sm font-semibold rounded-[5px] transition-all hover:scale-105 active:scale-95 border border-gray-200 dark:border-gray-700"
        >
          <ArrowLeft size={16} />
          Go Back
        </button>
      </div>
    </div>
  );
};

export default NotFound;
