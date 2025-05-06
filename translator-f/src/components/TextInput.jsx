import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { FaUpload, FaPaperclip } from "react-icons/fa";

const TextInput = ({
  value,
  onChange,
  onMicrophoneToggle,
  isListening,
  onSpeak,
  onPhotoUpload,
  onDocumentUpload,
  originalImage,
  processedImage,
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

  const handlePhotoUploadWrapper = (event) => {
    onPhotoUpload(event, setIsUploadMenuOpen);
    setIsUploadMenuOpen(false);
  };

  const handleDocumentUploadWrapper = (event) => {
    onDocumentUpload(event);
    setIsUploadMenuOpen(false);
  };

  return (
    <div className="p-4 border rounded-lg min-h-40 relative">
      <div className="flex items-start gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-h-32 resize-none focus:outline-none"
          placeholder="Enter text or use the microphone..."
          style={{ height: inputHeight, overflowWrap: "break-word", whiteSpace: "pre-wrap" }}
          aria-label="Input text for translation"
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="text-gray-500 hover:text-gray-900"
            aria-label="Clear input"
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
      {(originalImage || processedImage) && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold">Document Preview</h3>
          <div className="flex gap-4">
            {originalImage && (
              <div>
                <p className="text-xs">Original</p>
                <img src={originalImage} alt="Original" className="max-w-xs" />
              </div>
            )}
            {processedImage && (
              <div>
                <p className="text-xs">Scanned</p>
                <img src={processedImage} alt="Processed" className="max-w-xs" />
              </div>
            )}
          </div>
        </div>
      )}
      <div className="flex justify-between mb-2">
        <button
          onClick={onMicrophoneToggle}
          className="text-gray-500 hover:text-gray-700"
          aria-label={isListening ? "Stop microphone" : "Start microphone"}
        >
          {isListening ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
        </button>
        <div className="flex gap-4">
          <button
            onClick={onSpeak}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Speak input text"
          >
            <Volume2 className="w-6 h-6" />
          </button>
          <button
            onClick={() => setIsUploadMenuOpen(!isUploadMenuOpen)}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Open upload menu"
          >
            <FaPaperclip className="w-6 h-6" />
          </button>
          {isUploadMenuOpen && (
            <div className="absolute z-10 bottom-12 right-4 bg-white border rounded-lg shadow-lg p-2">
              <label className="flex items-center gap-2 p-2 hover:bg-gray-100 w-full text-left cursor-pointer">
                <FaUpload className="w-4 h-4" /> Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUploadWrapper}
                  className="hidden"
                  aria-label="Upload photo"
                />
              </label>
              <label className="flex items-center gap-2 p-2 hover:bg-gray-100 w-full text-left cursor-pointer">
                <FaUpload className="w-4 h-4" /> Document
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleDocumentUploadWrapper}
                  className="hidden"
                  aria-label="Upload document"
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