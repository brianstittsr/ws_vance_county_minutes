import * as fs from 'fs';
import * as path from 'path';

export interface WikiDocument {
  id: string;
  title: string;
  year: string;
  content: string;
  filePath: string;
  createdAt: Date;
  meetingDate: string;
  summary: string;
  keyDecisions: string[];
  topics: string[];
}

export function extractWikiContent(filePath: string): { content: string; metadata: Partial<WikiDocument> } {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.basename(filePath, '.md');
  const year = path.basename(path.dirname(filePath));
  
  // Parse markdown to extract metadata
  const lines = content.split('\n');
  const metadata: Partial<WikiDocument> = {
    year,
    filePath,
  };
  
  // Extract title (first h1)
  const titleMatch = content.match(/^# (.+)$/m);
  if (titleMatch) {
    metadata.title = titleMatch[1];
  }
  
  // Extract date
  const dateMatch = content.match(/\*\*Date:\*\* (.+)$/m);
  if (dateMatch) {
    metadata.meetingDate = dateMatch[1];
  }
  
  // Extract summary from ## Summary section
  const summaryMatch = content.match(/## Summary\n\n([\s\S]+?)(?=\n\n## |$)/);
  if (summaryMatch) {
    metadata.summary = summaryMatch[1].trim();
  }
  
  // Extract key decisions
  const decisionsMatch = content.match(/## Key Decisions\n\n([\s\S]+?)(?=\n\n## |$)/);
  if (decisionsMatch) {
    metadata.keyDecisions = decisionsMatch[1]
      .split('\n')
      .filter(line => line.startsWith('- '))
      .map(line => line.replace('- ', '').trim());
  }
  
  // Extract topics
  const topicsMatch = content.match(/## Topics Discussed\n\n([\s\S]+?)(?=\n\n## |$)/);
  if (topicsMatch) {
    metadata.topics = topicsMatch[1]
      .split('\n')
      .filter(line => line.startsWith('- '))
      .map(line => line.replace('- ', '').trim());
  }
  
  return { content, metadata };
}

export function processAllWikis(wikiDir: string): WikiDocument[] {
  const documents: WikiDocument[] = [];
  
  if (!fs.existsSync(wikiDir)) {
    console.log('Wiki directory does not exist:', wikiDir);
    return documents;
  }
  
  const years = fs.readdirSync(wikiDir);
  
  for (const year of years) {
    const yearPath = path.join(wikiDir, year);
    if (!fs.statSync(yearPath).isDirectory()) continue;
    
    const files = fs.readdirSync(yearPath);
    
    for (const file of files) {
      if (!file.endsWith('.md') || file === 'index.md') continue;
      
      const filePath = path.join(yearPath, file);
      try {
        const { content, metadata } = extractWikiContent(filePath);
        
        documents.push({
          id: `${year}/${file}`,
          title: metadata.title || file.replace(/_/g, ' ').replace('.md', ''),
          year,
          content,
          filePath,
          createdAt: fs.statSync(filePath).mtime,
          meetingDate: metadata.meetingDate || '',
          summary: metadata.summary || '',
          keyDecisions: metadata.keyDecisions || [],
          topics: metadata.topics || [],
        });
      } catch (error) {
        console.error(`Error processing wiki ${file}:`, error);
      }
    }
  }
  
  return documents;
}

export function getWikiDocumentById(wikiDir: string, year: string, fileName: string): WikiDocument | null {
  const filePath = path.join(wikiDir, year, fileName);
  
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  try {
    const { content, metadata } = extractWikiContent(filePath);
    
    return {
      id: `${year}/${fileName}`,
      title: metadata.title || fileName.replace(/_/g, ' ').replace('.md', ''),
      year,
      content,
      filePath,
      createdAt: fs.statSync(filePath).mtime,
      meetingDate: metadata.meetingDate || '',
      summary: metadata.summary || '',
      keyDecisions: metadata.keyDecisions || [],
      topics: metadata.topics || [],
    };
  } catch (error) {
    console.error(`Error getting wiki document ${filePath}:`, error);
    return null;
  }
}
