import React, { useState, useEffect, useCallback } from 'react';
import {
  Video,
  Calendar,
  Clock,
  Users,
  Bell,
  Eye,
  Search,
  Play,
  ChevronRight,
  FileText,
  Award,
  Sparkles,
  Captions,
  X,
} from 'lucide-react';
import { cn } from '../components/ui/utils';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Skeleton } from '../components/ui/skeleton';
import { useToast } from '../hooks/use-toast';
import { sessionsApi } from '../services/api';
import { JitsiRoom } from '../components/conference';
import type { TranscriptLine } from '../components/conference/types';
import type { Session, SessionStatus } from '../components/sessions/types';

/**
 * Transform backend snake_case session to frontend camelCase Session
 */
function transformSession(raw: Record<string, unknown>): Session {
  const course = (raw.course as Record<string, unknown> | undefined);
  const instructor = (raw.instructor as Record<string, unknown> | undefined);
  
  // Extract course name from various possible sources (API returns name, show endpoint returns title)
  const courseName = course?.name || course?.title || raw.course_name || raw.course_title || 'Unnamed Course';
  
  return {
    id: String(raw.id),
    title: String(raw.title || ''),
    courseId: String(raw.course_id || course?.id || ''),
    courseName: String(courseName),
    courseColor: raw.course_color as string | undefined,
    instructorId: String(raw.instructor_id || instructor?.id || ''),
    instructorName: String(instructor?.name || raw.instructor_name || 'Instructor'),
    instructorAvatar: (instructor?.profile_image || raw.instructor_avatar) as string | undefined,
    scheduledAt: String(raw.scheduled_at || ''),
    duration: Number(raw.duration || 60),
    startedAt: raw.started_at ? String(raw.started_at) : undefined,
    endedAt: raw.ended_at ? String(raw.ended_at) : undefined,
    status: String(raw.status || 'scheduled') as Session['status'],
    participantCount: Number(raw.participant_count || 0),
    maxParticipants: raw.max_participants ? Number(raw.max_participants) : undefined,
    recordingEnabled: Boolean(raw.recording_enabled),
    hasRecording: Boolean(raw.has_recording),
    recordingUrl: raw.recording_url as string | undefined,
    isPasswordProtected: Boolean(raw.password),
    roomName: raw.room_name as string | undefined,
    room_id: raw.room_id as string | undefined,
    aiTranscription: Boolean(raw.ai_transcription),
  };
}

/**
 * Format relative time
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (diff < 0) return 'Started';
  if (minutes < 60) return `in ${minutes}m`;
  if (hours < 24) return `in ${hours}h`;
  if (days === 1) return 'Tomorrow';
  return `in ${days}d`;
}

/**
 * Format duration
 */
function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

/**
 * Session Card for Students
 */
interface SessionCardProps {
  session: Session;
  onJoin: (session: Session) => void;
  onWatchRecording: (session: Session) => void;
  onSetReminder: (sessionId: string) => void;
}

