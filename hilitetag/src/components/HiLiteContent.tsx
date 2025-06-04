import React, { useImperativeHandle, useRef, forwardRef, useEffect } from "react";
import { wrapRangeWithMarkers } from "@/core/wrapRangeWithMarkers";
import { expandRangeToWordBoundaries } from "@/core/selectionUtils";
import type { HiLiteTags, TagDefinition } from "@/core/tags";

type HiLiteContentProps = {
  children: React.ReactNode;
  tags: HiLiteTags;
  defaultTag?: TagDefinition;
  autoWordBoundaries?: boolean;
  autoTag?: boolean;
  overlapTag?: boolean;
};

export const HiLiteContent = forwardRef(({ 
  children, 
  tags,
  defaultTag,
  autoWordBoundaries, 
  autoTag,
  overlapTag 
}: HiLiteContentProps, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Core highlighting logic for both manual and auto tag
  const performHighlight = (tag?: TagDefinition) => {
    if (!tag) return;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      let range = sel.getRangeAt(0);
      if (!range.collapsed && containerRef.current?.contains(range.commonAncestorContainer)) {
        if (autoWordBoundaries) {
          range = expandRangeToWordBoundaries(range);
        }
        wrapRangeWithMarkers(range, containerRef.current, !!overlapTag, tag);
      }
    }
  };

  // Expose highlightSelection via ref
  useImperativeHandle(ref, () => ({
    highlightSelection: (tag?: TagDefinition) => {
      performHighlight(tag || defaultTag);
    }
  }));

  // Auto-tagging: listen for mouseup events to trigger highlight automatically
  useEffect(() => {
    if (!autoTag) return;
    if (!defaultTag) {
      console.warn("autoTag is enabled but no defaultTag provided");
      return;
    }
    const container = containerRef.current;
    if (!container) return;

    const handleAutoTag = () => {
      performHighlight(defaultTag);
    };

    container.addEventListener("mouseup", handleAutoTag);
    return () => {
      container.removeEventListener("mouseup", handleAutoTag);
    };
  }, [autoTag, autoWordBoundaries, defaultTag]);

  return <div ref={containerRef}>{children}</div>;
});