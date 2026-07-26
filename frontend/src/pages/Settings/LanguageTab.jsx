import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const LanguageTab = ({
  selectedLanguage,
  setSelectedLanguage,
  isSwappingLanguage,
  handleRequestLanguage
}) => {
  const { t } = useLanguage();

  return (
    <div>
      <div className="border-b border-gray-200 pb-3 mb-6">
        <h2 className="text-[20px] font-normal text-gray-900 font-sans">{t('languageSettings')}</h2>
      </div>
      
      <div className="max-w-[400px] border border-gray-200 rounded p-5 md:p-6 bg-white shadow-sm">
        <form onSubmit={handleRequestLanguage} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-xs text-gray-700">
              {t('preferredLanguage')}
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full p-2 text-sm border border-gray-300 rounded-[3px] focus:outline-none focus:ring-4 focus:ring-[#0074CC]/20 focus:border-[#0074CC] bg-white cursor-pointer"
            >
              <option value="en">English (US)</option>
              <option value="es">Español (ES)</option>
              <option value="hi">हिन्दी (IN)</option>
              <option value="pt">Português (PT)</option>
              <option value="zh">中文 (CN)</option>
              <option value="fr">Français (FR)</option>
            </select>
          </div>

          <div className="p-3 bg-red-50 border border-red-200 rounded-[3px]">
            <p className="text-[12px] text-red-700 font-normal leading-normal">
              {selectedLanguage === 'fr' 
                ? "Security notice: Switching to French (FR) requires verifying a 6-digit OTP code sent to your email."
                : `Security notice: Switching to ${selectedLanguage.toUpperCase()} requires verifying a 6-digit OTP code sent via SMS.`}
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSwappingLanguage}
              className="bg-[#0A95FF] hover:bg-[#0074CC] text-white font-bold text-xs py-2.5 px-4 rounded-[3px] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isSwappingLanguage ? 'Requesting...' : t('saveChanges')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LanguageTab;
