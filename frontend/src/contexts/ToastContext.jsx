import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toastStyles = {
    success: 'bg-emerald-500/90 text-white border border-emerald-400/20 shadow-emerald-500/10',
    error: 'bg-rose-500/90 text-white border border-rose-400/20 shadow-rose-500/10',
    info: 'bg-sky-500/90 text-white border border-sky-400/20 shadow-sky-500/10',
    warning: 'bg-amber-500/90 text-white border border-amber-400/20 shadow-amber-500/10',
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      
      {/* Toast Overlay Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            onClick={() => removeToast(t.id)}
            className={`p-4 rounded-xl shadow-lg backdrop-blur-md flex items-center justify-between cursor-pointer transition-all duration-300 animate-slide-in ${toastStyles[t.type]}`}
          >
            <span className="text-sm font-semibold">{t.message}</span>
            <button className="text-white/60 hover:text-white text-lg font-bold ml-4">
              &times;
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
