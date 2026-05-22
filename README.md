# Vance County Minutes Scraper

This Next.js application scrapes meeting minutes from the Vance County Board of Commissioners website, extracts links to minutes, and downloads them organized by year.

## Features

- Scrapes the main Vance County Board of Commissioners page to find all year links
- Visits each year page to extract links to individual meeting minutes
- Downloads PDF and DOCX files and organizes them by year in a local folder
- Simple web interface to start the scraping process and view results

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn

### Installation

1. Clone this repository or download the source code
2. Install dependencies:

```bash
npm install
# or
yarn install
```

### Running the Application

1. Start the development server:

```bash
npm run dev
# or
yarn dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser
3. Click the "Start Scraping" button to begin the scraping process
4. Files will be downloaded to the `downloads` folder, organized by year

## Project Structure

- `src/app/page.tsx`: Main page with the user interface
- `src/app/api/scrape/route.ts`: API route that handles the scraping process
- `downloads/`: Directory where files are saved (created automatically)

## How It Works

1. The application fetches the main Vance County Board of Commissioners page
2. It extracts links to year pages (e.g., "Minutes 2024")
3. For each year page, it extracts links to individual meeting minutes
4. It downloads each file and saves it to the appropriate year folder
5. Results are displayed on the web interface

## License

MIT
