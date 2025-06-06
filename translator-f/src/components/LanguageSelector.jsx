import { useMemo } from "react";
import { ChevronDown } from "lucide-react";

// Available languages for translation
export const languages = [
  { code: "as", name: "Assamese", flag: "🇮🇳" },
  { code: "bn", name: "Bengali", flag: "🇮🇳" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "gbm", name: "Garhwali", flag: "🇮🇳" },
  { code: "gu", name: "Gujarati", flag: "🇮🇳" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "kn", name: "Kannada", flag: "🇮🇳" },
  { code: "kfy", name: "Kumaoni", flag: "🇮🇳" },
  { code: "mai", name: "Maithili", flag: "🇮🇳" },
  { code: "ml", name: "Malayalam", flag: "🇮🇳" },
  { code: "mr", name: "Marathi", flag: "🇮🇳" },
  { code: "mtei", name: "Meitei", flag: "🇮🇳" },
  { code: "ne", name: "Nepali", flag: "🇳🇵" },
  { code: "or", name: "Odia", flag: "🇮🇳" },
  { code: "pa", name: "Punjabi", flag: "🇮🇳" },
  { code: "sa", name: "Sanskrit", flag: "🇮🇳" },
  { code: "si", name: "Sinhala", flag: "🇱🇰" },
  { code: "ta", name: "Tamil", flag: "🇮🇳" },
  { code: "te", name: "Telugu", flag: "🇮🇳" },
  { code: "tcy", name: "Tulu", flag: "🇮🇳" },
  { code: "ur", name: "Urdu", flag: "🇵🇰" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
];

// Component: Language selector dropdown
export const LanguageSelector = ({ selectedLang, onSelect, isOpen, setIsOpen, search, setSearch }) => {
  const filteredLanguages = useMemo(
    () => languages.filter((lang) => lang.name.toLowerCase().includes(search.toLowerCase())),
    [search]
  );

  const selectedLanguage = languages.find((lang) => lang.code === selectedLang) || {
    name: "Select Language",
    flag: "",
  };

  return (
    <div className="flex-1 relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex w-64 md:w-72 items-center gap-2 sm:gap-3 whitespace-nowrap text-sm sm:text-base font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 dark:focus-visible:ring-purple-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 sm:[&_svg]:size-5 [&_svg]:shrink-0 h-auto p-3 sm:p-4 justify-between backdrop-blur-sm border-2 transition-all duration-300 rounded-xl sm:rounded-2xl min-w-[160px] sm:min-w-[180px] hover:scale-105 shadow-lg bg-white/70 dark:bg-gray-800/70 border-white/60 dark:border-gray-700/60 hover:bg-white/90 dark:hover:bg-gray-700/90 text-gray-800 dark:text-gray-200 hover:text-purple-700 dark:hover:text-purple-400"
        aria-label={`Select ${selectedLanguage.name} language`}
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        data-state={isOpen ? "open" : "closed"}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-base sm:text-lg lg:text-xl">{selectedLanguage.flag}</span>
          <span className="font-medium text-xs sm:text-sm lg:text-base">{selectedLanguage.name}</span>
        </div>
        <ChevronDown
          className={`h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>
      {isOpen && (
        <div className="absolute z-20 w-64 sm:w-72 bg-white/90 dark:bg-gray-800/90 border-2 border-white/60 dark:border-gray-700/60 shadow-xl mt-1 sm:mt-2 backdrop-blur-md rounded-xl sm:rounded-2xl overflow-hidden">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search languages..."
            className="w-full p-3 sm:p-4 border-b border-white/60 dark:border-gray-700/60 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 bg-white/70 dark:bg-gray-800/70 text-gray-800 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-400 text-sm sm:text-base"
            autoFocus
            aria-label="Search languages"
          />
          <div className="max-h-40 sm:max-h-48 overflow-y-auto">
            {filteredLanguages.sort((a, b) => a.name.localeCompare(b.name)).map((lang) => (
              <div
                key={lang.code}
                onClick={() => {
                  onSelect(lang.code);
                  setSearch("");
                  setIsOpen(false);
                }}
                className={`p-3 sm:p-4 hover:bg-purple-100/60 dark:hover:bg-purple-900/60 cursor-pointer flex items-center gap-2 sm:gap-3 text-sm sm:text-base text-gray-800 dark:text-gray-200 transition-all duration-200 ${
                  selectedLang === lang.code ? "bg-purple-100/60 dark:bg-purple-900/60" : ""
                }`}
                role="option"
                aria-selected={selectedLang === lang.code}
              >
                <span className="text-base sm:text-lg lg:text-xl">{lang.flag}</span>
                <span className="text-xs sm:text-sm lg:text-base">{lang.name}</span>
                {selectedLang === lang.code && (
                  <span className="ml-auto text-purple-600 dark:text-purple-300">🌐</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};