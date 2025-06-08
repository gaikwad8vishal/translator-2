import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Calendar, Download, History, Trash2,Moon, Sun } from "lucide-react";
import { languages } from "../components/constants";

const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

const TranslationHistory = () => {
  const [history, setHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState("light");
  const navigate = useNavigate();

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signin");
    }
  }, [navigate]);

  // Fetch history
  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${backendURL}/history/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory(response.data);
      setLoading(false);
    } catch (err) {
      setError(`Error fetching translation history: ${err.message}`);
      setLoading(false);
      if (err.response && err.response.status === 401) {
        navigate("/signin");
      }
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Toggle theme
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  // Delete history item
  const deleteHistoryItem = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${backendURL}/history/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      setError(`Error deleting history item: ${err.message}`);
    }
  };

  // Placeholder for favorite
  const handleFavorite = () => {
    alert("Favoriting functionality coming soon!");
  };

  // Filter history by search query
  const filteredHistory = history.filter(
    (item) =>
      item.input.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.translation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Placeholder for filter by date
  const handleFilterByDate = () => {
    alert("Filter by date functionality coming soon!");
  };

  // Placeholder for export
  const handleExport = () => {
    alert("Export functionality coming soon!");
  };

  // Map language code to name and flag
  const getLanguageDisplay = (code) => {
    const lang = languages.find((l) => l.code === code) || { name: code };
    const flags = {
      en: "🇺🇸",
      es: "🇪🇸",
      hi: "🇮🇳",
      fr: "🇫🇷",
      de: "🇩🇪",
      // Add more as needed
    };
    return `${lang.name} ${flags[code] || ""}`;
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return "Unknown";
    return new Date(date).toLocaleDateString("en-GB"); // e.g., "15/01/2024"
  };

  return (
    <div
      className={`min-h-screen transition-all duration-500 ${
        theme === "light"
          ? "bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100"
          : "bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900"
      }`}
      style={{ overflowY: "auto" }}
      aria-label="Translation history page"
    >
      <header className="p-6 border-b backdrop-blur-sm border-white/20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              className="inline-flex items-center justify-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent h-10 w-10 rounded-full text-gray-700 hover:text-gray-900"
              onClick={() => navigate(-1)}
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <History className="h-6 w-6 text-purple-500" />
              <h1 className={`text-xl font-bold ${theme === "light" ? "text-gray-900" : "text-white"}`}>
                Translation History
              </h1>
            </div>
          </div>
          <button
            className="inline-flex items-center justify-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:text-accent-foreground h-10 w-10 rounded-full transition-all duration-300 hover:scale-110 bg-gray-200 hover:bg-gray-300 text-gray-900 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {error && (
        <div className="text-red-500 text-sm p-6 max-w-6xl mx-auto">{error}</div>
      )}

      <main className="p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Search and Filter Section */}
          <div className="p-6 rounded-2xl backdrop-blur-sm border bg-white/40 border-white/50">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  className={`flex h-10 w-full rounded-md border px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm pl-10 ${
                    theme === "light"
                      ? "bg-white/70 border-gray-200/60 text-gray-900 placeholder:text-gray-500"
                      : "bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-400"
                  }`}
                  placeholder="Search translations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search translations"
                />
              </div>
              <div className="flex gap-2">
                <button
                  className="inline-flex items-center justify-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-9 rounded-md px-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  onClick={handleFilterByDate}
                  aria-label="Filter by date"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Filter by Date
                </button>
                <button
                  className="inline-flex items-center justify-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-9 rounded-md px-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  onClick={handleExport}
                  aria-label="Export history"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </button>
              </div>
            </div>
          </div>

          {/* History List */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center p-12 rounded-2xl backdrop-blur-sm border bg-white/40 border-white/50 text-gray-600">
                <p className="text-sm">Loading...</p>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="text-center p-12 rounded-2xl backdrop-blur-sm border bg-white/40 border-white/50 text-gray-600">
                <History className="h-12 w-12 mx-auto mb-4 text-purple-500" />
                <h3 className="font-semibold mb-2">No translations found</h3>
                <p className="text-sm">Start translating to build your history!</p>
              </div>
            ) : (
              filteredHistory.map((item) => (
                <div
                  key={item._id}
                  className="p-6 rounded-2xl backdrop-blur-sm border transition-all duration-300 hover:scale-[1.02] bg-white/40 border-white/50 hover:bg-white/60"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-600">
                          {getLanguageDisplay(item.from)} → {getLanguageDisplay(item.to)}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                          {formatDate(item.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="inline-flex items-center justify-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-9 rounded-md px-3 text-yellow-500 hover:text-yellow-600"
                        onClick={handleFavorite}
                        aria-label="Favorite translation"
                      >
                        ⭐
                      </button>
                      <button
                        className="inline-flex items-center justify-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-9 rounded-md px-3 hover:bg-gray-200  dark:hover:bg-gray-200 text-red-500 hover:text-red-600"
                        onClick={() => deleteHistoryItem(item._id)}
                        aria-label="Delete history item"
                      >
                        <Trash2 className="h-6 w-6 hover:scale-110" />
                      </button>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-white/60 border border-gray-200/50">
                      <h4 className="text-sm font-medium mb-2 text-gray-700">Original</h4>
                      <p className="text-gray-900">{item.input}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-purple-50 border border-purple-200/50">
                      <h4 className="text-sm font-medium mb-2 text-purple-700">Translation</h4>
                      <p className="text-purple-900">{item.translation}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TranslationHistory;