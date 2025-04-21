import { IoLanguageOutline } from "react-icons/io5";
import { useAuth } from "../utils/api";
import { FaUserCircle } from "react-icons/fa";
import { useState, useEffect, useRef } from "react";

const Header = () => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="fixed z-90 w-full shadow-md p-4 flex items-center justify-between bg-white text-black">
      <h1 className="text-2xl font-semibold">
        <a href="/" className="flex gap-2 items-center">
          <IoLanguageOutline className="text-purple-800" /> PolyglotPro
        </a>
      </h1>
      <div className="relative" ref={dropdownRef}>
        {user ? (
          <div className="relative mr-12">
            <button
              className="flex items-center gap-2 font-medium focus:outline-none text-purple-800"
              onClick={() => setDropdownOpen((prev) => !prev)}
            >
              <FaUserCircle size={24} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-44 shadow-lg rounded-lg p-3 bg-gray-100 text-gray-700">
                <p className="text-sm px-2 font-medium">{user?.email}</p>
                <hr className="my-2 border-gray-300" />
                <button
                  className="w-full text-left px-2 py-1 rounded transition duration-200 text-red-600 hover:bg-gray-200"
                  onClick={() => {
                    logout();
                    setDropdownOpen(false);
                    navigate("/");
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <a href="/signin">
            <button className="flex items-center gap-4 font-medium text-purple-800">
              <FaUserCircle size={24} />
              Sign In
            </button>
          </a>
        )}
      </div>
    </header>
  );
};

export default Header;