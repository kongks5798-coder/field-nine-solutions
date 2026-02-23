"use client";
import { useState, useCallback } from "react";

export interface ToastState {
  message: string;
  type: "success" | "error" | "info";
  id: number;
}

export function useToast(duration = 3000) {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const showToast = useCallback(
    (message: string, type: ToastState["type"] = "info") => {
      const id = Date.now();
      setToasts((prev) => [...prev, { message, type, id }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    },
    [duration],
  );

  return { toasts, showToast };
}
