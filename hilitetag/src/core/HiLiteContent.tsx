import React, { useImperativeHandle, useRef, forwardRef, useEffect } from "react";
import { wrapRangeWithMarkers } from "./wrapRangeWithMarkers";
import { expandRangeToWordBoundaries } from "./selectionUtils";
import type { TagDefinition } from "../components/tags";
import type { HiLiteData, HiLiteRef } from "../components/types";

type HiLiteContentProps = {
  children: React.ReactNode;
  defaultTag?: TagDefinition;
  autoWordBoundaries?: boolean;
  autoTag?: boolean;
  overlapTag?: boolean;
  selectedMarkerId?: string | null;
  tags?: any;
};

export const HiLiteContent = forwardRef<HiLiteRef, HiLiteContentProps & {
  onMarkerSelect?: (markerId: string | null) => void;
}>(({ 
  children, 
  defaultTag,
  autoWordBoundaries, 
  autoTag,
  overlapTag,
  selectedMarkerId,
  tags,
  onMarkerSelect,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle marker hover
  const handleMarkerMouseEnter = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains("marker")) {
      const markerId = target.getAttribute('data-marker-id');
      const tagId = target.getAttribute('data-tag-id');
      if (tagId && tags && markerId) {
        const tag = tags.getById(tagId);
        // Don't apply hover color if the marker is selected
        if (tag.hoverColor && markerId !== selectedMarkerId) {
          const container = containerRef.current;
          if (container) {
            const relatedMarkers = container.querySelectorAll(`.marker[data-marker-id="${markerId}"]`);
            relatedMarkers.forEach((marker: Element) => {
              (marker as HTMLElement).style.backgroundColor = tag.hoverColor!;
            });
          }
        }
      }
    }
  };

  const handleMarkerMouseLeave = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains("marker")) {
      const markerId = target.getAttribute('data-marker-id');
      const tagId = target.getAttribute('data-tag-id');
      if (tagId && tags && markerId) {
        const tag = tags.getById(tagId);
        // Only restore original color if the marker is not selected
        if (markerId !== selectedMarkerId) {
          const container = containerRef.current;
          if (container) {
            const relatedMarkers = container.querySelectorAll(`.marker[data-marker-id="${markerId}"]`);
            relatedMarkers.forEach((marker: Element) => {
              (marker as HTMLElement).style.backgroundColor = tag.color;
            });
          }
        }
      }
    }
  };

  // Handle document click to clear selection when clicking outside
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // If click is outside any marker, clear selection
      if (!target.closest('.marker') && onMarkerSelect) {
        onMarkerSelect(null);
      }
    };

    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [onMarkerSelect]);

  // Set up event listeners for hover
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Use event delegation for better performance
    container.addEventListener('mouseenter', handleMarkerMouseEnter, true);
    container.addEventListener('mouseleave', handleMarkerMouseLeave, true);

    return () => {
      container.removeEventListener('mouseenter', handleMarkerMouseEnter, true);
      container.removeEventListener('mouseleave', handleMarkerMouseLeave, true);
    };
  }, [tags, selectedMarkerId]);

  // Add click handler
  const handleMarkerClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent document click handler from firing
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

      if (markers.length > 0) {
        // Get information about each marker
        const markerInfo = markers.map(marker => {
          const rect = marker.getBoundingClientRect();
          const area = rect.width * rect.height;
          return {
            element: marker,
            area,
            rect,
            // Check if click is in a uniquely covered area (not overlapped)
            isUniquelyClicked: markers.every(other => {
              if (other === marker) return true;
              const otherRect = other.getBoundingClientRect();
              // If click point is outside the other marker's bounds
              return !(x >= otherRect.left && x <= otherRect.right &&
                      y >= otherRect.top && y <= otherRect.bottom);
            })
          };
        });

        // First, try to select marker if clicked in its unique (non-overlapped) area
        const uniquelyClickedMarker = markerInfo.find(info => info.isUniquelyClicked);
        if (uniquelyClickedMarker) {
          const markerId = uniquelyClickedMarker.element.getAttribute("data-marker-id");
          onMarkerSelect?.(markerId);
          return;
        }

        // If click is in overlapped area, select the smallest marker
        const smallestMarker = markerInfo.reduce((smallest, current) => 
          current.area < smallest.area ? current : smallest
        );

        const markerId = smallestMarker.element.getAttribute("data-marker-id");
        onMarkerSelect?.(markerId);
        return;
      }
    }
    onMarkerSelect?.(null);
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
    if (!tag) {
      console.warn('No tag provided. Make sure to provide a tag or set a defaultTag when using autoTag.');
      return;
    }
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      console.warn('No text selected for highlighting');
      return;
    }
    let range = sel.getRangeAt(0);
    if (range.collapsed) {
      return;
    }
    if (!containerRef.current?.contains(range.commonAncestorContainer)) {
      console.warn('Selected text is outside the HiLiteContent component');
      return;
    }

    // Store the selection details before any DOM modifications
    const rangeDetails = {
      startContainer: range.startContainer,
      startOffset: range.startOffset,
      endContainer: range.endContainer,
      endOffset: range.endOffset,
      text: range.toString()
    };
    
    if (autoWordBoundaries) {
      range = expandRangeToWordBoundaries(range);
      // Update details if word boundaries were expanded
      rangeDetails.startOffset = range.startOffset;
      rangeDetails.endOffset = range.endOffset;
      rangeDetails.text = range.toString();
    }
    
    const result = wrapRangeWithMarkers(range, containerRef.current, !!overlapTag, tag);
    
    // Restore selection for potential subsequent tag applications
    if (!autoTag && containerRef.current) {  // Don't restore selection in autoTag mode
      // Find text nodes that contain our original content
      const walker = document.createTreeWalker(containerRef.current, NodeFilter.SHOW_TEXT);
      let startNode: Text | null = null;
      let endNode: Text | null = null;
      let node: Text | null;
      
      // Look for nodes containing our start and end points
      while ((node = walker.nextNode() as Text)) {
        if (!startNode && node.textContent?.includes(rangeDetails.text.substring(0, 20))) {
          startNode = node;
        }
        if (!endNode && node.textContent?.includes(rangeDetails.text.slice(-20))) {
          endNode = node;
        }
        if (startNode && endNode) break;
      }

      // If we found our nodes, create a new range
      if (startNode && endNode) {
        try {
          const newRange = document.createRange();
          newRange.setStart(startNode, 0);
          newRange.setEnd(endNode, endNode.length);
          sel.removeAllRanges();
          sel.addRange(newRange);
        } catch (error) {
          console.warn('Failed to restore selection, but tag was created successfully');
        }
      }
    }

    // Calculate HiLiteData for the newly created tag
    if (result && containerRef.current) {
      // Collect all text nodes before the start marker to calculate beginIndex
      const allTextNodes = getTextNodes(containerRef.current);
      let beginIndex = 0;
      let endIndex = 0;
      let foundStart = false;

      for (let node of allTextNodes) {
        // If we haven't found the start marker yet, add to beginIndex
        if (!foundStart) {
          // Check if this text node is before our marker
          const closestMarker = node.parentElement?.closest('.marker');
          if (!closestMarker || closestMarker.getAttribute('data-marker-id') !== result.markerId) {
            beginIndex += node.textContent?.length || 0;
          } else {
            foundStart = true;
          }
        }
        
        // Add to endIndex until we find our end marker
        const length = node.textContent?.length || 0;
        endIndex += length;
        
        // Check if this is our end marker
        const closestMarker = node.parentElement?.closest('.marker');
        if (closestMarker?.getAttribute('data-marker-id') === result.markerId && 
            closestMarker.classList.contains('marker-end')) {
          break;
        }
      }

      return {
        markerId: result.markerId,
        tagId: tag.id,
        text: result.text,
        beginIndex,
        endIndex
      } as HiLiteData;
    }
    return undefined;
  };

  // Expose hiliteTag, removeTag, getAllTags, restoreTags, and updateTag via ref
  useImperativeHandle(ref, () => ({
    hiliteTag: (tag?: TagDefinition) => {
      return performHilite(tag || defaultTag);
    },
    removeTag: (markerId: string): HiLiteData | undefined => {
      if (!containerRef.current) return undefined;
      
      const spans = containerRef.current.querySelectorAll(`span.marker[data-marker-id="${markerId}"]`);
      if (!spans.length) return undefined;

      // Get the tag data before removal
      const firstSpan = spans[0] as HTMLElement;
      const tagId = firstSpan.getAttribute('data-tag-id') || '';
      let text = '';
      let beginIndex = 0;
      let currIdx = 0;

      // Calculate beginIndex and collect text
      const walker = document.createTreeWalker(containerRef.current, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode as Text;
        if (node.parentElement?.closest(`[data-marker-id="${markerId}"]`)) {
          if (text === '') {
            beginIndex = currIdx;
          }
          text += node.textContent;
        }
        currIdx += (node.textContent?.length || 0);
      }

      // Create HiLiteData before removal
      const tagData: HiLiteData = {
        markerId,
        tagId,
        text,
        beginIndex,
        endIndex: beginIndex + text.length
      };

      // Remove the spans
      spans.forEach(span => {
        // Check if this span contains other markers
        const nestedMarkers = span.querySelectorAll('span.marker');
        if (nestedMarkers.length > 0) {
          // Create a temporary fragment to hold nested content
          const fragment = document.createDocumentFragment();
          
          // Move all child nodes (including nested markers) to the fragment
          while (span.firstChild) {
            fragment.appendChild(span.firstChild);
          }
          
          // Replace the span with its content
          span.replaceWith(fragment);
        } else {
          // If no nested markers, simply convert to text node
          const textNode = document.createTextNode(span.textContent || "");
          span.replaceWith(textNode);
        }
      });

      return tagData;
    },
    updateTag: (markerId: string, newTag: TagDefinition | undefined) => {
      if (!containerRef.current || !markerId) {
        console.warn('No container ref or marker ID provided');
        return;
      }

      if (!newTag) {
        console.warn('No tag provided to updateTag');
        return;
      }

      const spans = containerRef.current.querySelectorAll(`span.marker[data-marker-id="${markerId}"]`);
      if (spans.length === 0) {
        console.warn(`No markers found with id: ${markerId}`);
        return;
      }

      spans.forEach(span => {
        // Update data-tag-id attribute
        span.setAttribute('data-tag-id', newTag.id);
        
        // Apply new tag's color and style
        const el = span as HTMLElement;
        el.style.background = newTag.color;
        if (newTag.style) {
          Object.assign(el.style, newTag.style);
        }
      });

      // Calculate HiLiteData for the updated tag
      const allTextNodes = getTextNodes(containerRef.current);
      let beginIndex = 0;
      let endIndex = 0;
      let foundStart = false;
      let text = '';

      for (let node of allTextNodes) {
        // If we haven't found the start marker yet, add to beginIndex
        if (!foundStart) {
          // Check if this text node is before our marker
          const closestMarker = node.parentElement?.closest('.marker');
          if (!closestMarker || closestMarker.getAttribute('data-marker-id') !== markerId) {
            beginIndex += node.textContent?.length || 0;
          } else {
            foundStart = true;
            text = node.textContent || '';
          }
        } else {
          // We're between start and end markers, collect text
          text += node.textContent || '';
        }
        
        // Add to endIndex until we find our end marker
        endIndex += node.textContent?.length || 0;
        
        // Check if this is our end marker
        const closestMarker = node.parentElement?.closest('.marker');
        if (closestMarker?.getAttribute('data-marker-id') === markerId && 
            closestMarker.classList.contains('marker-end')) {
          break;
        }
      }

      return {
        markerId,
        tagId: newTag.id,
        text: text.trim(),
        beginIndex,
        endIndex
      } as HiLiteData;
    },
    getAllTags: () => {
      if (!containerRef.current) {
        console.warn('getAllTags called before HiLiteContent container is ready');
        return [];
      }
      const markerElements = containerRef.current.querySelectorAll('.marker');
      if (markerElements.length === 0) {
        console.warn('No markers found in the content');
        return [];
      }
      
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
      if (!containerRef.current) {
        console.warn('Failed to restore tags: HiLiteContent container not ready');
        return;
      }

      if (!Array.isArray(tagsArr)) {
        console.warn('restoreTags expects an array of HiLiteData, received:', typeof tagsArr);
        return;
      }

      if (tagsArr.length === 0) {
        console.warn('restoreTags called with an empty array');
        return;
      }

      // Validate tag data structure
      const invalidTags = tagsArr.filter(tag => {
        const isValid = tag.markerId && tag.tagId && 
                       typeof tag.beginIndex === 'number' && 
                       typeof tag.endIndex === 'number';
        if (!isValid) {
          console.warn('Invalid tag data structure:', tag);
        }
        return !isValid;
      });

      if (invalidTags.length > 0) {
        console.warn(`${invalidTags.length} invalid tags found and will be skipped`);
      }
      
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
      onClick={handleMarkerClick}
    >
      {children}
    </div>
  );
});