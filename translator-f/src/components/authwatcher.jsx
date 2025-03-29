import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../utils/api"; // Yeh tumhara context hoga

const AuthWatcher = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth(); // Auth context se user lo

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    
    if (storedUser) {
      setUser(JSON.parse(storedUser)); // ✅ State ko turant update karo
    }
  }, [setUser]);

  return null; // Yeh sirf sync kar raha hai, koi UI nahi hai
};

export default AuthWatcher;
