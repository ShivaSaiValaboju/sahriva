import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  RotateCcw,
  Bot,
  User,
  ChevronDown,
  Minimize2,
  Maximize2,
  ExternalLink,
  Cpu,
  Zap,
  ShieldCheck,
  Tag,
  ArrowUpRight,
} from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  model?: string;
  isNotice?: boolean;
}

const DEFAULT_GREETING: ChatMessage = {
  id: 'greeting',
  role: 'assistant',
  content: `👋 **Welcome to SAHRIVA Store!**\n\nI am your **AI Software Architect & Concierge**, curated under the direction of **Shiva Sai Valaboju**.\n\nHow can I help you today? I can recommend top trending tools like **CapCut Pro** and **InShot Pro**, explain our **perpetual offline licensing**, or share our active promotional vouchers like **LAUNCH25**!`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  model: 'gemini-3.8-flash',
};

const SUGGESTIONS = [
  { label: '🎬 What is CapCut Pro?', prompt: 'Can you tell me about CapCut Pro and its AI curve speed features?' },
  { label: '✂️ Why choose InShot Pro?', prompt: 'What makes InShot Pro the top choice for mobile and desktop video editing?' },
  { label: '⚡ What is HyperFlow Studio?', prompt: 'Can you tell me about HyperFlow Studio and its 120 FPS engine?' },
  { label: '📱 Apps that run on Android', prompt: 'Which apps in the SAHRIVA Store support Android?' },
  { label: '🔑 How does offline licensing work?', prompt: 'How does the perpetual offline license key activation work?' },
  { label: '🏷️ Active coupon codes', prompt: 'What coupon codes are currently active in SAHRIVA Store?' },
];

interface GeminiChatbotProps {
  onNavigateApp?: (slug: string) => void;
  onNavigateRoute?: (route: string) => void;
}

