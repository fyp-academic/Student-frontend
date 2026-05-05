import React, { useState } from 'react';
import { BarChart3, Check, X, Loader2 } from 'lucide-react';
import { cn } from '../ui/utils';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import type { Poll } from '../sessions/types';

interface PollModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  role: 'student' | 'instructor';
  existingPolls: Poll[];
  activePoll: Poll | null;
  hasVoted: Record<string, boolean>;
  onVote: (pollId: string, optionIndex: number) => void;
}

export function PollModal({
  isOpen,
  onClose,
  role,
  existingPolls,
  activePoll,
  hasVoted,
  onVote,
}: PollModalProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (selectedOption === null || !activePoll) return;
    setIsSubmitting(true);
    await onVote(activePoll.id, selectedOption);
    setIsSubmitting(false);
    setSelectedOption(null);
  };

  // Show results if already voted
  const hasVotedOnActive = activePoll ? hasVoted[activePoll.id] : false;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {role === 'instructor' ? 'Create Poll' : 'Live Poll'}
          </DialogTitle>
          <DialogDescription>
            {role === 'student' && activePoll
              ? 'Vote on the active poll'
              : 'View and participate in session polls'}
          </DialogDescription>
        </DialogHeader>

        {role === 'student' && activePoll && !hasVotedOnActive && (
          <div className="space-y-4 py-4">
            <p className="font-medium">{activePoll.question}</p>
            <div className="space-y-2">
              {activePoll.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedOption(index)}
                  className={cn(
                    'w-full p-3 rounded-lg border text-left transition-colors',
                    selectedOption === index
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                        selectedOption === index ? 'border-primary' : 'border-muted'
                      )}
                    >
                      {selectedOption === index && (
                        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                      )}
                    </div>
                    <span>{option}</span>
                  </div>
                </button>
              ))}
            </div>
            <Button
              onClick={handleSubmit}
              disabled={selectedOption === null || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Submit Vote
                </>
              )}
            </Button>
          </div>
        )}

        {role === 'student' && activePoll && hasVotedOnActive && (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <p className="font-medium">Vote submitted!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Waiting for the instructor to share results...
            </p>
          </div>
        )}

        {role === 'student' && !activePoll && (
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No active polls</p>
            <p className="text-sm text-muted-foreground mt-1">
              The instructor may create one soon
            </p>
          </div>
        )}

        {/* Poll history */}
        {existingPolls.length > 0 && (
          <>
            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-medium mb-2">Poll History</h4>
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {existingPolls.map((poll) => (
                    <div
                      key={poll.id}
                      className={cn(
                        'p-2 rounded text-sm',
                        poll.isActive
                          ? 'bg-primary/5 border border-primary/20'
                          : 'bg-muted'
                      )}
                    >
                      <p className="font-medium truncate">{poll.question}</p>
                      {poll.results && (
                        <div className="mt-1 space-y-1">
                          {poll.options.map((option, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full"
                                  style={{
                                    width: `${((poll.results?.[i] || 0) / Math.max(...(poll.results || [1]))) * 100}%`,
                                  }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground w-8 text-right">
                                {poll.results?.[i] || 0}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default PollModal;
