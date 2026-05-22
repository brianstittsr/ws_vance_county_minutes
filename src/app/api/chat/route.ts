import { NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { processAllMinutes } from '@/lib/pdf-processor';
import { getVectorStore } from '@/lib/vector-store';
import * as path from 'path';

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
    
    // Check if we need to index documents
    if (vectorStore.getChunks().length === 0) {
      const downloadDir = path.join(process.cwd(), 'downloads');
      const documents = await processAllMinutes(downloadDir);
      await vectorStore.indexDocuments(documents);
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
    return NextResponse.json(
      { error: 'Failed to process chat request: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
