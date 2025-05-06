const ErrorMessage = ({ error, onClose, onRetry }) => {
    if (!error) return null;
  
    return (
      <div className="text-red-500 text-center mb-4 p-3 rounded-lg flex justify-between items-center">
        <p>
          {error} {error.includes("unavailable") && "This may be due to a weak signal or another app using the resource."}
        </p>
        <div className="flex gap-2">
          {onRetry && (
            <button onClick={onRetry} className="text-blue-700 hover:text-blue-900">
              Try Again
            </button>
          )}
          <button onClick={onClose} className="text-red-700 hover:text-red-900">
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
      </div>
    );
  };
  
  export default ErrorMessage;