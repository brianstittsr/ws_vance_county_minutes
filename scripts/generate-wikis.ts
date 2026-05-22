import * as dotenv from 'dotenv';
import { generateWikis, getWikiStats } from './wiki-generator.js';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

async function main() {
  console.log('📝 Vance County Minutes Wiki Generator\n');
  
  // Show current stats
  const stats = getWikiStats();
  console.log('Current Status:');
  console.log(`  Total files processed: ${stats.totalFiles}`);
  console.log(`  Total years: ${stats.totalYears}`);
  console.log(`  Last run: ${stats.lastRun || 'Never'}\n`);
  
  // Generate wikis
  console.log('Processing new minutes...\n');
  
  const downloadDir = path.join(process.cwd(), 'downloads');
  const result = await generateWikis(downloadDir);
  
  console.log('\n✅ Done!');
  console.log(`  Processed: ${result.processed} new file(s)`);
  
  if (result.newFiles.length > 0) {
    console.log('\n  New files found:');
    result.newFiles.forEach(file => {
      console.log(`    - ${path.relative(downloadDir, file)}`);
    });
  }
  
  if (result.errors.length > 0) {
    console.log('\n  Errors:');
    result.errors.forEach(err => console.log(`    ⚠️ ${err}`));
  }
  
  // Show updated stats
  const newStats = getWikiStats();
  console.log('\n📊 Updated Status:');
  console.log(`  Total files processed: ${newStats.totalFiles}`);
  console.log(`  Total years: ${newStats.totalYears}`);
  console.log(`  Last run: ${newStats.lastRun}`);
  
  console.log('\n🌐 Wiki available at: ./wiki/index.md');
}

main().catch(console.error);
