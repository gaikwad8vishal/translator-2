import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const SignUp = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const backendURL = import.meta.env.VITE_BACKEND_URL;


  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post("https://translator-3-w6hg.onrender.com/users/signup", {
        name,
        email,
        password,
      });

      localStorage.setItem("token", response.data.token);
      navigate("/signin"); // Redirect to Home after signup
      
    } catch (err) {
      setError("Signup failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-semibold text-purple-800 mb-4 text-center">Sign Up</h2>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <form onSubmit={handleSignUp} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            className="w-full p-2 border rounded"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
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
            {loading ? "Signing Up..." : "Sign Up"}
          </button>
        </form>

        <p className="text-sm text-center mt-4">
          Already have an account? <a href="/signin" className="text-purple-600 hover:underline">Sign In</a>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
