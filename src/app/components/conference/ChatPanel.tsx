import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { cn } from '../ui/utils';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import type { ChatMessage } from './types';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isInstructor: boolean;
}

export function ChatPanel({ messages, onSendMessage, isInstructor }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  const isAI = (msg: ChatMessage) => msg.isAI || msg.senderName.toLowerCase().includes('ai');

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No messages yet</p>
              <p className="text-xs mt-1">Type a message to start chatting</p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex flex-col',
                msg.senderId === 'me' && 'items-end'
              )}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-lg p-3',
                  isAI(msg)
                    ? 'bg-clay/10 border border-clay/30'
                    : msg.senderId === 'me'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                {/* Header */}
                <div className="flex items-center gap-2 mb-1">
                  {isAI(msg) && (
                    <Sparkles className="h-3.5 w-3.5 text-clay" />
                  )}
                  <span
                    className={cn(
                      'text-xs font-medium',
                      isAI(msg) ? 'text-clay' : 'text-muted-foreground'
                    )}
                  >
                    {msg.senderName}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>

                {/* Content */}
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t bg-card">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button size="icon" onClick={handleSend} disabled={!input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* AI suggestion for students */}
        {!isInstructor && input.startsWith('@ai') && (
          <p className="text-xs text-clay mt-2">
            Ask the AI assistant anything about the session
          </p>
        )}
      </div>
    </div>
  );
}

export default ChatPanel;
