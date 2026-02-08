"use client";

import { useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
  duration?: number;
}

/**
 * Toast notification component
 * Auto-dismisses after specified duration
 */
export default function Toast({
  message,
  type = "info",
  onClose,
  duration = 3000,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const typeStyles = {
    success: {
      bg: "bg-green-50 border-green-200",
      text: "text-green-800",
      icon: <CheckCircle className="w-5 h-5 text-green-500" />,
    },
    error: {
      bg: "bg-red-50 border-red-200",
      text: "text-red-800",
      icon: <AlertCircle className="w-5 h-5 text-red-500" />,
    },
    info: {
      bg: "bg-blue-50 border-blue-200",
      text: "text-blue-800",
      icon: <Info className="w-5 h-5 text-blue-500" />,
    },
  };

  const styles = typeStyles[type];

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 border rounded-lg shadow-lg ${styles.bg} animate-in slide-in-from-bottom-5 duration-300`}
    >
      {styles.icon}
      <p className={`text-sm font-medium ${styles.text}`}>{message}</p>
      <button
        onClick={onClose}
        aria-label="Close notification"
        className={`p-1 rounded-full hover:bg-black/5 transition-colors ${styles.text}`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
