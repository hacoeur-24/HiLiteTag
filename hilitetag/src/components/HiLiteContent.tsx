import React, { useImperativeHandle, useRef, forwardRef, useEffect } from "react";
import { wrapRangeWithMarkers } from "../core/wrapRangeWithMarkers";
import { expandRangeToWordBoundaries } from "../core/selectionUtils";
import type { TagDefinition, HighlightedTag } from "../core/tags";

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

  // Helper: Get all text nodes in order
  function getTextNodes(root: Node): Text[] {
    const nodes: Text[] = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      nodes.push(node as Text);
    }
    return nodes;
  }

  // Core highlighting logic for both manual and auto tag
  const performHilite = (tag?: TagDefinition) => {
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

  // Expose hiliteTag, removeTag, getAllTags, restoreTags via ref
  useImperativeHandle(ref, () => ({
    hiliteTag: (tag?: TagDefinition) => {
      performHilite(tag || defaultTag);
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
      // Group by markerId
      const markers: Record<string, { tagId: string, text: string, beginIndex: number, endIndex: number }> = {};
      // Walk text nodes to compute absolute indexes
      const textNodes = getTextNodes(containerRef.current);
      let absIdx = 0;
      textNodes.forEach(node => {
        let parent = node.parentElement;
        if (parent && parent.classList.contains('marker')) {
          const markerId = parent.getAttribute('data-marker-id')!;
          const tagId = parent.getAttribute('data-tag-id')!;
          const text = node.textContent || "";
          if (!markers[markerId]) {
            markers[markerId] = {
              tagId,
              text: '',
              beginIndex: absIdx,
              endIndex: absIdx
            };
          }
          markers[markerId].text += text;
          markers[markerId].endIndex = absIdx + text.length;
        }
        absIdx += node.textContent?.length || 0;
      });
      // Return as array
      return Object.entries(markers).map(([markerId, v]) => ({
        markerId,
        tagId: v.tagId,
        text: v.text,
        beginIndex: v.beginIndex,
        endIndex: v.endIndex
      }));
    },
    restoreTags: (tagsArr: HighlightedTag[]) => {
      if (!containerRef.current) return;
      // Remove all existing markers
      containerRef.current.querySelectorAll('span.marker').forEach(span => {
        const textNode = document.createTextNode(span.textContent || "");
        span.replaceWith(textNode);
      });
      // Get all text nodes
      const textNodes = getTextNodes(containerRef.current);
      // For each tag, find the nodes covering [beginIndex, endIndex) and wrap
      tagsArr.forEach(tagObj => {
        const { tagId, beginIndex, endIndex } = tagObj;
        let tag: TagDefinition | undefined;
        if (tags && typeof tags.getById === 'function') {
          tag = tags.getById(tagId);
        } else if (defaultTag && tagId === defaultTag.id) {
          tag = defaultTag;
        }
        if (!tag) return;
        // Find start and end node/offset
        let currIdx = 0;
        let startNode: Text | null = null, endNode: Text | null = null;
        let startOffset = 0, endOffset = 0;
        for (let node of textNodes) {
          const len = node.textContent?.length || 0;
          if (!startNode && beginIndex >= currIdx && beginIndex < currIdx + len) {
            startNode = node;
            startOffset = beginIndex - currIdx;
          }
          if (!endNode && endIndex > currIdx && endIndex <= currIdx + len) {
            endNode = node;
            endOffset = endIndex - currIdx;
          }
          currIdx += len;
        }
        if (startNode && endNode && containerRef.current) {
          const range = document.createRange();
          range.setStart(startNode, startOffset);
          range.setEnd(endNode, endOffset);
          wrapRangeWithMarkers(range, containerRef.current as HTMLElement, true, tag);
        }
      });
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
      performHilite(defaultTag);
    };

    container.addEventListener("mouseup", handleAutoTag);
    return () => {
      container.removeEventListener("mouseup", handleAutoTag);
    };
  }, [autoTag, autoWordBoundaries, defaultTag]);

  // Update marker colors based on selection
  useEffect(() => {
    function colorToCss(color: string) {
      return color;
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