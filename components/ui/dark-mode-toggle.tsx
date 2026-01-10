"use client"

import { Moon, Sun } from "lucide-react"
import { Button } from "./button"
import { useDarkMode } from "@/hooks/use-dark-mode"

/**
 * Dark Mode Toggle Component
 * 
 * A button to toggle between light and dark mode.
 * Persists preference in localStorage.
 */
export function DarkModeToggle() {
  const { isDark, toggle, mounted } = useDarkMode()

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Sun className="w-5 h-5" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      className="dark:text-white"
    >
      {isDark ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </Button>
  )
}
