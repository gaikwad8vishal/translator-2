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
    <div className="space-y-4">
      <div className="relative">
        <div
          ref={outputRef}
          className="min-h-[250px] rounded-2xl p-4 border-2 bg-white/90 border-purple-200/50 text-gray-900 placeholder:text-gray-500"
          style={{ height: outputHeight, overflowWrap: "break-word", whiteSpace: "pre-wrap" }}
          aria-live="polite"
        >
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <span className="text-gray-400 text-lg flex gap-1">
                Loading<span className="animate-bounce">.</span>
                <span className="animate-bounce delay-100">.</span>
                <span className="animate-bounce delay-200">.</span>
              </span>
            </div>
          ) : text.startsWith("Error:") ? (
            <p className="text-red-500 text-center mt-20 text-lg">{text}</p>
          ) : text ? (
            <p className="text-gray-900">{text}</p>
          ) : (
            <p className="text-gray-400 text-center mt-20 text-lg">
              Smart translation with advanced analysis will appear here...
            </p>
          )}
        </div>
        {text && !loading && (
          <div className="absolute bottom-4 right-4 flex gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:text-accent-foreground h-9 px-3 transition-all duration-300 border-2 rounded-xl border-purple-300/60 text-purple-700 hover:bg-purple-100/60"
              aria-label={copied ? "Text copied" : "Copy text"}
              disabled={!text}
            >
              {copied ? (
                <HiClipboardCheck className="h-4 w-4 text-green-500" />
              ) : (
                <HiClipboard className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={onSpeak}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:text-accent-foreground h-9 px-3 transition-all duration-300 border-2 rounded-xl border-purple-300/60 text-purple-700 hover:bg-purple-100/60"
              aria-label="Speak output text"
              disabled={!text}
            >
              <Volume2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TextOutput;