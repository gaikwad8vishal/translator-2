// src/components/DocumentScanner.jsx

import React, { useEffect, useRef, useState } from "react";
import Tesseract from "tesseract.js";

const DocumentScanner = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState("");

  // Open the camera when the user clicks a button
  const handleOpenCamera = async () => {
    setError("");

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Camera access is not supported in your browser.");
      setTimeout(() => setError(""), 3000);
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      setIsCameraOpen(true);
    } catch (err) {
      let errorMessage = "Failed to access camera.";
      if (err.name === "NotAllowedError") {
        errorMessage = "Camera access denied. Please allow camera permissions.";
      } else if (err.name === "NotFoundError") {
        errorMessage = "No camera found on this device.";
      }
      setError(errorMessage);
      setTimeout(() => setError(""), 3000);
    }
  };

  // Attach the stream to the video element when the camera is opened
  useEffect(() => {
    if (isCameraOpen && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((err) => {
        console.error("Error playing video:", err);
        setError("Failed to play video stream. Please ensure camera permissions are granted.");
        setTimeout(() => setError(""), 3000);
      });
    }
  }, [isCameraOpen, stream]);

  // Clean up the stream when the component unmounts or camera is closed
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  // Capture image and extract text
  const handleCapture = async () => {
    if (!canvasRef.current || !videoRef.current) {
      setError("Camera stream not available. Please reopen the camera.");
      setTimeout(() => setError(""), 3000);
      closeCamera();
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setError("Unable to get canvas context.");
      setTimeout(() => setError(""), 3000);
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/png");

    setLoading(true);
    setError("");

    try {
      console.log("Starting Tesseract OCR...");
      const result = await Tesseract.recognize(dataUrl, "eng", {
        logger: (m) => console.log("Tesseract Logger:", m),
      });

      console.log("OCR completed, extracted text:", result.data.text);
      const extractedText = result.data.text.trim();

      if (extractedText) {
        setText(extractedText);
      } else {
        setError("No text detected in the image.");
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      console.error("Capture or Processing Error:", err);
      setError(`Error: ${err.message || "Failed to process image"}`);
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
      closeCamera();
    }
  };

  // Close the camera and stop the stream
  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-4">
      <h1 className="text-3xl font-bold text-purple-700 mb-4">Document Scanner</h1>

      {!isCameraOpen && (
        <button
          onClick={handleOpenCamera}
          className="px-4 py-2 bg-purple-800 text-white rounded-lg hover:bg-purple-900"
        >
          Open Camera
        </button>
      )}

      {error && (
        <div className="text-red-500 text-center mb-4 p-3 rounded-lg flex justify-between items-center max-w-md w-full">
          <p>{error}</p>
          <button onClick={() => setError("")} className="text-red-700 hover:text-red-900">
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
      )}

      {isCameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div
            className="bg-white p-4 rounded-lg max-w-md w-full sm:min-h-[300px] sm:max-h-[50vh] min-h-[450px] max-h-[70vh]"
          >
            <div className="relative h-full">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full rounded-lg object-cover"
                onCanPlay={() => console.log("Video can play")}
                onError={(e) => console.error("Video error:", e)}
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <div className="flex justify-between mt-4">
              <button
                onClick={handleCapture}
                className="px-4 py-2 bg-purple-800 text-white rounded-lg disabled:opacity-50 hover:bg-purple-900"
                disabled={loading}
              >
                {loading ? "Scanning..." : "Capture & Extract Text"}
              </button>
              <button
                onClick={closeCamera}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {text && (
        <div className="mt-4 w-full max-w-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Extracted Text:</h2>
          <pre className="bg-gray-100 p-4 rounded w-full whitespace-pre-wrap">{text}</pre>
        </div>
      )}
    </div>
  );
};

export default DocumentScanner;