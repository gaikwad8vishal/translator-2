import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const SignIn = ({ onClose }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      setError("");
      const response = await axios.post(`${backendURL}/users/signin`, {
        email,
        password,
      });

      const { token, user, name } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("name", name);
      localStorage.setItem("user", JSON.stringify(user));
      navigate("/");
      setTimeout(() => {
        window.location.reload();
      }, 50);
    } catch (err) {
      setError("Invalid email or password");
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
    <div
      role="dialog"
      aria-modal="true"
      className="fixed left-1/2 top-1/2 z-50 grid w-full max-w-md -translate-x-1/2 -translate-y-1/2 gap-4 p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-2xl border-2 backdrop-blur-xl bg-gradient-to-br from-white/95 via-purple-50/90 to-blue-50/90 dark:from-gray-900/95 dark:via-gray-800/95 dark:to-purple-900/90 border-purple-200/70 dark:border-purple-500/40 transition-all duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
      tabIndex={-1}
    >
      <button
        type="button"
        onClick={handleClose}
        className="absolute right-4 top-4 rounded-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Close"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
        <span className="sr-only">Close</span>
      </button>
      <div className="flex flex-col space-y-3 text-center">
        <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center shadow-xl">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-8 w-8 text-white"
          >
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" x2="3" y1="12" y2="12" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 dark:from-purple-500 dark:via-indigo-500 dark:to-blue-500 bg-clip-text text-transparent">
          Welcome Back
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Sign in to unlock premium translation features
        </p>
      </div>
      <form onSubmit={handleSignIn} className="space-y-6 mt-6">
        {error && <p className="text-red-500 dark:text-red-400 text-sm text-center">{error}</p>}
        <div className="space-y-2">
          <label htmlFor="signin-email" className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Email Address
          </label>
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400"
            >
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            <input
              type="email"
              id="signin-email"
              placeholder="Enter your email"
              className="w-full pl-10 pr-3 py-2 h-12 rounded-xl border-2 bg-white/90 dark:bg-gray-800/60 border-gray-300/60 dark:border-gray-600/50 text-gray-900 dark:text-white focus:border-purple-400/70 dark:focus:border-purple-400/70 focus:outline-none focus:ring-2 focus:ring-purple-400/70 dark:focus:ring-purple-400/70 transition-all duration-300"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="signin-password" className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Password
          </label>
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400"
            >
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <input
              type="password"
              id="signin-password"
              placeholder="Enter your password"
              className="w-full pl-10 pr-3 py-2 h-12 rounded-xl border-2 bg-white/90 dark:bg-gray-800/60 border-gray-300/60 dark:border-gray-600/50 text-gray-900 dark:text-white focus:border-purple-400/70 dark:focus:border-purple-400/70 focus:outline-none focus:ring-2 focus:ring-purple-400/70 dark:focus:ring-purple-400/70 transition-all duration-300"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
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
              Signing In...
            </span>
          ) : (
            <span className="flex items-center gap-2 justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 mr-2"
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" x2="3" y1="12" y2="12" />
              </svg>
              Sign In to Premium
            </span>
          )}
        </button>
      </form>
      <p className="text-sm text-center mt-4 text-gray-600 dark:text-gray-300">
        Don't have an account?{" "}
        <a href="/signup" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline">
          Sign Up
        </a>
      </p>
    </div>
  );
};

export default SignIn;