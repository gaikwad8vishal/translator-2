import { useEffect, useState, useRef } from "react";
import { FaMicrophone } from "react-icons/fa";
import { IoLanguageOutline } from "react-icons/io5";
import { motion } from "framer-motion";

const languages = [
  { code: "auto", name: "Detect Language" },
  { code: "af", name: "Afrikaans" }, { code: "sq", name: "Albanian" }, { code: "am", name: "Amharic" },
  { code: "ar", name: "Arabic" }, { code: "as", name: "Assamese" }, { code: "az", name: "Azerbaijani" },
  { code: "bn", name: "Bengali" }, { code: "bho", name: "Bhojpuri" }, { code: "bs", name: "Bosnian" },
  { code: "bg", name: "Bulgarian" }, { code: "zh", name: "Chinese" }, { code: "hr", name: "Croatian" },
  { code: "cs", name: "Czech" }, { code: "da", name: "Danish" }, { code: "doi", name: "Dogri" },
  { code: "nl", name: "Dutch" }, { code: "en", name: "English" }, { code: "et", name: "Estonian" },
  { code: "fi", name: "Finnish" }, { code: "fr", name: "French" }, { code: "de", name: "German" },
  { code: "el", name: "Greek" }, { code: "gu", name: "Gujarati" }, { code: "he", name: "Hebrew" },
  { code: "hi", name: "Hindi" }, { code: "hu", name: "Hungarian" }, { code: "is", name: "Icelandic" },
  { code: "id", name: "Indonesian" }, { code: "it", name: "Italian" }, { code: "ja", name: "Japanese" },
  { code: "kn", name: "Kannada" }, { code: "ks", name: "Kashmiri" }, { code: "kok", name: "Konkani" },
  { code: "ko", name: "Korean" }, { code: "lv", name: "Latvian" }, { code: "lt", name: "Lithuanian" },
  { code: "mai", name: "Maithili" }, { code: "ml", name: "Malayalam" }, { code: "ms", name: "Malay" },
  { code: "mr", name: "Marathi" }, { code: "mni", name: "Manipuri" }, { code: "ne", name: "Nepali" },
  { code: "or", name: "Odia" }, { code: "pa", name: "Punjabi" }, { code: "sa", name: "Sanskrit" },
  { code: "sat", name: "Santali" }, { code: "sd", name: "Sindhi" }, { code: "si", name: "Sinhala" },
  { code: "ta", name: "Tamil" }, { code: "te", name: "Telugu" }, { code: "ur", name: "Urdu" },
  { code: "eu", name: "Basque" }
];

const sortLanguages = (langs) => {
  const detectLang = langs.find(lang => lang.code === "auto"); // Find "Detect Language"
  const otherLangs = langs.filter(lang => lang.code !== "auto") // Exclude "Detect Language"
    .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically
  return [detectLang, ...otherLangs]; // Place "Detect Language" at the top
};



const Translator = () => {
  const [text, setText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("en");
  const textareaRef = useRef(null);
  const [isListening, setIsListening] = useState(false);

  // Auto-focus on text input when page loads
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Auto resize textarea when text changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [text]);

  // Speech Recognition (Voice to Text)
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

  const startListening = () => {
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.lang = "en";
      recognition.interimResults = false;
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setText((prev) => prev + " " + transcript);
      };
      recognition.onend = () => setIsListening(false);
      recognition.start();
    }
  };

  // Auto-translate after user types
  useEffect(() => {
    const timer = setTimeout(() => {
      if (text.trim() !== "") {
        handleTranslate();
      }
    }, 500);
    setTranslatedText(text);
    return () => clearTimeout(timer);
  }, [text, sourceLang, targetLang]);

  const handleTranslate = async () => {
    setTranslatedText(text);
  };

  // Swap source and target language
  const swapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setText(translatedText);
    setTranslatedText(text);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 ">
      <div className="w-full max-w-3xl bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-purple-700 text-center mb-4 flex items-center gap-2">
          <IoLanguageOutline /> Translator
        </h2>

        {/* 🌟 Language Selection in Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <select className=" focus:outline-none p-2  border rounded" value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}>
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </select>

          <button className="p-2  rounded-full flex justify-center items-center" onClick={swapLanguages}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
          </button>

          <select className="p-2 focus:outline-none border rounded" value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </select>
        </div>

        {/* 🏆 Responsive Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Input Textarea */}
          <div className="relative w-full">
            <textarea
              ref={textareaRef}
              className="w-full p-3 focus:outline-none resize-none border rounded"
              rows={6}
              placeholder="Enter text or use the mic..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            {/* 🎤 Animated Mic Button */}
            <motion.button
              onClick={startListening}
              className="absolute bottom-2 left-2 p-3 rounded-full text-gray-400"
              style={{ backgroundColor: isListening ? "red" : "" }}
              animate={{ scale: isListening ? [1, 1.2, 1] : 1 }}
              transition={{ duration: 0.5, repeat: isListening ? Infinity : 0, ease: "easeInOut" }}
            >
              <FaMicrophone />
            </motion.button>
            {/* Word Counter */}
            <div className="absolute bottom-2 right-2 text-gray-500 text-sm bg-white px-2 py-1 rounded">
              {text.length}/{1000}
            </div>
          </div>

          {/* Output Textarea */}
          <textarea
            className="w-full focus:outline-none p-3 focus:outline-none border resize-none rounded bg-gray-100"
            rows={6}
            value={translatedText}
            readOnly
          />
        </div>
      </div>
    </div>
  );
};

export default Translator;
