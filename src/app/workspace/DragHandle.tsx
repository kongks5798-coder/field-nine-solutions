"use client";

import { T } from "./workspace.constants";

interface DragHandleProps {
  direction: "horizontal" | "vertical";
  onMouseDown: (e: React.MouseEvent) => void;
  isDragging: boolean;
}

export function DragHandle({ direction, onMouseDown, isDragging }: DragHandleProps) {
  const isH = direction === "horizontal";
  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        ...(isH
          ? { width: 4, flexShrink: 0, cursor: "col-resize", zIndex: 10 }
          : { height: 4, cursor: "row-resize" }),
        background: isDragging ? T.borderHi : "transparent",
      }}
      onMouseEnter={e => (e.currentTarget.style.background = T.border)}
      onMouseLeave={e => {
        if (!isDragging) e.currentTarget.style.background = "transparent";
      }}
    />
  );
}
