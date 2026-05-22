import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';
import { MinuteDocument } from './pdf-processor';

export interface DocumentChunk {
  id: string;
  documentId: string;
  title: string;
  year: string;
  content: string;
  embedding: number[];
}

export class VectorStore {
  private chunks: DocumentChunk[] = [];
  private embeddingModel = 'text-embedding-3-small';

  async indexDocuments(documents: MinuteDocument[]): Promise<void> {
    this.chunks = [];
    
    for (const doc of documents) {
      // Split content into chunks for better retrieval
      const chunks = this.splitText(doc.content, 500);
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const { embedding } = await embed({
          model: openai.embedding(this.embeddingModel),
          value: chunk,
        });
        
        this.chunks.push({
          id: `${doc.id}-chunk-${i}`,
          documentId: doc.id,
          title: doc.title,
          year: doc.year,
          content: chunk,
          embedding,
        });
      }
    }
  }

  private splitText(text: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    const words = text.split(/\s+/);
    
    for (let i = 0; i < words.length; i += chunkSize) {
      chunks.push(words.slice(i, i + chunkSize).join(' '));
    }
    
    return chunks;
  }

  async search(query: string, topK: number = 5): Promise<DocumentChunk[]> {
    const { embedding: queryEmbedding } = await embed({
      model: openai.embedding(this.embeddingModel),
      value: query,
    });

    const similarities = this.chunks.map(chunk => ({
      chunk,
      similarity: this.cosineSimilarity(queryEmbedding, chunk.embedding),
    }));

    similarities.sort((a, b) => b.similarity - a.similarity);
    
    return similarities.slice(0, topK).map(s => s.chunk);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  getChunks(): DocumentChunk[] {
    return this.chunks;
  }
}

let globalVectorStore: VectorStore | null = null;

export async function getVectorStore(): Promise<VectorStore> {
  if (!globalVectorStore) {
    globalVectorStore = new VectorStore();
  }
  return globalVectorStore;
}
