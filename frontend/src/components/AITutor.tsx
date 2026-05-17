'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, BrainCircuit, Loader2, X, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { apiUrl } from '@/lib/api';

/** Client-side input validation — catches obvious garbage before hitting the API */
function validateInput(text: string): string | null {
  const cleaned = text.trim();
  if (!cleaned || cleaned.length < 3) return 'Please type a question with at least a few words.';
  if (cleaned.length > 2000) return 'Message is too long. Please keep it under 2000 characters.';
  if (/^[\W_\s]+$/.test(cleaned)) return 'Please type a real question, not just symbols.';
  if (/^(.)\1{4,}$/.test(cleaned)) return 'That doesn\'t look like a question. Try asking about a topic!';
  const alphaOnly = cleaned.replace(/[^a-zA-Z]/g, '');
  if (alphaOnly.length < 2) return 'Please include some words in your question.';
  if (alphaOnly.length > 5) {
    const uniqueRatio = new Set(alphaOnly.toLowerCase()).size / alphaOnly.length;
    if (uniqueRatio < 0.15) return 'I couldn\'t understand that. Please rephrase your question.';
  }
  const words = cleaned.toLowerCase().split(/\s+/);
  if (words.length >= 4 && new Set(words).size === 1) return 'Please ask a specific question instead of repeating the same word.';
  return null;
}

export function AITutor() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai' | 'error'; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const accessToken = useAppStore(state => state.accessToken);

  const handleSend = async () => {
    const userMsg = query.trim();
    if (!userMsg || !accessToken) return;

    // Client-side validation
    const validationError = validateInput(userMsg);
    if (validationError) {
      setMessages(prev => [...prev, { role: 'user', text: userMsg }, { role: 'error', text: validationError }]);
      setQuery('');
      return;
    }

    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setQuery('');
    setLoading(true);

    try {
      const response = await fetch(apiUrl('/api/v1/ai/tutor/query'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ query: userMsg })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, { role: 'ai', text: data.response }]);
      } else {
        setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I am having trouble connecting to the brain module right now.' }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'Offline mode is active, but the local AI engine is not responding.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-cyan-500 rounded-full shadow-2xl flex items-center justify-center text-slate-900 z-50 border-4 border-slate-900"
      >
        <BrainCircuit className="w-8 h-8" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-28 right-8 w-[400px] h-[550px] bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-700 bg-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-cyan-400" />
                <span className="font-bold text-white">Nexus AI Tutor</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {messages.length === 0 && (
                <div className="text-center mt-20">
                  <BrainCircuit className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-500 text-sm">Ask me anything about your current courses or skills!</p>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-cyan-500 text-slate-900 rounded-tr-none' 
                      : msg.role === 'error'
                      ? 'bg-amber-500/10 text-amber-300 rounded-tl-none border border-amber-500/30'
                      : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                  }`}>
                    {msg.role === 'error' && <AlertCircle className="w-4 h-4 text-amber-400 mb-1.5 inline-block mr-1.5" />}
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-700">
                    <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-700 bg-slate-800/50">
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask a question..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-4 pr-12 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <button 
                  onClick={handleSend}
                  disabled={!query.trim() || loading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-cyan-400 hover:text-cyan-300 transition-colors disabled:opacity-40"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
