"use client";

import { useEffect } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const config = {
    success: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-800",
      icon: CheckCircle2,
    },
    error: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-700",
      icon: XCircle,
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-800",
      icon: Info,
    },
  }[type];

  const Icon = config.icon;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`${config.bg} ${config.border} ${config.text} border rounded-lg px-4 py-3 shadow-xl shadow-black/10 max-w-sm flex items-start gap-3`}>
        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <p className="text-sm font-medium flex-1">{message}</p>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-current opacity-50 hover:opacity-100 transition-opacity"
          aria-label="닫기"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
