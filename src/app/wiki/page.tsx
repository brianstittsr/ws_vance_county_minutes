'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Meeting {
  id: string;
  title: string;
  year: string;
  date: string;
  pdfUrl: string;
  wikiUrl: string;
  summary: string;
}

interface MeetingsByYear {
  year: string;
  meetings: Meeting[];
}

export default function WikiArchivePage() {
  const [meetingsByYear, setMeetingsByYear] = useState<MeetingsByYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMeetings();
  }, []);

  async function fetchMeetings() {
    try {
      const response = await fetch('/api/issues');
      const data = await response.json();
      
      if (data.success && data.issuesByYear) {
        // Transform issues into meetings grouped by year
        const yearMap = new Map<string, Meeting[]>();
        
        data.issuesByYear.forEach((yearData: any) => {
          const year = yearData.year;
          const meetings: Meeting[] = [];
          
          // Get unique meetings from issues
          const seenMeetings = new Set<string>();
          yearData.issues.forEach((issue: any) => {
            const meetingKey = `${issue.year}-${issue.meetingFile}`;
            if (!seenMeetings.has(meetingKey)) {
              seenMeetings.add(meetingKey);
              meetings.push({
                id: meetingKey,
                title: issue.meetingFile,
                year: issue.year,
                date: issue.meetingDate,
                pdfUrl: issue.pdfUrl,
                wikiUrl: issue.wikiUrl,
                summary: issue.summary,
              });
            }
          });
          
          if (meetings.length > 0) {
            yearMap.set(year, meetings);
          }
        });
        
        // Convert to array sorted by year descending
        const sorted = Array.from(yearMap.entries())
          .map(([year, meetings]) => ({
            year,
            meetings: meetings.sort((a, b) => {
              // Sort by date within year
              return new Date(b.date).getTime() - new Date(a.date).getTime();
            }),
          }))
          .sort((a, b) => parseInt(b.year) - parseInt(a.year));
        
        setMeetingsByYear(sorted);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  }

  // Filter meetings
  const filteredMeetings = meetingsByYear.map(yearGroup => ({
    ...yearGroup,
    meetings: yearGroup.meetings.filter(meeting => {
      const matchesYear = !selectedYear || meeting.year === selectedYear;
      const matchesSearch = !searchTerm || 
        meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        meeting.summary.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesYear && matchesSearch;
    }),
  })).filter(yearGroup => yearGroup.meetings.length > 0);

  const allYears = meetingsByYear.map(y => y.year);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading archive...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-900 to-blue-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Meeting Archive</h1>
              <p className="text-blue-200 mt-1">Vance County Board of Commissioners Minutes (2010-2026)</p>
            </div>
            <Link 
              href="/" 
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search meetings..."
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
                {allYears.map(year => (
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
      </div>

      {/* Archive List */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        {filteredMeetings.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500">No meetings found matching your criteria.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredMeetings.map((yearGroup) => (
              <div key={yearGroup.year} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-800">{yearGroup.year}</h2>
                  <p className="text-sm text-gray-600">{yearGroup.meetings.length} meetings</p>
                </div>
                
                <div className="divide-y divide-gray-100">
                  {yearGroup.meetings.map((meeting) => (
                    <div key={meeting.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {meeting.title}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {meeting.date}
                          </p>
                          {meeting.summary && meeting.summary !== 'Analysis failed. Please review original document.' && (
                            <p className="text-gray-600 mt-2 text-sm line-clamp-2">
                              {meeting.summary}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex gap-2 shrink-0">
                          <a
                            href={meeting.pdfUrl}
                            download
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            PDF
                          </a>
                          <a
                            href={meeting.wikiUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-sm transition-colors"
                          >
                            Wiki
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
