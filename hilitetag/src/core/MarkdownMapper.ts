import { marked } from 'marked';

/**
 * Maps positions between Markdown source text and rendered HTML text content
 */
export class MarkdownMapper {
  private markdownSource: string;
  private htmlContent: string;
  private textContent: string;
  
  constructor(markdownSource: string) {
    this.markdownSource = markdownSource;
    this.htmlContent = marked.parse(markdownSource) as string;
    this.textContent = '';
    this.buildTextContent();
  }
  
  /**
   * Get the HTML content
   */
  getHtml(): string {
    return this.htmlContent;
  }
  
  /**
   * Get the plain text content (without any Markdown formatting)
   */
  getTextContent(): string {
    return this.textContent;
  }
  
  /**
   * Build text content from HTML
   */
  private buildTextContent(): void {
    // Create a temporary DOM to extract text content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = this.htmlContent;
    
    // Extract all text content from the HTML
    const walker = document.createTreeWalker(
      tempDiv,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    const textParts: string[] = [];
    
    // Collect all text nodes
    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      const text = node.textContent || '';
      textParts.push(text);
    }
    
    this.textContent = textParts.join('');
  }
  
  /**
   * Convert HTML text range to Markdown source range
   * Returns the ACTUAL character positions in the markdown file
   */
  mapHtmlRangeToMarkdown(htmlStartPos: number, htmlEndPos: number): { start: number; end: number } {
    // Get the text we're looking for from the HTML text content
    const searchText = this.textContent.substring(htmlStartPos, htmlEndPos);
    
    if (!searchText) {
      return { start: 0, end: 0 };
    }
    
    // First, try to find exact match in markdown
    let index = this.markdownSource.indexOf(searchText);
    
    if (index !== -1) {
      // Expand to include surrounding formatting characters if present,
      // to return ACTUAL file positions that include markdown delimiters
      let actualStart = index;
      let actualEnd = index + searchText.length;
      
      // Look back for opening formatting
      while (actualStart > 0 && this.isPartOfSameFormattingBlock(actualStart - 1)) {
        actualStart--;
      }
      
      // Look forward for closing formatting
      while (actualEnd < this.markdownSource.length && this.isPartOfSameFormattingBlock(actualEnd)) {
        actualEnd++;
      }
      
      return { start: actualStart, end: actualEnd };
    }
    
    // If not found, the text might be split by formatting
    // Try to find it by searching for parts
    const words = searchText.split(/\s+/);
    if (words.length > 0) {
      // Search for the first word to get a starting point
      const firstWord = words[0];
      let searchFrom = 0;
      
      while (searchFrom < this.markdownSource.length) {
        const wordIndex = this.markdownSource.indexOf(firstWord, searchFrom);
        if (wordIndex === -1) break;
        
        // Check if we can match all words from this position
        let pos = wordIndex;
        let matched = true;
        
        for (let i = 0; i < words.length; i++) {
          const word = words[i];
          const foundAt = this.findWordIgnoringFormatting(word, pos);
          
          if (foundAt === -1) {
            matched = false;
            break;
          }
          
          pos = foundAt + word.length;
        }
        
        if (matched) {
          // Found all words, now find the exact range
          const start = wordIndex;
          const end = pos;
          
          // Adjust to include any formatting
          let actualStart = start;
          let actualEnd = end;
          
          // Look back for opening formatting
          while (actualStart > 0 && this.isPartOfSameFormattingBlock(actualStart - 1)) {
            actualStart--;
          }
          
          // Look forward for closing formatting
          while (actualEnd < this.markdownSource.length && this.isPartOfSameFormattingBlock(actualEnd)) {
            actualEnd++;
          }
          
          return { start: actualStart, end: actualEnd };
        }
        
        searchFrom = wordIndex + 1;
      }
    }
    
    console.error(`Failed to find text "${searchText}" in markdown`);
    return { start: 0, end: 0 };
  }
  
  /**
   * Find a word starting from position, ignoring formatting
   */
  private findWordIgnoringFormatting(word: string, startPos: number): number {
    let charIndex = 0;
    
    for (let i = startPos; i < this.markdownSource.length && charIndex < word.length; i++) {
      const char = this.markdownSource[i];
      
      // Skip formatting characters
      if (char === '*' || char === '_' || char === '`' || char === '[' || char === ']' || char === '(' || char === ')') {
        continue;
      }
      
      if (char === word[charIndex]) {
        if (charIndex === 0) {
          startPos = i; // Mark the actual start
        }
        charIndex++;
      } else if (charIndex > 0) {
        // We were matching but hit a non-match
        return -1;
      }
    }
    
    return charIndex === word.length ? startPos : -1;
  }
  
  /**
   * Check if a position is part of the same formatting block
   */
  private isPartOfSameFormattingBlock(pos: number): boolean {
    const char = this.markdownSource[pos];
    // Check for formatting characters that might be part of this text's formatting
    return char === '*' || char === '_' || char === '`';
  }
  
  /**
   * Convert Markdown source range to HTML text range
   * Takes ACTUAL file positions and maps to HTML text positions
   */
  mapMarkdownRangeToHtml(markdownStartPos: number, markdownEndPos: number): { start: number; end: number } {
    // Extract the text from the markdown at these positions
    const markdownText = this.markdownSource.substring(markdownStartPos, markdownEndPos);
    
    // Remove markdown formatting to get pure text
    const pureText = this.stripMarkdownFormatting(markdownText);
    
    // Find this text in the HTML text content
    const htmlIndex = this.textContent.indexOf(pureText);
    
    if (htmlIndex !== -1) {
      return { start: htmlIndex, end: htmlIndex + pureText.length };
    }
    
    // If not found, try to find it more carefully
    console.warn(`Could not find markdown text "${pureText}" in HTML`);
    return { start: 0, end: pureText.length };
  }
  
  /**
   * Strip markdown formatting from text
   */
  private stripMarkdownFormatting(text: string): string {
    // Remove common markdown formatting
    return text
      .replace(/\*\*([^*]+)\*\*/g, '$1')  // Bold **text**
      .replace(/\*([^*]+)\*/g, '$1')      // Italic *text*
      .replace(/__([^_]+)__/g, '$1')      // Bold __text__
      .replace(/_([^_]+)_/g, '$1')        // Italic _text_
      .replace(/`([^`]+)`/g, '$1')        // Inline code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Links [text](url)
      .replace(/^#+\s+/gm, '')            // Headers
      .replace(/^[-*+]\s+/gm, '')         // List markers
      .replace(/^\d+\.\s+/gm, '');        // Numbered lists
  }
}
