import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Get current route
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLiveChatOpen, setIsLiveChatOpen] = useState(false);
  const [isMultiDeviceOpen, setIsMultiDeviceOpen] = useState(false);

  // Define button states and their corresponding routes
  const buttons = [
    {
      route: "/",
      label: "Home page",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="size-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205 3 1m1.5.5-1.5-.5M6.75 7.364V3h-3v18m3-13.636 10.5-3.819"
          />
        </svg>
      ),
      state: [isChatOpen, setIsChatOpen],
      handler: () => {
        navigate("/");
        setIsChatOpen(false);
        setIsLiveChatOpen(false);
        setIsMultiDeviceOpen(false);
      },
    },
    {
      route: "/single-device",
      label: isChatOpen ? "Close chat" : "Open chat",
      icon: (
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
          className="h-5 w-5 sm:h-5.5 sm:w-5.5 lg:h-6 lg:w-6"
        >
          <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path>
        </svg>
      ),
      state: [isChatOpen, setIsChatOpen],
      handler: () => {
        navigate("/single-device");
        setIsLiveChatOpen(false);
        setIsMultiDeviceOpen(false);
        setIsChatOpen((prev) => !prev);
      },
    },
    {
      route: "/conversation",
      label: isLiveChatOpen ? "Close live chat" : "Open live chat",
      icon: (
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
          className="h-6 w-6"
        >
          <path d="m4 6 3-3 3 3"></path>
          <path d="M7 17V3"></path>
          <path d="m14 6 3-3 3 3"></path>
          <path d="M17 17V3"></path>
          <path d="M4 21h16"></path>
        </svg>
      ),
      state: [isLiveChatOpen, setIsLiveChatOpen],
      handler: () => {
        navigate("/conversation");
        setIsChatOpen(false);
        setIsMultiDeviceOpen(false);
        setIsLiveChatOpen((prev) => !prev);
      },
    },
    {
      route: "/multidevice",
      label: isMultiDeviceOpen ? "Close multi-device" : "Open multi-device",
      icon: (
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
          className="h-5 w-5 sm:h-5.5 sm:w-5.5 lg:h-6 lg:w-6"
        >
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <rect x="9" y="9" width="16" height="16" rx="2" />
          <path d="M4 20 L10 14" />
          <path d="M14 10 L20 4" />
        </svg>
      ),
      state: [isMultiDeviceOpen, setIsMultiDeviceOpen],
      handler: () => {
        navigate("/multidevice");
        setIsChatOpen(false);
        setIsLiveChatOpen(false);
        setIsMultiDeviceOpen((prev) => !prev);
      },
    },
  ];

  return (
    <div className="fixed bottom-4 sm:bottom-5 lg:bottom-6 left-1/2 transform -translate-x-1/2 z-30">
      <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 p-3 sm:p-3.5 lg:p-4 rounded-lg sm:rounded-2xl backdrop-blur-md border-2 shadow-lg bg-white/90 dark:bg-gray-800/90 border-gray-200/60 dark:border-gray-700/60 lg:border-purple-200/60 dark:lg:border-purple-600/60">
        {buttons.map(({ route, label, icon, handler }) => (
          <button
            key={route}
            onClick={handler}
            className={`inline-flex items-center justify-center rounded-lg sm:rounded-2xl transition-all duration-500 hover:scale-125 w-12 h-12 sm:w-13 sm:h-13 lg:w-14 lg:h-14 ${
              location.pathname === route
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-2 border-purple-400/50 dark:border-purple-600/50"
                : "text-purple-600 dark:text-purple-300 hover:text-purple-700 dark:hover:text-purple-400 hover:bg-purple-100/60 dark:hover:bg-purple-900/60 border-2 border-gray-300/40 dark:border-gray-600/40 lg:border-purple-300/40 dark:lg:border-purple-600/40"
            } shadow-lg`}
            aria-label={label}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Footer;