import React, { useImperativeHandle, useRef, forwardRef, useEffect } from "react";
import { wrapRangeWithMarkers } from "../core/wrapRangeWithMarkers";
import { expandRangeToWordBoundaries } from "../core/selectionUtils";
import type { TagDefinition } from "../core/tags";

type HiLiteContentProps = {
  children: React.ReactNode;
  defaultTag?: TagDefinition;
  autoWordBoundaries?: boolean;
  autoTag?: boolean;
  overlapTag?: boolean;
  selectedMarkerId?: string | null;
  tags?: any;
};

export const HiLiteContent = forwardRef(({ 
  children, 
  defaultTag,
  autoWordBoundaries, 
  autoTag,
  overlapTag,
  selectedMarkerId,
  tags
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

  // Expose highlightTag and removeTag via ref
  useImperativeHandle(ref, () => ({
    highlightTag: (tag?: TagDefinition) => {
      performHighlight(tag || defaultTag);
    },
    removeTag: (markerId: string) => {
      if (!containerRef.current) return;
      const spans = containerRef.current.querySelectorAll(`span.marker[data-marker-id="${markerId}"]`);
      spans.forEach(span => {
        const textNode = document.createTextNode(span.textContent || "");
        span.replaceWith(textNode);
      });
    },
    getAllTags: () => {
      if (!containerRef.current) return [];
      const spans = containerRef.current.querySelectorAll('span.marker');
      return Array.from(spans).map(span => ({
        markerId: span.getAttribute('data-marker-id'),
        tagId: span.getAttribute('data-tag-id'),
        text: span.textContent,
        isStart: span.classList.contains('marker-start'),
        isEnd: span.classList.contains('marker-end'),
        // Optionally, you can add more context here
      }));
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

  // Update marker colors based on selection
  useEffect(() => {
    // Utility to convert color
    function colorToCss(color: string | { r: number; g: number; b: number; a?: number }) {
      if (typeof color === "string") return color;
      const { r, g, b, a } = color;
      return a !== undefined ? `rgba(${r},${g},${b},${a})` : `rgb(${r},${g},${b})`;
    }

    if (!containerRef.current) return;
    const spans = containerRef.current.querySelectorAll('.marker');
    spans.forEach(span => {
      const markerId = span.getAttribute('data-marker-id');
      const tagId = span.getAttribute('data-tag-id');
      let tag: TagDefinition | undefined;
      // Try to get tag from tags prop if available
      if (tags && typeof tags.getById === 'function') {
        tag = tags.getById(tagId);
      } else if (defaultTag && tagId === defaultTag.id) {
        tag = defaultTag;
      }
      if (markerId && tag && tag.selectedColor && markerId === selectedMarkerId) {
        (span as HTMLElement).style.background = colorToCss(tag.selectedColor);
      } else if (tag && tag.color) {
        (span as HTMLElement).style.background = colorToCss(tag.color);
      }
    });
  }, [selectedMarkerId, defaultTag, tags]);

  return <div ref={containerRef}>{children}</div>;
});