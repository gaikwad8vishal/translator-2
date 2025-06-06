
import { useRef } from "react";
import { LucideSparkles, LucideGlobe, LucideRotateCcw, LucideChevronDown, LucideMic, LucideUpload, LucideLanguages, LucideWandSparkles, LucideCamera, LucideFileText } from "lucide-react";

const EnhancedTranslationCard = ({
  text,
  setText,
  from,
  setFrom,
  to,
  setTo,
  translatedText,
  isTranslating,
  handleSwapLanguages,
  handleDocumentUpload,
  handlePhotoUpload,
  isUploading,
  isFromOpen,
  setIsFromOpen,
  searchFrom,
  setSearchFrom,
  isToOpen,
  setIsToOpen,
  searchTo,
  setSearchTo,
  isListening,
  startSpeechRecognition,
  stopSpeechRecognition,
}) => {
  const photoInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const documentInputRef = useRef(null);

  const languages = [
    { code: "en", name: "English", flag: "🇬🇧" },
    { code: "es", name: "Spanish", flag: "🇪🇸" },
    { code: "hi", name: "Hindi", flag: "🇮🇳" },
  ];

  const getLanguage = (code) => languages.find((lang) => lang.code === code) || { name: "Unknown", flag: "🌐" };

  return (
    <div className="w-full max-w-7xl mx-auto backdrop-blur-xl rounded-3xl border-2 shadow-2xl p-6 bg-gradient-to-br from-white/80 via-purple-50/90 to-blue-50/80 border-purple-200/60">
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full text-sm font-bold border-2 shadow-lg bg-gradient-to-r from-purple-100/80 to-blue-100/80 text-purple-700 border-purple-300/70">
          <LucideSparkles className="h-5 w-5 text-yellow-400" />
          Smart Translation Engine
          <LucideGlobe className="h-5 w-5 text-blue-400" />
        </div>
      </div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1 relative">
          <button
            type="button"
            className="flex items-center justify-between gap-2 p-4 rounded-xl border-2 bg-white/70 border-white/60 hover:bg-white/90 text-gray-800 font-medium min-w-[160px] transition-all duration-300 hover:scale-105 shadow-lg"
            onClick={() => setIsFromOpen(!isFromOpen)}
            aria-haspopup="menu"
            aria-expanded={isFromOpen}
            aria-label={`Select source language, currently ${getLanguage(from).name}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{getLanguage(from).flag}</span>
              <span className="font-medium">{getLanguage(from).name}</span>
            </div>
            <LucideChevronDown className="h-4 w-4 text-gray-600" />
          </button>
          {isFromOpen && (
            <div className="absolute z-50 mt-2 w-48 bg-white shadow-lg rounded-lg p-2">
              <input
                type="text"
                value={searchFrom}
                onChange={(e) => setSearchFrom(e.target.value)}
                placeholder="Search languages..."
                className="w-full p-2 rounded-md border border-gray-300"
              />
              {languages
                .filter((lang) => lang.name.toLowerCase().includes(searchFrom.toLowerCase()))
                .map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    className="flex items-center gap-2 p-2 w-full text-left hover:bg-gray-100"
                    onClick={() => {
                      setFrom(lang.code);
                      setIsFromOpen(false);
                    }}
                    aria-label={`Select ${lang.name} as source language`}
                  >
                    <span className="text-xl">{lang.flag}</span>
                    <span>{lang.name}</span>
                  </button>
                ))}
            </div>
          )}
        </div>
        <button
          type="button"
          className="h-10 w-10 mx-6 rounded-full border-2 bg-gradient-to-r from-purple-200/90 to-blue-200/90 hover:from-purple-300 hover:to-blue-300 border-purple-300/70 text-purple-700 transition-all duration-500 hover:scale-110 hover:rotate-180 shadow-xl"
          onClick={handleSwapLanguages}
          aria-label="Swap source and target languages"
        >
          <LucideRotateCcw className="h-6 w-6" />
        </button>
        <div className="flex-1 relative">
          <button
            type="button"
            className="flex items-center justify-between gap-2 p-4 rounded-xl border-2 bg-white/70 border-white/60 hover:bg-white/90 text-gray-800 font-medium min-w-[160px] transition-all duration-300 hover:scale-105 shadow-lg"
            onClick={() => setIsToOpen(!isToOpen)}
            aria-haspopup="menu"
            aria-expanded={isToOpen}
            aria-label={`Select target language, currently ${getLanguage(to).name}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{getLanguage(to).flag}</span>
              <span className="font-medium">{getLanguage(to).name}</span>
            </div>
            <LucideChevronDown className="h-4 w-4 text-gray-600" />
          </button>
          {isToOpen && (
            <div className="absolute z-50 mt-2 w-48 bg-white shadow-lg rounded-lg p-2">
              <input
                type="text"
                value={searchTo}
                onChange={(e) => setSearchTo(e.target.value)}
                placeholder="Search languages..."
                className="w-full p-2 rounded-md border border-gray-300"
              />
              {languages
                .filter((lang) => lang.name.toLowerCase().includes(searchTo.toLowerCase()))
                .map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    className="flex items-center gap-2 p-2 w-full text-left hover:bg-gray-100"
                    onClick={() => {
                      setTo(lang.code);
                      setIsToOpen(false);
                    }}
                    aria-label={`Select ${lang.name} as target language`}
                  >
                    <span className="text-xl">{getLanguage(to).flag}</span>
                    <span>{lang.name}</span>
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={photoInputRef}
        onChange={handlePhotoUpload}
      />
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        ref={cameraInputRef}
        onChange={handlePhotoUpload}
      />
      <input
        type="file"
        accept=".pdf,.docx,.txt"
        className="hidden"
        ref={documentInputRef}
        onChange={handleDocumentUpload}
      />
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-purple-700">From</span>
              <span className="text-sm font-medium text-gray-700">{getLanguage(from).name}</span>
              <LucideLanguages className="h-4 w-4 text-purple-600" />
            </div>
          </div>
          <div className="relative">
            <textarea
              className="w-full px-3 py-2 text-sm min-h-[250px] resize-none rounded-2xl border-2 bg-white/90 border-purple-200/50 text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-purple-400 transition-all duration-300 pr-36"
              placeholder="Enter text for smart translation..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              aria-label="Enter text to translate"
            />
            <div className="absolute bottom-4 right-4 flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  className="h-9 px-3 rounded-full border-2 border-purple-200 text-purple-700 hover:bg-purple-100/70 transition-all duration-200"
                  onClick={() => (isListening ? stopSpeechRecognition() : startSpeechRecognition())}
                  aria-label={isListening ? "Stop speech recognition" : "Start speech recognition"}
                  disabled={isUploading || isTranslating}
                >
                  <LucideMic className={`h-4 w-4 ${isListening ? "text-red-500" : "text-purple-600"}`} />
                </button>
                <button
                  type="button"
                  className="h-9 px-3 rounded-full border-2 border-blue-200 text-blue-600 hover:bg-blue-100/70 transition-all duration-200"
                  onClick={() => photoInputRef.current.click()}
                  aria-label="Upload photo for text extraction"
                  disabled={isUploading || isTranslating}
                >
                  <LucideUpload className="h-4 w-4 text-blue-500" />
                </button>
                <button
                  type="button"
                  className="h-9 px-3 rounded-full border-2 border-blue-200 text-blue-600 hover:bg-blue-100/70 transition-all duration-200"
                  onClick={() => cameraInputRef.current.click()}
                  aria-label="Capture photo with camera"
                  disabled={isUploading || isTranslating}
                >
                  <LucideCamera className="h-4 w-4 text-blue-500" />
                </button>
                <button
                  type="button"
                  className="h-9 px-3 rounded-full border-2 border-blue-200 text-blue-600 hover:bg-blue-100/70 transition-all duration-200"
                  onClick={() => documentInputRef.current.click()}
                  aria-label="Upload document for text extraction"
                  disabled={isUploading || isTranslating}
                >
                  <LucideFileText className="h-4 w-4 text-blue-500" />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900">To</span>
              <span className="text-sm font-medium text-gray-700">{getLanguage(to).name}</span>
              <LucideWandSparkles className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <div className="relative min-h-[250px] rounded-xl p-4 border-2 bg-white/90 border-gray-100 text-gray-900">
            {isTranslating ? (
              <p className="text-sm text-gray-500 text-center mt-4">Translating...</p>
            ) : translatedText ? (
              <p className="text-sm text-gray-700">{translatedText}</p>
            ) : (
              <p className="text-sm text-gray-500 text-center mt-4">Translation will appear here...</p>
            )}
          </div>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between">
        <div className="text-xs flex items-center gap-4 text-gray-500">
          <span>{text.length}/15000 characters</span>
        </div>
        <div className="text-xs text-purple-600">
          ✨ Smart Engine • Advanced OCR • Context Analysis • Cultural Adaptation • Multi-variant Output
        </div>
      </div>
    </div>
  );
};

export default EnhancedTranslationCard;