export const GeminiChatbot: React.FC<GeminiChatbotProps> = ({
  onNavigateApp,
  onNavigateRoute,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'gemini-3.8-flash' | 'gemini-3.1-flash-lite'>('gemini-3.8-flash');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('sahriva_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      // ignore
    }
    return [DEFAULT_GREETING];
  });

  // Sleek initial 5-second left sliding animation: expands "Talk to Shiva's bot", then gracefully reverts to "AI Bot"
  const [isIntroExpanded, setIsIntroExpanded] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsIntroExpanded(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const { showToast } = useNotification();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-save chat history
  useEffect(() => {
    try {
      localStorage.setItem('sahriva_chat_history', JSON.stringify(messages));
    } catch (e) {
      // ignore
    }
  }, [messages]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, isMinimized]);

  // Keyboard shortcut ⌘J or Ctrl+J to toggle chatbot, plus custom event trigger
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    const handleCustomOpen = (e: Event) => {
      const customEvent = e as CustomEvent<{ prompt?: string }>;
      setIsOpen(true);
      setIsMinimized(false);
      if (customEvent.detail?.prompt) {
        setInput(customEvent.detail.prompt);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-gemini-chat', handleCustomOpen);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-gemini-chat', handleCustomOpen);
    };
  }, []);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInput('');
    setIsLoading(true);

    try {
      // Send entire multi-turn history to /api/chat
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          messages: newHistory.map((m) => ({
            role: m.role === 'user' ? 'user' : 'model',
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage: ChatMessage = {
        id: `asst_${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'I processed your request, but received no textual reply.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: data.model || selectedModel,
        isNotice: Boolean(data.isNotice),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Chatbot error:', err);
      const fallbackMessage: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `I encountered a momentary connection hiccup. As a reminder, SAHRIVA Store features **HyperFlow Studio ($49.00)**, **Orbit Terminal (Free)**, and **CipherGuard Pro ($45.00)**. Use coupon **LAUNCH25** for 25% off orders over $20.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: 'offline-assistant',
      };
      setMessages((prev) => [...prev, fallbackMessage]);
      showToast({
        type: 'info',
        title: 'Gemini Assistant Notice',
        message: 'Running in resilient offline mode.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([DEFAULT_GREETING]);
    localStorage.removeItem('sahriva_chat_history');
    showToast({
      type: 'info',
      title: 'Chat Reset',
      message: 'Conversation history cleared.',
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Helper to render text with markdown formatting (headers, bold, lists, and app chips)
  const formatContent = (content: string) => {
    const lines = content.split('\n');

    return (
      <div className="space-y-2 text-xs sm:text-sm leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) {
            return <div key={idx} className="h-1.5" />;
          }

          // Bold headers or list items
          const isListItem = line.trim().startsWith('- ') || line.trim().startsWith('* ');
          const formattedLine = line.replace(/^[-*]\s+/, '');

          // Check for app mentions to offer interactive chip
          const appMentions = [
            { name: 'DaVinci Resolve Studio 21', slug: 'davinci-resolve-studio-21' },
            { name: 'CapCut Pro', slug: 'capcut-pro' },
            { name: 'InShot Pro', slug: 'inshot-pro' },
            { name: 'HyperFlow Studio', slug: 'hyperflow-studio' },
            { name: 'Orbit Terminal', slug: 'orbit-terminal' },
            { name: 'PixelForge Vector', slug: 'pixelforge-vector' },
            { name: 'Vortex DB Studio', slug: 'vortex-db-studio' },
            { name: 'CipherGuard Pro', slug: 'cipherguard-pro' },
            { name: 'Zenith Markdown Editor', slug: 'zenith-markdown-editor' },
            { name: 'SoundWave Studio', slug: 'soundwave-studio' },
          ].filter((app) => line.includes(app.name));

          // Inline parsing for **bold** and `code`
          const parts = formattedLine.split(/(\*\*.*?\*\*|`.*?`)/g);

          return (
            <div key={idx} className={isListItem ? 'flex items-start gap-1.5 ml-2' : ''}>
              {isListItem && <span className="text-violet-500 font-bold shrink-0">•</span>}
              <div className="flex-1">
                {parts.map((part, pIdx) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return (
                      <strong key={pIdx} className="font-bold text-neutral-900 dark:text-white">
                        {part.slice(2, -2)}
                      </strong>
                    );
                  }
                  if (part.startsWith('`') && part.endsWith('`')) {
                    return (
                      <code
                        key={pIdx}
                        className="px-1.5 py-0.5 rounded bg-neutral-200/80 dark:bg-neutral-800 font-mono text-[11px] text-violet-700 dark:text-violet-300 font-medium"
                      >
                        {part.slice(1, -1)}
                      </code>
                    );
                  }
                  return <span key={pIdx}>{part}</span>;
                })}

                {/* Interactive App Badges */}
                {appMentions.length > 0 && onNavigateApp && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {appMentions.map((app) => (
                      <button
                        key={app.slug}
                        onClick={() => onNavigateApp(app.slug)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-100 hover:bg-violet-200 dark:bg-violet-950/70 dark:hover:bg-violet-900 text-[11px] font-semibold text-violet-700 dark:text-violet-300 transition-colors cursor-pointer border border-violet-300/60 dark:border-violet-700/50"
                      >
                        <span>View {app.name}</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* Floating Trigger Area - Mobile-Friendly Ergonomic Dock Position */}
      <div className="fixed bottom-20 md:bottom-6 right-3.5 sm:right-5 md:right-6 z-40 flex flex-col items-end">
        {/* Floating Action Button with 5s Left-Sliding Text Animation */}
        {!isOpen && (
          <button
            onClick={() => {
              setIsIntroExpanded(false);
              setIsOpen(true);
              setIsMinimized(false);
            }}
            className="group relative flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-600 text-white shadow-[0_8px_25px_rgba(124,58,237,0.35)] hover:shadow-[0_12px_30px_rgba(124,58,237,0.5)] active:scale-95 transition-all duration-500 cursor-pointer border border-white/20 backdrop-blur-md"
            aria-label="Talk to Shiva's AI Bot"
          >
            {/* Sparkles Icon */}
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20 shrink-0">
              <Sparkles className="w-3 h-3 text-amber-300" />
            </div>

            {/* Sliding text towards left showing 'Talk to Shiva's bot' on app open, then reverting to 'AI Bot' after 5 seconds */}
            <div
              className={`overflow-hidden transition-all duration-700 ease-in-out whitespace-nowrap text-xs font-extrabold tracking-tight ${
                isIntroExpanded
                  ? 'max-w-[185px] opacity-100 pr-1'
                  : 'max-w-[46px] opacity-100 pr-0.5 group-hover:max-w-[185px]'
              }`}
            >
              <span>{isIntroExpanded ? "Talk to Shiva's bot" : 'AI Bot'}</span>
            </div>

            {/* Green blinking online light */}
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          </button>
        )}
      </div>

      {/* Floating Chatbot Window / Drawer */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 ease-out flex flex-col ${
            isMinimized
              ? 'bottom-20 md:bottom-6 right-4 sm:right-6 w-72 sm:w-80 h-14'
              : 'bottom-20 md:bottom-6 right-3 sm:right-6 w-[94vw] sm:w-[440px] md:w-[470px] h-[78vh] sm:h-[620px] max-h-[85vh]'
          } rounded-3xl bg-white/95 dark:bg-[#0c101c]/95 backdrop-blur-2xl border border-neutral-200/90 dark:border-neutral-800/90 shadow-[0_20px_60px_rgba(0,0,0,0.2)] dark:shadow-[0_25px_70px_rgba(0,0,0,0.7)] overflow-hidden`}
        >
          {/* Header */}
          <div className="p-3.5 sm:p-4 bg-gradient-to-r from-violet-600/10 via-indigo-600/10 to-transparent border-b border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-9 h-9 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-sky-400 flex items-center justify-center text-white shadow-md shadow-violet-500/25 shrink-0">
                <Sparkles className="w-4 h-4" />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0c101c]" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white tracking-tight truncate">
                    SAHRIVA Concierge
                  </h3>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-300/60 dark:border-violet-800/50 hidden xs:inline">
                    Gemini AI
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                  Store Advisor · Shiva Sai Valaboju
                </p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Model Switcher Pill */}
              {!isMinimized && (
                <div className="flex items-center bg-neutral-200/70 dark:bg-neutral-800/80 p-0.5 rounded-lg mr-1 text-[10px] font-semibold">
                  <button
                    onClick={() => setSelectedModel('gemini-3.8-flash')}
                    className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                      selectedModel === 'gemini-3.8-flash'
                        ? 'bg-white dark:bg-neutral-900 text-violet-700 dark:text-violet-300 shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                    title="Gemini 3.8 Flash (Balanced & High Accuracy)"
                  >
                    3.8 Flash
                  </button>
                  <button
                    onClick={() => setSelectedModel('gemini-3.1-flash-lite')}
                    className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                      selectedModel === 'gemini-3.1-flash-lite'
                        ? 'bg-white dark:bg-neutral-900 text-violet-700 dark:text-violet-300 shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                    title="Gemini 3.1 Flash Lite (Ultra Fast)"
                  >
                    Lite
                  </button>
                </div>
              )}

              {/* Reset History */}
              {!isMinimized && (
                <button
                  onClick={handleClearChat}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  title="Clear conversation history"
                  aria-label="Clear conversation history"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Minimize / Maximize */}
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                title={isMinimized ? 'Expand' : 'Minimize'}
                aria-label={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>

              {/* Close */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Close chat"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Expanded Body */}
          {!isMinimized && (
            <>
              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                {messages.map((msg) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 items-start ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-sm text-xs font-bold ${
                          isUser
                            ? 'bg-neutral-800 text-white dark:bg-neutral-700'
                            : 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white'
                        }`}
                      >
                        {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                      </div>

                      <div
                        className={`max-w-[85%] rounded-2xl p-3 sm:p-3.5 shadow-sm transition-all ${
                          isUser
                            ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-tr-xs'
                            : 'bg-neutral-100/90 dark:bg-neutral-900/90 text-neutral-800 dark:text-neutral-200 border border-neutral-200/80 dark:border-neutral-800/80 rounded-tl-xs'
                        }`}
                      >
                        {formatContent(msg.content)}

                        <div
                          className={`mt-1.5 flex items-center justify-between text-[10px] ${
                            isUser ? 'text-white/70' : 'text-neutral-400 dark:text-neutral-500'
                          }`}
                        >
                          <span>{msg.timestamp}</span>
                          {!isUser && msg.model && (
                            <span className="font-mono text-[9px] uppercase tracking-wider opacity-80">
                              {msg.model}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex gap-3 items-start">
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm animate-pulse">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div className="p-3.5 rounded-2xl bg-neutral-100/90 dark:bg-neutral-900/90 border border-neutral-200/80 dark:border-neutral-800/80 rounded-tl-xs space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-violet-600 animate-ping" />
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                          Consulting Gemini model...
                        </span>
                      </div>
                      <div className="w-36 h-2 rounded-full skeleton-shimmer" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Suggestions Rail */}
              {messages.length <= 3 && !isLoading && (
                <div className="px-4 py-2 bg-neutral-50/80 dark:bg-neutral-900/40 border-t border-neutral-200/60 dark:border-neutral-800/60">
                  <div className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-violet-500" />
                    <span>Suggested Inquiries</span>
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                    {SUGGESTIONS.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(s.prompt)}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-800/90 hover:bg-violet-50 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 text-[11px] text-neutral-700 dark:text-neutral-300 font-medium whitespace-nowrap transition-all shadow-2xs hover:border-violet-400 cursor-pointer active:scale-95 shrink-0"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Bar */}
              <div className="p-3 bg-white dark:bg-[#0c101c] border-t border-neutral-200/80 dark:border-neutral-800/80">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-end gap-2"
                >
                  <div className="flex-1 relative rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/20 transition-all p-2">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask Gemini about apps, architectures, offline licenses..."
                      rows={1}
                      className="w-full bg-transparent resize-none outline-none text-xs sm:text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 max-h-24 leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className={`p-2.5 rounded-2xl transition-all cursor-pointer shrink-0 shadow-md ${
                      input.trim() && !isLoading
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:scale-105 active:scale-95 shadow-violet-500/25'
                        : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
                    }`}
                    aria-label="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
                <div className="flex items-center justify-between text-[10px] text-neutral-400 mt-1 px-1">
                  <span>Press Enter to send · Shift+Enter for new line</span>
                  <span className="font-mono">Gemini 3.8 Flash</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};
