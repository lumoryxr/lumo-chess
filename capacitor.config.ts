import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lumoryx.lumochess',
  appName: '象棋残局',
  webDir: 'dist',
  backgroundColor: '#0d0d0d',
  android: {
    // Keep the WebView background dark to avoid a white flash on launch
    backgroundColor: '#0d0d0d',
  },
};

export default config;
