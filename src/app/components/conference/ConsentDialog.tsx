import React, { useState } from 'react';
import { Mic, Shield, Check, AlertTriangle, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { sessionsApi } from '../../services/api';

interface ConsentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  onConsentGranted: () => void;
}

export function ConsentDialog({
  isOpen,
  onClose,
  sessionId,
  onConsentGranted,
}: ConsentDialogProps) {
  const [isGranting, setIsGranting] = useState(false);
  const [dontAskAgain, setDontAskAgain] = useState(false);

  const handleGrant = async () => {
    setIsGranting(true);
    try {
      await sessionsApi.grantTranscriptionConsent(sessionId);
      onConsentGranted();
      onClose();
    } catch (error) {
      console.error('Failed to grant consent:', error);
    } finally {
      setIsGranting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-clay/10 rounded-full flex items-center justify-center">
              <Mic className="h-6 w-6 text-clay" />
            </div>
            <div>
              <DialogTitle>Audio Transcription</DialogTitle>
              <DialogDescription>
                Consent required for AI transcription
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Your audio will be captured</p>
              <p>
                To provide live transcription, your audio will be sent to our AI
                service. This data is processed securely and not stored permanently.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-clay/10 rounded-full flex items-center justify-center shrink-0">
                <FileText className="h-4 w-4 text-clay" />
              </div>
              <div className="text-sm">
                <p className="font-medium">What&apos;s captured</p>
                <p className="text-muted-foreground">
                  Only your spoken words during the session
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center shrink-0">
                <Shield className="h-4 w-4 text-green-600" />
              </div>
              <div className="text-sm">
                <p className="font-medium">How it&apos;s used</p>
                <p className="text-muted-foreground">
                  Transcripts are shared with session participants only
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <Label htmlFor="dont-ask" className="text-sm cursor-pointer">
              Remember my choice for this session
            </Label>
            <Switch
              id="dont-ask"
              checked={dontAskAgain}
              onCheckedChange={setDontAskAgain}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Decline
          </Button>
          <Button
            onClick={handleGrant}
            disabled={isGranting}
            className="flex-1 gap-2"
          >
            {isGranting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Grant Consent
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ConsentDialog;
