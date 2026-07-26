import React from 'react';

const PreferencesTab = ({
  selectedTheme,
  handleThemeChange,
  preferences,
  handlePreferenceToggle,
  excludeInput,
  setExcludeInput,
  excludedCompanies,
  handleAddCompany,
  handleRemoveCompany
}) => {
  return (
    <div>
      <div className="border-b border-gray-200 pb-3 mb-6">
        <h2 className="text-[20px] font-normal text-gray-900 font-sans">Preferences</h2>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-3" id="interface">Interface</h3>
          
          {/* Theme settings panel with cards */}
          <div className="border border-gray-200 rounded p-5 mb-5 bg-white">
            <label className="block text-xs font-bold text-gray-900 mb-4 uppercase tracking-wider">
              Theme
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              
              {/* Light option */}
              <label className="flex items-center gap-2.5 flex-col text-center cursor-pointer group">
                <input 
                  type="radio" 
                  name="themeModeRadio"
                  checked={selectedTheme === 'light'}
                  onChange={() => handleThemeChange('light')}
                  className="w-4 h-4 text-[#0074cc] border-gray-350 focus:ring-[#0074cc]"
                />
                <div className="flex flex-col items-center">
                  <div className="w-[110px] h-[72px] bg-slate-100 border border-gray-200 rounded-md overflow-hidden p-1 shadow-sm group-hover:border-gray-400 transition-colors">
                    <div className="w-full h-full bg-white rounded border border-gray-200 flex flex-col p-1.5 space-y-1">
                      <div className="w-3/4 h-2 bg-gray-200 rounded" />
                      <div className="w-1/2 h-1.5 bg-gray-100 rounded" />
                      <div className="w-full h-8 bg-[#f8f9f9] rounded border border-gray-150" />
                    </div>
                  </div>
                  <span className="text-[12px] font-medium text-gray-700 mt-2">Light</span>
                </div>
              </label>

              {/* System setting option */}
              <label className="flex items-center gap-2.5 flex-col text-center cursor-pointer group">
                <input 
                  type="radio" 
                  name="themeModeRadio"
                  checked={selectedTheme === 'system'}
                  onChange={() => handleThemeChange('system')}
                  className="w-4 h-4 text-[#0074cc] border-gray-350 focus:ring-[#0074cc]"
                />
                <div className="flex flex-col items-center">
                  <div className="w-[110px] h-[72px] bg-slate-100 border border-gray-200 rounded-md overflow-hidden p-1 shadow-sm group-hover:border-gray-400 transition-colors">
                    <div className="w-full h-full bg-white rounded border border-gray-200 flex flex-col overflow-hidden relative">
                      <div className="absolute inset-0 flex">
                        <div className="flex-1 bg-white p-1.5 space-y-1">
                          <div className="w-3/4 h-2 bg-gray-200 rounded" />
                          <div className="w-1/2 h-1.5 bg-gray-100 rounded" />
                        </div>
                        <div className="flex-1 bg-slate-800 p-1.5 space-y-1">
                          <div className="w-3/4 h-2 bg-slate-700 rounded" />
                          <div className="w-1/2 h-1.5 bg-slate-600 rounded" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <span className="text-[12px] font-medium text-gray-700 mt-2">System setting</span>
                </div>
              </label>

              {/* Dark option */}
              <label className="flex items-center gap-2.5 flex-col text-center cursor-pointer group">
                <input 
                  type="radio" 
                  name="themeModeRadio"
                  checked={selectedTheme === 'dark'}
                  onChange={() => handleThemeChange('dark')}
                  className="w-4 h-4 text-[#0074cc] border-gray-350 focus:ring-[#0074cc]"
                />
                <div className="flex flex-col items-center">
                  <div className="w-[110px] h-[72px] bg-slate-800 border border-slate-700 rounded-md overflow-hidden p-1 shadow-sm group-hover:border-slate-500 transition-colors">
                    <div className="w-full h-full bg-slate-900 rounded border border-slate-700 flex flex-col p-1.5 space-y-1">
                      <div className="w-3/4 h-2 bg-slate-700 rounded" />
                      <div className="w-1/2 h-1.5 bg-slate-800 rounded" />
                      <div className="w-full h-8 bg-slate-800 rounded border border-slate-700" />
                    </div>
                  </div>
                  <span className="text-[12px] font-medium text-gray-700 mt-2">Dark</span>
                </div>
              </label>

            </div>
          </div>
        </div>

        {/* Toggles list */}
        <div className="border border-gray-200 rounded divide-y divide-gray-200 bg-white">
          
          {/* High Contrast toggle */}
          <div className="p-4 flex items-center justify-between gap-4">
            <div>
              <span className="font-semibold text-gray-900 text-[13px] block">
                Enable high contrast
              </span>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-normal">
                When enabled, high contrast improves legibility by increasing contrast on elements.
              </p>
            </div>
            <input 
              type="checkbox"
              checked={preferences.highContrast}
              onChange={() => handlePreferenceToggle('highContrast')}
              className="w-9 h-5 bg-gray-200 rounded-full appearance-none relative checked:bg-[#0074cc] cursor-pointer transition-colors duration-200 before:content-[''] before:absolute before:h-4 before:w-4 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 before:transition-transform checked:before:translate-x-4 border border-gray-300 shadow-sm"
            />
          </div>

          {/* New Editor toggle */}
          <div className="p-4 flex items-center justify-between gap-4">
            <div>
              <span className="font-semibold text-gray-900 text-[13px] block">
                Enable new editor
              </span>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-normal">
                When enabled, the new rich markdown text editor is displayed.
              </p>
            </div>
            <input 
              type="checkbox"
              checked={preferences.newEditor}
              onChange={() => handlePreferenceToggle('newEditor')}
              className="w-9 h-5 bg-gray-200 rounded-full appearance-none relative checked:bg-[#0074cc] cursor-pointer transition-colors duration-200 before:content-[''] before:absolute before:h-4 before:w-4 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 before:transition-transform checked:before:translate-x-4 border border-gray-300 shadow-sm"
            />
          </div>
        </div>

        {/* Ad settings Exclusions list */}
        <div className="border border-gray-200 rounded p-5 bg-white">
          <h3 className="text-sm font-bold text-gray-900 mb-2">Excluded Advertisers</h3>
          <p className="text-xs text-gray-500 mb-4">
            List of companies that you do not want to see ads from on OverflowX.
          </p>
          <form onSubmit={handleAddCompany} className="flex gap-2 mb-4">
            <input 
              type="text" 
              placeholder="e.g. Acme Corp" 
              value={excludeInput}
              onChange={(e) => setExcludeInput(e.target.value)}
              className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-[13px] focus:border-[#0074CC] outline-none"
            />
            <button 
              type="submit"
              className="bg-[#0A95FF] hover:bg-[#0074CC] text-white px-3.5 py-1.5 rounded font-medium text-[12px] transition-colors"
            >
              Add
            </button>
          </form>

          <div className="flex flex-wrap gap-2">
            {excludedCompanies.map(company => (
              <span key={company} className="flex items-center gap-1.5 bg-[#E1ECF4] text-[#39739D] px-2.5 py-1 rounded-full text-xs font-medium">
                {company}
                <button 
                  type="button" 
                  onClick={() => handleRemoveCompany(company)}
                  className="text-gray-400 hover:text-gray-600 font-bold"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreferencesTab;
