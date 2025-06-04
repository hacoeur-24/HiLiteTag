import { nanoid } from "nanoid";
import type { TagDefinition } from "@/core/tags";

export function wrapRangeWithMarkers(
  range: Range,
  root: HTMLElement,
  allowOverlap: boolean,
  tag: TagDefinition
) {
  // Generate a unique marker ID for this highlight
  const markerId = nanoid(10);
  const tagId = tag.id;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

  // Phase 1: Collect all text nodes within the range and their offsets
  const nodesToWrap: { node: Text; startOffset: number; endOffset: number }[] = [];

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    if (!node.parentNode || !range.intersectsNode(node)) continue;

  // Only skip existing markers if overlap is NOT allowed
  if (!allowOverlap && (node.parentNode as Element).closest(".marker")) {
    continue;
  }

    const text = node.textContent || "";
    let startOffset = 0;
    let endOffset = text.length;

    if (node === range.startContainer) {
      startOffset = range.startOffset;
    }
    if (node === range.endContainer) {
      endOffset = range.endOffset;
    }

    if (startOffset < endOffset) {
      nodesToWrap.push({ node, startOffset, endOffset });
    }
  }

  // Get the selected text and trim whitespace
  const selectedText = range.toString();
  const trimmed = selectedText.trim();
  if (!trimmed) {
    // Only whitespace selected, do nothing
    return;
  }

  // Adjust range to exclude leading/trailing whitespace
  let leading = 0;
  let trailing = 0;
  for (let i = 0; i < selectedText.length; i++) {
    if (selectedText[i] === ' ' || selectedText[i] === '\n' || selectedText[i] === '\t') leading++;
    else break;
  }
  for (let i = selectedText.length - 1; i >= 0; i--) {
    if (selectedText[i] === ' ' || selectedText[i] === '\n' || selectedText[i] === '\t') trailing++;
    else break;
  }
  if (leading > 0 || trailing > 0) {
    // Move range start forward by leading, end backward by trailing
    let start = range.startOffset + leading;
    let end = range.endOffset - trailing;
    // Only adjust if in the same text node
    if (range.startContainer === range.endContainer && range.startContainer.nodeType === Node.TEXT_NODE) {
      range.setStart(range.startContainer, start);
      range.setEnd(range.endContainer, end);
    }
    // For multi-node selection, more complex logic would be needed
    // (for now, this covers the common case)
  }

  // Phase 2: Wrap each collected node segment
  for (let idx = 0; idx < nodesToWrap.length; idx++) {
    const { node, startOffset, endOffset } = nodesToWrap[idx];
    const text = node.textContent || "";
    const parent = node.parentNode!;

    const before = text.slice(0, startOffset);
    const middle = text.slice(startOffset, endOffset);
    const after = text.slice(endOffset);

    // Only wrap non-empty segments (avoid wrapping empty strings)
    if (middle.length === 0) continue;

    const span = document.createElement("span");
    span.setAttribute("data-marker-id", markerId);
    span.setAttribute("data-tag-id", tagId);
    span.className = "marker";
    // Apply tag color and custom style
    span.style.background = tag.color;
    if (tag.style) {
      Object.assign(span.style, tag.style);
    }

    // If this is the first segment, give it a "marker-start" class
    if (idx === 0) {
      span.classList.add("marker-start");
    }
    // If this is the last segment, give it a "marker-end" class
    if (idx === nodesToWrap.length - 1) {
      span.classList.add("marker-end");
    }
    span.textContent = middle;
    if (before) parent.insertBefore(document.createTextNode(before), node);
    parent.insertBefore(span, node);
    if (after) parent.insertBefore(document.createTextNode(after), node);
    parent.removeChild(node);
  }
}