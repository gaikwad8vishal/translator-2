import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Calendar, Download, History, Trash2, Star } from "lucide-react";
import DatePicker from "react-datepicker";
import { ToastContainer, toast } from "react-toastify";
import "react-datepicker/dist/react-datepicker.css";
import "react-toastify/dist/ReactToastify.css";
import { languages } from "../components/constants";
import { useTheme } from "../context/ThemeContext";
import Header from "./Header";

// Inline CSS for DatePicker to match the app's theme
const datePickerStyles = `
  .react-datepicker {
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 0.5rem;
    font-family: inherit;
  }
  .react-datepicker__header {
    background-color: transparent;
    border-bottom: none;
    padding: 0.5rem;
  }
  .react-datepicker__current-month {
    font-size: 0.875rem;
    font-weight: 600;
  }
  .react-datepicker__day-name,
  .react-datepicker__day {
    color: inherit;
    width: 2rem;
    line-height: 2rem;
    margin: 0.1rem;
  }
  .react-datepicker__day--selected,
  .react-datepicker__day--in-range,
  .react-datepicker__day--in-selecting-range {
    background-color: #a855f7;
    color: white;
    border-radius: 0.25rem;
  }
  .react-datepicker__day--outside-month {
    color: rgba(255, 255, 255, 0.3);
  }
  .react-datepicker__navigation {
    top: 0.75rem;
  }
  .react-datepicker__navigation-icon::before {
    border-color: currentColor;
  }
  .react-datepicker__triangle {
    display: none; /* Remove the triangle for a cleaner look */
  }
  .react-datepicker-popper[data-placement^="bottom"] {
    margin-top: 2.5rem;
  }
`;

// Inject the styles into the document
const styleElement = document.createElement("style");
styleElement.innerHTML = datePickerStyles;
document.head.appendChild(styleElement);

const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

