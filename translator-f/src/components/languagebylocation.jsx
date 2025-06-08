import { useState, useCallback } from "react";

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

export const useGeolocation = (setTo, setDetectedLanguage) => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const setFallbackLanguage = useCallback(() => {
    // Map unsupported browser languages to supported ones
    const browserLang = navigator.language.split("-")[0];
    const languageMap = {
      zh: "hi", // Map Chinese to Hindi as fallback
      ja: "en",
      de: "en",
      fr: "en",
      es: "en",
      it: "en",
      pt: "en",
      ru: "en",
      ko: "en",
      id: "en",
      ar: "ur",
      th: "en",
      vi: "en",
      tr: "en",
    };
    const validLang = languages.find((lang) => lang.code === browserLang)?.code || languageMap[browserLang] || "hi";
    setDetectedLanguage(validLang);
    setTo(validLang);
    setLoading(false);
  }, [setDetectedLanguage, setTo]);

  const fetchLocationAndSetLanguage = useCallback(
    async (lat, lon, retries = 3) => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
            {
              headers: {
                "User-Agent": "PolyglotPro/1.0 (contact@yourapp.com)", // Replace with your app's details
              },
            }
          );
          if (!response.ok) throw new Error(`Nominatim API error: ${response.status}`);
          const data = await response.json();
          const state = data.address?.state;
          const country = data.address?.country;

          const stateToLanguage = {
            Maharashtra: "mr",
            "Uttar Pradesh": "hi",
            "West Bengal": "bn",
            "Tamil Nadu": "ta",
            Gujarat: "gu",
            Karnataka: "kn",
            Rajasthan: "hi",
            Punjab: "pa",
            Bihar: "hi",
            Kerala: "ml",
            Telangana: "te",
            "Andhra Pradesh": "te",
            "Madhya Pradesh": "hi",
            Odisha: "or",
            Assam: "as",
            Jharkhand: "hi",
            Chhattisgarh: "hi",
            Haryana: "hi",
            "Himachal Pradesh": "hi",
            Uttarakhand: "hi",
            Manipur: "mtei",
            Meghalaya: "en",
            Mizoram: "en",
            Nagaland: "en",
            Sikkim: "ne",
            Tripura: "bn",
            "Arunachal Pradesh": "en",
            Goa: "kn",
            Delhi: "hi",
            "Jammu and Kashmir": "ur",
            Ladakh: "hi",
          };

          const countryToLanguage = {
            India: "hi",
            China: "zh",
            Japan: "ja",
            Germany: "de",
            France: "fr",
            Spain: "es",
            Italy: "it",
            Brazil: "pt",
            Russia: "ru",
            "United States": "en",
            "United Kingdom": "en",
            Canada: "en",
            Australia: "en",
            Nigeria: "en",
            "South Africa": "en",
            Mexico: "es",
            Argentina: "es",
            "South Korea": "ko",
            Indonesia: "id",
            Pakistan: "ur",
            Bangladesh: "bn",
            Turkey: "tr",
            Egypt: "ar",
            "Saudi Arabia": "ar",
            Thailand: "th",
            Vietnam: "vi",
          };

          let detectedLang = "hi";
          if (country === "India" && state && stateToLanguage[state]) detectedLang = stateToLanguage[state];
          else if (country && countryToLanguage[country]) detectedLang = countryToLanguage[country];
          const validLang = languages.find((lang) => lang.code === detectedLang)?.code || "hi";
          setDetectedLanguage(validLang);
          setTo(validLang);
          setError("");
          setLoading(false);
          return;
        } catch (error) {
          if (attempt === retries) {
            setError("Failed to detect location. Using default language.");
            setTimeout(() => setError(""), 5000); // Show error for 5 seconds
            setFallbackLanguage();
          }
          // Exponential backoff: 2s, 4s, 8s
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    },
    [setDetectedLanguage, setTo, setFallbackLanguage]
  );

  const getUserLanguage = useCallback(() => {
    setLoading(true);
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setTimeout(() => setError(""), 5000);
      setFallbackLanguage();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await fetchLocationAndSetLanguage(latitude, longitude);
      },
      (error) => {
        let errorMessage;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Using default language.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location unavailable. Using default language.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Using default language.";
            break;
          default:
            errorMessage = "Failed to access location. Using default language.";
        }
        setError(errorMessage);
        setTimeout(() => setError(""), 5000);
        setFallbackLanguage();
      },
      { timeout: 10000, maximumAge: 600000, enableHighAccuracy: false } // Reduced timeout, increased cache
    );
  }, [fetchLocationAndSetLanguage, setFallbackLanguage]);

  return { getUserLanguage, error, setError, loading };
};