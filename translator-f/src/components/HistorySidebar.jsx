import { useState, useEffect, useRef } from "react";
import axios from "axios";


const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";



const HistorySidebar = ({ isOpen, setIsOpen, history, setHistory }) => {
  const sidebarRef = useRef(null);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const response = await axios.get(`${backendURL}/history/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory(response.data);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  const deleteHistoryItem = async (id) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      await axios.delete(`${backendURL}/history/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory((prev) => prev.filter((item) => item._id !== id));
    } catch (error) {
      console.error("Error deleting history:", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  useEffect(() => {
    if (isOpen) fetchHistory();
  }, [isOpen]);

  return (
    <div
      ref={sidebarRef}
      className={`fixed top-0 z-50 w-96 right-0 h-full w-80 bg-white shadow-lg transform transition-transform duration-300 p-4 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
      style={{ maxHeight: "100vh", overflowY: "auto", overflowX: "hidden" }}
      aria-label="Translation history"
    >
      <div className="flex justify-between border p-1 rounded px-2 items-center mb-4">
        <h2 className="text-xl font-semibold text-purple-800">History</h2>
        <button
          className="text-gray-600 p-1 rounded hover:bg-gray-300"
          onClick={() => setIsOpen(false)}
          aria-label="Close history"
        >
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
              d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
            />
          </svg>
        </button>
      </div>
      {history.length === 0 ? (
        <p className="text-gray-500">No history available</p>
      ) : (
        <ul className="space-y-4">
          {history.map((item) => (
            <li
              key={item._id}
              className="p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-200 relative"
            >
              <div className="w-16 h-1 bg-purple-300 rounded mb-3"></div>
              <div className="text-gray-700 text-sm">
                <div className="flex justify-start mb-1">
                  <span className="text-purple-700 font-semibold">{item.from.toUpperCase()}→</span>
                  <span className="text-purple-700 font-semibold">{item.to.toUpperCase()}</span>
                </div>
                <p className="mb-1">
                  {item.input} → {item.translation}
                </p>
              </div>
              <button
                onClick={() => deleteHistoryItem(item._id)}
                className="absolute top-2 right-2 text-gray-600 hover:text-red-600"
                aria-label="Delete history item"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="size-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244 2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                  />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default HistorySidebar;