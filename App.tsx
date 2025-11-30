import React, { useState, useRef, useEffect } from 'react';
import { Message, Role, CounselingTopic } from './types';
import * as GeminiService from './services/geminiService';
import TopicSelector from './components/TopicSelector';
import ChatBubble from './components/ChatBubble';
import Button from './components/Button';
import { Send, Menu, RefreshCw, ChevronLeft } from 'lucide-react';

const App: React.FC = () => {
  const [topic, setTopic] = useState<CounselingTopic | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle text area auto-resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleTopicSelect = (selectedTopic: CounselingTopic) => {
    setTopic(selectedTopic);
    GeminiService.initializeChat(selectedTopic);
    
    // Initial greeting from AI
    const initialMessage: Message = {
      id: 'init-1',
      role: Role.MODEL,
      content: `안녕하세요. 마음이음 상담소입니다. \n\n'${selectedTopic}' 문제로 찾아오셨군요. \n지금 느끼시는 감정이나 겪고 계신 상황을 편안하게 말씀해 주시겠어요? 제가 곁에서 귀 기울여 듣겠습니다.`,
      timestamp: new Date()
    };
    setMessages([initialMessage]);
  };

  const handleReset = () => {
    if (window.confirm("상담 내용을 종료하고 처음으로 돌아가시겠습니까? 대화 내용은 저장되지 않습니다.")) {
      setTopic(null);
      setMessages([]);
      setInput('');
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessageText = input.trim();
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      content: userMessageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Placeholder for AI response
    const aiMessageId = (Date.now() + 1).toString();
    const aiPlaceholder: Message = {
      id: aiMessageId,
      role: Role.MODEL,
      content: '',
      isStreaming: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, aiPlaceholder]);

    try {
      const stream = GeminiService.sendMessageStream(userMessageText);
      let accumulatedText = '';

      for await (const chunk of stream) {
        accumulatedText += chunk;
        setMessages(prev => 
          prev.map(msg => 
            msg.id === aiMessageId 
              ? { ...msg, content: accumulatedText } 
              : msg
          )
        );
      }
    } catch (error) {
      console.error("Error sending message", error);
    } finally {
      setIsLoading(false);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, isStreaming: false } 
            : msg
        )
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!topic) {
    return (
      <div className="h-full bg-slate-50 overflow-y-auto">
        <TopicSelector onSelect={handleTopicSelect} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 max-w-4xl mx-auto shadow-2xl overflow-hidden relative">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 z-10 shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleReset} className="md:hidden">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-slate-800">마음이음 상담소</h1>
            <p className="text-xs text-teal-600 font-medium">{topic}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="ghost" size="sm" onClick={handleReset} title="상담 종료">
            <RefreshCw className="w-5 h-5 text-slate-500 hover:text-red-500 transition-colors" />
           </Button>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scroll-smooth bg-[#f8fafc]">
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
        {isLoading && messages.length > 0 && messages[messages.length - 1].role === Role.USER && (
           <div className="flex justify-start w-full mb-6">
             <div className="flex items-center gap-3">
               <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
               </div>
               <div className="text-slate-500 text-sm">답변을 생각하고 있습니다...</div>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="bg-white border-t border-slate-200 p-4 shrink-0">
        <div className="relative flex items-end gap-2 max-w-4xl mx-auto">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="고민을 이야기해주세요..."
            className="w-full resize-none max-h-[120px] py-3 pl-4 pr-12 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all scrollbar-hide"
            rows={1}
            disabled={isLoading}
          />
          <div className="absolute right-2 bottom-2">
            <Button 
              onClick={() => handleSubmit()} 
              disabled={!input.trim() || isLoading}
              className={`!p-2 rounded-lg transition-all ${input.trim() ? 'bg-teal-600 hover:bg-teal-700' : 'bg-slate-200 text-slate-400'}`}
              size="sm"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-2">
          AI는 실수를 할 수 있습니다. 중요한 정보는 확인이 필요합니다.
        </p>
      </footer>
    </div>
  );
};

export default App;