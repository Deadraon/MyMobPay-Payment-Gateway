'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  Copy,
  Check,
  RotateCcw,
  Maximize2,
  Minimize2,
  ExternalLink,
  ChevronDown,
  Layers,
  ArrowRight
} from 'lucide-react';

const SUGGESTED_QUESTIONS = [
  { label: 'Create a payment link', query: 'How do I generate a dynamic UPI payment link and QR code?' },
  { label: 'Verify webhooks (HMAC)', query: 'How do I verify the HMAC-SHA256 signature on MyMobPay webhooks?' },
  { label: '0% fees vs Razorpay', query: 'Why does MyMobPay charge 0% commission compared to traditional gateways?' },
  { label: 'Pending UTR settlement', query: 'How does automated 12-digit UTR verification and bank settlement work?' }
];

export default function MerchantAiCopilot({ profile = {}, user = {} }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Thread ID unique to this merchant profile
  const threadId = useRef(`merchant_${profile?.id || user?.id || 'guest'}_${Date.now()}`);

  const [messages, setMessages] = useState([
    {
      id: 'welcome_1',
      role: 'assistant',
      text: `Hello ${profile?.business_name || profile?.owner_name || 'there'}! 👋 I am your **MyMobPay AI Copilot**.\n\nI can help you build payment links, configure developer webhooks, inspect UTR settlements, or explain how our 0% fee engine works.\n\nWhat can I assist you with today?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      provider: 'built-in'
    }
  ]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [messages, isOpen, isMinimized]);

  // Keyboard shortcut Ctrl+K to toggle copilot
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSendMessage = async (textToSend = inputMessage) => {
    if (!textToSend || !textToSend.trim() || isLoading) return;

    const userText = textToSend.trim();
    const userMsg = {
      id: `usr_${Date.now()}`,
      role: 'user',
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          threadId: threadId.current,
          merchantContext: {
            id: profile?.id || user?.id,
            businessName: profile?.business_name || profile?.owner_name,
            upiId: profile?.upi_id,
            tier: profile?.is_premium ? 'Enterprise Pro' : 'Starter Free Tier',
            email: user?.email
          }
        })
      });

      const data = await res.json();

      if (data?.reply) {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai_${Date.now()}`,
            role: 'assistant',
            text: data.reply,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            provider: data.provider || 'ai'
          }
        ]);
      } else {
        throw new Error(data?.error || 'Empty reply from server');
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          text: '⚠️ I encountered a temporary connection issue. Please try asking again in a moment.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleResetChat = () => {
    threadId.current = `merchant_${profile?.id || user?.id || 'guest'}_${Date.now()}`;
    setMessages([
      {
        id: `welcome_${Date.now()}`,
        role: 'assistant',
        text: `Chat thread refreshed! 🔄 Backboard memory is clean for this session. How can I help you?`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        provider: 'built-in'
      }
    ]);
  };

  // Helper to render basic markdown bold and code blocks
  const renderFormattedText = (rawText) => {
    const parts = rawText.split(/(```[\s\S]*?```)/g);

    return parts.map((part, pIdx) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        const lang = lines[0]?.match(/^[a-z]+/i) ? lines[0] : '';
        const codeContent = lang ? lines.slice(1).join('\n') : lines.join('\n');

        return (
          <div key={pIdx} className="my-2.5 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shadow-md">
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800 text-[11px] font-mono text-slate-300 border-b border-slate-700">
              <span>{lang || 'code'}</span>
              <button
                onClick={() => handleCopy(codeContent, pIdx)}
                className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
              >
                {copiedIndex === pIdx ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400 font-sans">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span className="font-sans">Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 text-[11px] sm:text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
              <code>{codeContent}</code>
            </pre>
          </div>
        );
      }

      // Format bold markdown (**text** or ### header)
      return (
        <span key={pIdx} className="whitespace-pre-line leading-relaxed">
          {part}
        </span>
      );
    });
  };

  return (
    <>
      {/* ── Floating Launcher Pill Button (Bottom Right) ── */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-3 px-4 sm:px-5 py-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer border border-blue-400/30 backdrop-blur-md"
            aria-label="Open AI Copilot"
          >
            {/* Animated Ping Ring */}
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
            </span>

            <div className="p-1 rounded-full bg-white/20 group-hover:rotate-12 transition-transform">
              <Sparkles className="w-4 h-4 text-white" />
            </div>

            <div className="text-left">
              <p className="text-xs font-bold tracking-wide">Ask AI Copilot</p>
              <p className="text-[10px] text-blue-100 font-medium hidden sm:block">Press Ctrl+K</p>
            </div>
          </button>
        </div>
      )}

      {/* ── Copilot Drawer / Modal ── */}
      {isOpen && (
        <div
          className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[94vw] sm:w-[420px] max-w-[440px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden transition-all duration-300 ${
            isMinimized ? 'h-[68px]' : 'h-[580px] max-h-[85vh]'
          }`}
          style={{ boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)' }}
        >
          {/* Header Bar */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between border-b border-slate-700/60 select-none">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400 shadow-inner">
                <Bot className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold tracking-tight text-white">MyMobPay Copilot</h3>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Live
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 font-mono">
                  {process.env.NEXT_PUBLIC_APP_URL ? 'mymobpay.tech' : 'Persistent AI Memory'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                title="Reset conversation memory"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? 'Expand' : 'Minimize'}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close Copilot"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/70">
                {messages.map((msg, index) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div key={msg.id || index} className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                      {!isUser && (
                        <div className="w-6 h-6 rounded-lg bg-indigo-600/10 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] rounded-2xl p-3 text-xs shadow-sm ${
                          isUser
                            ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-tr-none'
                            : msg.isError
                            ? 'bg-rose-50 border border-rose-200 text-rose-700 rounded-tl-none'
                            : 'bg-white border border-slate-200/80 text-slate-800 rounded-tl-none'
                        }`}
                      >
                        <div>{renderFormattedText(msg.text)}</div>
                        <div className="mt-1.5 flex items-center justify-between text-[9px] opacity-60">
                          <span>{msg.time}</span>
                          {!isUser && msg.provider && (
                            <span className="font-mono uppercase tracking-wider text-[8px] bg-slate-100 px-1 py-0.2 rounded text-slate-500">
                              {msg.provider}
                            </span>
                          )}
                        </div>
                      </div>

                      {isUser && (
                        <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-sm">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {isLoading && (
                  <div className="flex gap-2.5 justify-start items-center">
                    <div className="w-6 h-6 rounded-lg bg-indigo-600/10 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
                      <Sparkles className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                    </div>
                    <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-none bg-white border border-slate-200 text-xs text-slate-500 flex items-center gap-2 shadow-sm">
                      <span className="flex space-x-1">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
                      </span>
                      <span className="text-[11px] font-medium text-slate-600">Copilot thinking...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts Carousel */}
              <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 pl-1">
                  Quick:
                </span>
                {SUGGESTED_QUESTIONS.map((item, idx) => (
                  <button
                    key={idx}
                    disabled={isLoading}
                    onClick={() => handleSendMessage(item.query)}
                    className="shrink-0 px-2.5 py-1 text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 border border-slate-200/80 rounded-full transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  disabled={isLoading}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask about payment links, APIs, webhooks..."
                  className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                />

                <button
                  onClick={() => handleSendMessage()}
                  disabled={isLoading || !inputMessage.trim()}
                  className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 transition-colors shadow-sm cursor-pointer"
                  title="Send message"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
