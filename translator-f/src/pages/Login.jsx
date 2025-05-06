import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const backendURL = import.meta.env.VITE_BACKEND_URL;

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      setError("");
      
      const response = await axios.post(`${backendURL}/users/signin`, {
        email,
        password,
      });

      const { token, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      navigate("/");
      setTimeout(() => {
        window.location.reload();
      }, 50);

      setUser(user);
      
    } catch (err) {
      setTimeout(() => {}, 15)
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleHomeRedirect = () => {
    navigate("/");
  };

  return (
    <div className="flex justify-center items-center mt-24 h-72 bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96 relative">
        <button
          onClick={handleHomeRedirect}
          className="absolute top-2 right-2 text-purple-600 hover:text-purple-800"
          title="Go to Home"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
        </button>
        <h2 className="text-2xl font-semibold text-purple-800 mb-4 text-center">Sign In</h2>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <form onSubmit={handleSignIn} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full p-2 border rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-2 border rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full bg-purple-800 text-white p-2 rounded hover:bg-purple-900 transition"
            disabled={loading}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <p className="text-sm text-center mt-4">
          Don't have an account? <a href="/signup" className="text-purple-600 hover:underline">Sign Up</a>
        </p>
      </div>
    </div>
  );
};

export default SignIn;