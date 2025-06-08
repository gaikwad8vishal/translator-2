
import { useState, useEffect, useCallback } from "react";
import { Settings, Crown, UserCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import HomeSetting from "../components/HomeSetting";

const Header = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("User");
  const [loginMessage, setLoginMessage] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      const storedUsername = localStorage.getItem("name") || "User";
      setIsAuthenticated(!!token);
      setUsername(storedUsername);
    };
    checkAuth();
    window.addEventListener("storage-auth-change", checkAuth);
    return () => window.removeEventListener("storage-auth-change", checkAuth);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setUsername("User");
    setLoginMessage("Logged out successfully.");
    setTimeout(() => setLoginMessage(""), 3000);
  }, []);

  const handleSettingsClick = useCallback(() => {
    setIsSettingsOpen((prev) => !prev);
  }, []);

  const handleSignInClick = useCallback(() => {
    navigate("/signin");
  }, [navigate]);

  const handleSignUpClick = useCallback(() => {
    navigate("/signup");
  }, [navigate]);

  return (
    <>
      <header className="relative z-10 p-4 ">
        <div className="max-w-7xl mx-auto md:flex rounded-xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between pr-4 sm:gap-3">
            <div className="flex gap-2">
              <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-2 sm:p-2.5 lg:p-3 shadow-lg border-purple-300/50 dark:border-gray-700/50">
                <div className="text-white text-lg sm:text-xl lg:text-xl font-bold">🌐</div>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-indigo-400 flex items-center gap-2">
                  PolyglotPro <span className="text-yellow-600 dark:text-yellow-300 animate-pulse">✨</span>
                </h1>
                <p className="text-xs sm:text-sm lg:text-sm font-medium text-gray-600 dark:text-gray-300">Smart translation with AI power</p>
              </div>
            </div>
            <button
              onClick={handleSettingsClick}
              className="inline-flex md:hidden items-center justify-center h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 transition-all duration-300 hover:scale-110 text-gray-800 dark:text-gray-200 hover:text-purple-700 dark:hover:text-purple-400"
              aria-label="Open settings"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="size-6"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25" />
              </svg>
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:gap-4">
            <button
              onClick={toggleTheme}
              className="hidden sm:inline-flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 rounded-full transition-all duration-300 hover:scale-110 bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-gray-100/30 dark:hover:bg-gray-700/30"
              aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            >
              {theme === "light" ? (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
                </svg>
              ) : (
                <svg
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="h-4 w-4 sm:h-5 sm:w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 6.636"
                  />
                </svg>
              )}
            </button>
            <button
              onClick={handleSettingsClick}
              className={`hidden md:inline-flex items-center justify-center h-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 rounded-full transition-all duration-300 hover:scale-110 ${
                isSettingsOpen
                  ? "bg-purple-100/60 dark:bg-purple-900/60 border-purple-300/40 dark:border-purple-700/40"
                  : "bg-white/80 dark:bg-gray-800/80"
              } text-purple-600 dark:text-purple-300 hover:text-purple-700 dark:hover:text-purple-400`}
              aria-label={isSettingsOpen ? "Close settings" : "Open settings"}
            >
              <Settings className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
              {isAuthenticated ? (
                <div className="flex hidden md:inline-flex items-center gap-4">
                  <div className="relative flex items-center gap-3 px-5 py-2.5 rounded-2xl border-2 backdrop-blur-xl shadow-xl bg-gradient-to-r from-amber-100/90 via-yellow-50/95 to-orange-100/90 dark:from-amber-900/90 dark:via-yellow-800/95 dark:to-orange-900/90 border-amber-300/60 dark:border-amber-700/60 shadow-amber-200/30 dark:shadow-amber-900/30">
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-orange-400/10 dark:from-yellow-800/10 dark:to-orange-800/10 rounded-2xl"></div>
                    <Crown className="h-5 w-5 text-yellow-500 dark:text-yellow-300 drop-shadow-lg relative z-10" />
                    <span className="text-sm font-bold relative z-10 text-yellow-700 dark:text-yellow-200">Premium Member</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl border bg-white/80 dark:bg-gray-800/80 border-gray-200/60 dark:border-gray-700/60 text-gray-700 dark:text-gray-200">
                      <UserCheck className="h-4 w-4 text-green-500 dark:text-green-300" />
                      <span className="text-sm font-medium">{username}</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-300 hover:scale-105 rounded-xl px-4 py-2 text-gray-700 dark:text-gray-200 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 border hover:border-red-300/50 dark:hover:border-red-700/50"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    onClick={handleSignInClick}
                    className="hidden md:flex items-center justify-center gap-2 whitespace-nowrap text-xs sm:text-sm h-12 sm:h-10 rounded-xl px-4 sm:px-6 py-2 sm:p-2.5 border-2 backdrop-blur-sm text-gray-700 dark:text-gray-200 hover:text-purple-700 dark:hover:text-purple-400 hover:bg-purple-50/80 dark:hover:bg-purple-900/80 border-purple-200/50 dark:border-gray-700/50 hover:border-purple-300/70 dark:border-purple-600/70 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={handleSignUpClick}
                    className="hidden md:flex items-center gap-2 whitespace-nowrap text-xs sm:text-sm font-bold h-12 sm:h-10 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 dark:from-purple-500 dark:via-indigo-500 dark:to-blue-500 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-purple-400/30 dark:border-purple-600/30"
                  >
                    Join Premium Free
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      <HomeSetting isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      {loginMessage && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-60 w-full max-w-md p-4 rounded-lg shadow-lg bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 flex justify-between items-center animate-slide-in">
          <p className="text-sm font-medium text-green-600 dark:text-green-200">{loginMessage}</p>
          <button
            onClick={() => setLoginMessage("")}
            className="text-green-600 hover:text-green-700 dark:text-green-300 dark:hover:text-green-400"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="size-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
};

export default Header;
