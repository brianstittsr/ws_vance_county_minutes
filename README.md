# Vance County Minutes Chat

AI-powered chat interface for querying Vance County Board of Commissioners meeting minutes. This application scrapes meeting minutes from the Vance County website, processes them with AI, and provides an intelligent chat interface to ask questions about the content.

## Features

- **Web Scraping**: Automatically scrapes meeting minutes from the Vance County Board of Commissioners website
- **Incremental Updates**: Only downloads new files since the last scrape (tracks last run time)
- **PDF Processing**: Extracts text from PDF meeting minutes using pdfjs-dist
- **Vector Search**: Uses OpenAI embeddings for semantic search across all meeting minutes
- **AI Chat Interface**: Mobile-responsive chat interface to ask questions about meeting minutes
- **Streaming Responses**: Real-time streaming of AI responses
- **Karpathy-Style Wikis**: AI-generated markdown wikis for easy browsing and search

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn
- OpenAI API key

### Installation

1. Clone this repository or download the source code
2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your OpenAI API key:

```
OPENAI_API_KEY=your_openai_api_key_here
```

### Running the Application

1. Start the development server:

```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser
3. Start chatting with the meeting minutes!

### Scraping Minutes

To scrape the latest meeting minutes:

```bash
curl -X POST http://localhost:3000/api/scrape
```

Or use the web interface by navigating to the scrape endpoint.

### Generating Wikis

To generate Karpathy-style wikis for all meeting minutes:

```bash
npm run wiki
```

Or via API:

```bash
curl -X POST http://localhost:3000/api/wiki
```

To scrape new minutes AND generate wikis:

```bash
npm run process-all
```

The wikis will be created in the `wiki/` folder with:
- `wiki/index.md` - Main navigation page
- `wiki/{year}/index.md` - Year overview with meeting list
- `wiki/{year}/{meeting}.md` - Individual meeting analysis

## Project Structure

- `src/app/page.tsx`: Main chat interface (mobile-responsive)
- `src/app/api/chat/route.ts`: Chat API with RAG (Retrieval-Augmented Generation)
- `src/app/api/scrape/route.ts`: Web scraping API with incremental updates
- `src/lib/pdf-processor.ts`: PDF text extraction utilities
- `src/lib/vector-store.ts`: Vector database for semantic search
- `src/lib/wiki-generator.ts`: Generates Karpathy-style markdown wikis from meeting minutes
- `src/app/api/wiki/route.ts`: API endpoint to trigger wiki generation
- `downloads/`: Directory where meeting minutes are saved (organized by year)
- `wiki/`: Generated markdown wikis (organized by year)

## How It Works

1. **Scraping**: The application fetches the Vance County Board of Commissioners page, extracts year links, and downloads meeting minutes
2. **Processing**: PDF files are processed and text is extracted
3. **Indexing**: Text is chunked and embedded using OpenAI's embedding model
4. **Chat**: When you ask a question, the system:
   - Searches for relevant chunks using vector similarity
   - Builds context from the most relevant meeting minutes
   - Sends the question and context to GPT-4 for an intelligent response

### Wiki Generation

1. **Analysis**: New PDFs are analyzed by GPT-4 to extract:
   - Meeting summaries
   - Key decisions
   - Action items
   - Topics discussed
   - Budget items
   - Ordinances
   - Public comments
2. **Structure**: Content is organized into Karpathy-style markdown with:
   - Clear hierarchical structure
   - Cross-linking between meetings
   - Year-based organization
   - Search-friendly formatting
3. **Navigation**: Automatic generation of:
   - Year index pages
   - Main wiki index
   - Topic-based summaries

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key (required for chat functionality)

## Cron Job Setup

To set up automatic scraping and wiki generation with a cron job, you can use a service like:

- **Vercel Cron Jobs**: Add a cron job in `vercel.json`
- **GitHub Actions**: Create a workflow file in `.github/workflows/`
- **External cron service**: Use a service like cron-job.org to call the endpoints

Example cron job configuration (runs daily at 2 AM):

```json
{
  "crons": [
    {
      "path": "/api/scrape",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/wiki",
      "schedule": "0 3 * * *"
    }
  ]
}
```

This will scrape new minutes at 2 AM and generate wikis at 3 AM.

## License

MIT
