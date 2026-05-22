import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export async function GET(
  request: Request,
  { params }: { params: { path: string[] } }
) {
  try {
    // Try multiple possible paths for the downloads directory
    const possiblePaths = [
      path.join(process.cwd(), 'downloads'),
      path.join(process.cwd(), '..', 'downloads'),
      path.join(process.cwd(), '.next', 'server', 'downloads'),
      '/var/task/downloads', // Vercel serverless path
    ];
    
    let downloadsDir = '';
    let filePath = '';
    
    for (const tryPath of possiblePaths) {
      const tryFilePath = path.join(tryPath, ...params.path);
      console.log('Trying download path:', tryFilePath);
      if (fs.existsSync(tryFilePath)) {
        downloadsDir = tryPath;
        filePath = tryFilePath;
        console.log('Found file at:', filePath);
        break;
      }
    }
    
    if (!filePath) {
      return new NextResponse('File not found', { status: 404 });
    }
    
    // Security check: ensure file is within downloads directory
    if (!filePath.startsWith(downloadsDir)) {
      return new NextResponse('Access denied', { status: 403 });
    }
    
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return new NextResponse('Error serving file', { status: 500 });
  }
}
