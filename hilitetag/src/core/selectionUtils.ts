export function expandRangeToWordBoundaries(range: Range): Range {
  const selectedText = range.toString();
  if (/^\s*$/.test(selectedText)) {
    return range;
  }

  const newRange = range.cloneRange();

  // Capture original boundary positions
  const originalStartContainer = range.startContainer;
  const originalStartOffset = range.startOffset;
  const originalEndContainer = range.endContainer;
  const originalEndOffset = range.endOffset;

  // Adjust start to the beginning of the word only if original start is on a word character
  if (
    originalStartContainer.nodeType === Node.TEXT_NODE &&
    originalStartOffset < (originalStartContainer.textContent || "").length
  ) {
    const textNode = originalStartContainer as Text;
    const text = textNode.textContent || "";
    const charAtStart = text.charAt(originalStartOffset);
    if (/\w/.test(charAtStart)) {
      let pos = originalStartOffset;
      while (pos > 0 && /\w/.test(text.charAt(pos - 1))) {
        pos--;
      }
      newRange.setStart(textNode, pos);
    }
  }

  // Adjust end to the end of the word only if original end is on a word character
  if (
    originalEndContainer.nodeType === Node.TEXT_NODE &&
    originalEndOffset > 0
  ) {
    const textNode = originalEndContainer as Text;
    const text = textNode.textContent || "";
    const charBeforeEnd = text.charAt(originalEndOffset - 1);
    if (/\w/.test(charBeforeEnd)) {
      let pos = originalEndOffset;
      const len = text.length;
      while (pos < len && /\w/.test(text.charAt(pos))) {
        pos++;
      }
      newRange.setEnd(textNode, pos);
    }
  }

  return newRange;
}