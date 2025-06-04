export function expandRangeToWordBoundaries(range: Range): Range {
  const newRange = range.cloneRange();

  const startContainer = newRange.startContainer;
  const endContainer = newRange.endContainer;

  // Adjust start to the beginning of the word
  if (startContainer.nodeType === Node.TEXT_NODE) {
    const textNode = startContainer as Text;
    const text = textNode.textContent || "";
    let pos = newRange.startOffset;
    // Move pos backward until non-word character or start of text
    while (pos > 0 && /\w/.test(text.charAt(pos - 1))) {
      pos--;
    }
    newRange.setStart(textNode, pos);
  }

  // Adjust end to the end of the word
  if (endContainer.nodeType === Node.TEXT_NODE) {
    const textNode = endContainer as Text;
    const text = textNode.textContent || "";
    let pos = newRange.endOffset;
    const len = text.length;
    // Move pos forward until non-word character or end of text
    while (pos < len && /\w/.test(text.charAt(pos))) {
      pos++;
    }
    newRange.setEnd(textNode, pos);
  }

  return newRange;
}