import { Crown, UserCheck } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const HomeSetting = ({ isOpen, onClose }) => {
  // All hooks at the top, unconditionally
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") || "light";
    }
    return "light";
  });
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
  const [translationQuality, setTranslationQuality] = useState(95);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("User");
  const [loginWarning, setLoginWarning] = useState("");
  const [favoriteLanguages, setFavoriteLanguages] = useState([
    { name: "English", flag: "🇺🇸" },
    { name: "Hindi", flag: "🇮🇳" },
    { name: "Marathi", flag: "🇮🇳" },
  ]);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  const languages = [
    { code: "as", name: "Assamese" },
    { code: "bn", name: "Bengali" },
    { code: "en", name: "English" },
    { code: "gbm", name: "Garhwali" },
    { code: "gu", name: "Gujarati" },
    { code: "hi", name: "Hindi" },
    { code: "kn", name: "Kannada" },
    { code: "kfy", name: "Kumaoni" },
    { code: "mai", name: "Maithili" },
    { code: "ml", name: "Malayalam" },
    { code: "mr", name: "Marathi" },
    { code: "mtei", name: "Meitei" },
    { code: "ne", name: "Nepali" },
    { code: "or", name: "Odia" },
    { code: "pa", name: "Punjabi" },
    { code: "sa", name: "Sanskrit" },
    { code: "si", name: "Sinhala" },
    { code: "ta", name: "Tamil" },
    { code: "te", name: "Telugu" },
    { code: "tcy", name: "Tulu" },
    { code: "ur", name: "Urdu" },
  ];

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const name = localStorage.getItem("name") || "User";
      setIsAuthenticated(!!token);
      setUsername(name);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
  }, [theme]);

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

  const toggleTheme = () => {
    setTheme((prev) => {
      const newTheme = prev === "light" ? "dark" : "light";
      localStorage.setItem("theme", newTheme);
      return newTheme;
    });
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setUsername("User");
    setLoginWarning("Logged out successfully.");
    setTimeout(() => {
      setLoginWarning("");
      window.location.reload();
    }, 1000);
  }, []);

  const handleSignInClick = () => {
    navigate("/signin");
  };

  const handleSignUpClick = () => {
    navigate("/signup");
  };

  const handleSliderChange = (setter, min, max) => (e) => {
    const value = Math.max(min, Math.min(max, Number(e.target.value)));
    setter(value);
  };

  const handleClose = () => {
    document.body.classList.remove("no-scroll");
    setShowLanguageDropdown(false);
    onClose();
  };

  const handleAddLanguage = (language) => {
    if (!favoriteLanguages.some((lang) => lang.name === language.name)) {
      setFavoriteLanguages([
        ...favoriteLanguages,
        { name: language.name, flag: "🌐" },
      ]);
    }
    setShowLanguageDropdown(false);
  };

  const handleHistoryClick = () => {
    navigate("/history");
  };

  // Early return after hooks
  if (!isOpen) return null;

  return (
    <div
      data-state={isOpen ? "open" : "closed"}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
      style={{ pointerEvents: "auto" }}
      onClick={handleClose}
      aria-hidden="true"
    >
      {loginWarning && (
        <div
          className="fixed top-12 rounded-xl left-1/2 transform -translate-x-1/2 z-[60] bg-green-600 text-white px-8 py-2 rounded-b-lg shadow-lg animate-slide-down"
          style={{ animation: "slide-down 0.5s ease-out" }}
        >
          <p className="text-sm font-medium">{loginWarning}</p>
        </div>
      )}
      <div
        role="dialog"
        aria-modal="true"
        className={`fixed inset-y-0 right-0 z-50 h-full w-full bg-gray-100 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 p-4 transition-transform duration-300 transform-gpu sm:w-80 md:w-96 lg:w-[28rem] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <div className="flex p-2 flex-col space-y-3">
          <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
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
              className="h-6 w-6 text-purple-500 sm:h-5 sm:w-5"
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
          <p className="text-xs text-gray-600 dark:text-gray-400 sm:text-sm">Customize your translation experience</p>
        </div>
        <button
          className="absolute right-5 top-5 rounded-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 p-2"
          onClick={handleClose}
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
        {isAuthenticated ? (
          <div className="flex items-center justify-between p-1 md:p-2 gap-4">
            <div className="relative flex items-center gap-3 px-2 md:px-5 py-2.5 rounded-md border-2 backdrop-blur-xl shadow-xl bg-gradient-to-r from-amber-100/90 via-yellow-50/95 to-orange-100/90 dark:from-amber-900/90 dark:via-yellow-800/95 dark:to-orange-900/90 border-amber-300/60 dark:border-amber-700/60 shadow-amber-200/30 dark:shadow-amber-900/30">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-orange-400/10 dark:from-yellow-800/10 dark:to-orange-800/10 rounded-2xl"></div>
              <Crown className="h-5 w-5 text-yellow-500 dark:text-yellow-300 drop-shadow-lg relative z-10" />
              <span className="text-sm font-bold relative z-10 text-yellow-700 dark:text-yellow-200">Premium Member</span>
            </div>
            <div className="flex items-center gap-2 md:px-4 px-2 py-2 rounded-md border bg-white/80 dark:bg-gray-800/80 border-gray-200/60 dark:border-gray-700/60 text-gray-700 dark:text-gray-200">
              <UserCheck className="h-4 w-4 text-green-500 dark:text-green-300" />
              <span className="text-sm font-medium">{username}</span>
            </div>
          </div>
        ) : (
          ""
        )}
        <div className="mt-4 space-y-5 max-h-[calc(100vh-4rem)] overflow-y-auto pr-2 pb-32">
          <div>
            <h3 className="mb-2 flex items-center gap-2 font-medium text-gray-800 dark:text-gray-200 text-sm sm:text-base">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 20.705"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-yellow-500"
              >
                <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.165a2.122 2.122 0 0 0-.611-1.879l-3.736-3.636a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
              </svg>
              Favorite Languages
            </h3>
            <div className="space-y-2 relative">
              {favoriteLanguages.map((lang) => (
                <div
                  key={lang.name}
                  className="flex py-3 items-center justify-between rounded-lg bg-gray-200/50 dark:bg-gray-800/50 p-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300"
                >
                  <span>
                    {lang.name} {lang.flag}
                  </span>
                </div>
              ))}
              <button
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                className="mt-3 inline-flex items-center gap-2 w-full justify-center rounded-full bg-white/70 dark:bg-gray-800/70 border border-gray-200/60 dark:border-gray-700/60 px-3 py-2 text-xs font-medium text-gray-800 dark:text-white hover:bg-white/90 dark:hover:bg-gray-700/80 hover:scale-105 transition-transform sm:text-sm sm:px-4 sm:py-3"
                aria-label="Add language"
              >
                Add Language
              </button>
              {showLanguageDropdown && (
                <ul className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700">
                  {languages.map((language) => (
                    <li
                      key={language.code}
                      onClick={() => handleAddLanguage(language)}
                      className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      {language.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div>
            <h3 className="mb-2 flex items-center gap-2 font-medium text-gray-800 dark:text-gray-200 text-sm sm:text-base">
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
                <path d="M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10 10 0 0 1-10-10 10 0 0 1 10-10 M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20 M2 12h20" />
              </svg>
              Appearance
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
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
                  <path d={theme === "light" ? "M12 3v1m0 16v1m8.66-8.66h-1m-16 0h-1m15.364-6.364-.707.707M5.343 18.657l-.707.707m12.728-12.728.707.707M6.05 6.05l.707.707M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" : "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"} />
                </svg>
                <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                  {theme === "light" ? "Light Mode" : "Dark Mode"}
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={theme === "dark"}
                data-state={theme === "dark" ? "checked" : "unchecked"}
                className={`inline-flex h-6 w-11 items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${
                  theme === "dark" ? "bg-blue-500" : "bg-gray-200"
                }`}
                onClick={toggleTheme}
              >
                <span
                  className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                    theme === "dark" ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-100/20 to-indigo-100/20 dark:from-purple-600/20 dark:to-indigo-600/20 border border-purple-200/50 dark:border-purple-400/50">
            <div className="space-y-2">
              {[].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-purple-700 dark:text-purple-300">{label}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings[key]}
                    data-state={settings[key] ? "checked" : "unchecked"}
                    className={`inline-flex h-6 w-11 items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:cursor-not-allowed disabled:opacity-50 ${
                      settings[key] ? "bg-purple-500" : "bg-gray-200 dark:bg-gray-700"
                    }`}
                    onClick={() => {}}
                  >
                    <span
                      className={`block h-5 w-5 rounded-full bg-white dark:bg-gray-900 shadow-sm transition-transform ${
                        settings[key] ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              ))}
              {isAuthenticated ? (
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-300 hover:scale-105 rounded-xl px-4 py-2 text-gray-700 dark:text-gray-200 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 border hover:border-red-300/50 dark:hover:border-red-700/50"
                  >
                    Logout
                  </button>
                  <button
                    onClick={handleHistoryClick}
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-300 hover:scale-105 rounded-xl px-4 py-2 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 border hover:border-blue-300/50 dark:hover:border-blue-700/50"
                  >
                    History
                  </button>
                </div>
              ) : (
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={handleSignInClick}
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-xs sm:text-sm h-12 sm:h-10 rounded-xl px-4 sm:px-6 py-2 sm:py-2.5 border-2 backdrop-blur-sm text-gray-700 dark:text-gray-200 hover:text-purple-700 dark:hover:text-purple-400 hover:bg-purple-50/80 dark:hover:bg-purple-900/80 border-purple-200/50 dark:border-gray-700/50 hover:border-purple-300/70 dark:hover:border-purple-600/70 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="blue"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2"
                    >
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                      <polyline points="10 17 15 12 10 7"></polyline>
                      <line x1="15" x2="3" y1="12" y2="12"></line>
                    </svg>
                    Sign In
                  </button>
                  <button
                    onClick={handleSignUpClick}
                    className="inline-flex items-center gap-2 whitespace-nowrap text-xs sm:text-sm font-bold h-12 sm:h-10 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 dark:from-purple-500 dark:via-indigo-500 dark:to-blue-500 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-purple-400/30 dark:border-purple-600/30"
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
                      className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <line x1="19" x2="19" y1="8" y2="14"></line>
                      <line x1="22" x2="16" y1="11" y2="11"></line>
                    </svg>
                    Join Premium Free
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeSetting;