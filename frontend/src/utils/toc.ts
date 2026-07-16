/**
 * Table of Contents (TOC) extraction utility.
 * Parses raw markdown body text, filters out code blocks, identifies headers
 * (levels 2-4), and slugifies header text to create unique anchor IDs for page navigation.
 */

export interface TocItem {
  id: string;   // Unique slug identifier for scroll target
  text: string; // Sanitized header text display label
  level: number; // Heading level (2 = H2, 3 = H3, 4 = H4)
}

/**
 * Extracts header metadata items from a markdown string to construct a Table of Contents.
 * Ignores any headers defined inside standard markdown code fences (```).
 * 
 * @param markdown The raw markdown content string.
 * @returns An array of parsed Table of Contents elements.
 */
export function extractToc(markdown: string): TocItem[] {
  if (!markdown) return [];
  const lines = markdown.split('\n');
  const toc: TocItem[] = [];

  // Toggle state tracker to ignore headers inside code blocks
  let inCodeBlock = false;

  for (const line of lines) {
    // Detect code fence boundary
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (!inCodeBlock) {
      // RegEx match for Markdown headings between H2 and H4
      const match = line.match(/^(#{2,4})\s+(.*)$/);
      if (match) {
        const level = match[1].length;
        
        // Remove formatting symbols like bold/italic asterisks, backticks, tildes, underscores
        let text = match[2].trim().replace(/[*_~`]/g, '');
        
        // Create slug ID mapping non-alphanumeric characters to dashes
        let id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        
        if (!id) id = `heading-${toc.length}`;
        
        // Append numeric suffix to slug IDs to prevent duplicate anchor references
        const existingCount = toc.filter(t => t.id === id || t.id.startsWith(`${id}-`)).length;
        if (existingCount > 0) {
          id = `${id}-${existingCount}`;
        }
        
        toc.push({ id, text, level });
      }
    }
  }

  return toc;
}
