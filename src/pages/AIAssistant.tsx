import { useState, useRef, useEffect } from 'react';
import {
  Send, Mic, Plus, MessageSquare, Sparkles, ChevronRight,
  Calendar, DollarSign, Users, ClipboardList, BarChart2, CheckSquare, Trash2
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  time: Date;
  messages: Message[];
}

const SUGGESTIONS = [
  { text: 'Check leave balance', icon: Calendar, color: '#3b82f6' },
  { text: 'Run payroll summary', icon: DollarSign, color: '#10b981' },
  { text: 'Show attendance report', icon: BarChart2, color: '#8b5cf6' },
  { text: 'List open positions', icon: Users, color: '#f97316' },
  { text: 'Employee performance', icon: ClipboardList, color: '#ec4899' },
  { text: 'Pending approvals', icon: CheckSquare, color: '#06b6d4' },
];

function getAIResponse(question: string): string {
  const q = question.toLowerCase();

  if (q.includes('leave balance') || q.includes('leave')) {
    return `Here is your leave balance for 2026:\n\n• **Casual Leave:** 8 days remaining (2 used)\n• **Sick Leave:** 8 days remaining (0 used)\n• **Annual Leave:** 13 days remaining (2 used)\n• **Compensatory Leave:** 1 day available\n\nYou have a total of **30 remaining leave days** across all categories. Your next leave request (Ananya Patel — 2 days from June 25) is currently pending approval.`;
  }
  if (q.includes('payroll') || q.includes('salary')) {
    return `**Payroll Summary — June 2026**\n\n• Total Payroll: ₹20,80,000\n• Employees Paid: 86\n• Avg Salary: ₹24,186\n• PF Deductions: ₹2,49,600\n• TDS Deductions: ₹1,87,200\n• Net Disbursed: ₹16,43,200\n\nPayroll is scheduled for **June 30, 2026**. 3 employees have variable pay adjustments this month.`;
  }
  if (q.includes('attendance') || q.includes('present')) {
    return `**Today's Attendance — June 20, 2026**\n\n• Present: 71 (82.5%)\n• Work From Home: 8 (9.3%)\n• On Leave: 5 (5.8%)\n• Absent: 2 (2.3%)\n\nOverall attendance rate this month is **91.2%**, which is above the company average. Engineering team has the highest attendance at 96%.`;
  }
  if (q.includes('open position') || q.includes('recruitment') || q.includes('hiring') || q.includes('vacancy')) {
    return `**Open Positions as of June 2026**\n\n1. Senior React Developer — Engineering (5 applications)\n2. Sales Manager — Sales (12 applications)\n3. UX Designer — Design (8 applications)\n4. HR Business Partner — HR (3 applications)\n5. DevOps Engineer — Engineering (7 applications)\n\nTotal open positions: **5**. Interviews are scheduled for 3 candidates next week.`;
  }
  if (q.includes('performance') || q.includes('appraisal') || q.includes('review')) {
    return `**Performance Overview — H1 2026**\n\n• Employees reviewed: 82/86\n• Average score: 78.4%\n• Outstanding (90%+): 14 employees\n• Good (70-89%): 48 employees\n• Needs Improvement (<70%): 20 employees\n\n**Top 3 Performers:**\n1. Amit Singh — 98%\n2. Kavya Reddy — 95%\n3. Priya Mehta — 92%\n\nH2 review cycle starts July 15.`;
  }
  if (q.includes('pending') || q.includes('approval')) {
    return `**Pending Approvals — Your Queue**\n\n📋 Leave Requests: 4 pending\n• Ananya Patel — 2 days (Jun 25–26)\n• Rohit Dev — 3 days (Jun 28–30)\n• Meena S — 1 day (Jun 24)\n• Suresh K — 5 days (Jul 1–5)\n\n💰 Expense Claims: 3 pending\n• Priya Mehta — ₹8,200 (Hotel)\n• Kavya Reddy — ₹2,300 (Fuel)\n• Rahul Sharma — ₹850 (Food)\n\nWould you like me to approve any of these?`;
  }
  if (q.includes('headcount') || q.includes('employee count') || q.includes('how many employee')) {
    return `**Current Headcount: 86 Employees**\n\nDepartment-wise breakdown:\n• Engineering: 28\n• Sales: 18\n• Marketing: 10\n• Operations: 9\n• Finance: 7\n• HR: 8\n• Design: 6\n\n3 employees on probation, 1 resigned (last day June 30). Net headcount will be 85 from July.`;
  }
  if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
    return `Hello! I'm your AI HR Assistant. I can help you with:\n\n• Leave balances and approvals\n• Payroll summaries\n• Attendance reports\n• Recruitment status\n• Performance data\n• Pending approvals\n\nWhat would you like to know today?`;
  }
  return `I understand you're asking about "${question}". Let me look that up for you.\n\nBased on our HR system data, I can see there are currently **86 active employees** across 7 departments. For more specific information on this topic, I'd recommend checking the dedicated module in the sidebar, or you can ask me a more specific question like "show leave balance" or "run payroll summary".\n\nIs there anything specific I can help you with?`;
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 mb-4">
      <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
        style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
        AI
      </div>
      <div className="chat-bubble-ai flex items-center gap-1 !px-4 !py-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-2 h-2 rounded-full bg-blue-400"
            style={{ animation: `bounce 1.4s ${i * 0.2}s infinite ease-in-out both` }} />
        ))}
      </div>
      <style>{`@keyframes bounce { 0%,80%,100%{transform:scale(0);opacity:.3} 40%{transform:scale(1);opacity:1} }`}</style>
    </div>
  );
}

