import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, X } from "lucide-react";
import { FaUpload, FaPaperclip } from "react-icons/fa";

const TextInput = ({
  value,
  onChange,
  onMicrophoneToggle,
  isListening,
  onSpeak,
  onDocumentUpload,
  onPhotoUpload,
  isUploading = false, // Renamed from isLoading to isUploading
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
    <div className="p-4 border rounded-lg min-h-40 relative">
      <div className="flex items-start gap-2 relative">
        <div className="relative w-full">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => !isUploading && onChange(e.target.value)} // Use isUploading
            className={`w-full min-h-32 resize-none focus:outline-none ${
              isUploading ? "opacity-50 cursor-not-allowed" : ""
            }`} // Use isUploading
            placeholder={isUploading ? "" : "Enter text or use the microphone..."}
            style={{ height: inputHeight, overflowWrap: "break-word", whiteSpace: "pre-wrap" }}
            aria-label="Input text for translation"
            disabled={isUploading} // Use isUploading
          />
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
              <svg
                className="animate-spin h-5 w-5 text-gray-500 mr-2"
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
        </div>
        {value && !isUploading && (
          <button
            onClick={() => onChange("")}
            className="text-gray-500 hover:text-gray-900"
            aria-label="Clear input"
            disabled={isUploading} // Use isUploading
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      <div className="flex justify-between mb-2">
        <button
          onClick={onMicrophoneToggle}
          className="text-gray-500 hover:text-gray-700"
          aria-label={isListening ? "Stop microphone" : "Start microphone"}
          disabled={isUploading} // Use isUploading
        >
          {isListening ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
        </button>
        <div className="flex gap-4">
          <button
            onClick={onSpeak}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Speak input text"
            disabled={isUploading} // Use isUploading
          >
            <Volume2 className="w-6 h-6" />
          </button>
          <button
            onClick={() => setIsUploadMenuOpen(!isUploadMenuOpen)}
            className="text-gray-500 hover:text-gray-700"
            aria-label={isUploadMenuOpen ? "Close upload menu" : "Open upload menu"}
            disabled={isUploading} // Use isUploading
          >
            {isUploadMenuOpen ? <X className="w-6 h-6" /> : <FaPaperclip className="w-6 h-6" />}
          </button>
          {isUploadMenuOpen && (
            <div className="absolute z-10 bottom-12 right-4 bg-white border rounded-lg shadow-lg p-2">
              <label className="flex items-center gap-2 p-2 hover:bg-gray-100 w-full text-left cursor-pointer">
                <FaUpload className="w-4 h-4" /> Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  aria-label="Upload photo"
                  disabled={isUploading} // Use isUploading
                />
              </label>
              <label className="flex items-center gap-2 p-2 hover:bg-gray-100 w-full text-left cursor-pointer">
                <FaUpload className="w-4 h-4" /> Document
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleDocumentUploadWrapper}
                  className="hidden"
                  aria-label="Upload document"
                  disabled={isUploading} // Use isUploading
                />
              </label>
            </div>
          )}
          <div className="flex items-center text-md text-right">
            {charCount}/{maxChars}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextInput;