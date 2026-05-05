import { useState, useCallback, useRef, useEffect } from 'react';
import type { JitsiMeetExternalAPIInstance } from './useJitsiScript';
import type { Participant } from '../components/conference/types';

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
}

export function useJitsiRoom(options: UseJitsiRoomOptions) {
  const {
    domain = 'meet.jit.si',
    roomName,
    jwt,
    displayName,
    email,
    onParticipantJoined,
    onParticipantLeft,
    onRecordingStatusChanged,
    onReadyToClose,
  } = options;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [handRaised, setHandRaised] = useState(false);

  const apiRef = useRef<JitsiMeetExternalAPIInstance | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize Jitsi API
  const initJitsi = useCallback(() => {
    if (!window.JitsiMeetExternalAPI || !containerRef.current) {
      setError(new Error('Jitsi API not available'));
      return;
    }

    try {
      setIsLoading(true);

      const configOverwrite = {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        disableDeepLinking: true,
        prejoinPageEnabled: false,
        p2p: { enabled: false }, // Force JVB routing
        channelLastN: 25, // Limit simultaneous video feeds
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

      // Set up event listeners
      api.addEventListeners({
        videoConferenceJoined: () => {
          setIsLoading(false);
        },
        participantJoined: ({ id, displayName: name, role }: { id: string; displayName: string; role?: string }) => {
          const participant: Participant = {
            id,
            name,
            role: role === 'moderator' ? 'instructor' : 'student',
            isMuted: false,
            isVideoOff: false,
          };
          onParticipantJoined?.(participant);
          api.getParticipantsInfo().then((participants) => {
            setParticipantCount(participants.length);
          });
        },
        participantLeft: ({ id }: { id: string }) => {
          onParticipantLeft?.(id);
          api.getParticipantsInfo().then((participants) => {
            setParticipantCount(participants.length);
          });
        },
        recordingStatusChanged: ({ on }: { on: boolean }) => {
          setIsRecording(on);
          onRecordingStatusChanged?.(on);
        },
        audioMuteStatusChanged: ({ muted }: { muted: boolean }) => {
          setIsAudioMuted(muted);
        },
        videoMuteStatusChanged: ({ muted }: { muted: boolean }) => {
          setIsVideoMuted(muted);
        },
        readyToClose: () => {
          onReadyToClose?.();
        },
        errorOccurred: ({ error: err }: { error: Error }) => {
          console.error('Jitsi error:', err);
          setError(err);
        },
      });

    } catch (err) {
      console.error('Failed to initialize Jitsi:', err);
      setError(err instanceof Error ? err : new Error('Failed to initialize Jitsi'));
      setIsLoading(false);
    }
  }, [domain, roomName, jwt, displayName, email, onParticipantJoined, onParticipantLeft, onRecordingStatusChanged, onReadyToClose]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
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
    initJitsi,
    toggleAudio,
    toggleVideo,
    toggleHand,
    shareScreen,
    leave,
    sendChatMessage,
  };
}
