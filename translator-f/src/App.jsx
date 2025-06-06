import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import SignIn from "./pages/Login";
import SignUp from "./pages/Signup";
import { AuthProvider } from "./utils/api";
import Translator from "./pages/Home";
import AuthWatcher from "./components/authwatcher";
import { ThemeProvider } from "./components/Therechanger";

function App() {
  return (
    <ThemeProvider>    
      <AuthProvider>
      <Router> 
        <AuthWatcher /> 
        <div className="flex flex-col min-h-screen">
          <main className="flex-1 p-4">
            <Routes>
              <Route path="/" element={<Translator />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
    </ThemeProvider>

  );
}

export default App;
