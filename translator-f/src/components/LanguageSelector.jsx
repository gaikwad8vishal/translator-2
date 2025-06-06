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
    <div className="flex-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:text-accent-foreground h-auto p-4 justify-between backdrop-blur-sm border transition-all duration-300 rounded-xl min-w-[160px] hover:scale-105 shadow-lg bg-white/70 border-white/60 hover:bg-white/90 text-gray-800"
        aria-label={`Select ${selectedLanguage.name} language`}
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        data-state={isOpen ? "open" : "closed"}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{selectedLanguage.flag}</span>
          <span className="font-medium">{selectedLanguage.name}</span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-gray-600 transition-transform duration-200 ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>
      {isOpen && (
        <div className="absolute z-10 w-92 bg-white/90 border border-white/60 shadow-lg mt-1 backdrop-blur-sm">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search languages..."
            className="w-full p-3 border-b border-white/60 focus:outline-none border bg-white/70 text-gray-800 placeholder:text-gray-500 text-sm"
            autoFocus
            aria-label="Search languages"
          />
          <div className="max-h-40 overflow-y-auto">
            {filteredLanguages.sort((a, b) => a.name.localeCompare(b.name)).map((lang) => (
              <div
                key={lang.code}
                onClick={() => {
                  onSelect(lang.code);
                  setSearch("");
                  setIsOpen(false);
                }}
                className={`p-3 hover:bg-purple-100/60 cursor-pointer flex items-center gap-3 text-sm text-gray-800 ${
                  selectedLang === lang.code ? "bg-purple-100/60" : ""
                }`}
                role="option"
                aria-selected={selectedLang === lang.code}
              >
                <span className="text-xl">{lang.flag}</span>
                <span>{lang.name}</span>
                {selectedLang === lang.code && <span className="ml-auto">🌐</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};