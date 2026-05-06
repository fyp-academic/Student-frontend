import { useState, useCallback, useRef, useEffect } from 'react';
import type { JitsiMeetExternalAPIInstance } from './useJitsiScript';
import type { Participant } from '../components/sessions/types';

interface UseJitsiRoomOptions {
  domain?: string;
  roomName: string;
  jwt?: string;
  displayName: string;
  email?: string;
  onParticipantJoined?: (participant: Participant) => void;
  onParticipantLeft?: (participantId: string) => void;
  onRecordingStatusChanged?: (isRecording: boolean) => void;
  onReadyToClose?: () => void;
  onChatMessage?: (message: { id: string; sender: { id: string; name: string }; text: string; timestamp: number; isAI?: boolean }) => void;
}

export function useJitsiRoom(options: UseJitsiRoomOptions) {
  const {
    domain = 'meet.codagenz.com',
    roomName,
    jwt,
    displayName,
    email,
    onParticipantJoined,
    onParticipantLeft,
    onRecordingStatusChanged,
    onReadyToClose,
    onChatMessage,
  } = options;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const apiRef = useRef<JitsiMeetExternalAPIInstance | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  // Use refs for callbacks so initJitsi stays stable and doesn't trigger loops
  const callbacksRef = useRef({
    onParticipantJoined,
    onParticipantLeft,
    onRecordingStatusChanged,
    onReadyToClose,
    onChatMessage,
  });
  useEffect(() => {
    callbacksRef.current = {
      onParticipantJoined,
      onParticipantLeft,
      onRecordingStatusChanged,
      onReadyToClose,
      onChatMessage,
    };
  }, [onParticipantJoined, onParticipantLeft, onRecordingStatusChanged, onReadyToClose, onChatMessage]);

  // Initialize Jitsi API
  const initJitsi = useCallback(() => {
    if (initializedRef.current) return;
    if (!window.JitsiMeetExternalAPI || !containerRef.current) {
      setError(new Error('Jitsi API not available'));
      return;
    }

    try {
      setIsLoading(true);

      // Dispose any existing API before creating a new one
      if (apiRef.current) {
        try {
          apiRef.current.dispose();
        } catch {
          // ignore disposal errors
        }
        apiRef.current = null;
      }

      const configOverwrite = {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        disableDeepLinking: true,
        prejoinPageEnabled: false,
        prejoinConfig: { enabled: false },
        p2p: { enabled: false }, // Force JVB routing
        channelLastN: 10, // Limit simultaneous video feeds for bandwidth
        resolution: 360,
        constraints: {
          video: {
            height: { ideal: 360, max: 480 },
            frameRate: { max: 20 },
          },
        },
        disableSimulcast: false,
        enableLayerSuspension: true,
        enableNoisyMicDetection: false,
        startBitrate: 800,
      };

      const interfaceConfigOverwrite = {
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        TOOLBAR_BUTTONS: [
          'microphone', 'camera', 'chat', 'raisehand', 'tileview', 'fullscreen',
          'videoquality', 'filmstrip', 'shortcuts', 'settings', 'download'
        ],
      };

      const api = new window.JitsiMeetExternalAPI(domain, {
        roomName,
        jwt,
        width: '100%',
        height: '100%',
        parentNode: containerRef.current,
        configOverwrite,
        interfaceConfigOverwrite,
        userInfo: {
          displayName,
          email: email || undefined,
        },
      });

      apiRef.current = api;
      initializedRef.current = true;
      setIsLoading(false);

      // Set up event listeners
      api.addEventListeners({
        videoConferenceJoined: () => {
          setIsLoading(false);
        },
        participantJoined: (data: unknown) => {
          const p = data as { id: string; displayName: string; role?: string };
          const participant: Participant = {
            id: p.id,
            name: p.displayName,
            role: p.role === 'moderator' ? 'instructor' : 'student',
            isMuted: false,
            isVideoOff: false,
          };
          callbacksRef.current.onParticipantJoined?.(participant);
          api.getParticipantsInfo().then((participants) => {
            setParticipantCount(participants.length);
          });
        },
        participantLeft: (data: unknown) => {
          const { id } = data as { id: string };
          callbacksRef.current.onParticipantLeft?.(id);
          api.getParticipantsInfo().then((participants) => {
            setParticipantCount(participants.length);
          });
        },
        recordingStatusChanged: (data: unknown) => {
          const { on } = data as { on: boolean };
          setIsRecording(on);
          callbacksRef.current.onRecordingStatusChanged?.(on);
        },
        audioMuteStatusChanged: (data: unknown) => {
          const { muted } = data as { muted: boolean };
          setIsAudioMuted(muted);
        },
        videoMuteStatusChanged: (data: unknown) => {
          const { muted } = data as { muted: boolean };
          setIsVideoMuted(muted);
        },
        screenSharingStatusChanged: (data: unknown) => {
          const { on } = data as { on: boolean };
          setIsScreenSharing(on);
        },
        readyToClose: () => {
          callbacksRef.current.onReadyToClose?.();
        },
        incomingMessage: (data: unknown) => {
          const msg = data as { from: string; nick: string; message: string; stamp: number };
          callbacksRef.current.onChatMessage?.({
            id: `${msg.from}-${msg.stamp || Date.now()}`,
            sender: { id: msg.from, name: msg.nick || 'Unknown' },
            text: msg.message,
            timestamp: msg.stamp || Date.now(),
            isAI: msg.message.startsWith('[AI]') || msg.nick?.toLowerCase().includes('ai'),
          });
        },
        errorOccurred: (data: unknown) => {
          const { error: err } = data as { error: Error };
          console.error('Jitsi error:', err);
          setError(err);
        },
      });

    } catch (err) {
      console.error('Failed to initialize Jitsi:', err);
      setError(err instanceof Error ? err : new Error('Failed to initialize Jitsi'));
      setIsLoading(false);
    }
  }, [domain, roomName, jwt, displayName, email]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      initializedRef.current = false;
      if (apiRef.current) {
        try {
          apiRef.current.dispose();
        } catch (e) {
          console.error('Error disposing Jitsi API:', e);
        }
        apiRef.current = null;
      }
    };
  }, []);

  // Commands
  const toggleAudio = useCallback(async () => {
    apiRef.current?.executeCommand('toggleAudio');
    const status = await apiRef.current?.isAudioMuted();
    setIsAudioMuted(status?.muted ?? false);
  }, []);

  const toggleVideo = useCallback(async () => {
    apiRef.current?.executeCommand('toggleVideo');
    const status = await apiRef.current?.isVideoMuted();
    setIsVideoMuted(status?.muted ?? false);
  }, []);

  const toggleHand = useCallback(() => {
    apiRef.current?.executeCommand('toggleRaiseHand');
    setHandRaised(prev => !prev);
  }, []);

  const shareScreen = useCallback(() => {
    apiRef.current?.executeCommand('toggleShareScreen');
    // Toggle local state immediately for responsive UI; event listener will correct if needed
    setIsScreenSharing(prev => !prev);
  }, []);

  const leave = useCallback(() => {
    apiRef.current?.executeCommand('hangup');
  }, []);

  const sendChatMessage = useCallback((message: string) => {
    apiRef.current?.executeCommand('sendChatMessage', message);
  }, []);

  return {
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
  };
}
