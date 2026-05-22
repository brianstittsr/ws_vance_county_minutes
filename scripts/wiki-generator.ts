import * as fs from 'fs';
import * as path from 'path';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { extractTextFromPDF, MinuteDocument } from './pdf-processor.js';

const WIKI_DIR = path.join(process.cwd(), 'wiki');
const WIKI_INDEX_FILE = path.join(WIKI_DIR, 'index.md');
const WIKI_TRACKING_FILE = path.join(process.cwd(), 'wiki-processed.json');

interface ProcessedWiki {
  filePath: string;
  processedAt: string;
  wikiPath: string;
}

interface WikiTracking {
  processedFiles: ProcessedWiki[];
  lastRun: string;
}

interface MeetingAnalysis {
  date: string;
  title: string;
  summary: string;
  keyDecisions: string[];
  actionItems: string[];
  attendees: string[];
  topics: string[];
  budgetItems: string[];
  ordinances: string[];
  publicComments: string[];
}

function loadWikiTracking(): WikiTracking {
  try {
    if (fs.existsSync(WIKI_TRACKING_FILE)) {
      const data = fs.readFileSync(WIKI_TRACKING_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading wiki tracking:', error);
  }
  return { processedFiles: [], lastRun: '' };
}

function saveWikiTracking(tracking: WikiTracking) {
  try {
    fs.writeFileSync(WIKI_TRACKING_FILE, JSON.stringify(tracking, null, 2));
  } catch (error) {
    console.error('Error saving wiki tracking:', error);
  }
}

function getNewMinutes(downloadDir: string, tracking: WikiTracking): string[] {
  const newFiles: string[] = [];
  const years = fs.readdirSync(downloadDir);
  
  for (const year of years) {
    const yearPath = path.join(downloadDir, year);
    if (!fs.statSync(yearPath).isDirectory()) continue;
    
    const files = fs.readdirSync(yearPath);
    for (const file of files) {
      if (!file.endsWith('.pdf')) continue;
      
      const filePath = path.join(yearPath, file);
      const relativePath = path.join(year, file);
      
      // Check if already processed
      const alreadyProcessed = tracking.processedFiles.some(
        p => p.filePath === relativePath
      );
      
      if (!alreadyProcessed) {
        newFiles.push(filePath);
      }
    }
  }
  
  return newFiles;
}

async function analyzeMeeting(filePath: string): Promise<MeetingAnalysis> {
  const content = await extractTextFromPDF(filePath);
  const fileName = path.basename(filePath, '.pdf');
  
  const prompt = `Analyze this Vance County Board of Commissioners meeting transcript and extract key information.

Meeting Content:
${content.slice(0, 15000)}

Extract and format the following as JSON:
{
  "date": "meeting date if found, or infer from filename",
  "title": "descriptive title based on content",
  "summary": "2-3 paragraph executive summary",
  "keyDecisions": ["list of major decisions made"],
  "actionItems": ["specific action items with responsible parties if mentioned"],
  "attendees": ["board members and key staff present"],
  "topics": ["main topics discussed"],
  "budgetItems": ["any budget or financial matters discussed"],
  "ordinances": ["ordinances or resolutions passed/discussed"],
  "publicComments": ["significant public comments or concerns"]
}

Be concise but comprehensive. If information isn't available, use empty arrays or "Not specified".`;

  try {
    const { text } = await generateText({
      model: openai('gpt-4o'),
      prompt,
      temperature: 0.3,
    });
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error(`Error analyzing ${filePath}:`, error);
  }
  
  // Fallback
  return {
    date: fileName.replace(/_/g, ' '),
    title: fileName.replace(/_/g, ' '),
    summary: 'Analysis failed. Please review original document.',
    keyDecisions: [],
    actionItems: [],
    attendees: [],
    topics: [],
    budgetItems: [],
    ordinances: [],
    publicComments: [],
  };
}

function generateMeetingWiki(analysis: MeetingAnalysis, year: string, fileName: string): string {
  const dateStr = analysis.date || fileName.replace(/_/g, ' ');
  const safeFileName = fileName.replace('.pdf', '');
  
  let markdown = `# ${analysis.title}\n\n`;
  markdown += `**Date:** ${dateStr}  \n`;
  markdown += `**Year:** ${year}  \n`;
  markdown += `**Type:** Board of Commissioners Meeting Minutes\n\n`;
  
  // Summary
  markdown += `## Summary\n\n${analysis.summary}\n\n`;
  
  // Key Decisions
  if (analysis.keyDecisions.length > 0) {
    markdown += `## Key Decisions\n\n`;
    analysis.keyDecisions.forEach(decision => {
      markdown += `- ${decision}\n`;
    });
    markdown += `\n`;
  }
  
  // Action Items
  if (analysis.actionItems.length > 0) {
    markdown += `## Action Items\n\n`;
    analysis.actionItems.forEach(item => {
      markdown += `- [ ] ${item}\n`;
    });
    markdown += `\n`;
  }
  
  // Topics
  if (analysis.topics.length > 0) {
    markdown += `## Topics Discussed\n\n`;
    analysis.topics.forEach(topic => {
      markdown += `- ${topic}\n`;
    });
    markdown += `\n`;
  }
  
  // Budget Items
  if (analysis.budgetItems.length > 0) {
    markdown += `## Budget & Financial Matters\n\n`;
    analysis.budgetItems.forEach(item => {
      markdown += `- ${item}\n`;
    });
    markdown += `\n`;
  }
  
  // Ordinances
  if (analysis.ordinances.length > 0) {
    markdown += `## Ordinances & Resolutions\n\n`;
    analysis.ordinances.forEach(ord => {
      markdown += `- ${ord}\n`;
    });
    markdown += `\n`;
  }
  
  // Attendees
  if (analysis.attendees.length > 0) {
    markdown += `## Attendees\n\n`;
    analysis.attendees.forEach(attendee => {
      markdown += `- ${attendee}\n`;
    });
    markdown += `\n`;
  }
  
  // Public Comments
  if (analysis.publicComments.length > 0) {
    markdown += `## Public Comments\n\n`;
    analysis.publicComments.forEach(comment => {
      markdown += `- ${comment}\n`;
    });
    markdown += `\n`;
  }
  
  // Links
  markdown += `---\n\n`;
  markdown += `## Links\n\n`;
  markdown += `- [Back to ${year} Index](./index.md)\n`;
  markdown += `- [Main Wiki Index](../index.md)\n`;
  
  return markdown;
}

function generateYearIndex(year: string, analyses: MeetingAnalysis[]): string {
  let markdown = `# ${year} - Vance County Board of Commissioners\n\n`;
  markdown += `## Meetings\n\n`;
  
  // Sort by date
  const sorted = [...analyses].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
  
  sorted.forEach(analysis => {
    const safeFileName = analysis.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    markdown += `- [${analysis.date} - ${analysis.title}](./${safeFileName}.md)\n`;
  });
  
  markdown += `\n`;
  
  // Summary statistics
  markdown += `## Year Summary\n\n`;
  markdown += `- **Total Meetings:** ${analyses.length}\n`;
  
  const allDecisions = analyses.flatMap(a => a.keyDecisions);
  const allBudgetItems = analyses.flatMap(a => a.budgetItems);
  const allOrdinances = analyses.flatMap(a => a.ordinances);
  
  markdown += `- **Key Decisions:** ${allDecisions.length}\n`;
  markdown += `- **Budget Items:** ${allBudgetItems.length}\n`;
  markdown += `- **Ordinances:** ${allOrdinances.length}\n`;
  
  markdown += `\n---\n\n`;
  markdown += `[← Back to Main Index](../index.md)\n`;
  
  return markdown;
}

function updateMainIndex(years: string[]): string {
  let markdown = `# Vance County Board of Commissioners - Meeting Minutes Wiki\n\n`;
  markdown += `AI-generated summaries and analysis of Board of Commissioners meeting minutes.\n\n`;
  
  markdown += `## Navigation\n\n`;
  
  // Sort years descending
  const sortedYears = [...years].sort((a, b) => parseInt(b) - parseInt(a));
  
  sortedYears.forEach(year => {
    markdown += `- [${year} Meetings](./${year}/index.md)\n`;
  });
  
  markdown += `\n`;
  
  // Search and browse section
  markdown += `## Browse by Topic\n\n`;
  markdown += `- [Budget & Finance](topics/budget.md)\n`;
  markdown += `- [Ordinances & Zoning](topics/ordinances.md)\n`;
  markdown += `- [Public Works](topics/public-works.md)\n`;
  markdown += `- [Personnel](topics/personnel.md)\n`;
  markdown += `- [Economic Development](topics/economic-development.md)\n`;
  
  markdown += `\n---\n\n`;
  markdown += `*Generated from official Vance County meeting minutes*\n`;
  
  return markdown;
}

export async function generateWikis(downloadDir: string): Promise<{
  processed: number;
  newFiles: string[];
  errors: string[];
}> {
  // Ensure wiki directory exists
  if (!fs.existsSync(WIKI_DIR)) {
    fs.mkdirSync(WIKI_DIR, { recursive: true });
  }
  
  const tracking = loadWikiTracking();
  const newFiles = getNewMinutes(downloadDir, tracking);
  
  if (newFiles.length === 0) {
    return { processed: 0, newFiles: [], errors: [] };
  }
  
  const errors: string[] = [];
  const yearAnalyses: Map<string, MeetingAnalysis[]> = new Map();
  
  for (const filePath of newFiles) {
    try {
      const year = path.basename(path.dirname(filePath));
      const fileName = path.basename(filePath);
      const relativePath = path.join(year, fileName);
      
      console.log(`Analyzing: ${relativePath}`);
      
      // Analyze the meeting
      const analysis = await analyzeMeeting(filePath);
      
      // Create year directory
      const yearDir = path.join(WIKI_DIR, year);
      if (!fs.existsSync(yearDir)) {
        fs.mkdirSync(yearDir, { recursive: true });
      }
      
      // Generate wiki markdown
      const wikiContent = generateMeetingWiki(analysis, year, fileName);
      const safeFileName = analysis.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const wikiPath = path.join(yearDir, `${safeFileName}.md`);
      
      fs.writeFileSync(wikiPath, wikiContent);
      
      // Track for year index
      if (!yearAnalyses.has(year)) {
        yearAnalyses.set(year, []);
      }
      yearAnalyses.get(year)!.push(analysis);
      
      // Update tracking
      tracking.processedFiles.push({
        filePath: relativePath,
        processedAt: new Date().toISOString(),
        wikiPath: path.join(year, `${safeFileName}.md`),
      });
      
    } catch (error) {
      const errorMsg = `Error processing ${filePath}: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    }
  }
  
  // Generate year indexes for affected years
  Array.from(yearAnalyses.entries()).forEach(([year, analyses]) => {
    const yearIndex = generateYearIndex(year, analyses);
    fs.writeFileSync(path.join(WIKI_DIR, year, 'index.md'), yearIndex);
  });
  
  // Update main index
  const allYears = fs.readdirSync(WIKI_DIR).filter(f => {
    const stat = fs.statSync(path.join(WIKI_DIR, f));
    return stat.isDirectory();
  });
  
  const mainIndex = updateMainIndex(allYears);
  fs.writeFileSync(WIKI_INDEX_FILE, mainIndex);
  
  // Save tracking
  tracking.lastRun = new Date().toISOString();
  saveWikiTracking(tracking);
  
  return {
    processed: newFiles.length - errors.length,
    newFiles,
    errors,
  };
}

export function getWikiStats(): {
  totalFiles: number;
  totalYears: number;
  lastRun: string;
} {
  const tracking = loadWikiTracking();
  
  let totalYears = 0;
  if (fs.existsSync(WIKI_DIR)) {
    totalYears = fs.readdirSync(WIKI_DIR).filter(f => {
      const stat = fs.statSync(path.join(WIKI_DIR, f));
      return stat.isDirectory();
    }).length;
  }
  
  return {
    totalFiles: tracking.processedFiles.length,
    totalYears,
    lastRun: tracking.lastRun,
  };
}
