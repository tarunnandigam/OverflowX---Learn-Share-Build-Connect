import React from 'react';

const SectionHeader = ({
  title,
  subtitle,
  action,
  className = '',
}) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-200 dark:border-darkborder mb-6 ${className}`}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
};

export default SectionHeader;
