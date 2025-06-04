import React, { useImperativeHandle, useRef, forwardRef, useEffect } from "react";
import { wrapRangeWithMarkers } from "@/core/wrapRangeWithMarkers";
import { expandRangeToWordBoundaries } from "@/core/selectionUtils";

type HiLiteContentProps = {
  children: React.ReactNode;
  autoWordBoundaries?: boolean;
  autoTag?: boolean;
  overlapTag?: boolean;
};

export const HiLiteContent = forwardRef(({ 
  children, 
  autoWordBoundaries, 
  autoTag,
  overlapTag 
}: HiLiteContentProps, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Core highlighting logic for both manual and auto tag
  const performHighlight = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      let range = sel.getRangeAt(0);
      if (!range.collapsed && containerRef.current?.contains(range.commonAncestorContainer)) {
        if (autoWordBoundaries) {
          range = expandRangeToWordBoundaries(range);
        }
        wrapRangeWithMarkers(range, containerRef.current, !!overlapTag);
      }
    }
  };

  // Expose highlightSelection via ref
  useImperativeHandle(ref, () => ({
    highlightSelection: () => {
      performHighlight();
    }
  }));

  // Auto-tagging: listen for mouseup events to trigger highlight automatically
  useEffect(() => {
    if (!autoTag) return;
    const container = containerRef.current;
    if (!container) return;

    const handleAutoTag = () => {
      performHighlight();
    };

    container.addEventListener("mouseup", handleAutoTag);
    return () => {
      container.removeEventListener("mouseup", handleAutoTag);
    };
  }, [autoTag, autoWordBoundaries]);

  return <div ref={containerRef}>{children}</div>;
});