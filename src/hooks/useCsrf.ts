"use client";
import { useEffect, useState } from "react";

export function useCsrf() {
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    fetch("/api/csrf")
      .then(r => r.json())
      .then(d => setToken(d.csrfToken))
      .catch(() => {});
  }, []);

  return token;
}
