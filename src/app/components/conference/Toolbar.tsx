import React from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Hand,
  ScreenShare,
  PhoneOff,
  MessageSquare,
  Users,
  BarChart3,
  MoreVertical,
  Bot,
} from 'lucide-react';
import { cn } from '../ui/utils';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Badge } from '../ui/badge';

interface ToolbarProps {
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  isHandRaised: boolean;
  isScreenSharing: boolean;
  isRecording: boolean;
  participantCount: number;
  role: 'student' | 'instructor';
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleHand: () => void;
  onShareScreen: () => void;
  onLeave: () => void;
  onOpenChat: () => void;
  onOpenParticipants: () => void;
  onOpenPolls: () => void;
  onOpenAI: () => void;
  hasNewPolls?: boolean;
  sessionId: string;
}

export function Toolbar({
  isAudioMuted,
  isVideoMuted,
  isHandRaised,
  isScreenSharing,
  isRecording,
  participantCount,
  role,
  onToggleAudio,
  onToggleVideo,
  onToggleHand,
  onShareScreen,
  onLeave,
  onOpenChat,
  onOpenParticipants,
  onOpenPolls,
  onOpenAI,
  hasNewPolls,
}: ToolbarProps) {
  return (
    <div className="h-16 sm:h-20 bg-card border-t px-4 flex items-center justify-between gap-2 sm:gap-4">
      {/* Left - Recording indicator */}
      <div className="flex items-center gap-2 min-w-[80px]">
        {isRecording && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="hidden sm:inline text-xs font-medium text-red-500">REC</span>
          </div>
        )}
      </div>

      {/* Center - Main controls */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Mic */}
        <Button
          variant={isAudioMuted ? 'destructive' : 'secondary'}
          size="icon"
          onClick={onToggleAudio}
          className={cn(
            'h-10 w-10 sm:h-12 sm:w-12 rounded-full',
            !isAudioMuted && 'bg-secondary hover:bg-secondary/80'
          )}
        >
          {isAudioMuted ? (
            <MicOff className="h-4 w-4 sm:h-5 sm:w-5" />
          ) : (
            <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
          )}
        </Button>

        {/* Video */}
        <Button
          variant={isVideoMuted ? 'destructive' : 'secondary'}
          size="icon"
          onClick={onToggleVideo}
          className={cn(
            'h-10 w-10 sm:h-12 sm:w-12 rounded-full',
            !isVideoMuted && 'bg-secondary hover:bg-secondary/80'
          )}
        >
          {isVideoMuted ? (
            <VideoOff className="h-4 w-4 sm:h-5 sm:w-5" />
          ) : (
            <Video className="h-4 w-4 sm:h-5 sm:w-5" />
          )}
        </Button>

        {/* Raise Hand - Student only */}
        {role === 'student' && (
          <Button
            variant={isHandRaised ? 'default' : 'secondary'}
            size="icon"
            onClick={onToggleHand}
            className={cn(
              'h-10 w-10 sm:h-12 sm:w-12 rounded-full',
              isHandRaised && 'bg-primary'
            )}
          >
            <Hand className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        )}

        {/* Screen Share */}
        <Button
          variant={isScreenSharing ? 'default' : 'secondary'}
          size="icon"
          onClick={onShareScreen}
          className={cn(
            'h-10 w-10 sm:h-12 sm:w-12 rounded-full',
            isScreenSharing && 'bg-primary'
          )}
        >
          <ScreenShare className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>

        {/* More options - Mobile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-full md:hidden"
            >
              <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onOpenChat}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenParticipants}>
              <Users className="h-4 w-4 mr-2" />
              Participants ({participantCount})
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenPolls}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Polls
              {hasNewPolls && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">!</Badge>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenAI}>
              <Bot className="h-4 w-4 mr-2" />
              AI Assistant
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Leave */}
        <Button
          variant="destructive"
          size="icon"
          onClick={onLeave}
          className="h-10 w-10 sm:h-12 sm:w-12 rounded-full ml-2"
        >
          <PhoneOff className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      </div>

      {/* Right - Secondary actions */}
      <div className="hidden md:flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenChat}
          className="gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          Chat
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenParticipants}
          className="gap-2"
        >
          <Users className="h-4 w-4" />
          {participantCount}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenPolls}
          className="gap-2"
        >
          <BarChart3 className="h-4 w-4" />
          Polls
          {hasNewPolls && (
            <Badge variant="destructive" className="ml-1">New</Badge>
          )}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenAI}
          className="gap-2"
        >
          <Bot className="h-4 w-4" />
          AI
        </Button>
      </div>
    </div>
  );
}

export default Toolbar;
