import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.goldinvestment.app',
  appName: 'Gold Investment',
  webDir: 'dist',
  server: {
    // For development, uncomment to use live reload:
    // url: 'http://YOUR_LOCAL_IP:5173',
    // cleartext: true,
  },
  ios: {
    contentInset: 'automatic',
  },
  android: {
    backgroundColor: '#f9fafb',
  },
  plugins: {
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#ffffff',
    },
  },
};

export default config;
