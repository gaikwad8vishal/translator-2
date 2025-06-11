import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useEffect } from "react";
import { useTheme } from "../context/ThemeContext"; // Import useTheme to access the theme

const ErrorMessage = ({ error, onClose, onRetry }) => {
  const { theme } = useTheme(); // Access the theme

  useEffect(() => {
    if (!error) return;

    const toastId = toast.error(error, {
      position: "top-right", // Match TranslationHistory position
      autoClose: 3000, // Match TranslationHistory duration
      onClose: onClose, // Keep the onClose handler
    });

    return () => toast.dismiss(toastId);
  }, [error, onClose]);

  return <ToastContainer position="top-right" autoClose={3000} theme={theme} />;
};

export default ErrorMessage;