import { useState, useEffect } from 'react';

/**
 * Hook to dynamically load the Jitsi External API script
 * Returns { loaded, error } state
 */
export function useJitsiScript(domain: string = 'meet.jit.si') {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Check if already loaded
    if (window.JitsiMeetExternalAPI) {
      setLoaded(true);
      return;
    }

    // Check if script is already in the DOM
    const existingScript = document.querySelector(
      `script[src="https://${domain}/external_api.js"]`
    );

    if (existingScript) {
      // Script is loading, wait for it
      const checkLoaded = () => {
        if (window.JitsiMeetExternalAPI) {
          setLoaded(true);
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
      return;
    }

    // Create and inject script
    const script = document.createElement('script');
    script.src = `https://${domain}/external_api.js`;
    script.async = true;

    script.onload = () => {
      // Give it a moment to initialize
      setTimeout(() => {
        if (window.JitsiMeetExternalAPI) {
          setLoaded(true);
        } else {
          setError(new Error('Jitsi API failed to initialize'));
        }
      }, 100);
    };

    script.onerror = () => {
      setError(new Error('Failed to load Jitsi script'));
    };

    document.body.appendChild(script);

    return () => {
      // Don't remove script on cleanup - other components might need it
    };
  }, [domain]);

  return { loaded, error };
}

// Global type declaration
declare global {
  interface Window {
    JitsiMeetExternalAPI: {
      new (
        domain: string,
        options: {
          roomName: string;
          jwt?: string;
          width?: string;
          height?: string;
          parentNode?: HTMLElement | null;
          configOverwrite?: Record<string, unknown>;
          interfaceConfigOverwrite?: Record<string, unknown>;
          userInfo?: {
            displayName: string;
            email?: string;
          };
        }
      ): JitsiMeetExternalAPIInstance;
    };
  }
}

export interface JitsiMeetExternalAPIInstance {
  addEventListeners: (listeners: Record<string, (data: unknown) => void>) => void;
  removeEventListener: (event: string) => void;
  dispose: () => void;
  executeCommand: (command: string, ...args: unknown[]) => void;
  isAudioMuted: () => Promise<{ muted: boolean }>;
  isVideoMuted: () => Promise<{ muted: boolean }>;
  getParticipantsInfo: () => Promise<unknown[]>;
}
