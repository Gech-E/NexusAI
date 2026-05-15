'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Send, Loader2, Sparkles } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

const suggestedPrompts = [
  'Explain the chain rule in calculus',
  'What is the difference between mitosis and meiosis?',
  'Help me understand Newton\'s second law',
  'Solve: 2x² + 5x - 3 = 0',
  'Explain photosynthesis step by step',
  'What are the key events of World War II?',
];

export default function AITutorPage() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const accessToken = useAppStore(state => state.accessToken);

  const handleSend = async (text?: string) => {
    const msg = text || query;
    if (!msg.trim() || !accessToken) return;

    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setQuery('');
    setLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/ai/tutor/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify({ query: msg })
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, { role: 'ai', text: data.response }]);
      } else {
        setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I am having trouble right now. Please try again.' }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'Offline mode is active, but the local AI engine is not responding.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">AI Tutor</h1>
        <p className="text-slate-400 text-sm">Your personal AI learning assistant — works offline</p>
      </motion.div>

      <div className="glassmorphism rounded-3xl overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 220px)' }}>
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 bg-cyan-500/10 rounded-3xl flex items-center justify-center mb-6 border border-cyan-500/20">
                <BrainCircuit className="w-10 h-10 text-cyan-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Ask me anything</h2>
              <p className="text-slate-500 text-sm max-w-md mb-8">
                I can help with math, science, history, language, and more. Powered by local AI inference.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
                {suggestedPrompts.slice(0, 4).map((prompt) => (
                  <button key={prompt} onClick={() => handleSend(prompt)}
                    className="text-left p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl text-sm text-slate-300 transition-all flex items-start gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                    <span className="line-clamp-2">{prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] p-4 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-cyan-500 text-slate-900 rounded-tr-sm'
                  : 'bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700'
              }`}>
                {msg.role === 'ai' && <BrainCircuit className="w-4 h-4 text-cyan-400 mb-2" />}
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-800 p-4 rounded-2xl rounded-tl-sm border border-slate-700 flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                <span className="text-slate-500 text-sm">Thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="relative">
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask a question about any subject..."
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3.5 pl-4 pr-14 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-slate-500"
            />
            <button onClick={() => handleSend()}
              disabled={!query.trim() || loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-900 rounded-lg transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-slate-600 mt-2 text-center">Nexus AI Tutor — Powered by local inference engine</p>
        </div>
      </div>
    </div>
  );
}
