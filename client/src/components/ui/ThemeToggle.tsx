import * as React from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

/* ==========================================================================
   ThemeToggle - Phase 4 Dark Mode Toggle Component
   Animated sun/moon toggle with smooth transitions
   ========================================================================== */

interface ThemeToggleProps {
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function ThemeToggle({ 
  size = "md", 
  showLabel = false,
  className 
}: ThemeToggleProps) {
  const { theme, toggleTheme, switchable } = useTheme();

  if (!switchable || !toggleTheme) {
    return null;
  }

  const isDark = theme === "dark";

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-9 w-9",
    lg: "h-10 w-10",
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "relative inline-flex items-center justify-center rounded-lg",
        "bg-transparent hover:bg-accent",
        "border border-transparent hover:border-border",
        "text-muted-foreground hover:text-foreground",
        "transition-all duration-200 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        sizeClasses[size],
        className
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {/* Sun icon */}
      <svg
        className={cn(
          iconSizes[size],
          "absolute transition-all duration-300",
          isDark 
            ? "rotate-90 scale-0 opacity-0" 
            : "rotate-0 scale-100 opacity-100"
        )}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
        />
      </svg>

      {/* Moon icon */}
      <svg
        className={cn(
          iconSizes[size],
          "absolute transition-all duration-300",
          isDark 
            ? "rotate-0 scale-100 opacity-100" 
            : "-rotate-90 scale-0 opacity-0"
        )}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
        />
      </svg>

      {showLabel && (
        <span className="sr-only">
          {isDark ? "Dark mode enabled" : "Light mode enabled"}
        </span>
      )}
    </button>
  );
}

/* ==========================================================================
   ThemeToggleSwitch - Alternative switch-style toggle
   ========================================================================== */

interface ThemeToggleSwitchProps {
  className?: string;
  showIcons?: boolean;
}

export function ThemeToggleSwitch({ 
  className,
  showIcons = true 
}: ThemeToggleSwitchProps) {
  const { theme, toggleTheme, switchable } = useTheme();

  if (!switchable || !toggleTheme) {
    return null;
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      onClick={toggleTheme}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full",
        "border-2 border-transparent",
        "transition-colors duration-200 ease-in-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isDark ? "bg-primary" : "bg-muted",
        className
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span
        className={cn(
          "pointer-events-none relative inline-flex h-5 w-5 transform rounded-full",
          "bg-card shadow-lg ring-0",
          "transition-transform duration-200 ease-in-out",
          isDark ? "translate-x-5" : "translate-x-0"
        )}
      >
        {showIcons && (
          <>
            {/* Sun icon (visible in light mode) */}
            <svg
              className={cn(
                "absolute inset-0 m-auto h-3 w-3 text-warning transition-opacity duration-200",
                isDark ? "opacity-0" : "opacity-100"
              )}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                clipRule="evenodd"
              />
            </svg>

            {/* Moon icon (visible in dark mode) */}
            <svg
              className={cn(
                "absolute inset-0 m-auto h-3 w-3 text-primary transition-opacity duration-200",
                isDark ? "opacity-100" : "opacity-0"
              )}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          </>
        )}
      </span>
    </button>
  );
}

export default ThemeToggle;
