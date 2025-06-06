import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, X, Image, FileText, Camera } from "lucide-react";
import { FaPaperclip } from "react-icons/fa";

const TextInput = ({
  value,
  onChange,
  onMicrophoneToggle,
  isListening,
  onSpeak,
  onDocumentUpload,
  onPhotoUpload,
  isUploading = false,
}) => {
  const textareaRef = useRef(null);
  const [inputHeight, setInputHeight] = useState("auto");
  const [isUploadMenuOpen, setIsUploadMenuOpen] = useState(false);
  const maxChars = 5000;
  const charCount = value.length;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${scrollHeight}px`;
      setInputHeight(`${scrollHeight}px`);
    }
  }, [value]);

  const handleDocumentUploadWrapper = (event) => {
    onDocumentUpload(event);
    setIsUploadMenuOpen(false);
  };

  const handlePhotoUpload = (event) => {
    onPhotoUpload(event);
    setIsUploadMenuOpen(false);
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => !isUploading && onChange(e.target.value)}
        className={`flex w-full px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[250px] resize-none rounded-2xl focus:ring-2 focus:ring-purple-500/50 transition-all duration-300 border-2 pr-16 bg-white/90 border-purple-200/50 text-gray-900 placeholder:text-gray-500 ${
          isUploading ? "opacity-50 cursor-not-allowed" : ""
        }`}
        placeholder={
          isUploading
            ? ""
            : "Enter text for smart translation with advanced features..."
        }
        style={{ height: inputHeight, overflowWrap: "break-word", whiteSpace: "pre-wrap" }}
        aria-label="Input text for translation"
        disabled={isUploading}
      />
      {isUploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
          <svg
            className="animate-spin h-5 w-5 text-purple-600 mr-2"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-gray-500">Loading...</span>
        </div>
      )}
      {value && !isUploading && (
        <button
          onClick={() => onChange("")}
          className="absolute top-2 right-4 text-gray-500 hover:text-gray-900"
          aria-label="Clear input"
          disabled={isUploading}
        >
          <X className="w-4 h-4" />
        </button>
      )}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <div className="flex gap-2">
          <button
            onClick={onMicrophoneToggle}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:size-shrink-0 hover:bg-accent hover:text-accent-foreground h-9 px-3 transition-all duration-300 border-2 rounded-xl border-purple-300/60 text-purple-700 hover:bg-purple-100/60"
            aria-label={isListening ? "Stop microphone" : "Start microphone"}
            disabled={isUploading}
          >
            {isListening ? (
              <Mic className="h-4 w-4" />
            ) : (
              <MicOff className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={onSpeak}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-9 px-3 transition-all duration-300 border-2 rounded-xl border-purple-300/60 text-purple-700 hover:bg-purple-100/60"
            aria-label="Speak input text"
            disabled={isUploading}
          >
            <Volume2 className="h-4 w-4" />
          </button>
          <div className="relative">
            <button
              onClick={() => setIsUploadMenuOpen(!isUploadMenuOpen)}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-9 px-3 transition-all duration-300 border-2 rounded-xl border-blue-300/60 text-blue-700 hover:bg-blue-100/60"
              aria-label={isUploadMenuOpen ? "Close upload menu" : "Open upload menu"}
              disabled={isUploading}
            >
              {isUploadMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <FaPaperclip className="h-4 w-4" />
              )}
            </button>
            {isUploadMenuOpen && (
              <div className="absolute bottom-full right-0 mb-2 p-2 rounded-xl border-2 shadow-xl backdrop-blur-xl z-10 bg-white/95 border-gray-200">
                <div className="flex flex-col gap-1 w-40">
                  <label className="relative">
                    <button
                      className="inline-flex items-center gap-2 whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 justify-start text-xs w-full text-left"
                      disabled={isUploading}
                    >
                      <Image className="h-3 w-3 mr-2" />
                      Upload Photo
                    </button>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      aria-label="Upload photo"
                      disabled={isUploading}
                    />
                  </label>
                  <button
                    className="inline-flex items-center gap-2 whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 justify-start text-xs"
                    disabled={true}
                    title="Take Photo is a premium feature"
                  >
                    <Camera className="h-3 w-3 mr-2" />
                    Take Photo
                  </button>
                  <label className="relative">
                    <button
                      className="inline-flex items-center gap-2 whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 justify-start text-xs w-full text-left"
                      disabled={isUploading}
                    >
                      <FileText className="h-3 w-3 mr-2" />
                      Upload Document
                    </button>
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={handleDocumentUploadWrapper}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      aria-label="Upload document"
                      disabled={isUploading}
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextInput;