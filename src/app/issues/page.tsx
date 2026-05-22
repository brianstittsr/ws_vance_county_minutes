'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Issue {
  id: string;
  title: string;
  year: string;
  meetingDate: string;
  meetingFile: string;
  summary: string;
  keyDecisions: string[];
  actionItems: string[];
  pdfUrl: string;
  wikiUrl: string;
}

interface IssuesData {
  totalIssues: number;
  years: string[];
  issues: Issue[];
}

export default function IssuesPage() {
  const [issuesData, setIssuesData] = useState<IssuesData | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchIssues();
  }, [selectedYear, searchTerm]);

  async function fetchIssues() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedYear) params.append('year', selectedYear);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`/api/issues?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setIssuesData(data);
        setError(null);
      } else {
        setError(data.error || 'Failed to load issues');
      }
    } catch (err) {
      setError('Failed to fetch issues');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading issues...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-xl">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Vance County Issues</h1>
              <p className="text-sm text-gray-600 mt-1">
                {issuesData?.totalIssues} issues addressed across {issuesData?.years.length} years
              </p>
            </div>
            <Link 
              href="/" 
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Chat
            </Link>
          </div>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search issues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Years</option>
                {issuesData?.years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              {(searchTerm || selectedYear) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedYear('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Issues List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="font-semibold text-gray-700">Issues List</h2>
              </div>
              <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
                {issuesData?.issues.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No issues found
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {issuesData?.issues.map((issue) => (
                      <button
                        key={issue.id}
                        onClick={() => setSelectedIssue(issue)}
                        className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                          selectedIssue?.id === issue.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {issue.title}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {issue.meetingDate}
                            </p>
                          </div>
                          <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600 shrink-0">
                            {issue.year}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Issue Detail */}
          <div className="lg:col-span-2">
            {selectedIssue ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-3">
                        {selectedIssue.year}
                      </span>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedIssue.title}
                      </h2>
                      <p className="text-gray-600 mt-2">
                        Meeting: {selectedIssue.meetingFile}
                      </p>
                      <p className="text-gray-500 text-sm">
                        Date: {selectedIssue.meetingDate}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <a
                        href={selectedIssue.pdfUrl}
                        download
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        PDF
                      </a>
                      <a
                        href={selectedIssue.wikiUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                      >
                        Wiki
                      </a>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Summary */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Summary</h3>
                    <p className="text-gray-700 leading-relaxed">
                      {selectedIssue.summary}
                    </p>
                  </div>

                  {/* Key Decisions */}
                  {selectedIssue.keyDecisions.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Decisions</h3>
                      <ul className="space-y-2">
                        {selectedIssue.keyDecisions.map((decision, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-medium shrink-0 mt-0.5">
                              {index + 1}
                            </span>
                            <span className="text-gray-700">{decision}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Items */}
                  {selectedIssue.actionItems.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Action Items</h3>
                      <ul className="space-y-2">
                        {selectedIssue.actionItems.map((item, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-sm shrink-0 mt-0.5">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                            </span>
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Select an Issue</h3>
                <p className="text-gray-500">
                  Click on any issue from the list to view details, key decisions, and download the PDF.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
