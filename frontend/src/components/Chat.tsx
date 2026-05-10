import React, { useState, useEffect, useRef, FormEvent } from 'react';
import DOMPurify from 'dompurify';
import useSocket from '../hooks/useSocket';

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: number;
  type: 'chat' | 'system' | 'kill';
}

interface ChatProps {
  userId: string;
  username: string;
}

const Chat: React.FC<ChatProps> = ({ userId, username }) => {
  const { emit, on, off } = useSocket();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleChatMessage = (msg: unknown) => {
      const chatMsg = msg as ChatMessage;
      chatMsg.text = DOMPurify.sanitize(chatMsg.text);
      setMessages((prev) => [...prev.slice(-50), chatMsg]); // Keep last 50 messages
    };

    const handleSystemMessage = (msg: unknown) => {
      const sysMsg = msg as ChatMessage;
      sysMsg.type = 'system';
      setMessages((prev) => [...prev.slice(-50), sysMsg]);
    };

    on('chat:message', handleChatMessage);
    on('chat:system', handleSystemMessage);

    return () => {
      off('chat:message', handleChatMessage);
      off('chat:system', handleSystemMessage);
    };
  }, [on, off]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    emit('chat:send', { text });

    // Optimistic local add
    const localMsg: ChatMessage = {
      id: `local-${Date.now()}`,
      userId,
      username,
      text: DOMPurify.sanitize(text),
      timestamp: Date.now(),
      type: 'chat',
    };
    setMessages((prev) => [...prev.slice(-50), localMsg]);
    setInput('');
  };

  const getMessageStyle = (msg: ChatMessage) => {
    if (msg.type === 'system') return 'text-gray-500 italic text-xs';
    if (msg.type === 'kill') return 'text-red-400 text-xs';
    if (msg.userId === userId) return 'text-nexus-300';
    return 'text-gray-300';
  };

  return (
    <div
      className={`absolute bottom-6 right-4 z-40 transition-all duration-300 ${
        isExpanded ? 'w-80' : 'w-64'
      }`}
    >
      <div className="glass-panel overflow-hidden flex flex-col" style={{ maxHeight: isExpanded ? '360px' : '180px' }}>
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between px-3 py-2 border-b border-arena-border hover:bg-white/[0.02] transition-colors"
        >
          <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">Chat</span>
          <span className="text-xs text-gray-600">{isExpanded ? '▼' : '▲'}</span>
        </button>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-[60px]">
          {messages.length === 0 ? (
            <p className="text-xs text-gray-600 text-center py-4">No messages yet</p>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`text-xs leading-relaxed ${getMessageStyle(msg)}`}>
                {msg.type === 'chat' && (
                  <>
                    <span className={`font-semibold ${msg.userId === userId ? 'text-nexus-400' : 'text-gray-400'}`}>
                      {msg.username}
                    </span>
                    <span className="text-gray-600">: </span>
                  </>
                )}
                <span>{msg.text}</span>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="border-t border-arena-border p-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full bg-transparent text-xs text-white placeholder-gray-600 px-2 py-1.5 focus:outline-none"
            placeholder="Type a message..."
            maxLength={200}
            onFocus={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()} // Prevent game input capture
          />
        </form>
      </div>
    </div>
  );
};

export default Chat;
