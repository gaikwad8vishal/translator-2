import { useEffect } from "react";

const ErrorMessage = ({ error, onClose, onRetry }) => {
  if (!error) return null;

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 2000);
    return () => clearTimeout(timer);
  }, [error, onClose]);

  return (
    <div className="fixed bottom-4 z-90 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md p-4 rounded-lg shadow-lg bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 flex justify-between items-center animate-slide-in">
      <p className="text-sm text-red-700 dark:text-red-200">
        {error} {error.includes("unavailable") && "This may be due to a weak signal or another app using the resource."}
      </p>
      <div className="flex gap-2">
        {onRetry && (
          <button onClick={onRetry} className="text-blue-700 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-500">
            Try Again
          </button>
        )}
        <button onClick={onClose} className="text-red-700 hover:text-red-900 dark:text-red-200 dark:hover:text-red-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="size-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <style>
        {`
          @keyframes slide-in {
            0% {
              transform: translate(-50%, 100%);
              opacity: 0;
            }
            100% {
              transform: translate(-50%, 0);
              opacity: 1;
            }
          }
          .animate-slide-in {
            animation: slide-in 0.3s ease-out;
          }
        `}
      </style>
    </div>
  );
};

export default ErrorMessage;