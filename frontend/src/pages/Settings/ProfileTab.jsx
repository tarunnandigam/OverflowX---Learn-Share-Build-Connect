import React from 'react';

const ProfileTab = ({
  displayName,
  setDisplayName,
  bioText,
  setBioText,
  handleProfileSave
}) => {
  return (
    <div>
      <div className="border-b border-gray-200 pb-3 mb-6">
        <h2 className="text-[20px] font-normal text-gray-900 font-sans">Edit Profile</h2>
      </div>
      
      <div className="max-w-[500px] border border-gray-200 rounded p-5 md:p-6 bg-white shadow-sm">
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-xs text-gray-700">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full p-2 text-sm border border-gray-300 rounded-[3px] focus:outline-none focus:border-[#0074CC] focus:ring-4 focus:ring-[#0074CC]/20 bg-white"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-xs text-gray-700">
              Biography / Bio
            </label>
            <textarea
              rows={5}
              value={bioText}
              onChange={(e) => setBioText(e.target.value)}
              className="w-full p-2 text-sm border border-gray-300 rounded-[3px] focus:outline-none focus:border-[#0074CC] focus:ring-4 focus:ring-[#0074CC]/20 bg-white resize-y"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="bg-[#0A95FF] hover:bg-[#0074CC] text-white font-bold text-xs py-2.5 px-4 rounded-[3px] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] transition-colors cursor-pointer"
            >
              Save profile changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileTab;
