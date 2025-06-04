import { nanoid } from "nanoid";
import type { TagDefinition } from "@/core/tags";

export function wrapRangeWithMarkers(
  range: Range,
  root: HTMLElement,
  allowOverlap: boolean,
  tag: TagDefinition
) {
  const tagId = tag.id || nanoid(8);
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

  // Phase 2: Wrap each collected node segment
  for (let idx = 0; idx < nodesToWrap.length; idx++) {
    const { node, startOffset, endOffset } = nodesToWrap[idx];
    const text = node.textContent || "";
    const parent = node.parentNode!;

    const before = text.slice(0, startOffset);
    const middle = text.slice(startOffset, endOffset);
    const after = text.slice(endOffset);

    const span = document.createElement("span");
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