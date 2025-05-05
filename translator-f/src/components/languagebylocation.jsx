// Language detection based on geolocation
import { useState , useCallback } from "react";



const languages = [
    { code: "as", name: "Assamese" },
    { code: "bn", name: "Bengali" },
    { code: "en", name: "English" },
    { code: "gbm", name: "Garhwali" },
    { code: "gu", name: "Gujarati" },
    { code: "hi", name: "Hindi" },
    { code: "kn", name: "Kannada" },
    { code: "kfy", name: "Kumaoni" },
    { code: "mai", name: "Maithili" },
    { code: "ml", name: "Malayalam" },
    { code: "mr", name: "Marathi" },
    { code: "mtei", name: "Meitei" },
    { code: "ne", name: "Nepali" },
    { code: "or", name: "Odia" },
    { code: "pa", name: "Punjabi" },
    { code: "sa", name: "Sanskrit" },
    { code: "si", name: "Sinhala" },
    { code: "ta", name: "Tamil" },
    { code: "te", name: "Telugu" },
    { code: "tcy", name: "Tulu" },
    { code: "ur", name: "Urdu" },
  ];
  


// Hook: Handle geolocation and language detection
export  const useGeolocation = (setTo, setDetectedLanguage) => {
  const [error, setError] = useState("");

  const setFallbackLanguage = useCallback(() => {
    const browserLang = navigator.language.split("-")[0];
    const validLang = languages.find((lang) => lang.code === browserLang)?.code || "hi";
    setDetectedLanguage(validLang);
    setTo(validLang);
  }, [setDetectedLanguage, setTo]);

  const fetchLocationAndSetLanguage = useCallback(
    async (lat, lon, retries = 3) => {
      while (retries > 0) {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
            { headers: { "User-Agent": "TranslatorApp/1.0 (your@email.com)" } }
          );
          if (!response.ok) throw new Error(`Nominatim API error: ${response.status}`);
          const data = await response.json();
          const state = data.address?.state;
          const country = data.address?.country;

          const stateToLanguage = {
            Maharashtra: "mr", "Uttar Pradesh": "hi", "West Bengal": "bn", "Tamil Nadu": "ta",
            Gujarat: "gu", Karnataka: "kn", Rajasthan: "hi", Punjab: "pa", Bihar: "hi",
            Kerala: "ml", Telangana: "te", "Andhra Pradesh": "te", "Madhya Pradesh": "hi",
            Odisha: "or", Assam: "as", Jharkhand: "hi", Chhattisgarh: "hi", Haryana: "hi",
            "Himachal Pradesh": "hi", Uttarakhand: "hi", Manipur: "mtei", Meghalaya: "en",
            Mizoram: "en", Nagaland: "en", Sikkim: "ne", Tripura: "bn", "Arunachal Pradesh": "en",
            Goa: "kn", Delhi: "hi", "Jammu and Kashmir": "ur", Ladakh: "hi",
          };

          const countryToLanguage = {
            India: "hi", China: "zh", Japan: "ja", Germany: "de", France: "fr", Spain: "es",
            Italy: "it", Brazil: "pt", Russia: "ru", "United States": "en", "United Kingdom": "en",
            Canada: "en", Australia: "en", Nigeria: "en", "South Africa": "en", Mexico: "es",
            Argentina: "es", "South Korea": "ko", Indonesia: "id", Pakistan: "ur", Bangladesh: "bn",
            Turkey: "tr", Egypt: "ar", "Saudi Arabia": "ar", Thailand: "th", Vietnam: "vi",
          };

          let detectedLang = "hi";
          if (country === "India" && state && stateToLanguage[state]) detectedLang = stateToLanguage[state];
          else if (country && countryToLanguage[country]) detectedLang = countryToLanguage[country];
          const validLang = languages.find((lang) => lang.code === detectedLang)?.code || "hi";
          setDetectedLanguage(validLang);
          setTo(validLang);
          setError("");
          return;
        } catch (error) {
          retries--;
          if (retries === 0) {
            setError("Failed to detect location. Using default language.");
            setTimeout(() => setError(""), 5000);
            setFallbackLanguage();
          }
          await new Promise((resolve) => setTimeout(resolve, 1000 * (4 - retries)));
        }
      }
    },
    [setDetectedLanguage, setTo, setFallbackLanguage]
  );

  const getUserLanguage = useCallback(
    (retries = 3) => {
      if (!navigator.geolocation) {
        setError("Geolocation is not supported by your browser.");
        setTimeout(() => setError(""), 2000);
        setFallbackLanguage();
        return;
      }

      const attemptGeolocation = (attempt) => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            fetchLocationAndSetLanguage(latitude, longitude);
          },
          (error) => {
            if (error.code === error.POSITION_UNAVAILABLE && attempt < retries) {
              setTimeout(() => attemptGeolocation(attempt + 1), 2000 * attempt);
              return;
            }
            let errorMessage = "An error occurred while accessing your location.";
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = "Please allow location access for better language detection.";
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = "Location information unavailable. Using default language.";
                break;
              case error.TIMEOUT:
                errorMessage = "Location request timed out. Try again later.";
                break;
              default:
                errorMessage = "An unexpected error occurred. Using default language.";
            }
            setError(errorMessage);
            setTimeout(() => setError(""), 5000);
            setFallbackLanguage();
          },
          { timeout: 30000, maximumAge: 300000, enableHighAccuracy: false }
        );
      };
      attemptGeolocation(1);
    },
    [fetchLocationAndSetLanguage, setFallbackLanguage]
  );

  return { getUserLanguage, error, setError };
};