function formatTime(d: Date) {
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatContent(text: string) {
  return text.split('\n').map((line, i) => {
    const bold = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return <p key={i} className={line.startsWith('•') || line.match(/^\d\./) ? 'ml-2' : ''} dangerouslySetInnerHTML={{ __html: bold }} />;
  });
}

export default function AIAssistant() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeConv = conversations.find(c => c.id === activeConvId);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  useEffect(() => { scrollToBottom(); }, [activeConv?.messages, isTyping]);

  function createNewConversation(firstMessage?: string) {
    const id = Date.now().toString();
    const conv: Conversation = {
      id, title: firstMessage ? firstMessage.slice(0, 30) + (firstMessage.length > 30 ? '...' : '') : 'New conversation',
      lastMessage: '', time: new Date(), messages: [],
    };
    setConversations(prev => [conv, ...prev]);
    setActiveConvId(id);
    return id;
  }

  function sendMessage(text?: string) {
    const content = (text || input).trim();
    if (!content) return;
    setInput('');

    let convId = activeConvId;
    if (!convId) {
      convId = createNewConversation(content);
    }

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content, timestamp: new Date() };

    setConversations(prev => prev.map(c => c.id === convId
      ? { ...c, title: c.messages.length === 0 ? content.slice(0, 35) : c.title, lastMessage: content, time: new Date(), messages: [...c.messages, userMsg] }
      : c
    ));

    setIsTyping(true);
    setTimeout(() => {
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'ai', content: getAIResponse(content), timestamp: new Date() };
      setIsTyping(false);
      setConversations(prev => prev.map(c => c.id === convId
        ? { ...c, lastMessage: aiMsg.content.slice(0, 40) + '...', messages: [...c.messages, aiMsg] }
        : c
      ));
    }, 1500);
  }

  function deleteConversation(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConvId === id) setActiveConvId(null);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  return (
    <div className="fade-up" style={{ height: 'calc(100vh - 96px)', display: 'flex', gap: 16 }}>
      {/* Sidebar */}
      <div className="glass-card !p-0 overflow-hidden shrink-0 desktop-only" style={{ width: 260, display: 'flex', flexDirection: 'column' }}>
        <div className="p-4 border-b border-white/5">
          <button className="btn btn-primary w-full justify-center" onClick={() => { createNewConversation(); }}>
            <Plus size={16} /> New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {conversations.length === 0 && (
            <p className="text-slate-500 text-xs text-center py-8">No conversations yet</p>
          )}
          {conversations.map(c => (
            <div key={c.id}
              onClick={() => setActiveConvId(c.id)}
              className={`rounded-xl p-3 cursor-pointer group transition-all relative ${activeConvId === c.id ? 'bg-blue-500/15 border border-blue-500/25' : 'hover:bg-white/5'}`}>
              <div className="flex items-start gap-2">
                <MessageSquare size={14} className="text-slate-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-slate-200 text-xs font-semibold truncate">{c.title}</p>
                  <p className="text-slate-500 text-xs truncate mt-0.5">{c.lastMessage}</p>
                </div>
                <button onClick={e => deleteConversation(c.id, e)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 hover:text-red-400">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
              AI
            </div>
            <div>
              <p className="text-white text-xs font-bold">HR AI Assistant</p>
              <p className="text-slate-500 text-xs">Powered by Claude</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main chat */}
      <div className="glass-card !p-0 overflow-hidden flex-1 flex flex-col">
        {/* Chat header */}
        <div className="p-4 border-b border-white/5 flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #06b6d4)', animation: 'rotate-slow 8s linear infinite' }}>
              AI
            </div>
            <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-[#0d1425] absolute -bottom-0.5 -right-0.5" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">HR AI Assistant</p>
            <p className="text-green-400 text-xs">Online — Ready to help</p>
          </div>
          <div className="ml-auto">
            <span className="badge badge-blue"><Sparkles size={10} /> AI Powered</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {(!activeConv || activeConv.messages.length === 0) ? (
            /* Welcome Screen */
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-6"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #06b6d4)', boxShadow: '0 0 40px rgba(59,130,246,0.3)' }}>
                AI
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">How can I help you today?</h2>
              <p className="text-slate-500 text-sm mb-8 text-center max-w-sm">
                Ask me anything about your HR data — leaves, payroll, attendance, recruitment, and more.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-xl">
                {SUGGESTIONS.map(s => (
                  <button key={s.text}
                    onClick={() => { if (!activeConvId) createNewConversation(s.text); sendMessage(s.text); }}
                    className="glass-card !p-3 text-left hover:border-blue-500/30 cursor-pointer transition-all">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-2" style={{ background: s.color + '22', border: `1px solid ${s.color}44` }}>
                      <s.icon size={14} style={{ color: s.color }} />
                    </div>
                    <p className="text-slate-300 text-xs font-medium leading-snug">{s.text}</p>
                    <ChevronRight size={12} className="text-slate-600 mt-1" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Messages */
            <div className="space-y-1">
              {activeConv.messages.map(msg => (
                <div key={msg.id} className={`flex items-end gap-3 mb-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {msg.role === 'ai' && (
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>AI</div>
                  )}
                  <div className="max-w-[75%]">
                    {msg.role === 'ai' ? (
                      <div className="chat-bubble-ai">
                        <div className="space-y-1 text-sm leading-relaxed">
                          {formatContent(msg.content)}
                        </div>
                      </div>
                    ) : (
                      <div className="chat-bubble-user">{msg.content}</div>
                    )}
                    <p className={`text-slate-600 text-xs mt-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                  {msg.role === 'user' && (
                    <div className="avatar !w-9 !h-9 shrink-0">ME</div>
                  )}
                </div>
              ))}
              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-white/5" style={{ paddingBottom: 'calc(var(--nav-h, 64px) + var(--safe-b, 0px) + 16px)' }}>
          {/* Suggestion quick pills (when chat active) */}
          {activeConv && activeConv.messages.length > 0 && (
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
              {SUGGESTIONS.slice(0, 4).map(s => (
                <button key={s.text} onClick={() => sendMessage(s.text)}
                  className="shrink-0 text-xs px-3 py-1.5 rounded-full text-slate-400 border border-white/8 hover:border-blue-500/30 hover:text-blue-400 transition-all bg-white/3">
                  {s.text}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-3 items-end">
            <div className="flex-1 search-box !rounded-2xl !py-3">
              <input
                ref={inputRef}
                className="flex-1 text-sm"
                placeholder="Ask anything about HR data, payroll, attendance..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button className="text-slate-500 hover:text-slate-300 transition-colors shrink-0">
                <Mic size={16} />
              </button>
            </div>
            <button
              className={`btn btn-primary !px-4 !py-3 rounded-2xl transition-all ${!input.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => sendMessage()}
              disabled={!input.trim() || isTyping}
            >
              <Send size={16} />
            </button>
          </div>
          <p className="text-slate-600 text-xs text-center mt-2">Press Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  );
}
