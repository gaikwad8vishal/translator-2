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
    setError(""); // Yaha setError clear kar raha hai
    
    const response = await axios.post("https://translator-5-6fr1.onrender.com/users/signin", {
      email,
      password,
    });

    const { token, user } = response.data;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    navigate("/"); // ✅ Redirect user first
      setTimeout(() => {
        window.location.reload(); // ✅ Then refresh page
      }, 50);

    setUser(user); // Context update
    
    ; // Redirect to home
    
  } catch (err) {setTimeout(() => {}, 15)
    setError("Invalid email or password");
  } finally {
    setLoading(false);
  }
};

  
  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
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
