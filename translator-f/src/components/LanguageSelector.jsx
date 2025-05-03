
import { useMemo } from "react";


// Available languages for translation
 export const languages = [
    { code: "as", name: "Assamese" },
    { code: "bn", name: "Bengali" },
    { code: "brx", name: "Bodo" },
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

// Component: Language selector dropdown
export  const LanguageSelector = ({ selectedLang, onSelect, isOpen, setIsOpen, search, setSearch }) => {
  const filteredLanguages = useMemo(
    () => languages.filter((lang) => lang.name.toLowerCase().includes(search.toLowerCase())),
    [search]
  );

  return (
    <div className="relative w-full" onClick={() => setIsOpen(!isOpen)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border p-3 rounded-lg flex justify-between items-center"
        aria-label={`Select ${selectedLang} language`}
      >
        {languages.find((lang) => lang.code === selectedLang)?.name || "Select Language"}
        <svg
          className="w-4 h-4 ml-2 transition-transform duration-200"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute z-10 w-full bg-white border rounded-lg shadow-lg mt-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search languages..."
            className="w-full p-2 border-b rounded-t-lg focus:outline-none"
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
                className="p-2 hover:bg-gray-100 cursor-pointer"
                role="option"
                aria-selected={selectedLang === lang.code}
              >
                {lang.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
