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
    <header className=" z-90 fixed w-full bg-white shadow-md p-4 flex items-center justify-between">
      <h1 className="text-2xl font-semibold text-purple-800">
        <a href="/" className="flex gap-2 items-center">
          <IoLanguageOutline /> PolyglotPro
        </a>
      </h1>
      <div className="relative" ref={dropdownRef}>
        {user ? (
          <div className="relative mr-12 ">
                <button
                  className="flex items-center gap-2 text-purple-800 font-medium focus:outline-none"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                >
                  <FaUserCircle size={24} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-gray-100 shadow-lg rounded-lg p-3 z-50">
                    <p className="text-sm text-gray-700 px-2 font-medium">{user?.email}</p>
                    <hr className="my-2" />
                    <button
                      className="w-full text-left text-red-600 px-2 py-1 hover:bg-gray-100 rounded transition duration-200"
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
            <button className="flex items-center gap-4 text-purple-800 font-medium">
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
