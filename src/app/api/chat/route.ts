import { NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { processAllWikis, WikiDocument } from '@/lib/wiki-processor';
import * as fs from 'fs';
import * as path from 'path';

// Simple in-memory cache for wiki documents
let cachedWikis: WikiDocument[] | null = null;
let cacheLoadTime = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function loadWikis(): WikiDocument[] {
  const now = Date.now();
  if (cachedWikis && (now - cacheLoadTime) < CACHE_TTL) {
    return cachedWikis;
  }
  
  const wikiDir = path.join(process.cwd(), 'wiki');
  cachedWikis = processAllWikis(wikiDir);
  cacheLoadTime = now;
  console.log(`Loaded ${cachedWikis.length} wiki documents`);
  return cachedWikis;
}

function searchWikis(wikis: WikiDocument[], query: string, limit: number = 5) {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
  
  const scored = wikis.map(wiki => {
    let score = 0;
    const searchable = `${wiki.title} ${wiki.summary} ${wiki.topics.join(' ')} ${wiki.content}`.toLowerCase();
    
    // Full phrase match gets high score
    if (searchable.includes(queryLower)) {
      score += 10;
    }
    
    // Individual word matches
    queryWords.forEach(word => {
      if (searchable.includes(word)) {
        score += 1;
        // Bonus for title matches
        if (wiki.title.toLowerCase().includes(word)) score += 2;
        if (wiki.topics.some(t => t.toLowerCase().includes(word))) score += 2;
      }
    });
    
    return { wiki, score };
  });
  
  return scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.wiki);
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    const lastMessage = messages[messages.length - 1];
    const query = lastMessage.content;

    // Load wikis (cached)
    const wikis = loadWikis();
    
    if (wikis.length === 0) {
      return NextResponse.json(
        { error: 'No wiki documents found. Please generate wikis first.' },
        { status: 500 }
      );
    }

    // Search for relevant wikis
    const relevantWikis = searchWikis(wikis, query, 5);
    
    if (relevantWikis.length === 0) {
      // No relevant docs found, but still try to answer
      console.log('No relevant wikis found for query:', query);
    }
    
    // Build context from relevant wikis
    const context = relevantWikis
      .map(wiki => {
        const content = wiki.content.slice(0, 3000); // Limit content length
        return `Meeting: ${wiki.title} (${wiki.year}, ${wiki.meetingDate})\nSummary: ${wiki.summary}\nTopics: ${wiki.topics.join(', ')}\nKey Decisions: ${wiki.keyDecisions.join(', ')}\n\nContent:\n${content}`;
      })
      .join('\n\n---\n\n');

    const systemPrompt = `You are a helpful assistant that answers questions about Vance County Board of Commissioners meeting minutes from 2010-2026.

${context ? `Here are relevant meeting minutes to help answer the question:

${context}

Use the information above to answer the user's question. Be specific and cite which meeting and year you're referencing.` : 'No specific meeting minutes were found for this query, but you can provide general information about the Vance County Board of Commissioners based on your training data.'}

If the answer is not in the provided context, say so clearly.`;

    const result = streamText({
      model: openai('gpt-4o'),
      system: systemPrompt,
      messages,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Error in chat API:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return NextResponse.json(
      { error: 'Failed to process chat request: ' + errorMessage },
      { status: 500 }
    );
  }
}
