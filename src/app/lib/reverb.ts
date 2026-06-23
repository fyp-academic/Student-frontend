// Shared Laravel Reverb (Pusher protocol) client configuration.
//
// The Reverb "app key" is a PUBLIC client value — it is sent to the browser on every WebSocket
// handshake and is already embedded in the built bundle. The secret stays server-side. We therefore
// ship safe hardcoded fallbacks so the production build always has a key even when the deploy
// environment has no `VITE_REVERB_*` variables (e.g. because `.env` is gitignored). A local `.env`
// still overrides these for development.

export interface ReverbConfig {
  key: string;
  wsHost: string;
  wsPort: number;
  scheme: string;
  forceTLS: boolean;
  enabledTransports: ('ws' | 'wss')[];
}

export function getReverbConfig(): ReverbConfig {
  const key    = import.meta.env.VITE_REVERB_APP_KEY || 'zuehdoeluljaqyepsijp';
  const wsHost = import.meta.env.VITE_REVERB_HOST    || 'api.codagenz.com';
  const wsPort = Number(import.meta.env.VITE_REVERB_PORT) || 443;
  const scheme = import.meta.env.VITE_REVERB_SCHEME  || 'https';
  const forceTLS = scheme === 'https';
  return {
    key,
    wsHost,
    wsPort,
    scheme,
    forceTLS,
    enabledTransports: forceTLS ? ['ws', 'wss'] : ['ws'],
  };
}
