'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, BrainCircuit, Loader2, X, Minimize2, Maximize2, AlertCircle, Trash2, Sparkles } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { apiUrl } from '@/lib/api';

/** Client-side input validation */
function validateInput(text: string): string | null {
  const cleaned = text.trim();
  if (!cleaned || cleaned.length < 3) return 'Please type a question with at least a few words.';
  if (cleaned.length > 2000) return 'Message is too long (max 2000 chars).';
  if (/^[\W_\s]+$/.test(cleaned)) return 'Please type a real question, not just symbols.';
  if (/^(.)\1{4,}$/.test(cleaned)) return "That doesn't look like a question.";
  const alpha = cleaned.replace(/[^a-zA-Z]/g, '');
  if (alpha.length < 2) return 'Please include some words in your question.';
  if (alpha.length > 5 && new Set(alpha.toLowerCase()).size / alpha.length < 0.15) return "I couldn't understand that. Please rephrase.";
  const words = cleaned.toLowerCase().split(/\s+/);
  if (words.length >= 4 && new Set(words).size === 1) return 'Please ask a specific question.';
  return null;
}

/** Simple markdown-to-JSX renderer for bold, italic, bullets, code */
function renderMarkdown(text: string) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    // Bold
    let processed = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Italic
    processed = processed.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // Inline code
    processed = processed.replace(/`(.+?)`/g, '<code class="bg-slate-700/50 px-1 py-0.5 rounded text-cyan-300 text-xs">$1</code>');
    // Bullet points
    if (/^[-•]\s/.test(processed)) {
      processed = processed.replace(/^[-•]\s/, '');
      return <li key={i} className="ml-4 list-disc" dangerouslySetInnerHTML={{ __html: processed }} />;
    }
    // Numbered list
    if (/^\d+\.\s/.test(processed)) {
      return <li key={i} className="ml-4 list-decimal" dangerouslySetInnerHTML={{ __html: processed }} />;
    }
    if (!processed.trim()) return <br key={i} />;
    return <p key={i} dangerouslySetInnerHTML={{ __html: processed }} />;
  });
}

const quickPrompts = [
  'Explain photosynthesis',
  'What is Newton\'s 2nd law?',
  'Solve x² + 5x + 6 = 0',
  'Help with derivatives',
];

type ChatMessage = { role: 'user' | 'ai' | 'error'; text: string };

export function AITutor() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const accessToken = useAppStore(state => state.accessToken);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (text?: string) => {
    const userMsg = (text || query).trim();
    if (!userMsg || !accessToken || loading) return;

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
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify({ query: userMsg })
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, { role: 'ai', text: data.response }]);
      } else {
        setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I\'m having trouble right now. Please try again.' }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'Connection error. Please check your network.' }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => setMessages([]);

  return (
    <>
      {/* Floating Action Button — hidden when chat is open */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => { setIsOpen(true); setIsMinimized(false); }}
            className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full shadow-lg shadow-cyan-500/25 flex items-center justify-center text-white z-50 hover:shadow-cyan-500/40 transition-shadow"
          >
            <BrainCircuit className="w-7 h-7" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{
              opacity: 1, y: 0, scale: 1,
              height: isMinimized ? 56 : 520,
              width: isMinimized ? 280 : 380,
            }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/40 flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-800/80 to-slate-800/50 border-b border-slate-700/60 shrink-0 cursor-pointer select-none"
              onClick={() => isMinimized && setIsMinimized(false)}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <BrainCircuit className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="font-semibold text-white text-sm">Nexus AI Tutor</span>
                  {!isMinimized && (
                    <span className="block text-[10px] text-slate-500 -mt-0.5">
                      {loading ? 'Thinking...' : 'Online'}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {!isMinimized && messages.length > 0 && (
                  <button onClick={(e) => { e.stopPropagation(); clearChat(); }}
                    className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-all"
                    title="Clear chat">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
                  title={isMinimized ? 'Maximize' : 'Minimize'}
                >
                  {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
                  title="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Body — hidden when minimized */}
            {!isMinimized && (
              <>
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-hide">
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                      <div className="w-14 h-14 bg-cyan-500/10 rounded-2xl flex items-center justify-center mb-4 border border-cyan-500/20">
                        <BrainCircuit className="w-7 h-7 text-cyan-400" />
                      </div>
                      <p className="text-white font-medium text-sm mb-1">How can I help?</p>
                      <p className="text-slate-500 text-xs mb-5 max-w-[240px]">Ask about any subject — math, science, history, CS, and more.</p>
                      <div className="grid grid-cols-2 gap-2 w-full max-w-[300px]">
                        {quickPrompts.map((p) => (
                          <button key={p} onClick={() => handleSend(p)}
                            className="text-left p-2.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/30 rounded-xl text-xs text-slate-400 hover:text-slate-200 transition-all flex items-start gap-1.5"
                          >
                            <Sparkles className="w-3 h-3 text-cyan-500 mt-0.5 shrink-0" />
                            <span className="line-clamp-2">{p}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl text-[13px] leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white px-3.5 py-2.5 rounded-br-md'
                          : msg.role === 'error'
                          ? 'bg-amber-500/10 text-amber-300 px-3.5 py-2.5 rounded-bl-md border border-amber-500/20'
                          : 'bg-slate-800/80 text-slate-200 px-3.5 py-2.5 rounded-bl-md border border-slate-700/60'
                      }`}>
                        {msg.role === 'error' && <AlertCircle className="w-3.5 h-3.5 text-amber-400 inline mr-1.5 -mt-0.5" />}
                        {msg.role === 'ai' ? (
                          <div className="space-y-1.5 ai-response">{renderMarkdown(msg.text)}</div>
                        ) : (
                          msg.text
                        )}
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-slate-800/80 px-4 py-3 rounded-2xl rounded-bl-md border border-slate-700/60 flex items-center gap-2">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <div className="px-3 py-3 border-t border-slate-700/50 bg-slate-800/30 shrink-0">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                      placeholder="Ask a question..."
                      disabled={loading}
                      className="flex-1 bg-slate-800/60 border border-slate-700/60 rounded-xl py-2.5 px-3.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all disabled:opacity-50"
                    />
                    <button
                      onClick={() => handleSend()}
                      disabled={!query.trim() || loading}
                      className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