function SessionCard({ session, onJoin, onWatchRecording, onSetReminder }: SessionCardProps) {
  const isLive = session.status === 'live';
  const isScheduled = session.status === 'scheduled';
  const isEnded = session.status === 'ended';
  const hasRecording = isEnded && session.hasRecording;

  return (
    <Card className={cn(
      'transition-all hover:shadow-md',
      isLive && 'ring-2 ring-destructive/50 shadow-lg'
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Course Badge */}
            <Badge
              variant="secondary"
              className="shrink-0"
              style={{
                backgroundColor: session.courseColor ? `${session.courseColor}20` : undefined,
                color: session.courseColor,
              }}
            >
              {session.courseName}
            </Badge>

            {/* Status Badge */}
            {isLive && (
              <Badge variant="destructive" className="text-xs shrink-0 animate-pulse">
                <Video className="h-3 w-3 mr-1" />
                LIVE
              </Badge>
            )}
            {isScheduled && (
              <Badge variant="secondary" className="text-xs shrink-0">
                <Calendar className="h-3 w-3 mr-1" />
                Scheduled
              </Badge>
            )}
            {isEnded && (
              <Badge variant="outline" className="text-xs shrink-0">
                Ended
              </Badge>
            )}

            {/* Recording Badge */}
            {session.recordingEnabled && (
              <Badge variant="outline" className="text-xs shrink-0 border-red-200 text-red-600">
                REC
              </Badge>
            )}
          </div>
        </div>

        <h3 className="font-semibold text-lg mt-2 line-clamp-2">{session.title}</h3>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{new Date(session.scheduledAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{new Date(session.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{formatDuration(session.duration)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>
              {session.participantCount}
              {session.maxParticipants && `/${session.maxParticipants}`}
            </span>
          </div>
        </div>

        {/* Instructor */}
        <div className="flex items-center gap-2 mb-4">
          <Avatar className="h-6 w-6">
            <AvatarImage src={session.instructorAvatar} />
            <AvatarFallback className="text-xs">{session.instructorName.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">{session.instructorName}</span>
          {session.aiTranscription && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 ml-auto">
              <Sparkles className="h-3 w-3 mr-1" />
              AI
            </Badge>
          )}
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-2">
            {isLive && (
              <Button
                onClick={() => onJoin(session)}
                className="bg-clay hover:bg-clay-deep text-white animate-pulse"
              >
                <Video className="h-4 w-4 mr-2" />
                Join Now
              </Button>
            )}
            {isScheduled && (
              <Button
                onClick={() => onSetReminder(session.id)}
                variant="ghost"
                size="sm"
                className="text-clay hover:text-clay-deep hover:bg-clay/10"
              >
                <Bell className="h-4 w-4 mr-2" />
                Remind Me
              </Button>
            )}
            {hasRecording && (
              <Button
                onClick={() => onWatchRecording(session)}
                variant="outline"
                className="border-clay text-clay hover:bg-clay/10 hover:text-clay-deep"
              >
                <Play className="h-4 w-4 mr-2" />
                Watch
              </Button>
            )}
          </div>

          {isScheduled && (
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(session.scheduledAt)}
            </span>
          )}

          {hasRecording && (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-clay hover:text-clay-deep"
              onClick={() => onWatchRecording(session)}
            >
              View Recording
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Student Sessions Page
 */
export function StudentSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [jwtToken, setJwtToken] = useState<string>('');
  const [aiTranscription, setAiTranscription] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [transcriptSession, setTranscriptSession] = useState<Session | null>(null);
  const [transcriptLines, setTranscriptLines] = useState<TranscriptLine[]>([]);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const { toast } = useToast();

  // Get user info from localStorage or context
  const userName = localStorage.getItem('user_name') || 'Student';
  const userEmail = localStorage.getItem('user_email') || '';

  // Fetch sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await sessionsApi.list({
          status: 'live,scheduled,ended',
          upcoming: true,
        });
        setSessions((res.data.data || []).map(transformSession));
      } catch (error) {
        console.error('Failed to fetch sessions:', error);
        toast({
          title: 'Error',
          description: 'Failed to load sessions.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [toast]);

  // Filter sessions
  const liveSessions = sessions.filter(s => s.status === 'live');
  const upcomingSessions = sessions.filter(s => s.status === 'scheduled');
  const pastSessions = sessions.filter(s => s.status === 'ended');

  const filteredUpcoming = upcomingSessions.filter(s =>
    searchQuery === '' ||
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.courseName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handlers
  const handleJoin = useCallback(async (session: Session) => {
    setIsJoining(true);
    try {
      // Fetch JWT token for the session
      const tokenRes = await sessionsApi.getToken(session.id);
      setJwtToken(tokenRes.data.token);
      setAiTranscription(tokenRes.data.ai_transcription ?? session.aiTranscription ?? false);
      setActiveSession(session);
    } catch (error) {
      console.error('Failed to get session token:', error);
      toast({
        title: 'Error',
        description: 'Failed to join session. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsJoining(false);
    }
  }, [toast]);

  const handleWatchRecording = useCallback((session: Session) => {
    if (session.recordingUrl) {
      window.open(session.recordingUrl, '_blank');
    } else {
      toast({
        title: 'Recording unavailable',
        description: 'This recording is not yet available.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleSetReminder = useCallback((sessionId: string) => {
    toast({
      title: 'Reminder set',
      description: 'You\'ll be notified 15 minutes before the session starts.',
    });
  }, [toast]);

  const handleViewTranscript = useCallback(async (session: Session) => {
    setTranscriptSession(session);
    setTranscriptLines([]);
    setTranscriptLoading(true);
    try {
      const res = await sessionsApi.getTranscript(session.id);
      const raw = (res.data.transcript ?? res.data.data ?? res.data ?? []) as Record<string, unknown>[];
      const lines: TranscriptLine[] = (Array.isArray(raw) ? raw : []).map((r, i) => ({
        id: String(r.id ?? `tr_${i}`),
        speaker: String(r.speaker_name ?? r.speaker ?? 'Speaker'),
        text: String(r.text ?? ''),
        timestamp: String(r.timestamp ?? r.created_at ?? ''),
      })).filter(l => l.text.trim() !== '');
      setTranscriptLines(lines);
    } catch (error) {
      console.error('Failed to load transcript:', error);
      toast({
        title: 'Transcript unavailable',
        description: 'Could not load the transcript for this session.',
        variant: 'destructive',
      });
    } finally {
      setTranscriptLoading(false);
    }
  }, [toast]);

  // Show Jitsi Room when actively joining a session
  if (activeSession && jwtToken) {
    return (
      <JitsiRoom
        sessionId={activeSession.id}
        roomName={activeSession.roomName || activeSession.room_id || activeSession.id}
        jwtToken={jwtToken}
        aiTranscription={aiTranscription}
        displayName={userName}
        email={userEmail}
        role="student"
        onLeave={() => {
          setActiveSession(null);
          setJwtToken('');
        }}
      />
    );
  }

  // Show joining loading state
  if (isJoining) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Joining session...</p>
        </div>
      </div>
    );
  }

  // Show loading skeletons
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64 mb-8" />
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Live Classes</h1>
        <p className="text-muted-foreground">
          Join your scheduled live sessions and view recordings
        </p>
      </div>

      {/* Live Now Section */}
      {liveSessions.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-red-500">
              Live Now
            </h2>
          </div>
          <div className="grid gap-4">
            {liveSessions.map(session => (
              <SessionCard
                key={session.id}
                session={session}
                onJoin={handleJoin}
                onWatchRecording={handleWatchRecording}
                onSetReminder={handleSetReminder}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Sessions */}
      {upcomingSessions.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Upcoming Sessions
            </h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sessions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="grid gap-4">
            {filteredUpcoming.map(session => (
              <SessionCard
                key={session.id}
                session={session}
                onJoin={handleJoin}
                onWatchRecording={handleWatchRecording}
                onSetReminder={handleSetReminder}
              />
            ))}
          </div>
        </div>
      )}

      {/* Past Recordings */}
      {pastSessions.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Past Recordings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pastSessions.filter(s => s.hasRecording || s.aiTranscription).map(session => (
              <Card
                key={session.id}
                className="cursor-pointer hover:shadow-md transition-all group"
                onClick={() => (session.hasRecording ? handleWatchRecording(session) : handleViewTranscript(session))}
              >
                <div className="aspect-video bg-slate-900 relative overflow-hidden rounded-t-lg">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                      {session.hasRecording
                        ? <Play className="h-8 w-8 text-white" />
                        : <Captions className="h-8 w-8 text-white" />}
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 rounded text-xs text-white font-medium">
                    {formatDuration(session.duration)}
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold line-clamp-1 mb-1">{session.title}</h3>
                  <p className="text-sm text-muted-foreground">{session.courseName}</p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {session.participantCount} views
                    </span>
                    <span>{new Date(session.scheduledAt).toLocaleDateString()}</span>
                  </div>
                  {session.aiTranscription && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full gap-1.5"
                      onClick={(e) => { e.stopPropagation(); handleViewTranscript(session); }}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      View transcript
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && sessions.length === 0 && (
        <div className="text-center py-16">
          <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-1">No sessions available</h3>
          <p className="text-muted-foreground">
            Check back later for upcoming live classes.
          </p>
        </div>
      )}

      {/* Saved Transcript Modal */}
      {transcriptSession && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setTranscriptSession(null)}
        >
          <div
            className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-2xl bg-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b p-5">
              <div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Session transcript</span>
                </div>
                <h3 className="mt-1 font-semibold">{transcriptSession.title}</h3>
                <p className="text-sm text-muted-foreground">{transcriptSession.courseName}</p>
              </div>
              <button
                onClick={() => setTranscriptSession(null)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
                aria-label="Close transcript"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {transcriptLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-5 w-full" />)}
                </div>
              ) : transcriptLines.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <Captions className="mb-2 h-8 w-8 opacity-50" />
                  <p className="text-sm">No transcript was captured for this session.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transcriptLines.map(line => (
                    <div key={line.id}>
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium text-foreground">{line.speaker}</span>
                        {line.timestamp && (
                          <span className="text-[11px] text-muted-foreground">
                            {(() => { const d = new Date(line.timestamp); return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); })()}
                          </span>
                        )}
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">{line.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentSessions;
