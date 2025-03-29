import axios from "axios";
import { ArrowLeftRight, Languages } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Clipboard, ClipboardCheck } from "lucide-react";



const languages = [
  { code: "auto", name: "Detect Language" },
  { code: "af", name: "Afrikaans" }, { code: "sq", name: "Albanian" }, { code: "am", name: "Amharic" },
  { code: "ar", name: "Arabic" }, { code: "as", name: "Assamese" }, { code: "az", name: "Azerbaijani" },
  { code: "bn", name: "Bengali" },  { code: "bs", name: "Bosnian" },{ code: "ur", name: "Urdu" },
  { code: "bg", name: "Bulgarian" }, { code: "zh", name: "Chinese" }, { code: "hr", name: "Croatian" },
  { code: "cs", name: "Czech" }, { code: "da", name: "Danish" }, ,{ code: "eu", name: "Basque" },
  { code: "nl", name: "Dutch" }, { code: "en", name: "English" }, { code: "et", name: "Estonian" },
  { code: "fi", name: "Finnish" }, { code: "fr", name: "French" }, { code: "de", name: "German" },
  { code: "el", name: "Greek" }, { code: "gu", name: "Gujarati" }, { code: "he", name: "Hebrew" },
  { code: "hi", name: "Hindi" }, { code: "hu", name: "Hungarian" }, { code: "is", name: "Icelandic" },
  { code: "id", name: "Indonesian" }, { code: "it", name: "Italian" }, { code: "ja", name: "Japanese" },
  { code: "kn", name: "Kannada" }, { code: "ko", name: "Korean" }, { code: "lv", name: "Latvian" }, 
  { code: "lt", name: "Lithuanian" }, { code: "mai", name: "Maithili" }, { code: "ml", name: "Malayalam" },
  { code: "ms", name: "Malay" }, { code: "mr", name: "Marathi" },  { code: "ne", name: "Nepali" },
  { code: "or", name: "Odia" }, { code: "pa", name: "Punjabi" }, { code: "sa", name: "Sanskrit" }, 
  { code: "si", name: "Sinhala" }, { code: "ta", name: "Tamil" }, { code: "te", name: "Telugu" },
  { code: "mtei", name: "Meitei" },
  { code: "tcy", name: "Tulu" },
  { code: "brx", name: "Bodo" },
  { code: "gbm", name: "Garhwali" },
  { code: "kfy", name: "Kumaoni" },
  { code: "ps", name: "Pashto" },
  { code: "bo", name: "Tibetan" },
  { code: "mn", name: "Mongolian" },
  { code: "lo", name: "Lao" },
  { code: "sw", name: "Swahili" },
  { code: "zu", name: "Zulu" },
  { code: "ha", name: "Hausa" },
  { code: "ga", name: "Irish" },
  { code: "cy", name: "Welsh" },
  { code: "hy", name: "Armenian" },
  { code: "ka", name: "Georgian" },
  { code: "ug", name: "Uyghur" },
  { code: "yi", name: "Yiddish" },

];


const Translator = () => {
  const [text, setText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [from, setFrom] = useState("en");
  const [to, setTo] = useState("hi");
  const textareaRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [height, setHeight] = useState("auto");


  const setLanguageByState = (state) => {
    const stateToLang = {
      Maharashtra: "mr", // Marathi
      Gujarat: "gu", // Gujarati
      Karnataka: "kn", // Kannada
      Telangana: "te", // Telugu
      Punjab: "pa", // Punjabi
      Rajasthan: "hi", // Hindi
      Kerala: "ml", // Malayalam
    };
  
    setTo(stateToLang[state] || "hi"); // Default Hindi if state not found
  };


  const getStateFromCoords = async (lat, lon) => {
    try {
      const res = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
      );
      const state = res.data.address.state; // Extract state name
      console.log("User's State:", state);
      setLanguageByState(state);
    } catch (error) {
      console.error("Reverse geocoding error:", error);
    }
  };
  


  useEffect(() => {
    const getLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            getStateFromCoords(latitude, longitude); // Call function to get state
            console.log(longitude,latitude)
          },
          (error) => console.error("Geolocation error:", error),
          { enableHighAccuracy: true }
        );
      }
    };
  
    getLocation();
  }, []);
  
  
  const handleCopy = () => {
    if (!translatedText) return;
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset after 2 sec
  };
      

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; // Reset height first
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // Set new height
    }
  }, [text]);


  useEffect(() => {
    if (textareaRef.current) {
      const scrollHeight = textareaRef.current.scrollHeight;
      setHeight(`${scrollHeight}px`); // Update height for both input & output
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
    setLoading(true)
    try {
      const response = await axios.post("http://localhost:3001/translate/", {
        text: inputText,
        from,
        to,
      });
      setLoading(false)

      setTranslatedText(response.data.translatedText);
    } catch (error) {
      console.error("Translation error:", error);
    }
  };

  const swapLanguages = () => {
    setFrom(to);
    setTo(from);
    setText(translatedText);
    setTranslatedText("");
  };
  

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 p-4">
      <div className="bg-white p-6 rounded-2xl shadow-2xl w-full  transition-all">
        <h1 className="text-3xl font-bold text-center mb-4 flex items-center justify-center gap-2">
          <Languages className="text-purple-700" />
           <div className="text-purple-700">Translator</div> 
        </h1>

        <div className=" flex justify-between mb-4">
        <select
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border p-3 rounded-lg w-2xl pr-2  text-gray-700 ">
            {languages
              .sort((a, b) => a.name.localeCompare(b.name)) // Alphabetical Sorting
              .map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
          </select>


          <button
            onClick={swapLanguages}
            className="p-3   rounded-full hover:bg-gray-200 transition"
          >
            <ArrowLeftRight className="text-gray-600" />
          </button>

          <select
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border p-3 rounded-lg w-2xl pr-2  text-gray-700 "
          >
            {languages
              .sort((a, b) => a.name.localeCompare(b.name)) // Alphabetical Sorting
              .map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
          </select>
        </div>
        <div className="flex gap-4 grid grid-cols-1 sm:grid-cols-2 ">
        <div className="relative ">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="border p-3 w-full  min-h-40 rounded-lg resize-none focus:outline-none"
            placeholder="Enter text..."
            style={{ height }} 
          />
          {text && (
            <button
              onClick={() => setText("")}
              className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
            <div 
              className="relative border p-3 w-full min-h-40 rounded-lg bg-gray-100 transition-all 
             whitespace-normal break-words overflow-hidden"
              style={{ height }} 
            >
              {/* Copy Button */}
              <button onClick={handleCopy} className="absolute top-2 right-2 text-gray-500 hover:text-black transition">
                {copied ? <ClipboardCheck className="w-5 h-5 text-green-500" /> : <Clipboard className="w-5 h-5" />}
              </button>

              {/* Loading Animation */}
              {loading ? (
                <span className="text-gray-500 flex gap-1">
                  Loading
                  <span className="animate-bounce">.</span>
                  <span className="animate-bounce delay-100">.</span>
                  <span className="animate-bounce delay-200">.</span>
                </span>
              ) : translatedText ? (
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