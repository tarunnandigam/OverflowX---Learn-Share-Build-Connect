import React from 'react';

const PageContainer = ({
  children,
  className = '',
  maxWidth = 'max-w-7xl',
}) => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-50 dark:bg-neutral-950 text-slate-800 dark:text-slate-100 transition-colors duration-500">
      {/* Background Soft Blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-indigo-500/10 dark:bg-indigo-600/5 blur-3xl animate-float-slow pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] rounded-full bg-sky-500/10 dark:bg-sky-600/5 blur-3xl animate-float-reverse pointer-events-none" />

      <div className={`relative z-10 mx-auto px-4 sm:px-6 lg:px-8 py-6 ${maxWidth} ${className}`}>
        {children}
      </div>
    </div>
  );
};

export default PageContainer;
