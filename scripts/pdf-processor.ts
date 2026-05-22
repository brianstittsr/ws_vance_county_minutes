import * as fs from 'fs';
import * as path from 'path';

export interface MinuteDocument {
  id: string;
  title: string;
  year: string;
  content: string;
  filePath: string;
  createdAt: Date;
}

export async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    // Use pdf-text-extract which works better on Windows
    const extract = require('pdf-text-extract');
    
    return new Promise((resolve, reject) => {
      extract(filePath, (err: any, pages: string[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(pages.join('\n'));
        }
      });
    });
  } catch (error) {
    console.error(`Error extracting text from ${filePath}:`, error);
    throw error;
  }
}

export async function processAllMinutes(downloadDir: string): Promise<MinuteDocument[]> {
  const documents: MinuteDocument[] = [];
  const years = fs.readdirSync(downloadDir);
  
  for (const year of years) {
    const yearPath = path.join(downloadDir, year);
    if (!fs.statSync(yearPath).isDirectory()) continue;
    
    const files = fs.readdirSync(yearPath);
    
    for (const file of files) {
      if (!file.endsWith('.pdf')) continue;
      
      const filePath = path.join(yearPath, file);
      try {
        const content = await extractTextFromPDF(filePath);
        
        documents.push({
          id: `${year}/${file}`,
          title: file.replace(/_/g, ' ').replace('.pdf', ''),
          year,
          content,
          filePath,
          createdAt: fs.statSync(filePath).mtime
        });
      } catch (error) {
        console.error(`Error processing ${file}:`, error);
      }
    }
  }
  
  return documents;
}
