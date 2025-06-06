import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";
import { X, User, Mail, Lock, Shield, UserPlus } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const SignUp = ({ onClose }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await axios.post(`${backendURL}/users/signup`, {
        name,
        email,
        password,
      });
      const { message } = response.data;
      setSuccess(message || "Signup successful! Redirecting to sign in...");
      setTimeout(() => {
        onClose();
        navigate("/signin", { replace: true });
      }, 2000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Signup failed. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    try {
      if (typeof onClose === "function") {
        onClose();
      } else {
        console.warn("onClose is not a function, navigating to /");
        navigate("/", { replace: true });
      }
    } catch (err) {
      console.error("Error in handleClose:", err);
      navigate("/", { replace: true });
    }
  };

  return (
    <Dialog.Root open={true} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className=" p-2 inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 grid max-w-md -translate-x-1/2 -translate-y-1/2 gap-4 p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-2xl border-2 backdrop-blur-xl bg-gradient-to-br from-white/95 via-purple-50/90 to-blue-50/90 dark:from-gray-900/95 dark:via-gray-800/95 dark:to-purple-900/90 border-purple-200/70 dark:border-purple-500/40 transition-all duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <Dialog.Close asChild>
            <button
              className="absolute right-4 top-4 rounded-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </Dialog.Close>
          <div className="flex flex-col text-center space-y-3">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center shadow-xl">
              <UserPlus className="h-8 w-8 text-white" />
            </div>
            <Dialog.Title className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 dark:from-purple-500 dark:via-indigo-500 dark:to-blue-500 bg-clip-text text-transparent">
              Join PolyglotPro
            </Dialog.Title>
            <Dialog.Description className="text-lg text-gray-600 dark:text-gray-300">
              Create your free premium account in seconds
            </Dialog.Description>
          </div>
          <form onSubmit={handleSignUp} className="space-y-6 mt-6">
            {success && <p className="text-green-500 dark:text-green-400 text-sm text-center">{success}</p>}
            {error && <p className="text-red-500 dark:text-red-400 text-sm text-center">{error}</p>}
            <div className="space-y-2">
              <label htmlFor="signup-name" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <input
                  type="text"
                  id="signup-name"
                  placeholder="Enter your full name"
                  className="w-full pl-10 pr-3 py-2 h-12 rounded-xl border-2 bg-white/90 dark:bg-gray-800/60 border-gray-300/60 dark:border-gray-600/50 text-gray-900 dark:text-white focus:border-purple-400/70 dark:focus:border-purple-400/70 focus:outline-none focus:ring-2 focus:ring-purple-400/70 dark:focus:ring-purple-400/70 transition-all duration-300"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="signup-email" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <input
                  type="email"
                  id="signup-email"
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-3 py-2 h-12 rounded-xl border-2 bg-white/90 dark:bg-gray-800/60 border-gray-300/60 dark:border-gray-600/50 text-gray-900 dark:text-white focus:border-purple-400/70 dark:focus:border-purple-400/70 focus:outline-none focus:ring-2 focus:ring-purple-400/70 dark:focus:ring-purple-400/70 transition-all duration-300"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="signup-password" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <input
                  type="password"
                  id="signup-password"
                  placeholder="Create a secure password"
                  className="w-full pl-10 pr-3 py-2 h-12 rounded-xl border-2 bg-white/90 dark:bg-gray-800/60 border-gray-300/60 dark:border-gray-600/50 text-gray-900 dark:text-white focus:border-purple-400/70 dark:focus:border-purple-400/70 focus:outline-none focus:ring-2 focus:ring-purple-400/70 dark:focus:ring-purple-400/70 transition-all duration-300"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 dark:from-purple-500 dark:via-indigo-500 dark:to-blue-500 dark:hover:from-purple-600 dark:hover:via-indigo-600 dark:hover:to-blue-600 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing Up...
                </span>
              ) : (
                <span className="flex items-center gap-2 justify-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Create Premium Account
                </span>
              )}
            </button>
          </form>
          <p className="text-sm text-center mt-4 text-gray-600 dark:text-gray-300">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/signin", { replace: true })}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline"
            >
              Sign In
            </button>
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default SignUp;