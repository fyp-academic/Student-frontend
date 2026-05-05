import React, { useEffect, useState, useCallback } from 'react';
import { useJitsiRoom } from '../../hooks/useJitsiRoom';
import { Toolbar } from './Toolbar';
import { ParticipantList } from './ParticipantList';
import { ChatPanel } from './ChatPanel';
import { PollModal } from './PollModal';
import { ConsentDialog } from './ConsentDialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { useToast } from '../../hooks/use-toast';
import { sessionsApi } from '../../services/api';
import type { JitsiRoomProps, Participant, ChatMessage } from './types';
import type { Poll as PollType } from '../sessions/types';

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
  const [activePanel, setActivePanel] = useState<'none' | 'chat' | 'participants'>('none');
  const [showPolls, setShowPolls] = useState(false);
  const [polls, setPolls] = useState<PollType[]>([]);
  const [activePoll, setActivePoll] = useState<PollType | null>(null);
  const [hasVoted, setHasVoted] = useState<Record<string, boolean>>({});
  const [showConsent, setShowConsent] = useState(false);
  const [consentGranted, setConsentGranted] = useState(false);

  const { toast } = useToast();

  const {
    containerRef,
    isLoading,
    error,
    isAudioMuted,
    isVideoMuted,
    participantCount,
    isRecording,
    handRaised,
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
  });

  // Initialize Jitsi when component mounts
  useEffect(() => {
    if (!window.JitsiMeetExternalAPI) {
      // Wait for script to load
      const checkInterval = setInterval(() => {
        if (window.JitsiMeetExternalAPI) {
          clearInterval(checkInterval);
          initJitsi();
        }
      }, 500);

      // Timeout after 30 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
      }, 30000);

      return () => clearInterval(checkInterval);
    }

    initJitsi();
  }, [initJitsi]);

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

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Connection Error</h2>
          <p className="text-muted-foreground mb-4">{error.message}</p>
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
                {activePanel === 'chat' ? 'Chat' : 'Participants'}
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
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Toolbar */}
      <Toolbar
        isAudioMuted={isAudioMuted}
        isVideoMuted={isVideoMuted}
        isHandRaised={handRaised}
        isScreenSharing={false}
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
