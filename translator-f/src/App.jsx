import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import SignIn from "./pages/Login";
import SignUp from "./pages/Signup";
import { AuthProvider } from "./utils/api";
import Translator from "./pages/Home";
import { ThemeProvider } from "./context/ThemeContext";
import { useNavigate } from "react-router-dom";
import React, { useEffect } from "react";
import ChatSidebar from "./components/ChatSidebar";
import TwoWayCommunication from "./components/TwoWayCommunication";
import TranslationHistory from "./components/HistorySidebar";
import Footer from "./components/Footer";
import LiveChatbar from "./components/LiveChatbar";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="flex flex-col min-h-screen">
            <main className="flex-1 ">
              <Routes>
                <Route path="/" element={<Translator />} />
                <Route path="/single-device" element={<ChatSidebar />} />
                <Route path="/conversation" element={<TwoWayCommunication />} />
                <Route path="/multidevice" element={<LiveChatbar />} />
                <Route path="/history" element={<TranslationHistory />} />
                <Route
                  path="/signin"
                  element={
                    <ModalWrapper>
                      <SignIn />
                    </ModalWrapper>
                  }
                />
                <Route
                  path="/signup"
                  element={
                    <ModalWrapper>
                      <SignUp />
                    </ModalWrapper>
                  }
                />
              </Routes>
            </main>
            <Footer/>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

// ModalWrapper component to render modals with backdrop
function ModalWrapper({ children }) {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate("/", { replace: true });
  };

  useEffect(() => {
    document.body.classList.add("no-scroll");
    return () => document.body.classList.remove("no-scroll");
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div onClick={(e) => e.stopPropagation()}>
        {React.cloneElement(children, { onClose: handleClose })}
      </div>
    </div>
  );
}

export default App;