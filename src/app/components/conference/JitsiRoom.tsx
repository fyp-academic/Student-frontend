import React, { useEffect, useState, useCallback } from 'react';
import {
  Bot,
  Loader2,
  Send,
} from 'lucide-react';
import { useJitsiRoom } from '../../hooks/useJitsiRoom';
import { useJitsiScript } from '../../hooks/useJitsiScript';
import { Toolbar } from './Toolbar';
import { ParticipantList } from './ParticipantList';
import { ChatPanel } from './ChatPanel';
import { PollModal } from './PollModal';
import { ConsentDialog } from './ConsentDialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useToast } from '../../hooks/use-toast';
import { sessionsApi } from '../../services/api';
import type { JitsiRoomProps, ChatMessage } from './types';
import type { Participant, Poll as PollType } from '../sessions/types';

export function JitsiRoom({
  sessionId,
  roomName,
  jwtToken,
  displayName,
  email,
  role,
  onLeave,
  initialConfig,
}: JitsiRoomProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activePanel, setActivePanel] = useState<'none' | 'chat' | 'participants' | 'ai'>('none');
  const [showPolls, setShowPolls] = useState(false);
  const [polls, setPolls] = useState<PollType[]>([]);
  const [activePoll, setActivePoll] = useState<PollType | null>(null);
  const [hasVoted, setHasVoted] = useState<Record<string, boolean>>({});
  const [showConsent, setShowConsent] = useState(false);
  const [consentGranted, setConsentGranted] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);

  const { toast } = useToast();

  // Load Jitsi external API script
  const { loaded: scriptLoaded, error: scriptError } = useJitsiScript();

  const {
    containerRef,
    isLoading,
    error,
    isAudioMuted,
    isVideoMuted,
    participantCount,
    isRecording,
    handRaised,
    isScreenSharing,
    initJitsi,
    toggleAudio,
    toggleVideo,
    toggleHand,
    shareScreen,
    leave,
    sendChatMessage,
  } = useJitsiRoom({
    roomName,
    jwt: jwtToken,
    displayName,
    email,
    onParticipantJoined: (p) => {
      setParticipants(prev => [...prev, p]);
    },
    onParticipantLeft: (id) => {
      setParticipants(prev => prev.filter(p => p.id !== id));
    },
    onReadyToClose: onLeave,
    onChatMessage: (msg) => {
      setMessages(prev => [...prev, {
        id: msg.id,
        senderId: msg.sender.id,
        senderName: msg.sender.name,
        text: msg.text,
        timestamp: msg.timestamp,
        isAI: msg.isAI,
      }]);
    },
  });

  // Initialize Jitsi when script is loaded
  useEffect(() => {
    if (!scriptLoaded) return;
    initJitsi();
  }, [initJitsi, scriptLoaded]);

  // Fetch polls periodically
  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const res = await sessionsApi.getPolls(sessionId);
        setPolls(res.data.polls || []);
        const active = res.data.polls?.find((p: PollType) => p.isActive);
        if (active && active.id !== activePoll?.id) {
          setActivePoll(active);
          setShowPolls(true);
        }
      } catch (err) {
        // Silent fail - polls are optional
      }
    };

    fetchPolls();
    const interval = setInterval(fetchPolls, 5000);
    return () => clearInterval(interval);
  }, [sessionId, activePoll]);

  const handleSendMessage = useCallback((text: string) => {
    sendChatMessage(text);
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      senderId: 'me',
      senderName: displayName,
      text,
      timestamp: Date.now(),
    }]);
  }, [sendChatMessage, displayName]);

  const handleAskAI = useCallback(async () => {
    if (!aiQuestion.trim()) return;
    const question = aiQuestion.trim();
    setAiQuestion('');
    setIsAiTyping(true);
    sendChatMessage(`@AI ${question}`);
    setMessages(prev => [...prev, {
      id: `ai-q-${Date.now()}`,
      senderId: 'me',
      senderName: displayName,
      text: `@AI ${question}`,
      timestamp: Date.now(),
    }]);
    setTimeout(() => setIsAiTyping(false), 3000);
  }, [aiQuestion, displayName, sendChatMessage]);

  const handleVote = async (pollId: string, optionIndex: number) => {
    try {
      await sessionsApi.votePoll(pollId, optionIndex);
      setHasVoted(prev => ({ ...prev, [pollId]: true }));
      toast({
        title: 'Vote submitted',
        description: 'Your vote has been recorded.',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to submit vote.',
        variant: 'destructive',
      });
    }
  };

  const handleLeave = useCallback(() => {
    leave();
    onLeave();
  }, [leave, onLeave]);

  if (error || scriptError) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Connection Error</h2>
          <p className="text-muted-foreground mb-4">{(error || scriptError)?.message}</p>
          <Button onClick={onLeave}>Return to Sessions</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white">Joining session...</p>
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 relative overflow-hidden">
        <div ref={containerRef} className="absolute inset-0" />

        {/* Mobile Panel Overlay */}
        <Sheet open={activePanel !== 'none'} onOpenChange={() => setActivePanel('none')}>
          <SheetContent side="right" className="w-[300px] sm:w-[350px] p-0">
            <SheetHeader className="p-4 border-b">
              <SheetTitle>
                {activePanel === 'chat'
                  ? 'Chat'
                  : activePanel === 'participants'
                    ? 'Participants'
                    : 'AI Assistant'}
              </SheetTitle>
            </SheetHeader>
            <div className="h-[calc(100vh-80px)] overflow-y-auto">
              {activePanel === 'chat' && (
                <ChatPanel
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isInstructor={role === 'instructor'}
                />
              )}
              {activePanel === 'participants' && (
                <ParticipantList
                  participants={participants}
                  isInstructor={role === 'instructor'}
                />
              )}
              {activePanel === 'ai' && (
                <div className="flex flex-col h-full p-4">
                  <div className="p-3 rounded-lg bg-purple-50 border border-purple-100 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-900">AI Assistant</span>
                    </div>
                    <p className="text-xs text-purple-700">
                      Ask questions about the session content.
                    </p>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3">
                    {messages
                      .filter(m => m.isAI || m.text.startsWith('@AI'))
                      .map((msg, idx) => (
                        <div key={`${msg.id}-${idx}`} className="flex gap-2">
                          <div className={
                            msg.isAI
                              ? 'bg-purple-50 text-purple-900 rounded-lg px-3 py-2 text-sm max-w-[80%]'
                              : 'bg-accent rounded-lg px-3 py-2 text-sm max-w-[80%] ml-auto'
                          }>
                            <p className="text-xs font-medium mb-1">{msg.isAI ? 'AI Assistant' : 'You'}</p>
                            <p>{msg.isAI ? msg.text : msg.text.replace('@AI ', '')}</p>
                          </div>
                        </div>
                      ))}
                    {isAiTyping && (
                      <div className="flex gap-2">
                        <div className="bg-purple-50 text-purple-900 rounded-lg px-3 py-2 text-sm">
                          <p className="flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            AI is thinking...
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 mt-2 border-t">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ask AI a question..."
                        value={aiQuestion}
                        onChange={(e) => setAiQuestion(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
                        className="flex-1"
                      />
                      <Button
                        size="icon"
                        onClick={handleAskAI}
                        disabled={!aiQuestion.trim() || isAiTyping}
                      >
                        {isAiTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Press Enter to ask the AI assistant</p>
                  </div>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Toolbar */}
      <Toolbar
        isAudioMuted={isAudioMuted}
        isVideoMuted={isVideoMuted}
        isHandRaised={handRaised}
        isScreenSharing={isScreenSharing}
        isRecording={isRecording}
        participantCount={participantCount}
        role={role}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onToggleHand={toggleHand}
        onShareScreen={shareScreen}
        onLeave={handleLeave}
        onOpenChat={() => setActivePanel('chat')}
        onOpenParticipants={() => setActivePanel('participants')}
        onOpenPolls={() => setShowPolls(true)}
        onOpenAI={() => setActivePanel('ai')}
        hasNewPolls={!!activePoll && !hasVoted[activePoll.id]}
        sessionId={sessionId}
      />

      {/* Poll Modal */}
      <PollModal
        isOpen={showPolls}
        onClose={() => setShowPolls(false)}
        sessionId={sessionId}
        role={role}
        existingPolls={polls}
        activePoll={activePoll}
        hasVoted={hasVoted}
        onVote={handleVote}
      />

      {/* Consent Dialog */}
      <ConsentDialog
        isOpen={showConsent}
        onClose={() => setShowConsent(false)}
        sessionId={sessionId}
        onConsentGranted={() => setConsentGranted(true)}
      />
    </div>
  );
}

export default JitsiRoom;
