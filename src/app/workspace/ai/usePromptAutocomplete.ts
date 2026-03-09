// Hook that provides ghost-text AI autocomplete for the prompt input
// - Debounces 600ms after user stops typing
// - Only triggers when input is 10+ chars and doesn't end with space
// - Calls /api/ai/autocomplete with { partial } → Anthropic Haiku (fast + cheap)
// - Returns { suggestion, accept, dismiss }

import { useState, useEffect, useRef, useCallback } from "react";

export function usePromptAutocomplete(
  input: string,
  onAccept: (completed: string) => void,
) {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setSuggestion(null);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (abortRef.current) abortRef.current.abort();

    // Don't trigger for short inputs or inputs ending with space (user still composing)
    if (input.length < 10 || input.endsWith(" ")) return;

    timerRef.current = setTimeout(async () => {
      try {
        abortRef.current = new AbortController();
        const res = await fetch("/api/ai/autocomplete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ partial: input }),
          signal: abortRef.current.signal,
        });
        if (!res.ok) return;
        const data = await res.json() as { suggestion?: string };
        const clean = (data.suggestion ?? "").replace(/^["'\s]+|["'\s]+$/g, "").split("\n")[0].trim();
        if (clean && clean.length > 2) setSuggestion(clean);
      } catch { /* ignore abort/network errors */ }
    }, 600);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [input]);

  const accept = useCallback(() => {
    if (suggestion) {
      onAccept(input + suggestion);
      setSuggestion(null);
    }
  }, [input, suggestion, onAccept]);

  const dismiss = useCallback(() => setSuggestion(null), []);

  return { suggestion, accept, dismiss };
}
