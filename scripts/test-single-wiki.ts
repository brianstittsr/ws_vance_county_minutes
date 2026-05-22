import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { extractTextFromPDF } from './pdf-processor.js';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

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

async function analyzeMeeting(filePath: string): Promise<MeetingAnalysis> {
  const content = await extractTextFromPDF(filePath);
  const fileName = path.basename(filePath, '.pdf');
  
  console.log(`Extracted ${content.length} characters from PDF`);
  console.log('First 500 chars:', content.slice(0, 500));
  
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
    console.log('\nSending to OpenAI for analysis...');
    const { text } = await generateText({
      model: openai('gpt-4o'),
      prompt,
      temperature: 0.3,
    });
    
    console.log('OpenAI response received');
    
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

async function main() {
  console.log('📝 Single Wiki Generation Test\n');
  
  // Check for API key
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ ERROR: OPENAI_API_KEY environment variable is not set');
    console.error('\nPlease create a .env.local file with your OpenAI API key:');
    console.error('  OPENAI_API_KEY=sk-your-key-here\n');
    console.error('Get your API key from: https://platform.openai.com/api-keys\n');
    process.exit(1);
  }
  
  const testFile = path.join(process.cwd(), 'downloads', '2013', 'april_8_2013.pdf');
  
  console.log('File:', testFile);
  console.log('Exists:', fs.existsSync(testFile));
  
  if (!fs.existsSync(testFile)) {
    console.error('File does not exist!');
    process.exit(1);
  }
  
  // Ensure wiki directory exists
  const wikiDir = path.join(process.cwd(), 'wiki', '2013');
  if (!fs.existsSync(wikiDir)) {
    fs.mkdirSync(wikiDir, { recursive: true });
  }
  
  console.log('\nAnalyzing PDF...');
  
  try {
    const analysis = await analyzeMeeting(testFile);
    
    console.log('\n✅ Analysis complete!');
    console.log('Title:', analysis.title);
    console.log('Date:', analysis.date);
    console.log('Summary:', analysis.summary.slice(0, 200) + '...');
    
    // Generate wiki markdown
    const wikiContent = generateMeetingWiki(analysis, '2013', 'april_8_2013.pdf');
    const wikiPath = path.join(wikiDir, 'april_8_2013.md');
    
    fs.writeFileSync(wikiPath, wikiContent);
    
    console.log('\n✅ Wiki generated:', wikiPath);
    console.log('\n--- Wiki Content Preview ---');
    console.log(wikiContent.slice(0, 1500));
    console.log('--- End Preview ---\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();
