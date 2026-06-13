import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Bot,
  Loader2,
  Send,
  Captions,
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
import type { JitsiRoomProps, ChatMessage, TranscriptLine } from './types';
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
  aiTranscription = false,
}: JitsiRoomProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activePanel, setActivePanel] = useState<'none' | 'chat' | 'participants' | 'ai' | 'transcript'>('none');
  const [transcriptLines, setTranscriptLines] = useState<TranscriptLine[]>([]);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
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
    sessionId,
    roomName,
    jwt: jwtToken,
    displayName,
    email,
    aiTranscription,
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
    onTranscriptLine: (line) => {
      setTranscriptLines(prev => {
        if (prev.some(l => l.id === line.id)) return prev;
        return [...prev, line].slice(-300);
      });
    },
  });

  // Auto-scroll the transcript panel to the latest line
  useEffect(() => {
    if (activePanel === 'transcript') {
      transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcriptLines, activePanel]);

  const formatCaptionTime = (ts: string) => {
    const d = new Date(ts);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

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
                    : activePanel === 'transcript'
                      ? 'Live transcript'
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
              {activePanel === 'transcript' && (
                <div className="flex flex-col h-full p-4">
                  <div className="flex-1 overflow-y-auto space-y-3">
                    {transcriptLines.length === 0 ? (
                      <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                        <Captions className="h-8 w-8 mb-2 opacity-50" />
                        <p className="text-sm">Captions will appear here as people speak.</p>
                      </div>
                    ) : (
                      transcriptLines.map((line) => (
                        <div key={line.id} className="text-sm">
                          <div className="flex items-baseline gap-2">
                            <span className="font-medium text-foreground">{line.speaker}</span>
                            <span className="text-[11px] text-muted-foreground">{formatCaptionTime(line.timestamp)}</span>
                          </div>
                          <p className="text-muted-foreground leading-snug">{line.text}</p>
                        </div>
                      ))
                    )}
                    <div ref={transcriptEndRef} />
                  </div>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* Live caption overlay — latest lines pinned to the bottom of the stage */}
        {aiTranscription && transcriptLines.length > 0 && activePanel !== 'transcript' && (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4">
            <div className="pointer-events-auto max-w-2xl rounded-xl bg-black/70 px-4 py-2.5 text-center backdrop-blur-sm">
              {transcriptLines.slice(-2).map((line) => (
                <p key={line.id} className="text-sm leading-snug text-white sm:text-base">
                  <span className="font-medium text-white/70">{line.speaker}: </span>
                  {line.text}
                </p>
              ))}
            </div>
          </div>
        )}
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
        onOpenTranscript={() => setActivePanel('transcript')}
        showTranscript={aiTranscription}
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
