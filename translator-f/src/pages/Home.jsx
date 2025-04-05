import axios from "axios";
import { ArrowLeftRight, Languages } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Clipboard, ClipboardCheck } from "lucide-react";
import { FaHistory } from "react-icons/fa";


const backendURL = import.meta.env.VITE_BACKEND_URL;


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
  const [to, setTo] = useState("en");
  const textareaRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [height, setHeight] = useState("auto");
  const [detectedLanguage, setDetectedLanguage] = useState("en"); // Default English
  const [history, setHistory] = useState([]);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false)




  useEffect(() => {
    const getUserLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude } = position.coords;
          fetchLocationAndSetLanguage(latitude, longitude);
        });
      }
    };
  
    const fetchLocationAndSetLanguage = async (lat, lon) => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
        );
        const data = await response.json();
        const state = data.address?.state;
  
        // State-wise language mapping
        const stateToLanguage = { 
          "Maharashtra": "mr",
          "Uttar Pradesh": "hi",
          "West Bengal": "bn",
          "Tamil Nadu": "ta",
          "Gujarat": "gu",
          "Karnataka": "kn",
          "Rajasthan": "hi",
          "Punjab": "pa",
          "Bihar": "hi",
          "Kerala": "ml",
          "Telangana": "te",
          "Andhra Pradesh": "te",
          "Madhya Pradesh": "hi",
          "Odisha": "or",
        };
  
        const detectedLang = stateToLanguage[state] || "en"; // Default to English if state not found
        setDetectedLanguage(detectedLang);
        setFrom(detectedLang); // Set initial language based on detection
      } catch (error) {
        console.error("Error fetching location:", error);
      }
    };
  
    getUserLocation();
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
  }, [text, from, to]); // Dependencies include `from` and `to` so that translation updates on swap
  

  const translateText = async (inputText) => {
    setLoading(true);
  
    const apiKey = process.env.GOOGLE_API_KEY; 
  
    try {
      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            q: inputText,
            source: from,
            target: to,
            format: "text",
          }),
        }
      );
  
      const data = await response.json();
  
      if (data.error) {
        throw new Error(data.error.message);
      }
  
      const translated = data.data.translations[0].translatedText;
      setTranslatedText(translated);
      setLoading(false);
  
      // Optional: Save history to backend (if logged in)
      const token = localStorage.getItem("token");
      if (token) {
        await axios.post(
          "https://translator-4-8ytv.onrender.com/history/save",
          {
            input: inputText,
            translation: translated,
            from,
            to,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
    } catch (error) {
      console.error("Translation error:", error);
      setTranslatedText("Translation failed.");
      setLoading(false);
    }
  };
  
  const swapLanguages = () => {
    setFrom(to);
    setTo(from);
  
    setText(translatedText); // ✅ Input box mai translated text daalo
    setTranslatedText(""); // ✅ Clear previous translation
  
    setTimeout(() => {
      translateText(translatedText); // ✅ Naya translation call karo
    }, 100); 
  };
  
  
  
  

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 p-4">
      <div className="bg-white p-6 rounded-2xl mt-72 sm:mt-0 shadow-2xl w-full  transition-all">
        <h1 className="text-3xl font-bold text-center mb-4 flex items-center justify-center gap-2">
          <Languages className="text-purple-700" />
           <div className="text-purple-700">Translator</div> 
        </h1>

        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
              {/* From Language Select */}
              <select
                value={from} 
                onChange={(e) => setFrom(e.target.value)}
                className="border p-3 rounded-lg w-full sm:w-1/3 text-gray-700"
              >
                {languages
                  .sort((a, b) => a.name.localeCompare(b.name)) 
                  .map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
              </select>
              {/* Swap Button */}
              <button
                onClick={swapLanguages}
                className="p-3 rounded-full hover:bg-gray-200 transition self-center sm:self-auto">
                <ArrowLeftRight className="text-gray-600" />
              </button>

              {/* To Language Select */}
              <select
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="border p-3 rounded-lg w-full sm:w-1/3 text-gray-700">
                {languages
                  .sort((a, b) => a.name.localeCompare(b.name))
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
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
            <div 
              className="relative border p-3   min-h-40 rounded-lg bg-gray-100 transition-all"
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
        <div className="mt-12">
        <button onClick={() => setIsHistoryOpen(true)} className="fixed bottom-4 right-4 bg-purple-800 text-white p-3 rounded-full shadow-lg">
        <FaHistory size={24} />
      </button>
      <HistorySidebar isOpen={isHistoryOpen} setIsOpen={setIsHistoryOpen} history={history} />
        </div>
      </div>
  );      
  };

  export default Translator;





  const HistorySidebar = ({ isOpen, setIsOpen }) => {
  const [history, setHistory] = useState([]);

  // Function to fetch history
  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.get("https://translator-4-8ytv.onrender.com/history/all", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setHistory(response.data);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  //  Function to delete history item
  const deleteHistoryItem = async (id) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await axios.delete(`https://translator-4-8ytv.onrender.com/history/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      

      setHistory((prev) => prev.filter((item) => item._id !== id));
    } catch (error) {
      console.error("Error deleting history:", error);
    }
  };

  // Fetch history only when the sidebar opens
  useEffect(() => {
    if (isOpen) fetchHistory();
  }, [isOpen]);

  return (
    <div
      className={`fixed top-0 right-0 h-full w-80 bg-white shadow-lg transform transition-transform duration-300 p-4 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
      style={{ maxHeight: "100vh", overflowY: "auto" }} // ✅ Added scroll

    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-purple-800">History</h2>
        <button className="text-gray-600" onClick={() => setIsOpen(false)}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
          </svg>
        </button>
      </div>
      {history.length === 0 ? (
        <p className="text-gray-500">No history available</p>
      ) : (
        <ul>
          {history.map((item) => (
            <li key={item._id} className="p-2 border-b text-sm text-gray-700 flex justify-between">
              <span>{item.input} ({item.from}) → {item.translation} ({item.to})</span>
              <button onClick={() => deleteHistoryItem(item._id)} className="text-gray-800 text-xs">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5"   stroke="currentColor" className="size-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
  };

