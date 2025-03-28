import { IoLanguageOutline } from "react-icons/io5";
import { useAuth } from "../utils/api";
import { FaUserCircle } from "react-icons/fa";
import { useState } from "react";

const Header = () => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="fixed w-full bg-white shadow-md p-4 flex items-center justify-between">
      <h1 className="text-2xl font-semibold text-purple-800">
        <a href="/" className="flex gap-2 items-center">
          <IoLanguageOutline /> Translator
        </a>
      </h1>
      <div className="relative">
        {user ? (
          // Logged-in User Icon with Dropdown
          <div>
            <button
              className="flex items-center gap-2 text-purple-800 font-medium"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <FaUserCircle size={24} />
              {user.name}
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded p-2">
                <p className="text-sm text-gray-700 px-2">{user.email}</p>
                <button
                  className="w-full text-left text-red-600 px-2 py-1 mt-2 hover:bg-gray-100"
                  onClick={logout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          // Sign In Button when User is Not Logged In
          <a href="/signin">
            <button className="text-white mr-4 border px-2 rounded bg-purple-800 py-1 font-medium hover:underline">
              Sign In
            </button>
          </a>
        )}
      </div>
    </header>
  );
};

export default Header;



