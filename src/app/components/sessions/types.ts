export type SessionStatus = 'scheduled' | 'live' | 'ended' | 'cancelled';

export interface Session {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  courseColor?: string;
  instructorId: string;
  instructorName: string;
  instructorAvatar?: string;
  
  // Timing
  scheduledAt: string;
  duration: number; // minutes
  startedAt?: string;
  endedAt?: string;
  
  // Room
  roomName?: string;

  // Status
  status: SessionStatus;
  participantCount: number;
  maxParticipants?: number;
  
  // Settings
  recordingEnabled: boolean;
  hasRecording?: boolean;
  recordingUrl?: string;
  isPasswordProtected?: boolean;
  aiTranscription?: boolean;
}

export interface Participant {
  id: string;
  name: string;
  avatar?: string;
  role: 'instructor' | 'student';
  isMuted: boolean;
  isVideoOff: boolean;
  handRaised?: boolean;
  engagementScore?: number;
}

export interface TranscriptSegment {
  id: string;
  speakerName: string;
  text: string;
  timestamp: number;
}

export interface Poll {
  id: string;
  question: string;
  options: string[];
  isMultipleChoice: boolean;
  isActive: boolean;
  results?: number[];
}