const TranslationHistory = () => {
  const [history, setHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const navigate = useNavigate();
  const { theme } = useTheme();

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signin");
    }
  }, [navigate]);

  // Fetch history with optional date range
  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const params = {};
      if (startDate) params.startDate = startDate.toISOString();
      if (endDate) {
        // Set endDate to the end of the day to include the entire day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        params.endDate = end.toISOString();
      }
      const response = await axios.get(`${backendURL}/history/all`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      let fetchedHistory = response.data;

      // Frontend fallback (optional, since backend now handles filtering)
      if (startDate || endDate) {
        fetchedHistory = fetchedHistory.filter((item) => {
          const itemDate = new Date(item.createdAt);
          const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
          const start = startDate
            ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
            : null;
          const end = endDate
            ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
            : null;

          if (start && end) {
            return itemDateOnly >= start && itemDateOnly <= end;
          } else if (start) {
            return itemDateOnly >= start;
          } else if (end) {
            return itemDateOnly <= end;
          }
          return true;
        });
      }

      setHistory(fetchedHistory);
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
  }, [startDate, endDate]);

  // Delete history item
  const deleteHistoryItem = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${backendURL}/history/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory((prev) => prev.filter((item) => item._id !== id));
      toast.success("Translation deleted successfully!");
    } catch (err) {
      setError(`Error deleting history item: ${err.message}`);
      toast.error("Failed to delete translation.");
    }
  };

  // Toggle favorite status
  const handleFavorite = async (id, currentFavorite) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `${backendURL}/history/favorite/${id}`,
        { favorite: !currentFavorite },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setHistory((prev) =>
        prev.map((item) =>
          item._id === id ? { ...item, favorite: !currentFavorite } : item
        )
      );
      toast.success(`Translation ${!currentFavorite ? "added to" : "removed from"} favorites!`);
    } catch (err) {
      setError(`Error updating favorite status: ${err.message}`);
      toast.error("Failed to update favorite status.");
    }
  };

  // Export history as CSV
  const handleExport = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${backendURL}/history/export`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `translation_history_${new Date().toISOString()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("History exported successfully!");
    } catch (err) {
      setError(`Error exporting history: ${err.message}`);
      toast.error("Failed to export history.");
    }
  };

  // Filter history by search query
  const filteredHistory = history.filter(
    (item) =>
      item.input.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.translation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Map language code to name and flag
  const getLanguageDisplay = (code) => {
    const lang = languages.find((l) => l.code === code) || { name: code };
    const flags = {
      en: "🇺🇸",
      hi: "🇮🇳",
      mr: "🇮🇳"
    };
    return `${lang.name} ${flags[code] || ""}`;
  };

  // Format date as date/month/year (e.g., 11/Jun/2025)
  const formatDate = (date) => {
    if (!date) return "Unknown";
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, "0"); // Ensure 2 digits for day
    const month = d.toLocaleString("en-US", { month: "short" }); // Get short month name (e.g., "Jun")
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div
      className={`min-h-screen pb-24 transition-all duration-500 ${
        theme === "light"
          ? "bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100"
          : "bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900"
      }`}
      style={{ overflowY: "auto" }}
      aria-label="Translation history page"
    >
      <Header />
      <header className="p-6 border-b  backdrop-blur-sm border-white/20">
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
        </div>
      </header>

      {error && (
        <div className="text-red-500 text-sm p-6 max-w-6xl mx-auto">{error}</div>
      )}

      <main className="p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Search and Filter Section */}
          <div className="p-3 sm:p-6 rounded-2xl backdrop-blur-sm border bg-white/40 border-white/50 relative z-10">
  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-center">
    <div className="relative w-full sm:flex-1">
      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
      <input
        className={`flex h-9 w-full rounded-md border px-3 py-2 text-sm sm:text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 pl-8 sm:pl-10 pr-3 ${
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
    <div className="flex gap-2 items-center w-full sm:w-auto">
      <div className="relative flex-1 sm:flex-none sm:w-48">
                   <DatePicker
                    selectsRange
                    startDate={startDate}
                    endDate={endDate}
                    onChange={(update) => setDateRange(update)}
                    className={`flex h-10 w-full rounded-md border px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm ${
                      theme === "light"
                        ? "bg-white/70 border-gray-200/60 text-gray-900"
                        : "bg-gray-800/50 border-gray-600 text-white"
                    }`}
                    placeholderText="Select date range"
                    aria-label="Select date range for filtering"
                    popperClassName={`z-[1000] ${
                      theme === "light"
                        ? "text-gray-900 bg-white/90"
                        : "text-white bg-gray-800/90"
                    }`} // Theme-based styling for the popper
                    popperPlacement="bottom-start" // Position the popper to the left side of the input
                    popperModifiers={[
                      {
                        name: "offset",
                        options: {
                          offset: [0, 8], // Add a small vertical offset to avoid overlapping the input
                        },
                      },
                      {
                        name: "preventOverflow",
                        options: {
                          rootBoundary: "viewport",
                          tether: false,
                          altAxis: true,
                        },
                      },
                      {
                        name: "zIndex",
                        enabled: true,
                        phase: "beforeWrite",
                        fn: ({ state }) => {
                          state.styles.popper.zIndex = 1000;
                        },
                      },
                    ]}
        />
        <Calendar className="absolute right-2 top-1/2 transform hidden -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
      </div>
      <button
        className="inline-flex items-center justify-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-9 rounded-md px-3 sm:px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 min-w-[90px] sm:min-w-[100px]"
        onClick={handleExport}
        aria-label="Export history"
      >
        <Download className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
        Export
      </button>
    </div>
  </div>
</div>

          {/* History List */}
          <div className="space-y-4 relative z-0">
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
                  className="p-6 rounded-2xl backdrop-blur-sm border transition-all duration-300 hover:scale-[1.02] bg-white/40 border-white/50 hover:bg-white/60 relative z-0"
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
                        className={`inline-flex items-center justify-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-9 rounded-md px-3 ${
                          item.favorite
                            ? "text-yellow-500 hover:text-yellow-600"
                            : "text-gray-500 hover:text-gray-600"
                        }`}
                        onClick={() => handleFavorite(item._id, item.favorite)}
                        aria-label={item.favorite ? "Remove from favorites" : "Add to favorites"}
                      >
                        <Star className={`h-6 w-6 ${item.favorite ? "fill-yellow-500" : ""}`} />
                      </button>
                      <button
                        className="inline-flex items-center justify-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-9 rounded-md px-3 hover:bg-gray-200 dark:hover:bg-gray-200 text-red-500 hover:text-red-600"
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
      <ToastContainer position="top-right" autoClose={3000} theme={theme} />
    </div>
  );
};

export default TranslationHistory;