import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';
import { WikiDocument } from './wiki-processor';

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

  async indexDocuments(documents: WikiDocument[]): Promise<void> {
    this.chunks = [];
    
    for (const doc of documents) {
      // Create multiple chunk types for better retrieval
      const chunksToEmbed: { id: string; content: string; metadata: any }[] = [];
      
      // 1. Full content (for comprehensive context)
      chunksToEmbed.push({
        id: `${doc.id}-full`,
        content: `Meeting: ${doc.title}\nDate: ${doc.meetingDate}\nYear: ${doc.year}\n\nSummary: ${doc.summary}\n\nFull Content:\n${doc.content.slice(0, 2000)}`,
        metadata: { type: 'full', doc }
      });
      
      // 2. Key decisions (if any)
      if (doc.keyDecisions && doc.keyDecisions.length > 0) {
        chunksToEmbed.push({
          id: `${doc.id}-decisions`,
          content: `Meeting: ${doc.title}\nDate: ${doc.meetingDate}\nKey Decisions:\n${doc.keyDecisions.map(d => `- ${d}`).join('\n')}`,
          metadata: { type: 'decisions', doc }
        });
      }
      
      // 3. Topics (if any)
      if (doc.topics && doc.topics.length > 0) {
        chunksToEmbed.push({
          id: `${doc.id}-topics`,
          content: `Meeting: ${doc.title}\nDate: ${doc.meetingDate}\nTopics Discussed:\n${doc.topics.map(t => `- ${t}`).join('\n')}`,
          metadata: { type: 'topics', doc }
        });
      }
      
      // 4. Content sections (split by headers)
      const sections = this.splitByHeaders(doc.content);
      for (let i = 0; i < sections.length; i++) {
        if (sections[i].length > 50) {
          chunksToEmbed.push({
            id: `${doc.id}-section-${i}`,
            content: `Meeting: ${doc.title}\nDate: ${doc.meetingDate}\nSection: ${sections[i].slice(0, 1000)}`,
            metadata: { type: 'section', doc }
          });
        }
      }
      
      // Generate embeddings for all chunks
      for (const chunk of chunksToEmbed) {
        const { embedding } = await embed({
          model: openai.embedding(this.embeddingModel),
          value: chunk.content,
        });
        
        this.chunks.push({
          id: chunk.id,
          documentId: doc.id,
          title: doc.title,
          year: doc.year,
          content: chunk.content,
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

  private splitByHeaders(text: string): string[] {
    // Split content by markdown headers
    const sections: string[] = [];
    const lines = text.split('\n');
    let currentSection = '';
    
    for (const line of lines) {
      if (line.match(/^#{2,3}\s/)) {
        if (currentSection.trim()) {
          sections.push(currentSection.trim());
        }
        currentSection = line + '\n';
      } else {
        currentSection += line + '\n';
      }
    }
    
    if (currentSection.trim()) {
      sections.push(currentSection.trim());
    }
    
    return sections;
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
