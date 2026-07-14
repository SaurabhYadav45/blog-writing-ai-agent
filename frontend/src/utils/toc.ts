export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function extractToc(markdown: string): TocItem[] {
  if (!markdown) return [];
  const lines = markdown.split('\n');
  const toc: TocItem[] = [];

  // Inside a code block we shouldn't extract headings.
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (!inCodeBlock) {
      // Look for ## or ### headings
      const match = line.match(/^(#{2,4})\s+(.*)$/);
      if (match) {
        const level = match[1].length;
        // Remove bold/italic markdown from heading text for the TOC label
        let text = match[2].trim().replace(/[*_~`]/g, '');
        // Simple slugify for the ID
        let id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        
        if (!id) id = `heading-${toc.length}`;
        
        // Prevent duplicate ids
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
