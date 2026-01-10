"use client"

import { useState, useEffect } from "react"

/**
 * Dark Mode Hook
 * 
 * Manages dark mode state and persistence in localStorage.
 * Automatically syncs with system preference on first load.
 * 
 * @example
 * const { isDark, toggle, setDark } = useDarkMode()
 */
export function useDarkMode() {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Check localStorage first, then system preference
    const stored = localStorage.getItem("darkMode")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    
    const shouldBeDark = stored !== null ? stored === "true" : prefersDark
    setIsDark(shouldBeDark)
    
    // Apply dark mode class
    if (shouldBeDark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [])

  const toggle = () => {
    const newValue = !isDark
    setIsDark(newValue)
    localStorage.setItem("darkMode", String(newValue))
    
    if (newValue) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  const setDark = (value: boolean) => {
    setIsDark(value)
    localStorage.setItem("darkMode", String(value))
    
    if (value) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  return { isDark, toggle, setDark, mounted }
}
