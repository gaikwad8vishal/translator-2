import React, { useState, useEffect } from "react";

const HomeSetting = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  // State for toggles
  const [settings, setSettings] = useState({
    autoDetect: true,
    smartTranslation: true,
    contextAnalysis: true,
    alternativeTranslations: true,
    culturalAdaptation: true,
    voiceSettings: true,
    autoSpeak: false,
    highAccuracy: true,
    realTimeTranslation: true,
    showConfidence: true,
    cacheTranslations: true,
    autoCorrection: true,
    offlineTranslation: false,
    professionalTerms: false,
  });

  // State for sliders
  const [speechRate, setSpeechRate] = useState(1);
  const [speechPitch, setSpeechPitch] = useState(1);
  const [translationQuality, setTranslationQuality] = useState(95);

  // Toggle handler
  const toggleSetting = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Slider handler
  const handleSliderChange = (setter, min, max) => (e) => {
    const value = Math.max(min, Math.min(max, Number(e.target.value)));
    setter(value);
  };

  // Prevent background scrolling when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("no-scroll");
    } else {
      document.body.classList.remove("no-scroll");
    }
    return () => {
      document.body.classList.remove("no-scroll");
    };
  }, [isOpen]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={`fixed inset-y-0 right-0 z-50 h-full w-full bg-white/95 backdrop-blur-lg border-l border-gray-200/60 p-4 transition-transform duration-300 transform-gpu sm:w-80 md:w-96 lg:w-[28rem] ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
      tabIndex={-1}
    >
      <div className="flex flex-col space-y-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900 sm:text-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 text-purple-500 sm:h-5 sm:w-5"
          >
            <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
            <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
            <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
            <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
            <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
            <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
            <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
            <path d="M6 18a4 4 0 0 1-1.967-.516" />
            <path d="M19.967 17.484A4 4 0 0 1 18 18" />
          </svg>
          PolyglotPro Settings
        </h2>
        <p className="text-xs text-gray-600 sm:text-sm">Customize your translation experience</p>
      </div>
      <button
        className="absolute right-3 top-3 rounded-sm text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 p-2"
        onClick={onClose}
        aria-label="Close settings"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M18 6 6 18" />
          <path d="M6 6l12 12" />
        </svg>
      </button>
      <div className="mt-4 space-y-5 max-h-[calc(100vh-4rem)] overflow-y-auto pr-2">
        <div>
          <h3 className="mb-2 flex items-center gap-2 font-medium text-gray-800 text-sm sm:text-base">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-yellow-500"
            >
              <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
            </svg>
            Favorite Languages
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-lg bg-gray-100/50 p-2 text-xs sm:text-sm text-gray-700">
              <span>English 🇺🇸</span>
              <button className="p-2 text-gray-500 hover:text-red-500" aria-label="Remove English">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <button
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white/70 border border-gray-200/60 px-3 py-2 text-xs font-medium text-gray-800 hover:bg-white/90 hover:scale-105 transition-transform sm:text-sm sm:px-4 sm:py-3"
            aria-label="Add language"
          >
            <span className="text-base sm:text-lg">➕</span>
            Add Language
          </button>
        </div>
        <div>
          <h3 className="mb-2 flex items-center gap-2 font-medium text-gray-800 text-sm sm:text-base">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-purple-500"
            >
              <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
              <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
              <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
              <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
              <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
              <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
              <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
              <path d="M6 18a4 4 0 0 1-1.967-.516" />
              <path d="M19.967 17.484A4 4 0 0 1 18 18" />
            </svg>
            AI Translation
          </h3>
          <div className="space-y-2">
            {[
              {
                key: "autoDetect",
                label: "Auto-detect Language",
                icon: "m5 8 6 6 m-7 0 6-6 2-3 M2 5h12 M7 2h1 m14 20-5-10-5 10 M14 18h6",
              },
              {
                key: "smartTranslation",
                label: "Smart Translation",
                icon: "M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",
              },
              {
                key: "contextAnalysis",
                label: "Context Analysis",
                icon: "M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10 10 10 0 0 1-10-10 10 10 0 0 1 10-10 M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20 M2 12h20",
              },
              {
                key: "alternativeTranslations",
                label: "Alternative Translations",
                icon: "M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z M13.5 6.5a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1z M17.5 10.5a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1z M8.5 7.5a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1z M6.5 12.5a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1z",
              },
              {
                key: "culturalAdaptation",
                label: "Cultural Adaptation",
                icon: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
              },
            ].map(({ key, label, icon }) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 48"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 text-purple-500"
                  >
                    <path d={icon} />
                  </svg>
                  <span className="text-xs sm:text-sm text-gray-700">{label}</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings[key]}
                  data-state={settings[key] ? "checked" : "unchecked"}
                  className={`inline-flex h-6 w-11 items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:cursor-not-allowed disabled:opacity-50 ${
                    settings[key] ? "bg-purple-500" : "bg-gray-200"
                  }`}
                  onClick={() => toggleSetting(key)}
                >
                  <span
                    className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                      settings[key] ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="mb-2 flex items-center gap-2 font-medium text-gray-800 text-sm sm:text-base">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-blue-500"
            >
              <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" />
              <path d="M16 9a5 5 0 0 1 0 6" />
              <path d="M19.364 18.364a9 9 0 0 0 0-12.728" />
            </svg>
            Voice & Audio
          </h3>
          <div className="space-y-2">
            {[
              { key: "voiceSettings", label: "Voice Settings" },
              { key: "autoSpeak", label: "Auto-speak Translations" },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-gray-700">{label}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings[key]}
                  data-state={settings[key] ? "checked" : "unchecked"}
                  className={`inline-flex h-6 w-11 items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:cursor-not-allowed disabled:opacity-50 ${
                    settings[key] ? "bg-purple-500" : "bg-gray-200"
                  }`}
                  onClick={() => toggleSetting(key)}
                >
                  <span
                    className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                      settings[key] ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            ))}
            <div className="space-y-1">
              <label className="text-xs sm:text-sm text-gray-700">Speech Rate: {speechRate.toFixed(1)}x</label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={speechRate}
                onChange={handleSliderChange(setSpeechRate, 0.5, 2)}
                className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-purple-500"
                aria-valuemin={0.5}
                aria-valuemax={2}
                aria-valuenow={speechRate}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs sm:text-sm text-gray-700">Speech Pitch: {speechPitch.toFixed(1)}</label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={speechPitch}
                onChange={handleSliderChange(setSpeechPitch, 0.5, 2)}
                className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-purple-500"
                aria-valuemin={0.5}
                aria-valuemax={2}
                aria-valuenow={speechPitch}
              />
            </div>
          </div>
        </div>
        <div>
          <h3 className="mb-2 flex items-center gap-2 font-medium text-gray-800 text-sm sm:text-base">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-gray-500"
            >
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Advanced Settings
          </h3>
          <div className="space-y-2">
            {[
              { key: "highAccuracy", label: "High Accuracy Mode" },
              { key: "realTimeTranslation", label: "Real-time Translation" },
              { key: "showConfidence", label: "Show Confidence Score" },
              { key: "cacheTranslations", label: "Cache Translations" },
              { key: "autoCorrection", label: "Smart Auto-correction" },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-gray-700">{label}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings[key]}
                  data-state={settings[key] ? "checked" : "unchecked"}
                  className={`inline-flex h-6 w-11 items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:cursor-not-allowed disabled:opacity-50 ${
                    settings[key] ? "bg-purple-500" : "bg-gray-200"
                  }`}
                  onClick={() => toggleSetting(key)}
                >
                  <span
                    className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                      settings[key] ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            ))}
            <div className="space-y-1">
              <label className="text-xs sm:text-sm text-gray-700">Translation Quality: {translationQuality}%</label>
              <input
                type="range"
                min="50"
                max="100"
                step="1"
                value={translationQuality}
                onChange={handleSliderChange(setTranslationQuality, 50, 100)}
                className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-purple-500"
                aria-valuemin={50}
                aria-valuemax={100}
                aria-valuenow={translationQuality}
              />
            </div>
          </div>
        </div>
        <div className="rounded-xl border-2 bg-gradient-to-r from-purple-100/80 to-blue-100/80 p-3 border-purple-200/60">
          <h3 className="mb-2 flex items-center gap-2 font-medium text-purple-700 text-sm sm:text-base">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-yellow-500"
            >
              <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
            </svg>
            Premium Features
          </h3>
          <div className="space-y-2">
            {[
              { key: "offlineTranslation", label: "Offline Translation" },
              { key: "professionalTerms", label: "Professional Terms" },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-purple-600">{label}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings[key]}
                  data-state={settings[key] ? "checked" : "unchecked"}
                  className={`inline-flex h-6 w-11 items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:cursor-not-allowed disabled:opacity-50 ${
                    settings[key] ? "bg-purple-500" : "bg-gray-200"
                  }`}
                  onClick={() => toggleSetting(key)}
                >
                  <span
                    className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                      settings[key] ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeSetting;