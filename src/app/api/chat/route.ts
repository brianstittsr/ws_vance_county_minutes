import { NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { processAllWikis, WikiDocument } from '@/lib/wiki-processor';
import { getVectorStore, VectorStore } from '@/lib/vector-store';
import * as path from 'path';

// Cache for indexed documents
let cachedDocuments: WikiDocument[] | null = null;
let isIndexing = false;
let indexPromise: Promise<void> | null = null;

async function ensureIndex(vectorStore: VectorStore): Promise<void> {
  // If already has chunks, we're done
  if (vectorStore.getChunks().length > 0) {
    return;
  }
  
  // If indexing is in progress, wait for it
  if (isIndexing && indexPromise) {
    return indexPromise;
  }
  
  // Start indexing
  isIndexing = true;
  indexPromise = (async () => {
    try {
      const wikiDir = path.join(process.cwd(), 'wiki');
      const documents = processAllWikis(wikiDir);
      
      if (documents.length === 0) {
        throw new Error('No wiki documents found');
      }
      
      // Index in batches to avoid timeout
      const batchSize = 10;
      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);
        await vectorStore.indexDocuments(batch);
        console.log(`Indexed batch ${i / batchSize + 1}/${Math.ceil(documents.length / batchSize)}`);
      }
      
      cachedDocuments = documents;
    } finally {
      isIndexing = false;
    }
  })();
  
  return indexPromise;
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

    // Get or initialize vector store
    const vectorStore = await getVectorStore();
    
    // Ensure index is ready (with timeout protection)
    await Promise.race([
      ensureIndex(vectorStore),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Indexing timeout')), 25000)
      )
    ]);
    
    // Check if indexing failed
    if (vectorStore.getChunks().length === 0) {
      return NextResponse.json(
        { error: 'Search index not ready. Please try again in a moment.' },
        { status: 503 }
      );
    }

    // Search for relevant chunks
    const relevantChunks = await vectorStore.search(query, 5);
    
    // Build context from relevant chunks
    const context = relevantChunks
      .map(chunk => `From ${chunk.title} (${chunk.year}):\n${chunk.content}`)
      .join('\n\n---\n\n');

    const systemPrompt = `You are a helpful assistant that answers questions about Vance County Board of Commissioners meeting minutes. 
Use the following context from the meeting minutes to answer the user's question. If the answer is not in the context, say so.

Context:
${context}

Answer the user's question based on the context above. Be specific and cite which meeting minutes you're referencing when possible.`;

    const result = streamText({
      model: openai('gpt-4o'),
      system: systemPrompt,
      messages,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Error in chat API:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('timeout')) {
      return NextResponse.json(
        { error: 'Search index is still loading. Please wait a moment and try again.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to process chat request: ' + errorMessage },
      { status: 500 }
    );
  }
}
