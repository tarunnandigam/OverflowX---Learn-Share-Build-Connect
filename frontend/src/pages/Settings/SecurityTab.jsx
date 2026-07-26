import React from 'react';

const SecurityTab = ({
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  passwordErrors,
  isPasswordLoading,
  handlePasswordSubmit
}) => {
  return (
    <div>
      <div className="border-b border-gray-200 pb-3 mb-6">
        <h2 className="text-[20px] font-normal text-gray-900 font-sans">Change Password</h2>
      </div>
      
      <div className="max-w-[400px] border border-gray-200 rounded p-5 md:p-6 bg-white shadow-sm">
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-xs text-gray-700">
              Current password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={`w-full p-2 text-sm border rounded-[3px] focus:outline-none focus:ring-4 focus:ring-[#0074CC]/20 ${
                passwordErrors.currentPassword ? 'border-red-500' : 'border-gray-300 focus:border-[#0074CC]'
              }`}
              required
            />
            {passwordErrors.currentPassword && (
              <span className="text-[11px] text-red-500 mt-1">{passwordErrors.currentPassword}</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-xs text-gray-700">
              New password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={`w-full p-2 text-sm border rounded-[3px] focus:outline-none focus:ring-4 focus:ring-[#0074CC]/20 ${
                passwordErrors.newPassword ? 'border-red-500' : 'border-gray-300 focus:border-[#0074CC]'
              }`}
              required
            />
            <p className="text-[11px] text-gray-400 font-normal">Must be at least 6 characters.</p>
            {passwordErrors.newPassword && (
              <span className="text-[11px] text-red-500 mt-1">{passwordErrors.newPassword}</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-xs text-gray-700">
              Confirm new password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full p-2 text-sm border rounded-[3px] focus:outline-none focus:ring-4 focus:ring-[#0074CC]/20 ${
                passwordErrors.confirmPassword ? 'border-red-500' : 'border-gray-300 focus:border-[#0074CC]'
              }`}
              required
            />
            {passwordErrors.confirmPassword && (
              <span className="text-[11px] text-red-500 mt-1">{passwordErrors.confirmPassword}</span>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isPasswordLoading}
              className="bg-[#0A95FF] hover:bg-[#0074CC] text-white font-bold text-xs py-2.5 px-4 rounded-[3px] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isPasswordLoading ? 'Saving...' : 'Change password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SecurityTab;
