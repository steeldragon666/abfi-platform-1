import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { usePortal } from "@/contexts/PortalContext";
import { PORTAL_CONFIGS, type Portal } from "@/config/navigation";

interface PortalSwitcherProps {
  className?: string;
  variant?: "default" | "compact" | "sidebar";
}

export function PortalSwitcher({ className, variant = "default" }: PortalSwitcherProps) {
  const {
    currentPortal,
    availablePortals,
    navigateToPortal,
    portalConfig,
  } = usePortal();

  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const CurrentIcon = portalConfig.icon;

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setFocusedIndex(0);
        } else {
          setFocusedIndex((prev) =>
            prev < availablePortals.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case "ArrowUp":
        event.preventDefault();
        if (isOpen) {
          setFocusedIndex((prev) =>
            prev > 0 ? prev - 1 : availablePortals.length - 1
          );
        }
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (isOpen && focusedIndex >= 0) {
          const selectedPortal = availablePortals[focusedIndex];
          navigateToPortal(selectedPortal);
          setIsOpen(false);
          buttonRef.current?.focus();
        } else {
          setIsOpen(!isOpen);
          if (!isOpen) setFocusedIndex(0);
        }
        break;
      case "Escape":
        setIsOpen(false);
        buttonRef.current?.focus();
        break;
      case "Tab":
        setIsOpen(false);
        break;
    }
  };

  // Focus management
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[role="option"]');
      (items[focusedIndex] as HTMLElement)?.focus();
    }
  }, [focusedIndex, isOpen]);

  const handlePortalSelect = (portal: Portal) => {
    navigateToPortal(portal);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Button
        ref={buttonRef}
        variant="ghost"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Current portal: ${portalConfig.label}. Click to switch portals.`}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={cn(
          "min-h-[44px] gap-2",
          variant === "compact" && "px-2",
          variant === "default" && "px-3",
          variant === "sidebar" && "w-full px-2 justify-start bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800"
        )}
      >
        <div
          className={cn(
            "flex items-center justify-center rounded-md shrink-0",
            variant === "compact" ? "h-8 w-8" : "h-8 w-8",
            portalConfig.bgColor
          )}
        >
          <CurrentIcon
            className={cn("h-4 w-4", portalConfig.color)}
            aria-hidden="true"
          />
        </div>
        {(variant === "default" || variant === "sidebar") && (
          <>
            <div className="flex flex-col items-start text-left flex-1 min-w-0">
              <span className="text-sm font-medium truncate">{portalConfig.label}</span>
              {variant === "default" && (
                <span className="text-xs text-muted-foreground hidden sm:block truncate">
                  {portalConfig.description}
                </span>
              )}
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                isOpen && "rotate-180"
              )}
              aria-hidden="true"
            />
          </>
        )}
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={cn(
            "absolute z-50 mt-2 w-72 rounded-lg border shadow-lg",
            "bg-white dark:bg-gray-900",
            "animate-in fade-in-0 zoom-in-95",
            variant === "sidebar" ? "left-0" : "left-1/2 -translate-x-1/2"
          )}
        >
          <div className="p-2">
            <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Switch Portal
            </p>
            <ul
              ref={listRef}
              role="listbox"
              aria-label="Available portals"
              className="space-y-1"
              onKeyDown={handleKeyDown}
            >
              {availablePortals.map((portalId, index) => {
                const config = PORTAL_CONFIGS[portalId];
                const Icon = config.icon;
                const isSelected = portalId === currentPortal;
                const isFocused = index === focusedIndex;

                return (
                  <li
                    key={portalId}
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={isFocused ? 0 : -1}
                    onClick={() => handlePortalSelect(portalId)}
                    onKeyDown={handleKeyDown}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-2 py-2 cursor-pointer",
                      "min-h-[44px]", // WCAG touch target
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isSelected
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-accent hover:text-accent-foreground",
                      isFocused && !isSelected && "bg-accent"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-md shrink-0",
                        config.bgColor
                      )}
                    >
                      <Icon className={cn("h-5 w-5", config.color)} aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{config.label}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {config.description}
                      </p>
                    </div>
                    {isSelected && (
                      <Check
                        className="h-4 w-4 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
