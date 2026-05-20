import React from 'react';
import { AUTO_SUBMIT_THRESHOLD, ActiveViolation, ViolationType } from '../hooks/useProctoringMonitor';

const MESSAGES: Record<ViolationType, { title: string; icon: string; msg: string }> = {
  tab_switch:          { title: 'Tab Switch Detected',       icon: '⚠️',  msg: 'You switched browser tabs. Stay on this page during the exam.' },
  fullscreen_exit:     { title: 'Fullscreen Exited',          icon: '🖥️',  msg: 'Do not exit fullscreen mode during the exam.' },
  copy_attempt:        { title: 'Copy Attempt Detected',      icon: '🚫',  msg: 'Copying content is not allowed during the exam.' },
  paste_attempt:       { title: 'Paste Attempt Detected',     icon: '🚫',  msg: 'Pasting content is not allowed during the exam.' },
  right_click:         { title: 'Right Click Blocked',        icon: '🔒',  msg: 'Right-clicking is disabled during the exam.' },
  keyboard_shortcut:   { title: 'Shortcut Blocked',           icon: '⌨️',  msg: 'Keyboard shortcuts are disabled during the exam.' },
  no_face_detected:    { title: 'Face Not Detected',          icon: '📷',  msg: 'Please ensure your face is clearly visible to the camera.' },
  multiple_faces:      { title: 'Multiple Faces Detected',    icon: '🚨',  msg: 'Only you should be visible during the exam.' },
  looking_away:        { title: 'Looking Away Detected',      icon: '👀',  msg: 'Please keep your eyes on the screen.' },
  phone_detected:      { title: 'Phone Detected',             icon: '📱',  msg: 'No mobile devices are allowed during the exam.' },
  browser_blur:        { title: 'Window Lost Focus',          icon: '⚠️',  msg: 'Do not switch away from the exam window.' },
  ai_content_detected: { title: 'AI Content Detected',        icon: '🤖',  msg: 'Your submission appears to contain AI-generated content. Please use your own words.' },
  background_person:    { title: 'Other Person Detected',      icon: '👥',  msg: 'Another person was detected in your camera. Only you should be present during the exam.' },
  background_voice:     { title: 'Background Voice Detected',  icon: '🔊',  msg: 'Sustained audio was detected in your environment. Ensure you are in a quiet room and alone.' },
  suspicious_movement:  { title: 'Suspicious Movement',        icon: '🚶',  msg: 'Unusual movement was detected in your camera feed. Please remain still and face the camera.' },
};

interface Props {
  violation:    ActiveViolation | null;
  warningCount: number;
  onAcknowledge: () => void;
}

export default function ViolationWarningModal({ violation, warningCount, onAcknowledge }: Props) {
  if (!violation) return null;

  const info      = MESSAGES[violation.type] ?? { title: 'Violation Detected', icon: '⚠️', msg: 'A violation was detected.' };
  const remaining = AUTO_SUBMIT_THRESHOLD - warningCount;
  const isCritical = warningCount >= 3;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70">
      <div className={`rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border-2 ${isCritical ? 'border-red-500' : 'border-yellow-400'}`}>

        {/* Header */}
        <div className={`px-6 py-4 ${isCritical ? 'bg-red-600' : 'bg-yellow-500'}`}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{info.icon}</span>
            <h2 className="text-white text-xl font-bold">{info.title}</h2>
          </div>
        </div>

        {/* Body */}
        <div className="bg-white px-6 py-5">
          <p className="text-gray-800 text-base mb-4">{info.msg}</p>

          {/* Warning counter badge */}
          <div className={`rounded-xl p-3 mb-4 ${isCritical ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}>
            <p className="font-semibold text-sm text-gray-700">
              Warning {warningCount} of {AUTO_SUBMIT_THRESHOLD}
            </p>
            {remaining > 0 ? (
              <p className="text-sm text-gray-600 mt-1">
                {remaining} more violation{remaining !== 1 ? 's' : ''} will result in automatic submission.
              </p>
            ) : (
              <p className="text-sm font-bold text-red-600 mt-1">
                Next violation will automatically submit your work.
              </p>
            )}
          </div>

          {/* Dot progress */}
          <div className="flex gap-2 mb-5">
            {Array.from({ length: AUTO_SUBMIT_THRESHOLD }).map((_, i) => (
              <div
                key={i}
                className={`h-3 w-3 rounded-full transition-colors ${
                  i < warningCount
                    ? isCritical ? 'bg-red-500' : 'bg-yellow-500'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          <button
            onClick={onAcknowledge}
            className={`w-full py-3 rounded-xl font-bold text-white transition-colors ${
              isCritical ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            I Understand — Continue
          </button>

          <p className="text-xs text-gray-400 text-center mt-3">
            All violations are logged and visible to your instructor.
          </p>
        </div>
      </div>
    </div>
  );
}
