import React, { useImperativeHandle, useRef, forwardRef, useEffect } from "react";
import { wrapRangeWithMarkers } from "../core/wrapRangeWithMarkers";
import { expandRangeToWordBoundaries } from "../core/selectionUtils";
import type { TagDefinition } from "../core/tags";
import type { HiLiteData } from "../core/hiLiteData";

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
  tags,
  onMarkerSelect, // Add this new prop
}: HiLiteContentProps & {
  onMarkerSelect?: (markerId: string | null) => void; // Add this type
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Add click handler
  const handleMarkerClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains("marker")) {
      // Find all markers at the clicked position
      const container = target.closest('div');
      if (!container) return;

      // Get click position
      const x = e.clientX;
      const y = e.clientY;

      // Find all markers that contain the clicked point
      const markers = Array.from(container.querySelectorAll('.marker'))
        .filter(marker => {
          const markerRect = marker.getBoundingClientRect();
          return x >= markerRect.left && x <= markerRect.right &&
                 y >= markerRect.top && y <= markerRect.bottom;
        }) as HTMLElement[];

      // Sort markers by length and select the shortest one
      const shortestMarker = markers.sort((a, b) => 
        (a.textContent?.length || 0) - (b.textContent?.length || 0)
      )[0];

      const markerId = shortestMarker?.getAttribute("data-marker-id") || target.getAttribute("data-marker-id");
      onMarkerSelect?.(markerId);
    } else {
      onMarkerSelect?.(null);
    }
  };

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
      
      const markers: HiLiteData[] = [];
      let absIdx = 0;
      const markerStack: { markerId: string, tagId: string, text: string, beginIndex: number }[] = [];

      // Helper function to process a text node
      function processNode(node: Node) {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent || '';
          // Update text for all active markers
          markerStack.forEach(marker => {
            marker.text += text;
          });
          absIdx += text.length;
        } else if (node instanceof HTMLElement) {
          if (node.classList.contains('marker')) {
            const markerId = node.getAttribute('data-marker-id')!;
            const tagId = node.getAttribute('data-tag-id')!;
            
            if (node.classList.contains('marker-start')) {
              // Start a new marker
              markerStack.push({
                markerId,
                tagId,
                text: '',
                beginIndex: absIdx
              });
            }

            // Process children
            for (let child of Array.from(node.childNodes)) {
              processNode(child);
            }

            if (node.classList.contains('marker-end')) {
              // Find and complete the marker
              const markerIndex = markerStack.findIndex(m => m.markerId === markerId);
              if (markerIndex !== -1) {
                const marker = markerStack[markerIndex];
                markers.push({
                  markerId: marker.markerId,
                  tagId: marker.tagId,
                  text: marker.text,
                  beginIndex: marker.beginIndex,
                  endIndex: absIdx
                });
                markerStack.splice(markerIndex, 1);
              }
            }
          } else {
            // Process children for non-marker elements
            for (let child of Array.from(node.childNodes)) {
              processNode(child);
            }
          }
        }
      }

      // Start processing from the container
      processNode(containerRef.current);
      return markers;
    },

    restoreTags: (tagsArr: HiLiteData[]) => {
      if (!containerRef.current) return;
      
      // Remove all existing markers
      containerRef.current.querySelectorAll('span.marker').forEach(span => {
        const textNode = document.createTextNode(span.textContent || "");
        span.replaceWith(textNode);
      });

      // Sort tags by length (shorter tags first) and then by position
      // This ensures inner tags are created before outer tags
      const sortedTags = [...tagsArr].sort((a, b) => {
        const lengthA = a.endIndex - a.beginIndex;
        const lengthB = b.endIndex - b.beginIndex;
        return lengthA - lengthB || a.beginIndex - b.beginIndex;
      });
      
      // Get all text nodes
      let textNodes = getTextNodes(containerRef.current);
      
      // For each tag, find the nodes covering [beginIndex, endIndex) and wrap
      sortedTags.forEach(tagObj => {
        const { tagId, beginIndex, endIndex, markerId } = tagObj;
        let tag: TagDefinition | undefined;
        if (tags && typeof tags.getById === 'function') {
          tag = tags.getById(tagId);
        } else if (defaultTag && tagId === defaultTag.id) {
          tag = defaultTag;
        }
        if (!tag) return;

        // Find start and end node/offset
        let currIdx = 0;
        let startNode: Text | null = null;
        let endNode: Text | null = null;
        let startOffset = 0;
        let endOffset = 0;
        
        // Refresh text nodes as they may have changed after wrapping
        if (!containerRef.current) return;
        textNodes = getTextNodes(containerRef.current);
        
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
          let range = document.createRange();
          range.setStart(startNode, startOffset);
          range.setEnd(endNode, endOffset);

          // For overlapping tags, we need to check if we're wrapping an existing marker
          const existingMarker = range.commonAncestorContainer.parentElement?.closest('.marker');
          if (existingMarker) {
            // If we're wrapping an existing marker, we need to expand our range to include the entire marker
            range = document.createRange();
            range.selectNode(existingMarker);
          }

          wrapRangeWithMarkers(range, containerRef.current as HTMLElement, true, tag, markerId);
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

  return (
    <div 
      ref={containerRef} 
      onClick={onMarkerSelect ? handleMarkerClick : undefined}
      style={{ cursor: onMarkerSelect ? 'pointer' : undefined }}
    >
      {children}
    </div>
  );
});