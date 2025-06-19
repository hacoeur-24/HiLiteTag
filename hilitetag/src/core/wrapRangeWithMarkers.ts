import { nanoid } from "nanoid";
import type { TagDefinition } from "../components/tags";

export type MarkerResult = {
  markerId: string;
  text: string;
};

export function wrapRangeWithMarkers(
  range: Range,
  root: HTMLElement,
  allowOverlap: boolean,
  tag: TagDefinition,
  providedMarkerId?: string
): MarkerResult | undefined {
  // Use provided marker ID or generate a new one
  const markerId = providedMarkerId || nanoid(10);
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
    return undefined;
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
    } else {
      // For multi-node selection, trim whitespace in the first and last node segments
      if (nodesToWrap.length > 0) {
        // Trim leading whitespace in the first node
        let first = nodesToWrap[0];
        let firstText = first.node.textContent?.slice(first.startOffset, first.endOffset) || "";
        let firstTrim = firstText.match(/^\s*/)?.[0].length || 0;
        if (firstTrim > 0) {
          first.startOffset += firstTrim;
        }
        // Trim trailing whitespace in the last node
        let last = nodesToWrap[nodesToWrap.length - 1];
        let lastText = last.node.textContent?.slice(last.startOffset, last.endOffset) || "";
        let lastTrim = lastText.match(/\s*$/)?.[0].length || 0;
        if (lastTrim > 0) {
          last.endOffset -= lastTrim;
        }
      }
    }
  }

  // Phase 2: Wrap each collected node segment
  // Find the first and last non-empty segment after trimming
  let firstNonEmptyIdx = -1;
  let lastNonEmptyIdx = -1;
  for (let i = 0; i < nodesToWrap.length; i++) {
    const { node, startOffset, endOffset } = nodesToWrap[i];
    const text = node.textContent || "";
    const middle = text.slice(startOffset, endOffset);
    if (middle.length > 0) {
      if (firstNonEmptyIdx === -1) firstNonEmptyIdx = i;
      lastNonEmptyIdx = i;
    }
  }

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

    // Only apply marker-start to the first non-empty segment
    if (idx === firstNonEmptyIdx) {
      span.classList.add("marker-start");
    }
    // Only apply marker-end to the last non-empty segment
    if (idx === lastNonEmptyIdx) {
      span.classList.add("marker-end");
    }
    span.textContent = middle;
    if (before) parent.insertBefore(document.createTextNode(before), node);
    parent.insertBefore(span, node);
    if (after) parent.insertBefore(document.createTextNode(after), node);
    parent.removeChild(node);
  }

  return {
    markerId,
    text: trimmed
  };
}