export interface SEOResult {
  score: number;
  wordCount: number;
  readabilityScore: number;
  readabilityLevel: string;
  keywordDensity: { word: string; count: number; density: number }[];
  suggestions: string[];
}

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'arent', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'cant', 'cannot', 'could', 'couldnt', 'did', 'didnt', 'do', 'does', 'doesnt', 'doing', 'dont', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadnt', 'has', 'hasnt', 'have', 'havent', 'having', 'he', 'hed', 'hell', 'hes', 'her', 'here', 'heres', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'hows', 'i', 'id', 'ill', 'im', 'ive', 'if', 'in', 'into', 'is', 'isnt', 'it', 'its', 'itself', 'lets', 'me', 'more', 'most', 'mustnt', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shant', 'she', 'shed', 'shell', 'shes', 'should', 'shouldnt', 'so', 'some', 'such', 'than', 'that', 'thats', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'theres', 'these', 'they', 'theyd', 'theyll', 'theyre', 'theyve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasnt', 'we', 'wed', 'well', 'were', 'weve', 'werent', 'what', 'whats', 'when', 'whens', 'where', 'wheres', 'which', 'while', 'who', 'whos', 'whom', 'why', 'whys', 'with', 'wont', 'would', 'wouldnt', 'you', 'youd', 'youll', 'youre', 'youve', 'your', 'yours', 'yourself', 'yourselves', 'will', 'can', 'just', 'like', 'also'
]);

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;

  // Handle common exceptions and silent 'e'
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  
  const syllables = word.match(/[aeiouy]{1,2}/g);
  return syllables ? syllables.length : 1;
}

export function analyzeSEO(markdown: string): SEOResult {
  const suggestions: string[] = [];
  let score = 100;

  // 1. Structural Regex Parsing (Links, Images, Code)
  // Remove code blocks
  const markdownWithoutCode = markdown.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '');
  
  // Find images ![alt](url)
  const images = [...markdownWithoutCode.matchAll(/!\[(.*?)\]\((.*?)\)/g)];
  let missingAlt = false;
  images.forEach(match => {
    if (!match[1] || match[1].trim() === '') missingAlt = true;
  });
  if (missingAlt) {
    score -= 10;
    suggestions.push('One or more images are missing alt text. Describe your images for better SEO and accessibility.');
  }

  // Find links [text](url) (ignoring images by using a negative lookbehind for !)
  const rawLinks = [...markdownWithoutCode.matchAll(/(?:[^!]|^)\[(.*?)\]\((.*?)\)/g)];
  if (rawLinks.length === 0) {
    score -= 10;
    suggestions.push('No links found. Add internal or external links to improve SEO authority.');
  }

  // 2. Text Cleanup & Word Count
  // Remove markdown symbols to get raw text
  const textOnly = markdownWithoutCode
    .replace(/!\[.*?\]\(.*?\)/g, '') // remove images entirely
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // keep link text
    .replace(/[#*_\->!]/g, ' ')
    .trim();

  // Strip punctuation for accurate word/syllable matching
  const cleanText = textOnly.replace(/[.,:;!?"'()[\]{}]/g, '');
  const words = cleanText.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;

  if (wordCount < 300) {
    score -= 20;
    suggestions.push('Content is too short. Aim for at least 300 words.');
  } else if (wordCount < 600) {
    score -= 10;
    suggestions.push('Content length is decent, but 600+ words rank better.');
  }

  // 3. Heading Structure
  const h1Match = markdownWithoutCode.match(/^#\s+(.*)/gm);
  const h2Match = markdownWithoutCode.match(/^##\s+(.*)/gm);

  if (!h1Match || h1Match.length === 0) {
    score -= 15;
    suggestions.push('Missing an H1 heading (Title).');
  } else if (h1Match.length > 1) {
    score -= 10;
    suggestions.push('Multiple H1 headings found. Use only one H1 for the main title.');
  } else {
    // Check H1 length
    const h1Text = h1Match[0].replace(/^#\s+/, '').trim();
    if (h1Text.length < 30 || h1Text.length > 65) {
      score -= 5;
      suggestions.push(`Your H1 title is ${h1Text.length} chars. Ideal length is 30-65 characters for optimal search engine display.`);
    }
  }

  if (!h2Match || h2Match.length === 0) {
    score -= 10;
    suggestions.push('No H2 subheadings found. Break up your content with H2 subheadings.');
  }

  // 4. Paragraph Lengths
  // Split by double newline to approximate paragraphs
  const paragraphs = textOnly.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
  let longParagraphs = 0;
  paragraphs.forEach(p => {
    if (p.split(/\s+/).length > 150) {
      longParagraphs++;
    }
  });
  if (longParagraphs > 0) {
    score -= Math.min(15, 5 * longParagraphs); // cap penalty at 15
    suggestions.push(`${longParagraphs} paragraph(s) exceed 150 words. Break them up to improve readability.`);
  }

  // 5. Readability (Flesch Reading Ease)
  // Split sentences safely
  // Remove abbreviations so they don't break sentence counting
  let sentenceText = markdownWithoutCode
    .replace(/(Mr|Mrs|Ms|Dr|Prof|Rev|St|e\.g|i\.e)\./gi, '$1') 
    .replace(/!\[.*?\]\(.*?\)/g, ''); // remove images to avoid URLs acting as sentences
  
  const sentences = sentenceText.split(/[.!?\n]+/).map(s => s.trim()).filter(s => s.length > 3);
  const sentenceCount = sentences.length || 1;
  let syllableCount = 0;
  
  words.forEach(word => {
    syllableCount += countSyllables(word);
  });

  const avgWordsPerSentence = wordCount / sentenceCount;
  const avgSyllablesPerWord = syllableCount / (wordCount || 1);
  
  let readabilityScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
  readabilityScore = Math.max(0, Math.min(100, Math.round(readabilityScore)));

  let readabilityLevel = 'Standard';
  if (readabilityScore > 80) readabilityLevel = 'Very Easy';
  else if (readabilityScore > 60) readabilityLevel = 'Standard (8th Grade)';
  else if (readabilityScore > 40) readabilityLevel = 'Difficult (College)';
  else {
    readabilityLevel = 'Very Difficult';
    score -= 10;
    suggestions.push('Content is very difficult to read. Try using shorter sentences and simpler words.');
  }

  // 6. Keyword Density
  const wordFreq: Record<string, number> = {};
  words.forEach(w => {
    const word = w.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (word.length > 3 && !STOP_WORDS.has(word)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });

  const keywordDensity = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word, count]) => ({
      word,
      count,
      density: Number(((count / (wordCount || 1)) * 100).toFixed(1))
    }));

  if (keywordDensity.length > 0 && keywordDensity[0].density > 5) {
    score -= 15;
    suggestions.push(`Keyword stuffing detected: "${keywordDensity[0].word}" appears too often (${keywordDensity[0].density}%). Keep under 5%.`);
  }

  if (suggestions.length === 0) {
    suggestions.push('Great job! Your content is exceptionally well-optimized.');
  }

  return {
    score: Math.max(0, score),
    wordCount,
    readabilityScore,
    readabilityLevel,
    keywordDensity,
    suggestions
  };
}
