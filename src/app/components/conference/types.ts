import type { Participant } from '../sessions/types';

export interface JitsiRoomProps {
  sessionId: string;
  roomName: string;
  jwtToken: string;
  displayName: string;
  email?: string;
  role: 'student' | 'instructor';
  onLeave: () => void;
  onParticipantJoined?: (participant: Participant) => void;
  onParticipantLeft?: (participantId: string) => void;
  onRecordingStatusChanged?: (isRecording: boolean) => void;
  initialConfig?: JitsiConfig;
  aiTranscription?: boolean;
}

export interface JitsiConfig {
  startWithAudioMuted?: boolean;
  startWithVideoMuted?: boolean;
  disableDeepLinking?: boolean;
  prejoinPageEnabled?: boolean;
  toolbarButtons?: string[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  isAI?: boolean;
}

export interface TranscriptLine {
  id: string;
  speaker: string;
  text: string;
  timestamp: string;
}

export type ToolbarAction = 
  | 'toggle-mic' 
  | 'toggle-camera' 
  | 'toggle-hand' 
  | 'share-screen'
  | 'leave';
