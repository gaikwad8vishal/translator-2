import { useState, useEffect, useRef, useCallback } from "react";
import { HiClipboard, HiClipboardCheck } from "react-icons/hi";
import { Volume2 } from "lucide-react";

const TextOutput = ({ text, loading, onCopy, onSpeak }) => {
  const outputRef = useRef(null);
  const [outputHeight, setOutputHeight] = useState("auto");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.style.height = "auto";
      const scrollHeight = outputRef.current.scrollHeight;
      outputRef.current.style.height = `${scrollHeight}px`;
      setOutputHeight(`${scrollHeight}px`);
    }
  }, [text, loading]);

  const handleCopy = useCallback(() => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy();
  }, [text, onCopy]);

  return (
    <div className="flex items-start p-4 border rounded-lg min-h-40">
      <div
        ref={outputRef}
        className="w-full"
        style={{ height: outputHeight, overflowWrap: "break-word", whiteSpace: "pre-wrap" }}
        aria-live="polite"
      >
        {loading ? (
          <span className="text-gray-500 flex gap-1">
            Loading<span className="animate-bounce">.</span>
            <span className="animate-bounce delay-100">.</span>
            <span className="animate-bounce delay-200">.</span>
          </span>
        ) : text.startsWith("Error:") ? (
          <p className="text-red-500">{text}</p>
        ) : text ? (
          <p>{text}</p>
        ) : (
          <span className="text-gray-500">Output will appear here...</span>
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className="text-gray-500 hover:text-black"
          aria-label={copied ? "Text copied" : "Copy text"}
          disabled={!text}
        >
          {copied ? (
            <HiClipboardCheck className="w-5 h-5 text-green-500" />
          ) : (
            <HiClipboard className="w-5 h-5" />
          )}
        </button>
        <button
          onClick={onSpeak}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Speak output text"
          disabled={!text}
        >
          <Volume2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default TextOutput;