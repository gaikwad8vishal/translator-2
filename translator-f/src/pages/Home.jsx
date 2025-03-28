import axios from "axios";
import { ArrowLeftRight, Languages } from "lucide-react";
import { useState, useEffect, useRef } from "react";


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
  const [from, setFrom] = useState("en");
  const [to, setTo] = useState("hi");
  const textareaRef = useRef(null);



  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; // Reset height first
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // Set new height
    }
  }, [text]);


  useEffect(() => {
    if (!text.trim()) {
      setTranslatedText("");
      return;
    }
    const timer = setTimeout(() => {
      translateText(text);
    }, 500); // Auto-translate after 500ms debounce

    return () => clearTimeout(timer);
  }, [text, from, to]);

  const translateText = async (inputText) => {
    try {
      const response = await axios.post("http://localhost:3001/translate/", {
        text: inputText,
        from,
        to,
      });
      setTranslatedText(response.data.translatedText);
    } catch (error) {
      console.error("Translation error:", error);
    }
  };

  const swapLanguages = () => {
    setFrom(to);
    setTo(from);
    setText(translatedText);
    setTranslatedText(text);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-4">
      <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-2xl transition-all">
        <h1 className="text-3xl font-bold text-center mb-4 flex items-center justify-center gap-2">
          <Languages className="text-purple-700" />
           <div className="text-purple-700">Translator</div> 
        </h1>

        <div className="flex gap-4 mb-4">
          <select
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border p-3 rounded-lg w-full text-gray-700 focus:ring focus:ring-blue-300"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>

          <button
            onClick={swapLanguages}
            className="p-3  rounded-full hover:bg-gray-200 transition"
          >
            <ArrowLeftRight className="text-gray-600" />
          </button>

          <select
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border p-3 rounded-lg w-full text-gray-700 focus:ring focus:ring-blue-300"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-4">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="border p-3 w-1/2 h-40 rounded-lg resize-none focus:outline-none  "
            placeholder="Enter text..."
          />

          <div className="border p-3 w-1/2 h-40 rounded-lg bg-gray-100 flex  transition-all">
            {translatedText ? (
              <p className="text-gray-800">{translatedText}</p>
            ) : (
              <span className="text-gray-500">Translation will appear here...</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Translator;