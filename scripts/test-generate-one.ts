import { generateWikis, getWikiStats } from './wiki-generator.js';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  // Test with just one file
  const testFile = path.join(process.cwd(), 'downloads', '2013', 'april_8_2013.pdf');
  
  console.log('📝 Testing Wiki Generation for Single File\n');
  console.log('File:', testFile);
  console.log('Exists:', fs.existsSync(testFile));
  
  // Clear tracking for this test
  const trackingFile = path.join(process.cwd(), 'wiki-processed.json');
  if (fs.existsSync(trackingFile)) {
    const tracking = JSON.parse(fs.readFileSync(trackingFile, 'utf-8'));
    // Remove april_8_2013 from processed files to force reprocessing
    tracking.processedFiles = tracking.processedFiles.filter(
      (p: any) => !p.filePath.includes('april_8_2013')
    );
    fs.writeFileSync(trackingFile, JSON.stringify(tracking, null, 2));
    console.log('Cleared april_8_2013 from tracking\n');
  }
  
  // Delete existing wiki if present
  const wikiFile = path.join(process.cwd(), 'wiki', '2013', 'april_8_2013.md');
  if (fs.existsSync(wikiFile)) {
    fs.unlinkSync(wikiFile);
    console.log('Deleted existing wiki file\n');
  }
  
  console.log('Generating wiki for april_8_2013.pdf...\n');
  
  try {
    const result = await generateWikis(path.join(process.cwd(), 'downloads'));
    
    console.log('\n✅ Done!');
    console.log(`  Processed: ${result.processed} file(s)`);
    console.log(`  New files: ${result.newFiles.length}`);
    
    if (result.errors.length > 0) {
      console.log('\n  Errors:');
      result.errors.forEach(err => console.log(`    ⚠️ ${err}`));
    }
    
    // Check if wiki was created
    if (fs.existsSync(wikiFile)) {
      const content = fs.readFileSync(wikiFile, 'utf-8');
      console.log('\n📄 Generated Wiki Content:');
      console.log('==========================');
      console.log(content.slice(0, 2000));
      console.log('==========================');
    } else {
      console.log('\n❌ Wiki file was not created');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error);
  }
}

main();
