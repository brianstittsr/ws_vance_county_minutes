import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { pipeline } from 'stream';

const streamPipeline = promisify(pipeline);

// Base URL for the Vance County website
const BASE_URL = 'https://www.vancecounty.org';
const COMMISSIONERS_URL = `${BASE_URL}/departments/board-of-commissioners/`;
const DOWNLOAD_DIR = path.join(process.cwd(), 'downloads');

// Ensure download directory exists
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

export async function POST() {
  try {
    // Step 1: Fetch the main page to get year links
    const yearLinks = await fetchYearLinks();
    
    // Step 2: Process each year page
    const results = await processYearLinks(yearLinks);
    
    return NextResponse.json({ 
      message: `Successfully processed ${results.length} year pages. Downloaded ${results.reduce((acc, year) => acc + year.downloadCount, 0)} files.`,
      results 
    });
  } catch (error) {
    console.error('Error in scraping process:', error);
    return NextResponse.json(
      { error: 'Failed to scrape minutes: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

async function fetchYearLinks() {
  try {
    const response = await axios.get(COMMISSIONERS_URL);
    const $ = cheerio.load(response.data);
    
    // Extract year links from the page
    const yearLinks: { year: string; url: string }[] = [];
    
    // Find links that contain "Minutes" followed by a year
    $('a').each((_, element) => {
      const link = $(element);
      const href = link.attr('href');
      const text = link.text().trim();
      
      // Match "Minutes YYYY" pattern
      const yearMatch = text.match(/Minutes\s+(\d{4})/i);
      
      if (yearMatch && href && href.includes('/minutes-')) {
        const year = yearMatch[1];
        yearLinks.push({
          year,
          url: href.startsWith('http') ? href : `${BASE_URL}${href.startsWith('/') ? '' : '/'}${href}`
        });
      }
    });
    
    // Remove duplicates
    return Array.from(new Map(yearLinks.map(item => [item.url, item])).values());
  } catch (error) {
    console.error('Error fetching year links:', error);
    throw new Error('Failed to fetch year links');
  }
}

async function processYearLinks(yearLinks: { year: string; url: string }[]) {
  const results = [];
  
  for (const { year, url } of yearLinks) {
    try {
      console.log(`Processing year ${year} at ${url}`);
      
      // Create year directory if it doesn't exist
      const yearDir = path.join(DOWNLOAD_DIR, year);
      if (!fs.existsSync(yearDir)) {
        fs.mkdirSync(yearDir, { recursive: true });
      }
      
      // Fetch the year page
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);
      
      // Extract links to minutes
      const minutesLinks: { title: string; url: string }[] = [];
      
      // Find links to PDF or DOCX files
      $('a').each((_, element) => {
        const link = $(element);
        const href = link.attr('href');
        const text = link.text().trim();
        
        if (href && (href.endsWith('.pdf') || href.endsWith('.docx') || href.endsWith('.doc'))) {
          minutesLinks.push({
            title: text,
            url: href.startsWith('http') ? href : `${BASE_URL}${href.startsWith('/') ? '' : '/'}${href}`
          });
        }
      });
      
      // Download each minutes file
      const downloadedFiles = [];
      for (const { title, url } of minutesLinks) {
        try {
          // Generate a safe filename
          const fileExtension = path.extname(url);
          const safeTitle = title
            .replace(/[^a-z0-9]/gi, '_')
            .replace(/_+/g, '_')
            .toLowerCase();
          
          const filename = `${safeTitle}${fileExtension}`;
          const filePath = path.join(yearDir, filename);
          
          // Download the file
          const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream'
          });
          
          await streamPipeline(response.data, fs.createWriteStream(filePath));
          console.log(`Downloaded: ${filename}`);
          
          downloadedFiles.push({
            title,
            filename,
            url
          });
        } catch (error) {
          console.error(`Error downloading ${title}:`, error);
        }
      }
      
      results.push({
        year,
        url,
        downloadCount: downloadedFiles.length,
        files: downloadedFiles
      });
    } catch (error) {
      console.error(`Error processing year ${year}:`, error);
      results.push({
        year,
        url,
        error: error instanceof Error ? error.message : String(error),
        downloadCount: 0,
        files: []
      });
    }
  }
  
  return results;
}
