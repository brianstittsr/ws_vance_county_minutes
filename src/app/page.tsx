'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const startScraping = async () => {
    setIsLoading(true);
    setMessage('Starting to scrape minutes...');
    setError('');
    
    try {
      const response = await fetch('/api/scrape', { method: 'POST' });
      const data = await response.json();
      
      if (response.ok) {
        setMessage(data.message);
      } else {
        setError(data.error || 'An error occurred while scraping');
      }
    } catch (err) {
      setError('Failed to start scraping process');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Vance County Minutes Scraper</h1>
      
      <div className="mb-8 text-center">
        <p className="mb-4">
          This application scrapes meeting minutes from the Vance County Board of Commissioners website,
          extracts links to minutes, and downloads them organized by year.
        </p>
        
        <button
          onClick={startScraping}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isLoading ? 'Scraping...' : 'Start Scraping'}
        </button>
      </div>

      {message && (
        <div className="mt-4 p-4 bg-green-100 text-green-800 rounded-md">
          {message}
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-800 rounded-md">
          {error}
        </div>
      )}
    </main>
  );
}
