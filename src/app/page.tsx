'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const actions2010 = [
  {
    category: 'Infrastructure',
    items: [
      'Water system improvements and expansion',
      'Road maintenance and paving projects',
      'Facility upgrades for county buildings',
    ],
    icon: '🏗️',
  },
  {
    category: 'Public Safety',
    items: [
      'Emergency services enhancements',
      'Law enforcement equipment upgrades',
      'Fire department support initiatives',
    ],
    icon: '🚔',
  },
  {
    category: 'Economic Development',
    items: [
      'Business recruitment and retention',
      'Industrial park development',
      'Tourism promotion activities',
    ],
    icon: '📈',
  },
  {
    category: 'Community Services',
    items: [
      'Youth development programs',
      'Senior citizen support services',
      'Health and wellness initiatives',
    ],
    icon: '👥',
  },
];

const stats2010 = [
  { label: 'Meetings Held', value: '24+', icon: '📅' },
  { label: 'Resolutions Passed', value: '45+', icon: '📋' },
  { label: 'Budget Allocated', value: '$12M+', icon: '💰' },
  { label: 'Projects Approved', value: '30+', icon: '🎯' },
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          assistantContent += chunk;
          
          setMessages((prev) => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage?.role === 'assistant') {
              lastMessage.content = assistantContent;
            } else {
              newMessages.push({
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: assistantContent,
              });
            }
            return newMessages;
          });
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInput(question);
    setShowChat(true);
    setTimeout(() => {
      const syntheticEvent = {
        preventDefault: () => {},
      } as any;
      handleSubmit(syntheticEvent);
    }, 100);
  };

  if (showChat) {
    return (
      <main className="flex flex-col h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-900 to-blue-700 text-white px-4 py-3 sm:px-6 shadow-lg">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Vance County Minutes Chat</h1>
              <p className="text-sm text-blue-200 mt-1">Ask questions about Board of Commissioners meeting minutes</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowChat(false)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-medium text-sm transition-colors"
              >
                ← Back to Dashboard
              </button>
              <Link 
                href="/issues" 
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium text-sm transition-colors"
              >
                Browse Issues
              </Link>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Welcome to Vance County Minutes Chat</h2>
                <p className="text-gray-500">Ask any question about the Board of Commissioners meeting minutes</p>
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-800 border border-gray-200 shadow-sm'
                }`}>
                  <p className="text-sm sm:text-base whitespace-pre-wrap break-words">{message.content}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="bg-white border-t border-gray-200 px-4 py-4 sm:px-6 shadow-lg">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question about the meeting minutes..."
                disabled={isLoading}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium text-sm sm:text-base"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Hero Section */}
      <header className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold">Vance County Board of Commissioners</h1>
              <p className="text-blue-200 mt-2 text-lg">Meeting Minutes Archive & AI Analysis</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowChat(true)}
                className="px-6 py-3 bg-white text-blue-900 rounded-lg hover:bg-blue-50 font-semibold shadow-lg transition-all hover:shadow-xl"
              >
                💬 Start Chat
              </button>
              <Link 
                href="/issues" 
                className="px-6 py-3 bg-blue-600/50 hover:bg-blue-600/70 text-white rounded-lg font-semibold transition-colors border border-blue-400"
              >
                📋 Browse Issues
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Featured Year - 2010 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="text-3xl">📅</span>
              2010 Year in Review - Actions & Accomplishments
            </h2>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gradient-to-b from-orange-50 to-white">
            {stats2010.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl p-4 shadow-md border border-orange-100 text-center">
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="text-2xl font-bold text-orange-600">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Action Categories */}
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Key Action Areas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {actions2010.map((action, index) => (
                <div key={index} className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{action.icon}</span>
                    <h4 className="font-bold text-gray-800">{action.category}</h4>
                  </div>
                  <ul className="space-y-2">
                    {action.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-700">
                        <span className="text-green-500 mt-1">✓</span>
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="px-6 pb-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3">Quick Questions About 2010:</h4>
              <div className="flex flex-wrap gap-2">
                {[
                  'What infrastructure projects were approved in 2010?',
                  'What was the 2010 budget allocation?',
                  'What youth programs started in 2010?',
                  'What economic development happened in 2010?',
                ].map((question, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickQuestion(question)}
                    className="px-4 py-2 bg-white hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium shadow-sm transition-colors border border-blue-200"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* All Years Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Chat Card */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">AI Chat Assistant</h3>
            <p className="text-gray-600 mb-4">Ask questions about any meeting minutes from 2010-2026. Get instant answers with citations.</p>
            <button 
              onClick={() => setShowChat(true)}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              Start Chatting
            </button>
          </div>

          {/* Issues Card */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Browse Issues</h3>
            <p className="text-gray-600 mb-4">Explore all topics and decisions made by the Board. Filter by year and download PDFs.</p>
            <Link 
              href="/issues"
              className="block w-full px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold transition-colors text-center"
            >
              View Issues
            </Link>
          </div>

          {/* Archive Card */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Meeting Archive</h3>
            <p className="text-gray-600 mb-4">Access all 354 meeting minutes from 2010-2026. Browse by year or search the wiki.</p>
            <Link 
              href="/wiki"
              className="block w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors text-center"
            >
              View Archive
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <p>Vance County Board of Commissioners Meeting Minutes Archive</p>
          <p className="text-sm mt-2">2010-2026 • AI-Powered Analysis & Search</p>
        </div>
      </footer>
    </main>
  );
}
