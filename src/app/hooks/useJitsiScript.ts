import { useState, useEffect } from 'react';

/**
 * Hook to dynamically load the Jitsi External API script
 * Returns { loaded, error, domain } state
 * 
 * Troubleshooting:
 * - Ensure VITE_JITSI_DOMAIN environment variable is set
 * - Verify Jitsi server is running and accessible at the domain
 * - Check DNS resolution: nslookup meet.codagenz.com
 * - Check browser console for CORS errors
 * - If Jitsi server is behind firewall, ensure port 443 (HTTPS) is open
 */
export function useJitsiScript(domain: string = 'meet.codagenz.com') {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Check if already loaded
    if (window.JitsiMeetExternalAPI) {
      setLoaded(true);
      console.log(`✓ Jitsi API already loaded from ${domain}`);
      return;
    }

    // Check if script is already in the DOM
    const existingScript = document.querySelector(
      `script[src="https://${domain}/external_api.js"]`
    );

    if (existingScript) {
      // Script is loading, wait for it
      console.log(`Waiting for Jitsi script to load from ${domain}...`);
      const checkLoaded = () => {
        if (window.JitsiMeetExternalAPI) {
          setLoaded(true);
          console.log(`✓ Jitsi script loaded successfully from ${domain}`);
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
      return;
    }

    // Create and inject script
    console.log(`Loading Jitsi external API from: https://${domain}/external_api.js`);
    const script = document.createElement('script');
    script.src = `https://${domain}/external_api.js`;
    script.async = true;

    script.onload = () => {
      // Give it a moment to initialize
      setTimeout(() => {
        if (window.JitsiMeetExternalAPI) {
          setLoaded(true);
          setError(null);
          console.log(`✓ Jitsi script loaded successfully from ${domain}`);
        } else {
          const initError = new Error(
            `Jitsi API failed to initialize after script load from ${domain}. ` +
            `The script loaded but JitsiMeetExternalAPI is not available. ` +
            `This may indicate a problem with the Jitsi server configuration.`
          );
          setError(initError);
          console.error('Jitsi initialization error:', initError);
        }
      }, 500);
    };

    script.onerror = () => {
      const loadError = new Error(
        `Failed to load Jitsi script from https://${domain}/external_api.js. ` +
        `Possible causes:\n` +
        `1. Jitsi server at ${domain} is not running\n` +
        `2. DNS resolution failed for ${domain}\n` +
        `3. Network connectivity issue\n` +
        `4. CORS policy blocking the request\n` +
        `5. VITE_JITSI_DOMAIN environment variable is not set correctly\n\n` +
        `Debugging steps:\n` +
        `- Check browser console for detailed error\n` +
        `- Verify domain in .env file: ${domain}\n` +
        `- Test connectivity: curl https://${domain}/external_api.js\n` +
        `- Check DNS: nslookup ${domain}`
      );
      console.error('Jitsi script load error:', loadError);
      setError(loadError);
    };

    document.body.appendChild(script);

    return () => {
      // Don't remove script on cleanup - other components might need it
    };
  }, [domain]);

  return { loaded, error, domain };
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
