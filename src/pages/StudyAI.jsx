import React, { useState, useRef, useEffect } from 'react';
import { Icons } from '../components/Icons.js';
import { api } from '../api.js';

/**
 * StudySphere AI Page Component
 * ==============================
 * Context-aware study tutor designed to help students understand
 * coursework and uploaded study notes/lectures on StudySphere.
 * Supports resource-based answering, step-by-step breakdowns,
 * conversational session memory, and follow-up clarifications.
 */
export function StudyAI({ initialContext = null, onClearContext = null }) {
  const [activeContext, setActiveContext] = useState(initialContext);
  const [messages, setMessages] = useState(() => {
    if (initialContext) {
      return [
        {
          role: 'assistant',
          content:
            `👋 Hello! I am **StudySphere AI**.\n\n` +
            `I see you are currently studying **"${initialContext.title}"** (${initialContext.subject} — ${initialContext.unit}).\n\n` +
            `I have indexed the material from this resource. You can ask me:\n` +
            `- *"Can you explain the main concepts in this material?"*\n` +
            `- *"Break down the equations step-by-step for exam prep."*\n` +
            `- *"What are the key exam takeaways?"*`
        }
      ];
    }
    return [
      {
        role: 'assistant',
        content:
          "👋 Hello! I am **StudySphere AI**.\n\n" +
          "My purpose is to help you understand the study materials available on StudySphere across **Physics**, **Mathematics**, **C Programming**, **Electrical Engineering**, and **Chemistry**.\n\n" +
          "Ask me a conceptual question, a formula breakdown, or open any study note and click **'Ask StudySphere AI'** to chat with resource context!"
      }
    ];
  });

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const chatEndRef = useRef(null);

  // Update context when initialContext prop changes
  useEffect(() => {
    if (initialContext && (!activeContext || initialContext.id !== activeContext.id)) {
      setActiveContext(initialContext);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            `📚 **Attached Study Context:** Now focusing on **"${initialContext.title}"** (${initialContext.subject} - ${initialContext.unit}). Ask me questions about this specific material!`
        }
      ]);
    }
  }, [initialContext]);

  // Context-specific or general suggested prompt chips
  const samplePrompts = activeContext
    ? [
        `Explain the core concept in ${activeContext.title.split('—')[0].trim()}`,
        'What are the most important formulas here?',
        'Break down this material step-by-step for exams',
        'Give a practical example of this concept'
      ]
    : [
        'What is the photoelectric effect?',
        'Explain Eigenvalues and Eigenvectors simply',
        'How do pointers and memory work in C?',
        'Explain Kirchhoff\'s Current & Voltage Laws',
        'What is Gibbs Free Energy and Phase Rule?'
      ];

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend = null) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    setErrorMsg('');
    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      // Build context payload
      const contextPayload = activeContext
        ? {
            resourceId: activeContext.id,
            title: activeContext.title,
            subject: activeContext.subject,
            unit: activeContext.unit,
            contentText: activeContext.content_text || activeContext.description || ''
          }
        : null;

      // Pass multi-turn conversation messages and active resource context
      const res = await api.askAI(
        newMessages.map((m) => ({ role: m.role, content: m.content })),
        contextPayload
      );

      if (res.reply) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: res.reply }
        ]);
      } else {
        throw new Error('Empty response from AI assistant.');
      }
    } catch (err) {
      console.error('Chat error:', err);
      setErrorMsg('Unable to reach study assistant right now.');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            "⚠️ *I couldn't process that query right now.* Please verify your server is running and try again."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([
      {
        role: 'assistant',
        content:
          "✨ **New chat session started.** Ask me anything about your engineering syllabus or coursework."
      }
    ]);
    setErrorMsg('');
  };

  const handleDetachContext = () => {
    setActiveContext(null);
    if (onClearContext) onClearContext();
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content:
          "ℹ️ **Switched to General Mode.** StudySphere AI is now answering general engineering coursework questions."
      }
    ]);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 h-[calc(100vh-4.5rem)] flex flex-col">
      {/* Top Header Bar */}
      <div className="pb-3 mb-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Icons.Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900">
                StudySphere AI
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Course Tutor
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Undergraduate Engineering Concept Tutor & Resource Assistant
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleNewChat}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 shadow-2xs transition-colors flex items-center gap-1.5"
            title="Start fresh conversation"
          >
            <Icons.Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      {/* Active Resource Context Banner */}
      {activeContext && (
        <div className="mb-3 p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1 rounded bg-indigo-200 text-indigo-800 shrink-0">
              <Icons.BookOpen className="w-3.5 h-3.5" />
            </span>
            <div className="truncate">
              <span className="font-semibold text-indigo-900">Studying Resource Context: </span>
              <span className="text-indigo-800 font-medium">"{activeContext.title}"</span>
              <span className="text-indigo-600 ml-1">({activeContext.subject})</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDetachContext}
            className="shrink-0 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 hover:bg-indigo-100 rounded transition-colors"
            title="Detach context and switch to general mode"
          >
            Switch to General
          </button>
        </div>
      )}

      {/* Suggested Prompt Chips */}
      <div className="mb-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
            Suggested:
          </span>
          {samplePrompts.map((prompt, i) => (
            <button
              key={i}
              type="button"
              disabled={isLoading}
              onClick={() => handleSendMessage(prompt)}
              className="shrink-0 px-3 py-1 text-xs bg-white text-slate-700 hover:text-blue-600 hover:border-blue-300 border border-slate-200 rounded-full shadow-2xs transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 overflow-y-auto bg-slate-50/70 rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';

          return (
            <div
              key={index}
              className={`flex items-start gap-3 ${
                isUser ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
                  isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-indigo-600 text-white'
                }`}
              >
                {isUser ? <Icons.User className="w-3.5 h-3.5" /> : <Icons.Bot className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 shadow-2xs ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-tr-none text-xs sm:text-sm font-medium whitespace-pre-wrap'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none text-xs sm:text-sm leading-relaxed whitespace-pre-wrap'
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Icons.Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-3 shadow-2xs flex items-center space-x-1.5">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="text-xs text-slate-400 pl-2">Analyzing and preparing answer...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between">
          <span>{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg('')} className="p-1">
            <Icons.X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Chat Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="mt-3 flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-500"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={
            activeContext
              ? `Ask a question about ${activeContext.title.split('—')[0].trim()}...`
              : "Ask a question about physics formulas, linear algebra, C pointers, etc..."
          }
          disabled={isLoading}
          className="flex-1 px-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className={`p-2.5 rounded-xl transition-colors shrink-0 flex items-center justify-center ${
            inputValue.trim() && !isLoading
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
          title="Send query"
        >
          <Icons.Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
