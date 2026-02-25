"use client";

import { useCallback } from "react";
import { T } from "./workspace.constants";

interface DragHandleProps {
  direction: "horizontal" | "vertical";
  onMouseDown: (e: React.MouseEvent) => void;
  /** Optional touch-start handler for tablet/mobile drag support */
  onTouchStart?: (e: React.TouchEvent) => void;
  isDragging: boolean;
}

export function DragHandle({ direction, onMouseDown, onTouchStart, isDragging }: DragHandleProps) {
  const isH = direction === "horizontal";

  // If no explicit onTouchStart is provided, synthesize one from onMouseDown
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (onTouchStart) {
        onTouchStart(e);
        return;
      }
      // Prevent scroll while dragging
      e.preventDefault();
      const touch = e.touches[0];
      // Create a synthetic mouse-like event to pass to onMouseDown
      const syntheticEvent = {
        preventDefault: () => {},
        clientX: touch.clientX,
        clientY: touch.clientY,
      } as React.MouseEvent;
      onMouseDown(syntheticEvent);

      // Set up touch move/end listeners that dispatch mouse-like events
      const onTouchMove = (ev: TouchEvent) => {
        ev.preventDefault();
        const t = ev.touches[0];
        const mouseMove = new MouseEvent("mousemove", {
          clientX: t.clientX,
          clientY: t.clientY,
          bubbles: true,
        });
        document.dispatchEvent(mouseMove);
      };

      const onTouchEnd = () => {
        const mouseUp = new MouseEvent("mouseup", { bubbles: true });
        document.dispatchEvent(mouseUp);
        document.removeEventListener("touchmove", onTouchMove);
        document.removeEventListener("touchend", onTouchEnd);
        document.removeEventListener("touchcancel", onTouchEnd);
      };

      document.addEventListener("touchmove", onTouchMove, { passive: false });
      document.addEventListener("touchend", onTouchEnd);
      document.addEventListener("touchcancel", onTouchEnd);
    },
    [onMouseDown, onTouchStart],
  );

  return (
    <div
      onMouseDown={onMouseDown}
      onTouchStart={handleTouchStart}
      role="separator"
      aria-orientation={isH ? "vertical" : "horizontal"}
      tabIndex={0}
      style={{
        ...(isH
          ? { width: 8, flexShrink: 0, cursor: "col-resize", zIndex: 10 }
          : { height: 8, cursor: "row-resize" }),
        background: isDragging ? T.borderHi : "transparent",
        touchAction: "none", // Prevent browser scroll/zoom during drag
      }}
      onMouseEnter={e => (e.currentTarget.style.background = T.border)}
      onMouseLeave={e => {
        if (!isDragging) e.currentTarget.style.background = "transparent";
      }}
    />
  );
}
