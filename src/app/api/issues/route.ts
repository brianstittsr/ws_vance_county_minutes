import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

interface Issue {
  id: string;
  title: string;
  year: string;
  meetingDate: string;
  meetingFile: string;
  summary: string;
  keyDecisions: string[];
  actionItems: string[];
  pdfUrl: string;
  wikiUrl: string;
}

interface IssuesByYear {
  year: string;
  issues: Issue[];
}

function extractIssuesFromWiki(wikiDir: string): Issue[] {
  const issues: Issue[] = [];
  
  if (!fs.existsSync(wikiDir)) {
    return issues;
  }
  
  const years = fs.readdirSync(wikiDir);
  
  for (const year of years) {
    const yearPath = path.join(wikiDir, year);
    if (!fs.statSync(yearPath).isDirectory()) continue;
    
    const files = fs.readdirSync(yearPath);
    
    for (const file of files) {
      if (!file.endsWith('.md') || file === 'index.md') continue;
      
      const filePath = path.join(yearPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Extract meeting metadata
      const titleMatch = content.match(/^# (.+)$/m);
      const dateMatch = content.match(/\*\*Date:\*\* (.+)$/m);
      const summaryMatch = content.match(/## Summary\n\n([\s\S]+?)(?=\n\n## |$)/);
      
      // Extract key decisions
      const decisionsMatch = content.match(/## Key Decisions\n\n([\s\S]+?)(?=\n\n## |$)/);
      const keyDecisions = decisionsMatch 
        ? decisionsMatch[1].split('\n').filter(line => line.startsWith('- ')).map(l => l.replace('- ', ''))
        : [];
      
      // Extract action items
      const actionItemsMatch = content.match(/## Action Items\n\n([\s\S]+?)(?=\n\n## |$)/);
      const actionItems = actionItemsMatch
        ? actionItemsMatch[1].split('\n').filter(line => line.startsWith('- [ ]')).map(l => l.replace('- [ ] ', ''))
        : [];
      
      // Extract topics as individual issues
      const topicsMatch = content.match(/## Topics Discussed\n\n([\s\S]+?)(?=\n\n## |$)/);
      const topics = topicsMatch
        ? topicsMatch[1].split('\n').filter(line => line.startsWith('- ')).map(l => l.replace('- ', ''))
        : [];
      
      // Create an issue entry for each topic
      if (topics.length > 0) {
        topics.forEach((topic, index) => {
          const baseFileName = file.replace('.md', '');
          issues.push({
            id: `${year}-${baseFileName}-topic-${index}`,
            title: topic,
            year,
            meetingDate: dateMatch ? dateMatch[1].trim() : '',
            meetingFile: baseFileName.replace(/_/g, ' '),
            summary: summaryMatch ? summaryMatch[1].slice(0, 300) + '...' : '',
            keyDecisions: keyDecisions.slice(0, 3),
            actionItems: actionItems.slice(0, 2),
            pdfUrl: `/downloads/${year}/${baseFileName}.pdf`,
            wikiUrl: `/wiki/${year}/${file}`,
          });
        });
      }
      
      // Also create issues for key decisions if they don't overlap with topics
      if (keyDecisions.length > 0 && topics.length === 0) {
        keyDecisions.forEach((decision, index) => {
          const baseFileName = file.replace('.md', '');
          issues.push({
            id: `${year}-${baseFileName}-decision-${index}`,
            title: decision.slice(0, 100) + (decision.length > 100 ? '...' : ''),
            year,
            meetingDate: dateMatch ? dateMatch[1].trim() : '',
            meetingFile: baseFileName.replace(/_/g, ' '),
            summary: summaryMatch ? summaryMatch[1].slice(0, 300) + '...' : '',
            keyDecisions: [decision],
            actionItems: actionItems.slice(0, 2),
            pdfUrl: `/downloads/${year}/${baseFileName}.pdf`,
            wikiUrl: `/wiki/${year}/${file}`,
          });
        });
      }
    }
  }
  
  return issues.sort((a, b) => {
    // Sort by year descending, then by meeting date
    if (a.year !== b.year) return parseInt(b.year) - parseInt(a.year);
    return new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime();
  });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const year = searchParams.get('year');
    const search = searchParams.get('search');
    
    const wikiDir = path.join(process.cwd(), 'wiki');
    let issues = extractIssuesFromWiki(wikiDir);
    
    // Filter by year if provided
    if (year) {
      issues = issues.filter(issue => issue.year === year);
    }
    
    // Filter by search term if provided
    if (search) {
      const searchLower = search.toLowerCase();
      issues = issues.filter(issue => 
        issue.title.toLowerCase().includes(searchLower) ||
        issue.summary.toLowerCase().includes(searchLower) ||
        issue.meetingFile.toLowerCase().includes(searchLower)
      );
    }
    
    // Get unique years for filtering
    const years = Array.from(new Set(issues.map(i => i.year))).sort((a, b) => parseInt(b) - parseInt(a));
    
    // Group issues by year for the response
    const issuesByYear: IssuesByYear[] = years.map(y => ({
      year: y,
      issues: issues.filter(i => i.year === y),
    }));
    
    return NextResponse.json({
      success: true,
      totalIssues: issues.length,
      years,
      issuesByYear,
      issues,
    });
  } catch (error) {
    console.error('Error fetching issues:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch issues' },
      { status: 500 }
    );
  }
}
