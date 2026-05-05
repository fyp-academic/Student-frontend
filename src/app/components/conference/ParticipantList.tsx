import React from 'react';
import { Mic, MicOff, Video, VideoOff, Hand, Users } from 'lucide-react';
import { cn } from '../ui/utils';
import { ScrollArea } from '../ui/scroll-area';
import type { Participant } from './types';

interface ParticipantListProps {
  participants: Participant[];
  isInstructor: boolean;
  onKick?: (id: string) => void;
  onMuteParticipant?: (id: string) => void;
  onAllowHand?: (id: string) => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(id: string): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-cyan-500',
  ];
  return colors[id.charCodeAt(0) % colors.length];
}

export function ParticipantList({
  participants,
  isInstructor,
  onKick,
  onMuteParticipant,
  onAllowHand,
}: ParticipantListProps) {
  // Sort: instructor first, then by name
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.role === b.role) return a.name.localeCompare(b.name);
    return a.role === 'instructor' ? -1 : 1;
  });

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-2">
        {sortedParticipants.map((participant) => (
          <div
            key={participant.id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent group"
          >
            {/* Avatar */}
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0',
                getAvatarColor(participant.id)
              )}
            >
              {participant.avatar ? (
                <img
                  src={participant.avatar}
                  alt={participant.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                getInitials(participant.name)
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">
                  {participant.name}
                </span>
                {participant.handRaised && (
                  <Hand className="h-4 w-4 text-yellow-500" />
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span
                  className={cn(
                    'px-1.5 py-0.5 rounded text-[10px] font-medium',
                    participant.role === 'instructor'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-600'
                  )}
                >
                  {participant.role}
                </span>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-1 text-muted-foreground">
              {participant.isMuted ? (
                <MicOff className="h-3.5 w-3.5" />
              ) : (
                <Mic className="h-3.5 w-3.5" />
              )}
              {participant.isVideoOff ? (
                <VideoOff className="h-3.5 w-3.5" />
              ) : (
                <Video className="h-3.5 w-3.5" />
              )}
            </div>

            {/* Actions - Instructor only */}
            {isInstructor && participant.role !== 'instructor' && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {participant.handRaised && (
                  <button
                    onClick={() => onAllowHand?.(participant.id)}
                    className="p-1.5 rounded hover:bg-green-100 text-green-600"
                    title="Allow to speak"
                  >
                    <Hand className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={() => onMuteParticipant?.(participant.id)}
                  className="p-1.5 rounded hover:bg-yellow-100 text-yellow-600"
                  title="Mute"
                >
                  <MicOff className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onKick?.(participant.id)}
                  className="p-1.5 rounded hover:bg-red-100 text-red-600"
                  title="Remove"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        ))}

        {participants.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No participants yet</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

export default ParticipantList;
