import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../utils/api";
import { FaUserCircle } from "react-icons/fa";
import { LucideMoon, LucideSettings, LucideLogIn, LucideUserPlus } from "lucide-react";

const Header = () => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="w-full shadow-md p-4 flex items-center justify-between bg-white text-black z-50">
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-3 border shadow-lg border-purple-300/50">
        <a href="/">
          <div className="text-white text-xl font-bold">🌐</div>
        </a>
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
            PolyglotPro
            <span className="text-yellow-400 animate-pulse">✨</span>
          </h1>
          <p className="text-sm text-gray-600">Smart translation with AI power</p>
        </div>
      </div>

      <div className="relative" ref={dropdownRef}>
        {user ? (
          <div className="relative mr-12">
            <button
              className="flex items-center gap-2 font-medium text-purple-800 focus:outline-none"
              onClick={() => setDropdownOpen((prev) => !prev)}
              aria-label="Toggle user menu"
            >
              <FaUserCircle size={24} />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-gray-100 text-gray-700 shadow-lg rounded-lg p-3 z-50">
                <p className="text-sm px-2 font-medium">{user?.email}</p>
                <hr className="my-2 border-gray-300" />
                <button
                  className="w-full text-left px-2 py-1 rounded text-red-600 hover:bg-gray-200 transition duration-200"
                  onClick={() => {
                    logout();
                    setDropdownOpen(false);
                    navigate("/");
                  }}
                  aria-label="Logout"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              className="h-10 w-10 rounded-full bg-gray-800/20 hover:bg-gray-800/30 text-gray-700 hover:text-accent-foreground transition-all duration-300 hover:scale-110 flex items-center justify-center"
              onClick={() => navigate("/theme-settings")}
              aria-label="Toggle theme"
            >
              <LucideMoon className="h-5 w-5" />
            </button>

            {/* Settings Button */}
            <button
              className="h-10 w-10 rounded-full border-2 bg-white/80 hover:bg-white/90 border-purple-300/60 text-purple-600 hover:text-purple-700 shadow-lg transition-all duration-300 hover:scale-110 flex items-center justify-center"
              onClick={() => navigate("/settings")}
              aria-label="Settings"
            >
              <LucideSettings className="h-5 w-5" />
            </button>

            {/* Sign In Button */}
            <button
              className="h-10 px-6 py-2.5 rounded-xl border-2 backdrop-blur-sm text-gray-700 hover:text-purple-700 hover:bg-purple-50/80 border-purple-200/50 hover:border-purple-300/70 shadow-md hover:shadow-purple-200/30 font-medium transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
              onClick={() => navigate("/signin")}
              aria-label="Sign In"
            >
              <LucideLogIn className="h-4 w-4" />
              Sign In
            </button>

            {/* Join Premium Button */}
            <button
              className="h-10 px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 text-white font-bold border-2 border-purple-400/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
              onClick={() => navigate("/signup")}
              aria-label="Join Premium"
            >
              <LucideUserPlus className="h-5 w-5" />
              Join Premium Free
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;